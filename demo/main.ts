import { logger } from '@rester/logger';
import { Queue } from '../src/core';
import { Message } from '../src/interfaces';

export const queue = new Queue({
  password: 'dev-redis',
});

setTimeout(
  () => {
    const delayMessage: Message = {
      topic: 'list',
      body: 'Delay Message',
      delay: 3000,
    };
    const immediateMessage = {
      topic: 'list',
      body: 'Immediate Message',
    };
    for (let i = 10; i; i--) {
      queue.produce(immediateMessage);
      queue.produce(delayMessage);
    }
  },
  0,
);

(async () => {
  logger.info('Start queue.');
  const topic = queue.consume({ topic: 'list' });
  for await (const message of topic) {
    logger.info('Got message:', JSON.stringify(message));
  }
})();
