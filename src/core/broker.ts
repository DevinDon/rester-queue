import EventEmitter from 'events';
import { Cluster, NodeRole, Redis } from 'ioredis';
import { v4 as uuid, validate } from 'uuid';
import type { FullMessage, Message, MessageTopic, ResterQueueConfig } from '../interfaces';
import { DATA_SUFFIX, getDataKey, parse, parseID, stringify } from '../utils';

/**
 * 基于 Redis 的延迟消息队列 Broker。
 */
export class ResterBroker {

  private emitter: EventEmitter = new EventEmitter();

  private redis: { default: Cluster; event: Cluster; } = {} as any;

  private iterators: Map<string, AsyncIterable<FullMessage>> = new Map();

  private topicRedises: Map<string, Cluster> = new Map();

  private nodes: Redis[] = [];

  /**
   * 创建一个基于 Redis 的延迟消息队列，仅支持使用 Redis Cluster 作为底层连接。
   *
   * @param {RedisConfig} redisConfig Redis 连接配置
   */
  constructor(
    private config: ResterQueueConfig,
  ) {
    this.redis.default = this.create('default-redis-client');
    this.redis.event = this.create('event-redis-client');
    this.redis.default.on('ready', () => {
      this.nodes = this.getNodes(this.redis.default, 'master');
      this.recover();
    });
    this.redis.event.on('ready', () => this.init());
  }

  /**
   * 创建并返回一个指定 Topic 的 Redis 客户端，如果对应 Topic 已存在，则直接返回。
   *
   * @param {string} topic Topic 名称
   * @returns {Cluster} 返回一个 Redis 集群客户端
   */
  private create(topic: string): Cluster {
    if (this.topicRedises.has(topic)) {
      return this.topicRedises.get(topic)!;
    }
    const client = new Cluster(this.config.nodes, this.config.config);
    this.topicRedises.set(topic, client);
    return client;
  }

  /**
   * 初始化过期键监听器，所有 Master 节点均要初始化。
   */
  private async init() {
    for (const client of this.getNodes(this.redis.event, 'master')) {
      await client.config('SET', 'notify-keyspace-events', 'Ex');
      await client.subscribe('__keyevent@0__:expired');
      client.on('message', (_, id) => {
        if (!validate(id)) { return; }
        return this.getMessage(id)
          .then(message => this.push(message!));
      });
    }
  }

  /**
   * 恢复之前未消费的延迟消息，所有 Master 节点。
   */
  private async recover() {
    const tasks = this.nodes
      .map(client => client.keys('*' + DATA_SUFFIX));
    const keys = (await Promise.all(tasks)).flat();
    for (const key of keys) {
      const id = parseID(key);
      if (id && !await this.redis.default.get(id)) {
        const message = await this.getMessage(id);
        await this.push(message!);
      }
    }
  }

  /**
   * 将已到时间的延迟消息推送至 Topic 消费。
   *
   * @param {FullMessage} message 要推送的消息及 ID
   */
  private async push({ id, topic, ...rest }: FullMessage) {
    await this.redis.default.del(getDataKey(id));
    await this.redis.default.rpush(topic, stringify({ id, topic, ...rest }));
    this.emitter.emit('message');
  }

  /**
   * 获取消息。
   *
   * @param {string} id 消息 ID
   * @returns {Promise<FullMessage | undefined>} 返回消息对象或未定义
   */
  private async getMessage(id: string): Promise<FullMessage | undefined> {
    return this.redis.default
      .get(getDataKey(id))
      .then(value => value ? parse(value) : undefined);
  }

  /**
   * 生产消息。
   *
   * @param {Message} message 消息内容，话题及延迟时间
   * @returns {Promise<string>} 返回该消息的 UUID
   */
  async produce({ topic, body, delay }: Message): Promise<string> {
    const id = uuid();
    if (typeof delay === 'number' && delay > 0) {
      await this.redis.default.set(id, '');
      await this.redis.default.set(getDataKey(id), stringify({ id, topic, body, delay }));
      await this.redis.default.pexpireat(id, Date.now() + delay);
    } else {
      await this.push({ id, topic, body, delay });
    }
    return id;
  }

  /**
   * 获取一个指定话题的可迭代对象，使用 `for-await-of` 进行遍历。
   *
   * @param {MessageTopic} topic 从指定的话题消费消息
   * @param {number} timeout 超时时长，毫秒，默认为 0 即不超时
   * @returns {AsyncIterable<FullMessage>} 返回一个可迭代对象，建议使用 `for-await-of` 遍历
   */
  consume({ topic }: MessageTopic, timeout: number = 0): AsyncIterable<FullMessage> {
    if (this.iterators.has(topic) !== true) {
      this.iterators.set(topic, {
        [Symbol.asyncIterator]: () => ({
          next: async () => {
            const value = await this.next({ topic }, timeout);
            if (typeof value === 'undefined') {
              return { done: true, value: undefined };
            }
            return { done: false, value };
          },
        }),
      });
    }
    return this.iterators.get(topic)!;
  }

  /**
   * 获取指定 Topic 中的下一条消息。
   *
   * @param {MessageTopic} topic 指定的 Topic
   * @param {number} timeout 超时时长，毫秒，默认为 0 即不超时
   * @returns {Promise<FullMessage | undefined>} 返回已经解析的 FullMessage
   */
  async next({ topic }: MessageTopic, timeout: number = 0): Promise<FullMessage | undefined> {
    if (this.topicRedises.has(topic) !== true) {
      this.topicRedises.set(topic, this.create(topic));
    }
    const result = await this.topicRedises.get(topic)!.blpop(topic, timeout / 1000);
    return result ? parse(result[1]) : undefined;
  }

  /**
   * 监听事件并执行操作。
   *
   * @param {'message'} event 监听事件
   * @param {Function} action 当事件触发时执行的函数
   */
  on(event: 'message', action: Function) {
    this.emitter.on(event, () => action());
  }

  private getNodes(client: Cluster, role: NodeRole = 'master') {
    return (client as Cluster).nodes(role);
  }

}
