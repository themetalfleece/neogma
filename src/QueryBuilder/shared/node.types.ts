import type { NeogmaModel } from '../../ModelFactory';
import type { Neo4jSupportedProperties } from '../../QueryRunner/QueryRunner.types';
import type { WhereParamsI } from '../../Where';

/** node type which will be used for matching */
export type NodeForMatchI = string | NodeForMatchObjectI;
export type NodeForMatchObjectI = {
  /** a label to use for this node */
  label?: string;
  /** the model of this node. Automatically sets the "label" field */
  model?: NeogmaModel<any, any, any, any>;
  /** identifier for the node */
  identifier?: string;
  /** where parameters for matching this node */
  where?: WhereParamsI;
};

/** node type which will be used for creating/merging */
export type NodeForCreateI =
  | string
  | NodeForCreateWithLabelI
  | NodeForCreateWithModelI;

export type NodeForCreateObjectI =
  | NodeForCreateWithLabelI
  | NodeForCreateWithModelI;

/** node type used for creating/merging, using a label */
export type NodeForCreateWithLabelI = {
  /** identifier for the node */
  identifier?: string;
  /** a label to use for this node */
  label: string;
  /** properties of the node */
  properties?: Neo4jSupportedProperties;
};

/** node type used for creating/merging, using a model to extract the label */
export type NodeForCreateWithModelI = {
  /** identifier for the node */
  identifier?: string;
  /** the model of this node. Automatically sets the "label" field */
  model: NeogmaModel<any, any, any, any>;
  /** properties of the node */
  properties?: Neo4jSupportedProperties;
};
