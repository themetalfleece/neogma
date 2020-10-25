export const trimWhitespace = (s: string, replaceWith = ' '): string =>
    s.replace(/\s+/g, replaceWith)?.trim();
