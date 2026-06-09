import DefaultAddressInput from "@/renderer/features/TreegeRenderer/native/components/inputs/DefaultAddressInput";
import DefaultAutocompleteInput from "@/renderer/features/TreegeRenderer/native/components/inputs/DefaultAutocompleteInput";
import DefaultCheckboxInput from "@/renderer/features/TreegeRenderer/native/components/inputs/DefaultCheckboxInput";
import DefaultDateInput from "@/renderer/features/TreegeRenderer/native/components/inputs/DefaultDateInput";
import DefaultDateRangeInput from "@/renderer/features/TreegeRenderer/native/components/inputs/DefaultDateRangeInput";
import DefaultFileInput from "@/renderer/features/TreegeRenderer/native/components/inputs/DefaultFileInput";
import DefaultHiddenInput from "@/renderer/features/TreegeRenderer/native/components/inputs/DefaultHiddenInput";
import DefaultHttpInput from "@/renderer/features/TreegeRenderer/native/components/inputs/DefaultHttpInput";
import DefaultNumberInput from "@/renderer/features/TreegeRenderer/native/components/inputs/DefaultNumberInput";
import DefaultPasswordInput from "@/renderer/features/TreegeRenderer/native/components/inputs/DefaultPasswordInput";
import DefaultRadioInput from "@/renderer/features/TreegeRenderer/native/components/inputs/DefaultRadioInput";
import DefaultSelectInput from "@/renderer/features/TreegeRenderer/native/components/inputs/DefaultSelectInput";
import DefaultSubmitInput from "@/renderer/features/TreegeRenderer/native/components/inputs/DefaultSubmitInput";
import DefaultSwitchInput from "@/renderer/features/TreegeRenderer/native/components/inputs/DefaultSwitchInput";
import DefaultTextareaInput from "@/renderer/features/TreegeRenderer/native/components/inputs/DefaultTextareaInput";
import DefaultTextInput from "@/renderer/features/TreegeRenderer/native/components/inputs/DefaultTextInput";
import DefaultTimeInput from "@/renderer/features/TreegeRenderer/native/components/inputs/DefaultTimeInput";
import DefaultTimeRangeInput from "@/renderer/features/TreegeRenderer/native/components/inputs/DefaultTimeRangeInput";
import { InputRenderers } from "@/renderer/types/renderer";

export {
  DefaultAddressInput,
  DefaultAutocompleteInput,
  DefaultCheckboxInput,
  DefaultDateInput,
  DefaultDateRangeInput,
  DefaultFileInput,
  DefaultHiddenInput,
  DefaultHttpInput,
  DefaultNumberInput,
  DefaultPasswordInput,
  DefaultRadioInput,
  DefaultSelectInput,
  DefaultSwitchInput,
  DefaultTextareaInput,
  DefaultTextInput,
  DefaultTimeInput,
  DefaultTimeRangeInput,
};

// Default input renderers mapping with proper typing
export const defaultInputRenderers: InputRenderers = {
  address: DefaultAddressInput,
  autocomplete: DefaultAutocompleteInput,
  checkbox: DefaultCheckboxInput,
  date: DefaultDateInput,
  daterange: DefaultDateRangeInput,
  file: DefaultFileInput,
  hidden: DefaultHiddenInput,
  http: DefaultHttpInput,
  number: DefaultNumberInput,
  password: DefaultPasswordInput,
  radio: DefaultRadioInput,
  select: DefaultSelectInput,
  submit: DefaultSubmitInput,
  switch: DefaultSwitchInput,
  text: DefaultTextInput,
  textarea: DefaultTextareaInput,
  time: DefaultTimeInput,
  timerange: DefaultTimeRangeInput,
};
