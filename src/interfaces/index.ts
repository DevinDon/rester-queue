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

export interface WithID {
  id: string;
}
