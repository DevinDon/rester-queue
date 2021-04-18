import EventEmitter from 'events';
import IORedis, { Redis, RedisOptions } from 'ioredis';
import { v4 as uuid, validate } from 'uuid';
import { Message, WithID } from '../interfaces';
import { parse, stringify } from '../utils';

export class Queue {

  private emitter: EventEmitter = new EventEmitter();
  private redis: Redis;
  private eventRedis: Redis;
  private iterators: Map<string, AsyncIterable<Message & WithID>> = new Map();
  private topicRedises: Map<string, Redis> = new Map();

  constructor(private config: RedisOptions) {
    this.redis = new IORedis(config);
    this.eventRedis = new IORedis(config);
    this.init();
  }

  private async init() {
    await this.eventRedis.config('SET', 'notify-keyspace-events', 'Ex');
    await this.eventRedis.subscribe('__keyevent@0__:expired');
    this.eventRedis.on('message', (_, id) => {
      if (!validate(id)) { return; }
      return this.redis
        .get(id + '-data')
        .then(value => parse(value!))
        .then(message => this.push(message));
    });
  }

  private async push({ id, topic, ...rest }: Message & WithID) {
    await this.redis
      .multi()
      .del(id + '-data')
      .rpush(topic, stringify({ id, topic, ...rest }))
      .exec();
    this.emitter.emit('message');
  }

  async produce({ topic, body, delay }: Message) {
    const id = uuid();
    if (typeof delay === 'number' && delay > 0) {
      await this.redis.multi()
        .set(id, '')
        .set(id + '-data', stringify({ id, topic, body, delay }))
        .pexpireat(id, Date.now() + delay)
        .exec();
    } else {
      await this.push({ id, topic, body, delay });
    }
  }

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

  on(event: 'message', action: Function) {
    this.emitter.on(event, () => action());
  }

}
