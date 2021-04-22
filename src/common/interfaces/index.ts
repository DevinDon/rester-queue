/**
 * @deprecated 弃用以避免歧义及复杂配置，默认时间均为 millisecond 毫秒。
 */
export enum TimeUnit {
  MILLISECOND = 'MILLISECOND',
  SECOND = 'SECOND',
  MINUTE = 'MINUTE',
  HOUR = 'HOUR',
  DAY = 'DAY',
  MONTH = 'MONTH',
  YEAR = 'YEAR',
}

export * from './messages';
