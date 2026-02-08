/** UNWIND object with value and as alias */
export type UnwindObjectI = {
  /** value to unwind */
  value: string;
  /** unwind value as this */
  as: string;
};

/** UNWIND parameter */
export type UnwindI = {
  /** UNWIND parameter */
  unwind: string | UnwindObjectI;
};

export type GetUnwindStringUnwind = UnwindI['unwind'];

/**
 * Type guard for checking if the unwind parameter is a valid UnwindObjectI.
 * Validates that it has non-empty 'value' and 'as' strings.
 * @param param - The parameter to check
 * @returns True if the parameter is a valid UnwindObjectI
 */
export const isUnwindObject = (
  param: UnwindI['unwind'],
): param is UnwindObjectI => {
  if (typeof param === 'string') {
    return false;
  }
  const obj = param as UnwindObjectI;
  return (
    typeof obj.value === 'string' &&
    obj.value.trim().length > 0 &&
    typeof obj.as === 'string' &&
    obj.as.trim().length > 0
  );
};
