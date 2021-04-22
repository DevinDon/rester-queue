import { validate } from 'uuid';

export const stringify = JSON.stringify;

export const parse = (input: string) => {
  try {
    return JSON.parse(input);
  } catch (error) {
    return input;
  }
};

export const DATA_SUFFIX = '-data';

export const getDataKey = (id: string) => id + DATA_SUFFIX;

export const parseID = (key: string) => {
  const [id] = key.split(DATA_SUFFIX);
  return id && validate(id) ? id : undefined;
};
