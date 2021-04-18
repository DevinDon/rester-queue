import EventEmitter from 'events';
import IORedis, { Redis, RedisOptions } from 'ioredis';
import { v4 as uuid, validate } from 'uuid';
import { Message, WithID } from '../interfaces';
import { getDataKey, parse, parseID, stringify } from '../utils';

/**
 * 基于 Redis 的延迟消息队列。
 */
export class Queue {

  private emitter: EventEmitter = new EventEmitter();
  private redis: Redis;
  private eventRedis: Redis;
  private iterators: Map<string, AsyncIterable<Message & WithID>> = new Map();
  private topicRedises: Map<string, Redis> = new Map();

  /**
   * 创建一个基于 Redis 的延迟消息队列，可以指定 `db` 属性来选择数据库。
   *
   * @param {RedisOptions} config Redis 连接配置
   */
  constructor(private config: RedisOptions) {
    this.redis = new IORedis(config);
    this.eventRedis = new IORedis(config);
    this.init();
    this.recover();
  }

  /**
   * 初始化过期键监听器。
   */
  private async init() {
    await this.eventRedis.config('SET', 'notify-keyspace-events', 'Ex');
    await this.eventRedis.subscribe(`__keyevent@${this.config.db || 0}__:expired`);
    this.eventRedis.on('message', (_, id) => {
      if (!validate(id)) { return; }
      return this.getMessage(id)
        .then(message => this.push(message));
    });
  }

  /**
   * 恢复之前未消费的延迟消息。
   */
  private async recover() {
    const keys = await this.redis.keys('data-*');
    for (const key of keys) {
      const id = parseID(key);
      if (id && !await this.redis.get(id)) {
        const message = await this.getMessage(id);
        await this.push(message);
      }
    }
  }

  /**
   * 将已到时间的延迟消息推送至 Topic 消费。
   *
   * @param {Message & WithID} message 要推送的消息及 ID
   */
  private async push({ id, topic, ...rest }: Message & WithID) {
    await this.redis
      .multi()
      .del(getDataKey(id))
      .rpush(topic, stringify({ id, topic, ...rest }))
      .exec();
    this.emitter.emit('message');
  }

  /**
   * 获取消息。
   *
   * @param {string} id 消息 ID
   * @returns {Promise<any | undefined>} 返回消息对象或未定义
   */
  private async getMessage(id: string): Promise<any | undefined> {
    return this.redis
      .get(getDataKey(id))
      .then(value => value ? parse(value) : undefined);
  }

  /**
   * 生产消息。
   *
   * @param {Message} message 消息内容，话题及延迟时间
   */
  async produce({ topic, body, delay }: Message) {
    const id = uuid();
    if (typeof delay === 'number' && delay > 0) {
      await this.redis.multi()
        .set(id, '')
        .set(getDataKey(id), stringify({ id, topic, body, delay }))
        .pexpireat(id, Date.now() + delay)
        .exec();
    } else {
      await this.push({ id, topic, body, delay });
    }
  }

  /**
   * 获取一个指定话题的可迭代对象，使用 `for-await-of` 进行遍历。
   *
   * @param {Pick<Message, 'topic'>} topic 从指定的话题消费消息
   * @returns {AsyncIterable<Message & WithID>} 返回一个可迭代对象，建议使用 `for-await-of` 遍历
   */
  consume({ topic }: Pick<Message, 'topic'>): AsyncIterable<Message & WithID> {
    if (this.topicRedises.has(topic) !== true) {
      this.topicRedises.set(topic, new IORedis(this.config));
    }
    if (this.iterators.has(topic) !== true) {
      this.iterators.set(topic, {
        [Symbol.asyncIterator]: () => ({
          next: async () => {
            const [, message] = await this.topicRedises.get(topic)!.blpop(topic, 0);
            return { done: false, value: parse(message) };
          },
        }),
      });
    }
    return this.iterators.get(topic)!;
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

}
