import { validate } from 'uuid';

export const stringify = JSON.stringify;

export const parse = (input: string) => {
  try {
    return JSON.parse(input);
  } catch (error) {
    return input;
  }
};

export const getDataKey = (id: string) => 'data-' + id;

export const parseID = (key: string) => {
  const [_, id] = key.split('data-');
  return id && validate(id) ? id : undefined;
};
