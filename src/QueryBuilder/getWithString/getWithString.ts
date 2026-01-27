import type { GetWithStringWith } from './getWithString.types';

export const getWithString = (wth: GetWithStringWith): string => {
  const wthArr = Array.isArray(wth) ? wth : [wth];

  return `WITH ${wthArr.join(', ')}`;
};
