export const isEmptyObject = (obj: Record<string, any>): boolean =>
    Object.entries(obj).length === 0 && obj.constructor === Object;
