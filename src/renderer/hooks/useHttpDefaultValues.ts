import { Node } from "@xyflow/react";
import { useEffect, useRef } from "react";
import { FormValues } from "@/renderer/types/renderer";
import { isFieldEmpty } from "@/renderer/utils/form";
import { makeHttpRequest } from "@/renderer/utils/http";
import {
  deriveHttpDefaultValue,
  getHttpDefaultRequestSignature,
  getHttpDefaultSource,
  hasUnresolvedHttpDefaultDependencies,
  resolveHttpDefaultRequest,
} from "@/renderer/utils/httpDefault";
import { HttpHeaders, InputNodeData } from "@/shared/types/node";

interface UseHttpDefaultValuesParams {
  /** Input nodes of the active branch — hidden branches never trigger requests. */
  inputNodes: Node<InputNodeData>[];
  formValues: FormValues;
  setFieldValue: (fieldName: string, value: unknown) => void;
  baseUrl?: string;
  headers?: HttpHeaders;
}

interface AppliedDerivation {
  /** Signature of the request the value came from (or is being fetched for). */
  signature: string;
  /** Last value written into the field by this hook, `undefined` while the first request is in flight. */
  value: unknown;
  /** The user edited the field away from its derived value: stop following the source until it is emptied. */
  detached?: boolean;
}

const areValuesEqual = (a: unknown, b: unknown): boolean => {
  try {
    return JSON.stringify(a) === JSON.stringify(b);
  } catch {
    return Object.is(a, b);
  }
};

/**
 * Drive the `defaultValue: { type: "http" }` fields: whenever the request of
 * such a field can be resolved and differs from the one last applied, fetch it
 * and write the derived value into the field.
 *
 * Mirrors the reference-default contract (`calculateReferenceFieldUpdates`):
 * a field the user edited away from its derived value stops following its
 * source, and a field that already holds a value (e.g. seeded from
 * `initialValues` on an edit screen) is never overwritten by the first
 * derivation. Requests are aborted when superseded or on unmount.
 */
export const useHttpDefaultValues = ({ inputNodes, formValues, setFieldValue, baseUrl, headers }: UseHttpDefaultValuesParams): void => {
  const appliedRef = useRef(new Map<string, AppliedDerivation>());
  const controllersRef = useRef(new Map<string, AbortController>());

  /**
   * Re-evaluate every http-derived field on each form/config change: a field
   * whose resolved request differs from the last applied one (tracked by
   * signature in `appliedRef`) gets (re)fetched; everything else is skipped,
   * so this runs cheaply on unrelated keystrokes.
   */
  useEffect(() => {
    inputNodes.forEach((node) => {
      const source = getHttpDefaultSource(node);

      if (!source || hasUnresolvedHttpDefaultDependencies(node, formValues)) {
        return;
      }

      const request = resolveHttpDefaultRequest(source, formValues, { baseUrl, headers });
      const signature = getHttpDefaultRequestSignature(request);
      const applied = appliedRef.current.get(node.id);

      if (applied?.signature === signature) {
        return;
      }

      // Respect what the user (or the consumer's initial values) put in the field:
      // once it diverges from the derived value, the field stays detached from its
      // source until the user empties it (same contract as reference defaults).
      const currentValue = formValues[node.id];
      if (!isFieldEmpty(currentValue) && (applied?.detached || !areValuesEqual(currentValue, applied?.value))) {
        appliedRef.current.set(node.id, { detached: true, signature, value: currentValue });
        return;
      }

      controllersRef.current.get(node.id)?.abort();
      const controller = new AbortController();
      controllersRef.current.set(node.id, controller);
      // Mark the request as in flight so re-renders don't re-issue it.
      appliedRef.current.set(node.id, { signature, value: applied?.value });

      makeHttpRequest({ ...request, signal: controller.signal }).then((result) => {
        if (controller.signal.aborted || !result.success) {
          return;
        }

        const value = deriveHttpDefaultValue(result.data, source, node.data.defaultValue ?? {});
        if (value === undefined) {
          return;
        }

        appliedRef.current.set(node.id, { signature, value });
        setFieldValue(node.id, value);
      });
    });
  }, [inputNodes, formValues, setFieldValue, baseUrl, headers]);

  /**
   * On unmount, abort every request still in flight so late responses can't
   * write into a form that no longer exists.
   */
  useEffect(() => {
    const controllers = controllersRef.current;

    return () => {
      for (const controller of controllers.values()) {
        controller.abort();
      }
    };
  }, []);
};
