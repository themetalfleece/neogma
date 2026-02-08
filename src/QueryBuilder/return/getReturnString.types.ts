/** Single return element - either a raw string or an object with identifier */
export type ReturnElementI =
  | string
  | {
      /** identifier to return */
      identifier: string;
      /** returns only this property of the identifier */
      property?: string;
    };

/** RETURN parameter */
export type ReturnI = {
  /** RETURN parameter - string, or array of strings/objects (can be mixed) */
  return: string | ReturnElementI[];
};

/** Array of return objects (all objects, no strings) */
export type ReturnObjectI = Array<{
  /** identifier to return */
  identifier: string;
  /** returns only this property of the identifier */
  property?: string;
}>;

export type GetReturnStringReturn = ReturnI['return'];
