import { logger } from '@rester/logger';
import { ResterBroker } from '../src/core';
import { Message } from '../src/interfaces';

export const queue = new ResterBroker({
  nodes: [
    { port: 7001 },
    { port: 7002 },
    { port: 7003 },
    { port: 7004 },
    { port: 7005 },
    { port: 7006 },
  ],
  config: {
    redisOptions: {
      password: 'rester-redis',
    },
  },
});

(async () => {

  setInterval(
    () => {
      const delayMessage: Message = {
        topic: 'list',
        body: 'Delay Message',
        delay: 3333,
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
    7777,
  );

  (async () => {
    logger.info('Start queue.');
    const topic = queue.consume({ topic: 'list' });
    for await (const message of topic) {
      logger.info('Got message:', JSON.stringify(message));
    }
  })();

})();
