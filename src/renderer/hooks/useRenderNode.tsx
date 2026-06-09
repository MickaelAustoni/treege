import { Node } from "@xyflow/react";
import { ComponentType, Fragment, ReactNode, useCallback, useMemo } from "react";
import {
  FormValues,
  InputExtraProps,
  InputFieldProps,
  InputRenderer,
  InputRenderers,
  InputValue,
  TreegeRendererComponents,
} from "@/renderer/types/renderer";
import { resolveInputPlaceholder, resolveNodeKey } from "@/renderer/utils/node";
import { sanitize } from "@/renderer/utils/sanitize";
import { getMissingDependencies } from "@/renderer/utils/templateDependencies";
import { NODE_TYPE } from "@/shared/constants/node";
import { InputNodeData, TreegeNodeData, UINodeData } from "@/shared/types/node";
import { isInputNode, isUINode } from "@/shared/utils/nodeTypeGuards";
import { getTranslatedText } from "@/shared/utils/translations";

type AnyComponent = ComponentType<any>;

type UseRenderNodeParams = {
  config: {
    components: TreegeRendererComponents;
    language: string;
  };
  DefaultFormWrapper: AnyComponent;
  DefaultInputWrapper: ComponentType<{ node: Node<InputNodeData>; children: ReactNode }>;
  DefaultSubmitButton: AnyComponent;
  DefaultSubmitButtonWrapper?: AnyComponent;
  defaultInputRenderers: InputRenderers;
  defaultUI: Record<string, AnyComponent>;
  formErrors: Record<string, string>;
  formValues: FormValues;
  inputNodes: Node<InputNodeData>[];
  isSubmitting?: boolean;
  missingRequiredFields: string[];
  setFieldValue: (fieldId: string, value: unknown) => void;
};

/**
 * Hook that returns rendering utilities for TreegeRenderer
 * Shared between web and native TreegeRenderer
 *
 * Returns:
 * - renderNode: Function to render individual nodes
 * - FormWrapper: Form wrapper component with fallback
 * - SubmitButton: Submit button component with fallback
 * - SubmitButtonWrapper: Submit button wrapper component with fallback (web only, undefined for native)
 */
export const useRenderNode = ({
  DefaultFormWrapper,
  DefaultInputWrapper,
  DefaultSubmitButton,
  DefaultSubmitButtonWrapper,
  config,
  defaultInputRenderers,
  defaultUI,
  formErrors,
  formValues,
  inputNodes,
  isSubmitting,
  missingRequiredFields,
  setFieldValue,
}: UseRenderNodeParams) => {
  // Components with fallbacks
  const FormWrapper = useMemo(() => config.components.form || DefaultFormWrapper, [config.components.form, DefaultFormWrapper]);
  const SubmitButton = useMemo(
    () => config.components.submitButton || DefaultSubmitButton,
    [config.components.submitButton, DefaultSubmitButton],
  );
  const SubmitButtonWrapper = useMemo(
    () => config.components.submitButtonWrapper || DefaultSubmitButtonWrapper || Fragment,
    [config.components.submitButtonWrapper, DefaultSubmitButtonWrapper],
  );

  const renderNode = useCallback(
    function renderNode(node: Node<TreegeNodeData>): ReactNode {
      const { type } = node;

      switch (type) {
        case NODE_TYPE.input: {
          if (!isInputNode(node)) {
            return null;
          }

          const inputData = node.data;
          const inputType = inputData.type || "text";
          const CustomRenderer = config.components.inputs?.[inputType];
          const DefaultRenderer = defaultInputRenderers[inputType as keyof typeof defaultInputRenderers];
          const Renderer = (CustomRenderer || DefaultRenderer) as InputRenderer | undefined;
          const fieldId = node.id;
          const setValue = (newValue: InputValue) => setFieldValue(fieldId, newValue);
          const value = formValues[fieldId];
          const error = formErrors[fieldId];
          const label = getTranslatedText(inputData.label, config.language);
          const placeholder = resolveInputPlaceholder(inputData, config.language);
          const helperText = getTranslatedText(inputData.helperText, config.language);
          const name = resolveNodeKey(node);
          const safeLabel = sanitize(label);
          const safePlaceholder = sanitize(placeholder);
          const safeHelperText = sanitize(helperText);

          if (!Renderer) {
            console.warn("No renderer found for input type:", inputType);
            return null;
          }

          const field: InputFieldProps = {
            "aria-invalid": error ? true : undefined,
            id: node.id,
            name,
            placeholder: safePlaceholder,
            required: inputData.required,
            value,
          };
          const extra: InputExtraProps = {
            error,
            helperText: safeHelperText,
            isSubmitting,
            label: safeLabel,
            missingDependencies: getMissingDependencies(node, formValues, inputNodes, config.language),
            missingRequiredFields,
            node,
            setValue,
          };

          return (
            <DefaultInputWrapper key={node.id} node={node}>
              <Renderer key={inputType} field={field} extra={extra} />
            </DefaultInputWrapper>
          );
        }

        case NODE_TYPE.group: {
          // Groups are no longer rendered as containers — they're metadata for
          // the step partitioning in `useTreegeRenderer`. Children are rendered
          // directly inside their step.
          return null;
        }

        case NODE_TYPE.ui: {
          if (!isUINode(node)) {
            return null;
          }

          const uiData = node.data as UINodeData;
          const uiType = uiData.type || "title";
          const CustomRenderer = config.components.ui?.[uiType];
          const DefaultRenderer = defaultUI[uiType];
          const Renderer = CustomRenderer || DefaultRenderer;

          if (!Renderer) {
            return null;
          }

          return <Renderer key={node.id} node={node} />;
        }

        default:
          console.warn("Unknown node type:", type);
          return null;
      }
    },
    [
      config,
      formValues,
      formErrors,
      setFieldValue,
      isSubmitting,
      missingRequiredFields,
      inputNodes,
      defaultInputRenderers,
      defaultUI,
      DefaultInputWrapper,
    ],
  );

  return {
    FormWrapper,
    renderNode,
    SubmitButton,
    SubmitButtonWrapper,
  };
};
