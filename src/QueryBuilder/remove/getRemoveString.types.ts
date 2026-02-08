/** removes properties of an identifier */
export type RemovePropertiesI = {
  /** identifier whose properties will be removed */
  identifier: string;
  /** properties to remove */
  properties: string | string[];
};

/** removes labels of an identifier */
export type RemoveLabelsI = {
  /** identifier whose labels will be removed */
  identifier: string;
  /** labels to remove */
  labels: string | string[];
};

/** REMOVE clause parameter */
export type RemoveI = {
  /** The remove expression - string literal, properties object, or labels object */
  remove: string | RemovePropertiesI | RemoveLabelsI; // TODO: also support array of Properties|Labels
};

export type GetRemoveStringRemove = RemoveI['remove'];
