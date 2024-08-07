'use server';

import {
  rerender,
  unstable_getCustomContext as getCustomContext,
} from 'waku/server';

export const greet = async (name: string) => {
  await Promise.resolve();
  console.log('Custom Context:', getCustomContext()); // ---> {}
  return `Hello ${name} from server!`;
};

// module state on server
let counter = 0;

export const getCounter = async () => counter;

export const increment = async () => {
  counter += 1;
  rerender('Waku');
};
