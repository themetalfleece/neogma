export const isEmptyObject = (obj: object) => Object.entries(obj).length === 0 && obj.constructor === Object;
