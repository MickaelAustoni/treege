import { describe, expect, it } from "vitest";
import { OpenApiDocument } from "@/editor/types/openapi";
import { buildPayloadSkeleton, findRouteRequestSchema } from "@/editor/utils/openApiPayload";

const doc: OpenApiDocument = {
  components: {
    schemas: {
      Address: {
        properties: { city: { type: "string" }, zip: { type: "string" } },
        type: "object",
      },
    },
  },
  openapi: "3.0.0",
  paths: {
    "/users": {
      get: {}, // no request body
      post: {
        requestBody: {
          content: {
            "application/json": {
              schema: {
                properties: {
                  active: { type: "boolean" },
                  address: { $ref: "#/components/schemas/Address" },
                  age: { type: "integer" },
                  name: { type: "string" },
                  role: { enum: ["admin", "user"], type: "string" },
                  source: { example: "web", type: "string" },
                  tags: { items: { type: "string" }, type: "array" },
                },
                type: "object",
              },
            },
          },
        },
      },
    },
  },
  servers: [{ url: "https://api.example.com" }],
};

describe("findRouteRequestSchema", () => {
  it("finds the JSON request-body schema for a matching route + method", () => {
    expect(findRouteRequestSchema(doc, "/users", "POST")).toBeDefined();
  });

  it("matches a base-prefixed (absolute) url", () => {
    expect(findRouteRequestSchema(doc, "https://api.example.com/users", "POST")).toBeDefined();
  });

  it("returns undefined when the route has no request body", () => {
    expect(findRouteRequestSchema(doc, "/users", "GET")).toBeUndefined();
  });

  it("returns undefined for an unknown route", () => {
    expect(findRouteRequestSchema(doc, "/unknown", "POST")).toBeUndefined();
  });

  it("returns undefined for an empty url", () => {
    expect(findRouteRequestSchema(doc, "", "POST")).toBeUndefined();
  });
});

describe("buildPayloadSkeleton", () => {
  it("builds a typed skeleton, using example/enum and resolving $ref", () => {
    const schema = findRouteRequestSchema(doc, "/users", "POST");

    expect(buildPayloadSkeleton(doc, schema)).toEqual({
      active: false,
      address: { city: "", zip: "" }, // resolved $ref
      age: 0,
      name: "",
      role: "admin", // first enum value
      source: "web", // example
      tags: [""], // one item showing the array shape
    });
  });

  it("returns null for an undefined schema", () => {
    expect(buildPayloadSkeleton(doc, undefined)).toBeNull();
  });
});
