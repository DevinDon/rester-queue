import type { ClusterNode, ClusterOptions, RedisOptions } from 'ioredis';

/**
 * Redis 连接配置，别名。
 *
 * @alias RedisOptions
 */
export type RedisConfig = RedisOptions;

/**
 * Redis 集群节点配置，别名。
 *
 * @alias ClusterNode
 */
export type RedisClusterNodeConfig = ClusterNode;

/**
 * Redis 集群配置，别名。
 *
 * @alias ClusterOptions
 */
export type RedisClusterConfig = ClusterOptions;

/**
 * Redis Broker 配置，组合别名。
 */
export interface ResterBrokerConfig {
  nodes: RedisClusterNodeConfig[];
  config?: RedisClusterConfig;
}
