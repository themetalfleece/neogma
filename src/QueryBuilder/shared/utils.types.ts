/** returns the given type, while making the given properties required */
export type RequiredProperties<T, P extends keyof T> = T & {
  [key in P]-?: Required<NonNullable<T[key]>>;
};
