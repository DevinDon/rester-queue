/**
 * 将消息序列化为字符串。
 *
 * @param {Message | FullMessage} input
 * @returns {string} 序列化后的消息
 */
export const stringifyMessage = JSON.stringify;

/**
 * 将字符串解析为 `Message` 或 `FullMessage`，如果无法解析，那么直接返回原本的输入内容。
 *
 * @param {string} input 序列化的字符串
 * @returns {FullMessage | Message | any} 返回解析后的消息
 */
export const parseMessage = (input: string): any => {
  try {
    return JSON.parse(input);
  } catch (error) {
    return input;
  }
};
