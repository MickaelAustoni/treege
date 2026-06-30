import { Node } from "@xyflow/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { InputNodeData, SubmitConfig } from "@/shared/types/node";

// Mock only the network call; keep every other http util (header/url/template
// resolution) real so the test exercises the genuine body-building path.
vi.mock("@/renderer/utils/http", async (importActual) => {
  const actual = await importActual<typeof import("@/renderer/utils/http")>();
  return {
    ...actual,
    makeHttpRequest: vi.fn(),
  };
});

import { makeHttpRequest } from "@/renderer/utils/http";
import { submitFormData } from "@/renderer/utils/submit";

const mockedMakeHttpRequest = vi.mocked(makeHttpRequest);

const inputNodes: Node<InputNodeData>[] = [
  {
    data: { name: "firstName", type: "text" },
    id: "node-1",
    position: { x: 0, y: 0 },
    type: "input",
  },
];

/** Parse the JSON body of the (single) request the mock received. */
const sentBody = () => {
  const body = mockedMakeHttpRequest.mock.calls[0]?.[0]?.body;
  return typeof body === "string" ? JSON.parse(body) : body;
};

describe("submitFormData — extraPayload integration", () => {
  const baseConfig: SubmitConfig = { method: "POST", url: "https://api.test/submit" };
  const formValues = { "node-1": "Ada" };

  beforeEach(() => {
    mockedMakeHttpRequest.mockReset();
    mockedMakeHttpRequest.mockResolvedValue({ data: {}, success: true });
  });

  it("merges a static extraPayload into the sendAllFormValues body", async () => {
    await submitFormData({ ...baseConfig, sendAllFormValues: true }, formValues, inputNodes, undefined, undefined, { userId: "u1" });

    expect(sentBody()).toEqual({ firstName: "Ada", userId: "u1" });
  });

  it("merges extraPayload on top of a payloadTemplate, the template shape preserved", async () => {
    const config: SubmitConfig = { ...baseConfig, payloadTemplate: '{"profile":{"name":"{{firstName}}"}}' };

    await submitFormData(config, formValues, inputNodes, undefined, undefined, { userId: "u1" });

    expect(sentBody()).toEqual({ profile: { name: "Ada" }, userId: "u1" });
  });

  it("sends the extraPayload alone when the config would otherwise send no body", async () => {
    // Neither sendAllFormValues nor a template → no base body; the extra must still go out.
    await submitFormData(baseConfig, formValues, inputNodes, undefined, undefined, { userId: "u1" });

    expect(mockedMakeHttpRequest.mock.calls[0]?.[0]?.body).toBeDefined();
    expect(sentBody()).toEqual({ userId: "u1" });
  });

  it("evaluates the function form against the name-keyed form values", async () => {
    await submitFormData({ ...baseConfig, sendAllFormValues: true }, formValues, inputNodes, undefined, undefined, (values) => ({
      greeting: `Hello ${values.firstName}`,
    }));

    expect(sentBody()).toEqual({ firstName: "Ada", greeting: "Hello Ada" });
  });

  it("lets extraPayload override a same-named form field", async () => {
    await submitFormData({ ...baseConfig, sendAllFormValues: true }, formValues, inputNodes, undefined, undefined, {
      firstName: "override",
    });

    expect(sentBody()).toEqual({ firstName: "override" });
  });

  it("sends only the form values when no extraPayload is provided (no regression)", async () => {
    await submitFormData({ ...baseConfig, sendAllFormValues: true }, formValues, inputNodes);

    expect(sentBody()).toEqual({ firstName: "Ada" });
  });

  it("sends no body when neither a payload nor an extraPayload is configured", async () => {
    await submitFormData(baseConfig, formValues, inputNodes);

    expect(mockedMakeHttpRequest.mock.calls[0]?.[0]?.body).toBeUndefined();
  });
});
