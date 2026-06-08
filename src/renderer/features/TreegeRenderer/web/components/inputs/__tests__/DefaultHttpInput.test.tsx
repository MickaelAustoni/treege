import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { Node } from "@xyflow/react";
import { StrictMode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TreegeRenderRuntimeProvider } from "@/renderer/context/TreegeRenderRuntimeProvider";
import InputRendererHost from "@/renderer/features/TreegeRenderer/InputRendererHost";
import { InputExtraProps, InputFieldProps } from "@/renderer/types/renderer";
import { InputNodeData } from "@/shared/types/node";
import DefaultHttpInput from "../DefaultHttpInput";

const USERS = [
  { id: 1, name: "Leanne Graham" },
  { id: 2, name: "Ervin Howell" },
];

/**
 * A fetch mock that honours the abort signal the same way the real `fetch`
 * does: the response only resolves on a later microtask, and if the request
 * was aborted in the meantime it rejects with an `AbortError`. This is what
 * makes the StrictMode regression reproducible — a mock that ignored the
 * signal would resolve the (aborted) first request and hide the bug.
 */
const createAbortAwareFetch = (data: unknown) =>
  vi.fn((_url: string, init?: RequestInit) =>
    Promise.resolve().then(() => {
      if (init?.signal?.aborted) {
        const error = new Error("The operation was aborted");
        error.name = "AbortError";
        throw error;
      }
      return {
        json: async () => data,
        ok: true,
        status: 200,
        statusText: "OK",
      } as Response;
    }),
  );

const buildNode = (): Node<InputNodeData> => ({
  data: {
    httpConfig: {
      body: "",
      fetchOnMount: true,
      headers: {},
      method: "GET",
      queryParams: {},
      responseMapping: { labelField: "name", valueField: "id" },
      responsePath: "",
      searchParam: "",
      sendAllFormValues: false,
      showLoading: true,
      url: "https://jsonplaceholder.typicode.com/users",
    },
    type: "http",
  },
  id: "M7uYawQJYU1-P-MgCBbCb",
  position: { x: 0, y: 0 },
  type: "input",
});

const renderHttpInput = (node: Node<InputNodeData>) => {
  const field: InputFieldProps<"http"> = { id: node.id, name: "users", value: "" };
  const extra: InputExtraProps<"http"> = { missingDependencies: [], node, setValue: vi.fn() };

  return render(
    <StrictMode>
      <TreegeRenderRuntimeProvider value={{ formValues: {}, inputNodes: [node], language: "en" }}>
        <InputRendererHost render={DefaultHttpInput} field={field} extra={extra} />
      </TreegeRenderRuntimeProvider>
    </StrictMode>,
  );
};

describe("DefaultHttpInput (web)", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", createAbortAwareFetch(USERS));
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  // Regression: under React StrictMode the mount fetch was aborted on the
  // simulated unmount and never retried (the one-time guard stayed set),
  // leaving the field empty ("No data available"). The Select trigger is
  // disabled while there are no options, so it staying disabled is the
  // observable symptom of the bug.
  it("populates options from fetchOnMount even under StrictMode double-invoke", async () => {
    renderHttpInput(buildNode());

    // The trigger is disabled until options are fetched; once the mount fetch
    // resolves it becomes enabled. With the bug it would stay disabled forever.
    await waitFor(() => {
      expect((screen.getByRole("combobox") as HTMLButtonElement).disabled).toBe(false);
    });

    expect(fetch).toHaveBeenCalled();
  });

  // Regression: editing an HTTP field in the editor and re-saving pushes a new
  // tree (new `httpConfig`) without remounting the input. The mount fetch only
  // runs once, so the field used to keep showing stale data. It must re-fetch
  // when the config changes (e.g. a new url).
  it("re-fetches when the HTTP config changes after mount (tree re-saved)", async () => {
    const node = buildNode();
    const { rerender } = renderHttpInput(node);

    await waitFor(() => {
      expect((screen.getByRole("combobox") as HTMLButtonElement).disabled).toBe(false);
    });

    const callsAfterMount = vi.mocked(fetch).mock.calls.length;

    const updated = buildNode();
    updated.data.httpConfig = {
      ...updated.data.httpConfig,
      url: "https://jsonplaceholder.typicode.com/people",
    } as InputNodeData["httpConfig"];
    const field: InputFieldProps<"http"> = { id: updated.id, name: "users", value: "" };
    const extra: InputExtraProps<"http"> = { missingDependencies: [], node: updated, setValue: vi.fn() };

    rerender(
      <StrictMode>
        <TreegeRenderRuntimeProvider value={{ formValues: {}, inputNodes: [updated], language: "en" }}>
          <InputRendererHost render={DefaultHttpInput} field={field} extra={extra} />
        </TreegeRenderRuntimeProvider>
      </StrictMode>,
    );

    await waitFor(() => {
      expect(vi.mocked(fetch).mock.calls.length).toBeGreaterThan(callsAfterMount);
    });

    expect(vi.mocked(fetch).mock.calls.some(([url]) => String(url).includes("/people"))).toBe(true);
  });
});
