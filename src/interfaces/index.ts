import type { ClusterNode, ClusterOptions, RedisOptions } from 'ioredis';

export enum TimeUnit {
  MILLISECOND = 'MILLISECOND',
  SECOND = 'SECOND',
  MINUTE = 'MINUTE',
  HOUR = 'HOUR',
  DAY = 'DAY',
  MONTH = 'MONTH',
  YEAR = 'YEAR',
}

export interface Message<T = any> {
  topic: string;
  body: T;
  delay?: number;
}

export interface MessageID {
  id: string;
}

export type FullMessage<T = any> = Message<T> & MessageID;

export type MessageTopic = Pick<Message, 'topic'>;

export type RedisConfig = RedisOptions;

export type RedisClusterNodeConfig = ClusterNode;

export type RedisClusterConfig = ClusterOptions;

export interface ResterQueueConfig {
  nodes: RedisClusterNodeConfig[];
  config?: RedisClusterConfig;
}
