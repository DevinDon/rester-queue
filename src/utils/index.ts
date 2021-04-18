export const stringify = JSON.stringify;
export const parse = (input: string) => {
  try {
    return JSON.parse(input);
  } catch (error) {
    return input;
  }
};
