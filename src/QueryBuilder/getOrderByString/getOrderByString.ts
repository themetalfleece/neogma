import type { GetOrderByStringOrderBy } from './getOrderByString.types';

export const getOrderByString = (orderBy: GetOrderByStringOrderBy): string => {
  if (typeof orderBy === 'string') {
    return `ORDER BY ${orderBy}`;
  }

  if (Array.isArray(orderBy)) {
    const orderByParts = orderBy.map((element) => {
      if (typeof element === 'string') {
        return element;
      }
      if (Array.isArray(element)) {
        return `${element[0]} ${element[1]}`;
      }
      return [
        // identifier.property
        [element.identifier, element.property].filter((v) => v).join('.'),
        // ASC or DESC
        element.direction,
      ]
        .filter((v) => v)
        .join(' ');
    });

    return `ORDER BY ${orderByParts.join(', ')}`;
  }

  // else, it's the object type
  const orderByString = [
    // identifier.property
    [orderBy.identifier, orderBy.property].filter((v) => v).join('.'),
    // ASC or DESC
    orderBy.direction,
  ]
    .filter((v) => v)
    .join(' ');

  return `ORDER BY ${orderByString}`;
};
