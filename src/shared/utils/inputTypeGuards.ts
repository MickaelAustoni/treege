import { OPTIONS_INPUT_TYPES } from "@/shared/constants/inputType";
import { InputNodeData, TreegeNodeData } from "@/shared/types/node";

/**
 * Type guard: narrows the node `data` to an `InputNodeData` whose type
 * supports an option list. After a truthy check, `data.options`,
 * `data.optionsSource`, etc. are accessible without casts.
 */
export const isOptionsInputData = (data: TreegeNodeData | undefined): data is InputNodeData =>
  Boolean(data && "type" in data && data.type && OPTIONS_INPUT_TYPES.includes(data.type));
