import { validate } from 'uuid';
import { DATA_SUFFIX } from './constants';

/**
 * 获取存放延迟消息内容的键名。
 *
 * @param {string} id 该消息的 ID
 * @returns {string} 返回拼接后的消息内容键名
 */
export const getDataKey = (id: string): string => id + DATA_SUFFIX;

/**
 * 从消息内容键名解析消息 ID。
 *
 * @param {string} key 存放消息内容的键名
 * @returns {string | undefined} 解析成功则返回 UUID，否则返回 `undefined`
 */
export const parseID = (key: string): string | undefined => {
  const [id] = key.split(DATA_SUFFIX);
  return id && validate(id) ? id : undefined;
};
