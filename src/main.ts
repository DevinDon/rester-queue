import { Queue } from './core';
import { Message } from './interfaces';
import { logger } from '@rester/logger';

const queue = new Queue({
  password: 'dev-redis',
});

setTimeout(
  () => {
    const delayMessage: Message = {
      topic: 'list',
      body: { name: 'Delay Message' },
      delay: 10000,
    };
    queue.produce(delayMessage);
    const immediateMessage = {
      topic: 'list',
      body: { name: 'Immediate Message' },
    };
    queue.produce(immediateMessage);
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
