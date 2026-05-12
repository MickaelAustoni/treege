import { INPUT_TYPE } from "@/shared/constants/inputType";
import { InputNodeData, TreegeNodeData } from "@/shared/types/node";

/**
 * Input types that carry a static option list (`data.options`) or can use a
 * remote `optionsSource`. Anything else is treated as a free-form input.
 */
const OPTIONS_INPUT_TYPES: readonly string[] = [INPUT_TYPE.radio, INPUT_TYPE.select, INPUT_TYPE.checkbox, INPUT_TYPE.autocomplete];

/**
 * Type guard: narrows the node `data` to an `InputNodeData` whose type
 * supports an option list. After a truthy check, `data.options`,
 * `data.optionsSource`, etc. are accessible without casts.
 */
export const isOptionsInputData = (data: TreegeNodeData | undefined): data is InputNodeData =>
  Boolean(data && "type" in data && data.type && OPTIONS_INPUT_TYPES.includes(data.type));
