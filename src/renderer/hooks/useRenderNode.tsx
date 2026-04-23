import { Node } from "@xyflow/react";
import { ComponentType, Fragment, ReactNode, useCallback, useMemo } from "react";
import { FormValues, InputRenderers, InputRenderProps, InputValue, TreegeRendererComponents } from "@/renderer/types/renderer";
import { resolveNodeKey } from "@/renderer/utils/node";
import { sanitize } from "@/renderer/utils/sanitize";
import { NODE_TYPE } from "@/shared/constants/node";
import { TreegeNodeData, UINodeData } from "@/shared/types/node";
import { isGroupNode, isInputNode, isUINode } from "@/shared/utils/nodeTypeGuards";
import { getStaticTranslations, getTranslatedText } from "@/shared/utils/translations";

const TEXTFIELD_INPUT_TYPES: ReadonlySet<string> = new Set(["text", "number", "password", "textarea", "time"]);

type AnyComponent = ComponentType<any>;

type UseRenderNodeParams = {
  config: {
    components: TreegeRendererComponents;
    language: string;
  };
  DefaultFormWrapper: AnyComponent;
  DefaultGroup: AnyComponent;
  DefaultSubmitButton: AnyComponent;
  DefaultSubmitButtonWrapper?: AnyComponent;
  defaultInputRenderers: InputRenderers;
  defaultUI: Record<string, AnyComponent>;
  formErrors: Record<string, string>;
  formValues: FormValues;
  missingRequiredFields: string[];
  setFieldValue: (fieldId: string, value: unknown) => void;
  visibleNodes: Node<TreegeNodeData>[];
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
  DefaultGroup,
  DefaultSubmitButton,
  DefaultSubmitButtonWrapper,
  config,
  defaultInputRenderers,
  defaultUI,
  formErrors,
  formValues,
  missingRequiredFields,
  setFieldValue,
  visibleNodes,
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
          const Renderer = (CustomRenderer || DefaultRenderer) as ((props: InputRenderProps) => ReactNode) | undefined;
          const fieldId = node.id;
          const setValue = (newValue: InputValue) => setFieldValue(fieldId, newValue);
          const value = formValues[fieldId];
          const error = formErrors[fieldId];
          const label = getTranslatedText(inputData.label, config.language);
          const hasPlaceholderForLanguage = !!inputData.placeholder?.[config.language];
          const placeholder =
            !hasPlaceholderForLanguage && TEXTFIELD_INPUT_TYPES.has(inputType)
              ? getStaticTranslations(config.language)["renderer.defaultInputs.newAnswer"]
              : getTranslatedText(inputData.placeholder, config.language);
          const helperText = getTranslatedText(inputData.helperText, config.language);
          const name = resolveNodeKey(node);
          // Sanitize all user-controlled text to prevent XSS attacks (plainTextOnly: true by default)
          const safeLabel = sanitize(label);
          const safePlaceholder = sanitize(placeholder);
          const safeHelperText = sanitize(helperText);

          if (!Renderer) {
            console.warn("No renderer found for input type:", inputType);
            return null;
          }

          return (
            <Renderer
              key={node.id}
              id={node.id}
              node={node}
              value={value}
              error={error}
              label={safeLabel}
              placeholder={safePlaceholder}
              helperText={safeHelperText}
              name={name}
              setValue={setValue}
              missingRequiredFields={missingRequiredFields}
            />
          );
        }

        case NODE_TYPE.group: {
          if (!isGroupNode(node)) {
            return null;
          }

          const GroupComponent = (config.components.group || DefaultGroup) as ComponentType<{
            key?: string;
            node: Node<TreegeNodeData>;
            children: ReactNode;
          }>;
          // Filter children - visibleNodes maintains flow order from getFlowRenderState
          const childNodes = visibleNodes.filter((child) => child.parentId === node.id);

          return (
            <GroupComponent key={node.id} node={node}>
              {childNodes.map((child) => renderNode(child))}
            </GroupComponent>
          );
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

        case NODE_TYPE.flow: {
          // FlowNodes are already merged in the pre-processing step
          // So we should never reach here, but just in case, return null
          return null;
        }

        default:
          console.warn("Unknown node type:", type);
          return null;
      }
    },
    [config, visibleNodes, formValues, formErrors, setFieldValue, missingRequiredFields, defaultInputRenderers, defaultUI, DefaultGroup],
  );

  return {
    FormWrapper,
    renderNode,
    SubmitButton,
    SubmitButtonWrapper,
  };
};
