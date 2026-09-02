import { act, renderHook, waitFor } from "@testing-library/react";
import { Edge, Node } from "@xyflow/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useTreegeRenderer } from "@/renderer/features/TreegeRenderer/useTreegeRenderer";
import { Flow, InputNodeData } from "@/shared/types/node";

const WORKSITES: Record<string, { address: Record<string, string> }> = {
  "42": { address: { city: "Paris", route: "Rue de la Paix", streetNumber: "12", zipcode: "75002" } },
  "43": { address: { city: "Lyon", route: "Cours Lafayette", streetNumber: "1", zipcode: "69003" } },
};

const inputNode = (id: string, data: Partial<InputNodeData>): Node => ({
  data: data as InputNodeData,
  id,
  position: { x: 0, y: 0 },
  type: "input",
});

const edge = (source: string, target: string): Edge => ({ id: `${source}->${target}`, source, target });

/** Worksite id → delivery address derived from GET /v2/worksites/{{worksite}}. */
const flow: Flow = {
  edges: [edge("worksite", "address"), edge("address", "comment")],
  id: "flow-http-default",
  nodes: [
    inputNode("worksite", { name: "worksite", type: "text" }),
    inputNode("address", {
      defaultValue: {
        httpSource: {
          responsePath: "address",
          template: "{{streetNumber}} {{route}}, {{zipcode}} {{city}}",
          url: "/v2/worksites/{{worksite}}",
        },
        type: "http",
      },
      name: "address",
      type: "address",
    }),
    inputNode("comment", { name: "comment", type: "text" }),
  ],
};

const jsonResponse = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), { headers: { "Content-Type": "application/json" }, status });

const fetchMock = vi.fn((url: string) => {
  const id = url.split("/").pop() ?? "";
  const worksite = WORKSITES[id];

  return Promise.resolve(worksite ? jsonResponse(worksite) : jsonResponse({ detail: "not found" }, 404));
});

describe("http default values", () => {
  beforeEach(() => {
    fetchMock.mockClear();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("derives the value once every dependency is filled and follows the source", async () => {
    const { result } = renderHook(() => useTreegeRenderer({ baseUrl: "https://api.example.com", flow }));

    expect(fetchMock).not.toHaveBeenCalled();

    act(() => result.current.setFieldValue("worksite", "42"));

    await waitFor(() => expect(result.current.formValues.address).toBe("12 Rue de la Paix, 75002 Paris"));
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toBe("https://api.example.com/v2/worksites/42");

    act(() => result.current.setFieldValue("worksite", "43"));

    await waitFor(() => expect(result.current.formValues.address).toBe("1 Cours Lafayette, 69003 Lyon"));
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("does not re-fetch when unrelated fields change", async () => {
    const { result } = renderHook(() => useTreegeRenderer({ flow }));

    act(() => result.current.setFieldValue("worksite", "42"));
    await waitFor(() => expect(result.current.formValues.address).toBeDefined());

    act(() => result.current.setFieldValue("comment", "hello"));
    act(() => result.current.setFieldValue("comment", "hello world"));

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("stops overwriting a value the user edited by hand", async () => {
    const { result } = renderHook(() => useTreegeRenderer({ flow }));

    act(() => result.current.setFieldValue("worksite", "42"));
    await waitFor(() => expect(result.current.formValues.address).toBe("12 Rue de la Paix, 75002 Paris"));

    act(() => result.current.setFieldValue("address", "Custom address"));
    act(() => result.current.setFieldValue("worksite", "43"));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    expect(result.current.formValues.address).toBe("Custom address");
  });

  it("keeps a diverged field detached across later source changes", async () => {
    const { result } = renderHook(() => useTreegeRenderer({ flow }));

    act(() => result.current.setFieldValue("worksite", "42"));
    await waitFor(() => expect(result.current.formValues.address).toBe("12 Rue de la Paix, 75002 Paris"));

    act(() => result.current.setFieldValue("address", "Custom address"));
    act(() => result.current.setFieldValue("worksite", "43"));
    act(() => result.current.setFieldValue("worksite", "42"));

    await new Promise((resolve) => setTimeout(resolve, 100));
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(result.current.formValues.address).toBe("Custom address");

    // Emptying the field re-attaches it to its source.
    act(() => result.current.setFieldValue("address", ""));
    act(() => result.current.setFieldValue("worksite", "43"));

    await waitFor(() => expect(result.current.formValues.address).toBe("1 Cours Lafayette, 69003 Lyon"));
  });

  it("never overwrites a value seeded from initialValues", async () => {
    const { result } = renderHook(() => useTreegeRenderer({ flow, initialValues: { address: "Stored address", worksite: "42" } }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(0));
    expect(result.current.formValues.address).toBe("Stored address");
  });

  it("leaves the field untouched when the request fails", async () => {
    const { result } = renderHook(() => useTreegeRenderer({ flow }));

    act(() => result.current.setFieldValue("worksite", "999"));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    expect(result.current.formValues.address).toBeUndefined();
  });
});
