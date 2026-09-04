import { renderHook, waitFor } from "@testing-library/react";
import { Node } from "@xyflow/react";
import { PropsWithChildren } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { TreegeRenderRuntimeProvider } from "@/renderer/context/TreegeRenderRuntimeProvider";
import { useInputOptions } from "@/renderer/hooks/useInputOptions";
import { createOptionsCache, OptionsCache } from "@/renderer/utils/optionsCache";
import { InputNodeData } from "@/shared/types/node";

vi.mock("@/renderer/utils/http", async () => {
  const actual = await vi.importActual<typeof import("@/renderer/utils/http")>("@/renderer/utils/http");
  return { ...actual, makeHttpRequest: vi.fn() };
});

const { makeHttpRequest } = await import("@/renderer/utils/http");
const mockedRequest = vi.mocked(makeHttpRequest);

const node: Node<InputNodeData> = {
  data: {
    label: { en: "Country" },
    name: "country",
    optionsSource: { mapping: { labelField: "name", valueField: "code" }, url: "https://api.example.com/countries" },
    type: "select",
  },
  id: "country",
  position: { x: 0, y: 0 },
  type: "input",
};

const withRuntime =
  (optionsCache?: OptionsCache) =>
  ({ children }: PropsWithChildren) => <TreegeRenderRuntimeProvider value={{ optionsCache }}>{children}</TreegeRenderRuntimeProvider>;

describe("useInputOptions – optionsCache", () => {
  beforeEach(() => {
    mockedRequest.mockReset();
    mockedRequest.mockResolvedValue({
      data: [
        { code: "fr", name: "France" },
        { code: "de", name: "Germany" },
      ],
      status: 200,
      success: true,
    });
  });

  it("fetches on every mount when no cache is provided (runtime behaviour), aborting on unmount", async () => {
    const first = renderHook(() => useInputOptions(node), { wrapper: withRuntime() });
    await waitFor(() => expect(first.result.current.options).toHaveLength(2));
    expect(mockedRequest.mock.calls[0][0].signal).toBeInstanceOf(AbortSignal);
    first.unmount();

    const second = renderHook(() => useInputOptions(node), { wrapper: withRuntime() });
    await waitFor(() => expect(second.result.current.options).toHaveLength(2));

    expect(mockedRequest).toHaveBeenCalledTimes(2);
  });

  it("reuses the cached options on remount, from the very first render", async () => {
    const cache = createOptionsCache();

    const first = renderHook(() => useInputOptions(node), { wrapper: withRuntime(cache) });
    await waitFor(() => expect(first.result.current.options).toHaveLength(2));
    first.unmount();

    const second = renderHook(() => useInputOptions(node), { wrapper: withRuntime(cache) });
    expect(second.result.current.isLoading).toBe(false);
    expect(second.result.current.options.map((option) => option.value)).toEqual(["fr", "de"]);

    expect(mockedRequest).toHaveBeenCalledTimes(1);
  });

  it("lets a shared request complete and fill the cache even when the input unmounts mid-flight", async () => {
    const cache = createOptionsCache();
    const deferred = createDeferred<Awaited<ReturnType<typeof makeHttpRequest>>>();
    mockedRequest.mockReturnValue(deferred.promise);

    const first = renderHook(() => useInputOptions(node), { wrapper: withRuntime(cache) });
    expect(first.result.current.isLoading).toBe(true);
    expect(mockedRequest.mock.calls[0][0].signal).toBeUndefined();
    first.unmount();

    deferred.resolve({ data: [{ code: "fr", name: "France" }], status: 200, success: true });

    const second = renderHook(() => useInputOptions(node), { wrapper: withRuntime(cache) });
    await waitFor(() => expect(second.result.current.options.map((option) => option.value)).toEqual(["fr"]));
    expect(mockedRequest).toHaveBeenCalledTimes(1);
  });

  it("shares one request between inputs mounting together", async () => {
    const cache = createOptionsCache();

    const first = renderHook(() => useInputOptions(node), { wrapper: withRuntime(cache) });
    const second = renderHook(() => useInputOptions(node), { wrapper: withRuntime(cache) });
    await waitFor(() => expect(first.result.current.options).toHaveLength(2));
    await waitFor(() => expect(second.result.current.options).toHaveLength(2));

    expect(mockedRequest).toHaveBeenCalledTimes(1);
  });

  it("does not cache failed requests and reports the error", async () => {
    mockedRequest.mockResolvedValue({ error: "boom", status: 500, success: false });
    const cache = createOptionsCache();

    const { result, unmount } = renderHook(() => useInputOptions(node), { wrapper: withRuntime(cache) });
    await waitFor(() => expect(result.current.error).toBe("boom"));
    unmount();

    renderHook(() => useInputOptions(node), { wrapper: withRuntime(cache) });
    await waitFor(() => expect(mockedRequest).toHaveBeenCalledTimes(2));
  });
});

/** A promise settled by hand, to hold a request in flight while the test unmounts the input. */
const createDeferred = <T,>() => {
  const handles: { resolve: (value: T) => void } = { resolve: () => {} };
  const promise = new Promise<T>((resolve) => {
    handles.resolve = resolve;
  });
  return { promise, resolve: (value: T) => handles.resolve(value) };
};
