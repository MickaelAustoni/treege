export const INPUT_TYPE = {
  address: "address",
  autocomplete: "autocomplete",
  checkbox: "checkbox",
  date: "date",
  daterange: "daterange",
  file: "file",
  hidden: "hidden",
  http: "http",
  number: "number",
  password: "password",
  radio: "radio",
  select: "select",
  submit: "submit",
  switch: "switch",
  text: "text",
  textarea: "textarea",
  time: "time",
  timerange: "timerange",
} as const;

/**
 * Input types that carry a static option list (`data.options`) or can use a
 * remote `data.optionsSource`. Anything else is treated as a free-form input.
 */
export const OPTIONS_INPUT_TYPES: readonly string[] = [INPUT_TYPE.radio, INPUT_TYPE.select, INPUT_TYPE.checkbox, INPUT_TYPE.autocomplete];
