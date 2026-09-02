import { Node } from "@xyflow/react";
import { describe, expect, it } from "vitest";
import {
  deriveHttpDefaultValue,
  getHttpDefaultRequestSignature,
  getHttpDefaultSource,
  hasUnresolvedHttpDefaultDependencies,
  resolveHttpDefaultRequest,
} from "@/renderer/utils/httpDefault";
import { getTemplateDependencyIds } from "@/renderer/utils/templateDependencies";
import { HttpDefaultSource, InputNodeData } from "@/shared/types/node";

const source: HttpDefaultSource = {
  queryParams: { lang: "{{language}}" },
  responsePath: "address",
  template: "{{streetNumber}} {{route}}, {{zipcode}} {{city}}",
  url: "/v2/worksites/{{worksite}}",
};

const node = (defaultValue: InputNodeData["defaultValue"]): Node<InputNodeData> => ({
  data: { defaultValue, name: "address", type: "address" },
  id: "address",
  position: { x: 0, y: 0 },
  type: "input",
});

describe("getHttpDefaultSource", () => {
  it("returns the source only for http defaults with a url", () => {
    expect(getHttpDefaultSource(node({ httpSource: source, type: "http" }))).toBe(source);
    expect(getHttpDefaultSource(node({ httpSource: { responsePath: "x" }, type: "http" }))).toBeUndefined();
    expect(getHttpDefaultSource(node({ referenceField: "worksite", type: "reference" }))).toBeUndefined();
    expect(getHttpDefaultSource(node(null))).toBeUndefined();
  });
});

describe("dependencies", () => {
  it("lists the fields referenced by the request, alongside options sources", () => {
    const withOptions = node({ httpSource: source, type: "http" });
    withOptions.data.optionsSource = { url: "/v2/options/{{category}}" };

    expect(getTemplateDependencyIds(node({ httpSource: source, type: "http" }))).toEqual(["worksite", "language"]);
    expect(getTemplateDependencyIds(withOptions)).toEqual(["category", "worksite", "language"]);
  });

  it("is unresolved until every referenced field is filled", () => {
    const target = node({ httpSource: source, type: "http" });

    expect(hasUnresolvedHttpDefaultDependencies(target, {})).toBe(true);
    expect(hasUnresolvedHttpDefaultDependencies(target, { language: "fr", worksite: "" })).toBe(true);
    expect(hasUnresolvedHttpDefaultDependencies(target, { language: "fr", worksite: "42" })).toBe(false);
  });
});

describe("resolveHttpDefaultRequest", () => {
  it("resolves templates, the base url and merges headers (field-level wins)", () => {
    const request = resolveHttpDefaultRequest(
      { ...source, headers: { Accept: "text/plain", "X-Scope": "{{worksite}}" } },
      { language: "fr", worksite: "42" },
      { baseUrl: "https://api.example.com", headers: { Accept: "application/json", Authorization: "Bearer t" } },
    );

    expect(request).toEqual({
      body: undefined,
      headers: { Accept: "text/plain", Authorization: "Bearer t", "X-Scope": "42" },
      method: "GET",
      queryParams: { lang: "fr" },
      url: "https://api.example.com/v2/worksites/42",
    });
  });

  it("ignores headers in the request signature", () => {
    const base = resolveHttpDefaultRequest(source, { language: "fr", worksite: "42" });
    const otherToken = resolveHttpDefaultRequest(
      source,
      { language: "fr", worksite: "42" },
      { headers: { Authorization: "Bearer other" } },
    );
    const otherWorksite = resolveHttpDefaultRequest(source, { language: "fr", worksite: "43" });

    expect(getHttpDefaultRequestSignature(base)).toBe(getHttpDefaultRequestSignature(otherToken));
    expect(getHttpDefaultRequestSignature(base)).not.toBe(getHttpDefaultRequestSignature(otherWorksite));
  });
});

describe("deriveHttpDefaultValue", () => {
  const response = { address: { city: "Paris", route: "Rue de la Paix", streetNumber: "12", zipcode: "75002" }, id: "42" };

  it("renders the template from the extracted object and tidies whitespace", () => {
    expect(deriveHttpDefaultValue(response, source, { type: "http" })).toBe("12 Rue de la Paix, 75002 Paris");
    expect(deriveHttpDefaultValue({ address: { city: "Paris", zipcode: "75002" } }, source, { type: "http" })).toBe("75002 Paris");
  });

  it("exposes a scalar as {{value}}", () => {
    expect(deriveHttpDefaultValue({ total: 3 }, { responsePath: "total", template: "{{value}} items", url: "/x" }, { type: "http" })).toBe(
      "3 items",
    );
  });

  it("falls back to the transform function when there is no template", () => {
    const noTemplate = { responsePath: "id", url: "/x" };

    expect(deriveHttpDefaultValue(response, noTemplate, { type: "http" })).toBe("42");
    expect(deriveHttpDefaultValue(response, noTemplate, { transformFunction: "toNumber", type: "http" })).toBe(42);
    expect(
      deriveHttpDefaultValue(
        response,
        { responsePath: "address", url: "/x" },
        { objectMapping: [{ sourceKey: "city", targetKey: "town" }], transformFunction: "toObject", type: "http" },
      ),
    ).toEqual({ town: "Paris" });
  });

  it("uses the whole response without a path and returns undefined when nothing is found", () => {
    expect(deriveHttpDefaultValue("raw", { url: "/x" }, { type: "http" })).toBe("raw");
    expect(deriveHttpDefaultValue(response, { responsePath: "missing.path", url: "/x" }, { type: "http" })).toBeUndefined();
  });
});
