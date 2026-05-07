import TreegeNode from "@/editor/features/TreegeEditor/nodes/TreegeNode";
import { NODE_TYPE } from "@/shared/constants/node";

export const NODE_TYPES = {
  [NODE_TYPE.flow]: TreegeNode,
  [NODE_TYPE.group]: () => null,
  [NODE_TYPE.input]: TreegeNode,
  [NODE_TYPE.ui]: TreegeNode,
};
