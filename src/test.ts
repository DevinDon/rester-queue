export class ABC {

  ok(): AsyncIterable<number> {
    return {
      [Symbol.asyncIterator]: () => {
        let index = 0;
        console.log('inner', index);
        return {
          next: async () => {
            await new Promise(resolve => setTimeout(resolve, 1000));
            return { done: false, value: index += 1 };
          },
        };
      },
    };
  }

}

(async () => {
  for await (const item of new ABC().ok()) {
    console.log(item);
  }
})();
