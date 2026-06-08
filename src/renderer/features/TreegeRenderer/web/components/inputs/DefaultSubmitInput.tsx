import { useTreegeRendererConfig } from "@/renderer";
import DefaultSubmitButton from "@/renderer/features/TreegeRenderer/web/components/DefaultSubmitButton";
import DefaultSubmitButtonWrapper from "@/renderer/features/TreegeRenderer/web/components/DefaultSubmitButtonWrapper";
import { InputExtraProps, InputFieldProps } from "@/renderer/types/renderer";

const DefaultSubmitInput = (_field: InputFieldProps<"submit">, extra: InputExtraProps<"submit">) => {
  const { missingRequiredFields, isSubmitting, label } = extra;
  const config = useTreegeRendererConfig();
  const submitButton = config?.components?.submitButton;
  const submitButtonWrapper = config?.components?.submitButtonWrapper;
  const SubmitButton = submitButton || DefaultSubmitButton;
  const SubmitButtonWrapper = submitButtonWrapper || DefaultSubmitButtonWrapper;

  return (
    <SubmitButtonWrapper missingFields={missingRequiredFields}>
      <SubmitButton label={label} disabled={isSubmitting} />
    </SubmitButtonWrapper>
  );
};

export default DefaultSubmitInput;
