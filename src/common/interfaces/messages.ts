/**
 * 消息封装类型。
 */
export interface Message<T = any> {
  topic: string;
  body: T;
  delay?: number;
}

/**
 * 消息 ID 类型。
 */
export interface MessageID {
  id: string;
}

/**
 * 带有 ID 的完整消息类型。
 */
export type FullMessage<T = any> = Message<T> & MessageID;

/**
 * 消息话题类型。
 */
export type MessageTopic = Pick<Message, 'topic'>;
