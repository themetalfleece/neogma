import { GetUnwindStringUnwind } from './getUnwindString.types';

export const getUnwindString = (unwind: GetUnwindStringUnwind): string => {
  const unwindString =
    typeof unwind === 'string' ? unwind : `${unwind.value} AS ${unwind.as}`;

  return `UNWIND ${unwindString}`;
};
