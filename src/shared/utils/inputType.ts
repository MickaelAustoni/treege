import { INPUT_TYPE } from "@/shared/constants/inputType";
import { FlowNodeData, InputNodeData, UINodeData } from "@/shared/types/node";

/**
 * Input types that carry a static option list (`data.options`) or can use a
 * remote `optionsSource`. Anything else is treated as a free-form input.
 */
export const OPTIONS_INPUT_TYPES: readonly string[] = [INPUT_TYPE.radio, INPUT_TYPE.select, INPUT_TYPE.checkbox, INPUT_TYPE.autocomplete];

export const isOptionsInputType = (type?: string): boolean => Boolean(type) && OPTIONS_INPUT_TYPES.includes(type as string);

/**
 * Type guard: narrows the node `data` to an `InputNodeData` whose type
 * supports an option list.
 */
export const isOptionsInputData = (data: FlowNodeData | InputNodeData | UINodeData | undefined): data is InputNodeData =>
  Boolean(data && "type" in data && isOptionsInputType(data.type));
