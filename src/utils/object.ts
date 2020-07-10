export const isEmptyObject = (obj: AnyObject): boolean =>
    Object.entries(obj).length === 0 && obj.constructor === Object;
