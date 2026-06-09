import { Node } from "@xyflow/react";
import { describe, expect, it } from "vitest";
import { FormValues } from "@/renderer/types/renderer";
import {
  applyReferenceTransformation,
  buildInitialFormValues,
  calculateReferenceFieldUpdates,
  checkFormFieldHasValue,
  convertFormValuesToNamedFormat,
  isFieldEmpty,
} from "@/renderer/utils/form";
import { InputNodeData } from "@/shared/types/node";

describe("Form Utils", () => {
  describe("isFieldEmpty", () => {
    describe("Empty Values", () => {
      it("should return true for undefined", () => {
        expect(isFieldEmpty(undefined)).toBe(true);
      });

      it("should return true for null", () => {
        expect(isFieldEmpty(null)).toBe(true);
      });

      it("should return true for empty string", () => {
        expect(isFieldEmpty("")).toBe(true);
      });

      it("should return true for whitespace-only string", () => {
        expect(isFieldEmpty("   ")).toBe(true);
      });

      it("should return true for empty array", () => {
        expect(isFieldEmpty([])).toBe(true);
      });
    });

    describe("Non-Empty Values", () => {
      it("should return false for non-empty string", () => {
        expect(isFieldEmpty("hello")).toBe(false);
      });

      it("should return false for string with only spaces around text", () => {
        expect(isFieldEmpty("  hello  ")).toBe(false);
      });

      it("should return false for number 0", () => {
        expect(isFieldEmpty(0)).toBe(false);
      });

      it("should return false for boolean false", () => {
        expect(isFieldEmpty(false)).toBe(false);
      });

      it("should return false for boolean true", () => {
        expect(isFieldEmpty(true)).toBe(false);
      });

      it("should return false for array with elements", () => {
        expect(isFieldEmpty([1, 2, 3])).toBe(false);
      });

      it("should return false for object", () => {
        expect(isFieldEmpty({ key: "value" })).toBe(false);
      });

      it("should return false for empty object", () => {
        expect(isFieldEmpty({})).toBe(false);
      });
    });
  });

  describe("checkFormFieldHasValue", () => {
    describe("Has Value", () => {
      it("should return true for non-empty string", () => {
        const formValues: FormValues = { name: "John" };
        expect(checkFormFieldHasValue("name", formValues)).toBe(true);
      });

      it("should return true for number including 0", () => {
        const formValues: FormValues = { age: 0 };
        expect(checkFormFieldHasValue("age", formValues)).toBe(true);
      });

      it("should return true for boolean false", () => {
        const formValues: FormValues = { active: false };
        expect(checkFormFieldHasValue("active", formValues)).toBe(true);
      });

      it("should return true for boolean true", () => {
        const formValues: FormValues = { active: true };
        expect(checkFormFieldHasValue("active", formValues)).toBe(true);
      });

      it("should return true for empty string", () => {
        const formValues: FormValues = { name: "" };
        expect(checkFormFieldHasValue("name", formValues)).toBe(true);
      });

      it("should return true for empty array", () => {
        const formValues: FormValues = { items: [] };
        expect(checkFormFieldHasValue("items", formValues)).toBe(true);
      });
    });

    describe("No Value", () => {
      it("should return false for undefined field", () => {
        const formValues: FormValues = {};
        expect(checkFormFieldHasValue("missing", formValues)).toBe(false);
      });

      it("should return false for null value", () => {
        const formValues: FormValues = { name: null };
        expect(checkFormFieldHasValue("name", formValues)).toBe(false);
      });

      it("should return false for undefined fieldName", () => {
        const formValues: FormValues = { name: "John" };
        expect(checkFormFieldHasValue(undefined, formValues)).toBe(false);
      });

      it("should return false for empty string fieldName", () => {
        const formValues: FormValues = { name: "John" };
        expect(checkFormFieldHasValue("", formValues)).toBe(false);
      });
    });

    describe("Edge Cases", () => {
      it("should handle numeric field names", () => {
        const formValues: FormValues = { "123": "value" };
        expect(checkFormFieldHasValue("123", formValues)).toBe(true);
      });

      it("should handle field names with special characters", () => {
        const formValues: FormValues = { "field-name": "value" };
        expect(checkFormFieldHasValue("field-name", formValues)).toBe(true);
      });

      it("should distinguish between undefined and null", () => {
        const formValues: FormValues = { defined: null };
        expect(checkFormFieldHasValue("defined", formValues)).toBe(false);
        expect(checkFormFieldHasValue("undefined", formValues)).toBe(false);
      });
    });
  });

  describe("convertFormValuesToNamedFormat", () => {
    describe("Basic Conversion", () => {
      it("should convert node IDs to field names", () => {
        const formValues: FormValues = {
          "node-1": "Alice",
          "node-2": "Bob",
        };
        const nodes: Node<InputNodeData>[] = [
          {
            data: { name: "firstName", type: "text" },
            id: "node-1",
            position: { x: 0, y: 0 },
            type: "input",
          },
          {
            data: { name: "lastName", type: "text" },
            id: "node-2",
            position: { x: 100, y: 0 },
            type: "input",
          },
        ];

        const result = convertFormValuesToNamedFormat(formValues, nodes);

        expect(result).toEqual({
          firstName: "Alice",
          lastName: "Bob",
        });
      });

      it("should use label when name is missing", () => {
        const formValues: FormValues = {
          "node-1": "value",
        };
        const nodes: Node<InputNodeData>[] = [
          {
            data: { label: { en: "First Name" }, type: "text" },
            id: "node-1",
            position: { x: 0, y: 0 },
            type: "input",
          },
        ];

        const result = convertFormValuesToNamedFormat(formValues, nodes);

        expect(result).toEqual({
          "First Name": "value",
        });
      });

      it("should use node ID as fallback when name and label are missing", () => {
        const formValues: FormValues = {
          "node-1": "value",
        };
        const nodes: Node<InputNodeData>[] = [
          {
            data: { type: "text" } as InputNodeData,
            id: "node-1",
            position: { x: 0, y: 0 },
            type: "input",
          },
        ];

        const result = convertFormValuesToNamedFormat(formValues, nodes);

        expect(result).toEqual({
          "node-1": "value",
        });
      });

      it("should prioritize name over label", () => {
        const formValues: FormValues = {
          "node-1": "value",
        };
        const nodes: Node<InputNodeData>[] = [
          {
            data: { label: { en: "First Name" }, name: "firstName", type: "text" },
            id: "node-1",
            position: { x: 0, y: 0 },
            type: "input",
          },
        ];

        const result = convertFormValuesToNamedFormat(formValues, nodes);

        expect(result).toEqual({
          firstName: "value",
        });
      });

      it("should use first available language when en label is missing", () => {
        const formValues: FormValues = {
          "node-1": "value",
        };
        const nodes: Node<InputNodeData>[] = [
          {
            data: { label: { fr: "Prénom" }, type: "text" },
            id: "node-1",
            position: { x: 0, y: 0 },
            type: "input",
          },
        ];

        const result = convertFormValuesToNamedFormat(formValues, nodes);

        expect(result).toEqual({
          Prénom: "value",
        });
      });

      it("should skip nodes without values in formValues", () => {
        const formValues: FormValues = {
          "node-1": "Alice",
        };
        const nodes: Node<InputNodeData>[] = [
          {
            data: { name: "firstName", type: "text" },
            id: "node-1",
            position: { x: 0, y: 0 },
            type: "input",
          },
          {
            data: { name: "lastName", type: "text" },
            id: "node-2",
            position: { x: 100, y: 0 },
            type: "input",
          },
        ];

        const result = convertFormValuesToNamedFormat(formValues, nodes);

        expect(result).toEqual({
          firstName: "Alice",
        });
        expect(result).not.toHaveProperty("lastName");
      });
    });

    describe("Duplicate Names", () => {
      it("should overwrite earlier values with later ones for duplicate names", () => {
        const formValues: FormValues = {
          "node-1": "First",
          "node-2": "Second",
        };
        const nodes: Node<InputNodeData>[] = [
          {
            data: { name: "value", type: "text" },
            id: "node-1",
            position: { x: 0, y: 0 },
            type: "input",
          },
          {
            data: { name: "value", type: "text" },
            id: "node-2",
            position: { x: 100, y: 0 },
            type: "input",
          },
        ];

        const result = convertFormValuesToNamedFormat(formValues, nodes);

        expect(result).toEqual({
          value: "Second",
        });
      });
    });

    describe("Value Types", () => {
      it("should preserve string values", () => {
        const formValues: FormValues = { "node-1": "text" };
        const nodes: Node<InputNodeData>[] = [
          {
            data: { name: "field", type: "text" },
            id: "node-1",
            position: { x: 0, y: 0 },
            type: "input",
          },
        ];

        const result = convertFormValuesToNamedFormat(formValues, nodes);

        expect(result.field).toBe("text");
      });

      it("should preserve number values", () => {
        const formValues: FormValues = { "node-1": 42 };
        const nodes: Node<InputNodeData>[] = [
          {
            data: { name: "age", type: "number" },
            id: "node-1",
            position: { x: 0, y: 0 },
            type: "input",
          },
        ];

        const result = convertFormValuesToNamedFormat(formValues, nodes);

        expect(result.age).toBe(42);
      });

      it("should preserve boolean values", () => {
        const formValues: FormValues = { "node-1": true };
        const nodes: Node<InputNodeData>[] = [
          {
            data: { name: "active", type: "checkbox" },
            id: "node-1",
            position: { x: 0, y: 0 },
            type: "input",
          },
        ];

        const result = convertFormValuesToNamedFormat(formValues, nodes);

        expect(result.active).toBe(true);
      });

      it("should preserve array values", () => {
        const formValues: FormValues = { "node-1": ["a", "b", "c"] };
        const nodes: Node<InputNodeData>[] = [
          {
            data: { name: "items", type: "select" },
            id: "node-1",
            position: { x: 0, y: 0 },
            type: "input",
          },
        ];

        const result = convertFormValuesToNamedFormat(formValues, nodes);

        expect(result.items).toEqual(["a", "b", "c"]);
      });

      it("should preserve object values", () => {
        const formValues: FormValues = { "node-1": { nested: "value" } };
        const nodes: Node<InputNodeData>[] = [
          {
            data: { name: "data", type: "http" },
            id: "node-1",
            position: { x: 0, y: 0 },
            type: "input",
          },
        ];

        const result = convertFormValuesToNamedFormat(formValues, nodes);

        expect(result.data).toEqual({ nested: "value" });
      });

      it("should handle zero, false, and empty string as valid values", () => {
        const formValues: FormValues = {
          "node-1": 0,
          "node-2": false,
          "node-3": "",
        };
        const nodes: Node<InputNodeData>[] = [
          {
            data: { name: "count", type: "number" },
            id: "node-1",
            position: { x: 0, y: 0 },
            type: "input",
          },
          {
            data: { name: "active", type: "checkbox" },
            id: "node-2",
            position: { x: 100, y: 0 },
            type: "input",
          },
          {
            data: { name: "name", type: "text" },
            id: "node-3",
            position: { x: 200, y: 0 },
            type: "input",
          },
        ];

        const result = convertFormValuesToNamedFormat(formValues, nodes);

        expect(result).toEqual({
          active: false,
          count: 0,
          name: "",
        });
      });
    });

    describe("Empty Cases", () => {
      it("should return empty object for empty nodes array", () => {
        const formValues: FormValues = { "node-1": "value" };
        const nodes: Node<InputNodeData>[] = [];

        const result = convertFormValuesToNamedFormat(formValues, nodes);

        expect(result).toEqual({});
      });

      it("should return empty object for empty formValues", () => {
        const formValues: FormValues = {};
        const nodes: Node<InputNodeData>[] = [
          {
            data: { name: "field", type: "text" },
            id: "node-1",
            position: { x: 0, y: 0 },
            type: "input",
          },
        ];

        const result = convertFormValuesToNamedFormat(formValues, nodes);

        expect(result).toEqual({});
      });

      it("should return empty object when both are empty", () => {
        const result = convertFormValuesToNamedFormat({}, []);

        expect(result).toEqual({});
      });
    });
  });

  describe("buildInitialFormValues", () => {
    /** Concise input-node factory for these tests. */
    const input = (id: string, data: InputNodeData): Node<InputNodeData> => ({
      data,
      id,
      position: { x: 0, y: 0 },
      type: "input",
    });

    describe("Key Normalization", () => {
      it("should seed values keyed by node.id", () => {
        const nodes = [input("node-1", { name: "firstName", type: "text" }), input("node-2", { name: "lastName", type: "text" })];

        const result = buildInitialFormValues({ "node-1": "Alice", "node-2": "Bob" }, nodes);

        expect(result).toEqual({ "node-1": "Alice", "node-2": "Bob" });
      });

      it("should accept name-based keys (round-trip from onSubmit)", () => {
        const nodes = [input("node-1", { name: "firstName", type: "text" }), input("node-2", { name: "lastName", type: "text" })];

        const result = buildInitialFormValues({ firstName: "Alice", lastName: "Bob" }, nodes);

        expect(result).toEqual({ "node-1": "Alice", "node-2": "Bob" });
      });

      it("should accept label-based keys when name is missing", () => {
        const nodes = [input("node-1", { label: { en: "First Name" }, type: "text" })];

        const result = buildInitialFormValues({ "First Name": "Alice" }, nodes);

        expect(result).toEqual({ "node-1": "Alice" });
      });

      it("should prioritize the node.id key over the name key when both are present", () => {
        const nodes = [input("node-1", { name: "firstName", type: "text" })];

        const result = buildInitialFormValues({ firstName: "byName", "node-1": "byId" }, nodes);

        expect(result).toEqual({ "node-1": "byId" });
      });

      it("should ignore keys that match no node", () => {
        const nodes = [input("node-1", { name: "firstName", type: "text" })];

        const result = buildInitialFormValues({ firstName: "Alice", unknownField: "ignored" }, nodes);

        expect(result).toEqual({ "node-1": "Alice" });
      });

      it("should preserve falsy values (0, false, empty string)", () => {
        const nodes = [
          input("node-1", { name: "count", type: "number" }),
          input("node-2", { name: "active", type: "checkbox" }),
          input("node-3", { name: "label", type: "text" }),
        ];

        const result = buildInitialFormValues({ active: false, count: 0, label: "" }, nodes);

        expect(result).toEqual({ "node-1": 0, "node-2": false, "node-3": "" });
      });
    });

    describe("Default Values", () => {
      it("should apply static defaults to fields left unset", () => {
        const nodes = [input("node-1", { defaultValue: { staticValue: "fallback", type: "static" }, name: "firstName", type: "text" })];

        const result = buildInitialFormValues({}, nodes);

        expect(result).toEqual({ "node-1": "fallback" });
      });

      it("should let provided values override static defaults", () => {
        const nodes = [input("node-1", { defaultValue: { staticValue: "fallback", type: "static" }, name: "firstName", type: "text" })];

        const result = buildInitialFormValues({ firstName: "Alice" }, nodes);

        expect(result).toEqual({ "node-1": "Alice" });
      });

      it("should resolve reference defaults from another field's resolved value", () => {
        const nodes = [
          input("source", { name: "email", type: "text" }),
          input("target", { defaultValue: { referenceField: "source", type: "reference" }, name: "confirmEmail", type: "text" }),
        ];

        const result = buildInitialFormValues({ email: "a@b.com" }, nodes);

        expect(result).toEqual({ source: "a@b.com", target: "a@b.com" });
      });

      it("should not apply a reference default when the referenced field is unset", () => {
        const nodes = [
          input("source", { name: "email", type: "text" }),
          input("target", { defaultValue: { referenceField: "source", type: "reference" }, name: "confirmEmail", type: "text" }),
        ];

        const result = buildInitialFormValues({}, nodes);

        expect(result).toEqual({});
      });
    });

    describe("Empty Cases", () => {
      it("should return an empty object for empty inputs", () => {
        expect(buildInitialFormValues({}, [])).toEqual({});
      });

      it("should return an empty object when no values match and no defaults exist", () => {
        const nodes = [input("node-1", { name: "firstName", type: "text" })];

        expect(buildInitialFormValues({}, nodes)).toEqual({});
      });
    });
  });

  describe("applyReferenceTransformation", () => {
    describe("No Transformation", () => {
      it("should return original value when transformFunction is null", () => {
        expect(applyReferenceTransformation("test", null)).toBe("test");
      });

      it("should return original value when transformFunction is undefined", () => {
        expect(applyReferenceTransformation("test", undefined)).toBe("test");
      });
    });

    describe("toString Transformation", () => {
      it("should convert number to string", () => {
        expect(applyReferenceTransformation(42, "toString")).toBe("42");
      });

      it("should convert boolean to string", () => {
        expect(applyReferenceTransformation(true, "toString")).toBe("true");
      });

      it("should keep string as string", () => {
        expect(applyReferenceTransformation("test", "toString")).toBe("test");
      });

      it("should convert object to string", () => {
        expect(applyReferenceTransformation({ a: 1 }, "toString")).toBe("[object Object]");
      });
    });

    describe("toNumber Transformation", () => {
      it("should convert string to number", () => {
        expect(applyReferenceTransformation("42", "toNumber")).toBe(42);
      });

      it("should convert boolean to number", () => {
        expect(applyReferenceTransformation(true, "toNumber")).toBe(1);
        expect(applyReferenceTransformation(false, "toNumber")).toBe(0);
      });

      it("should keep number as number", () => {
        expect(applyReferenceTransformation(42, "toNumber")).toBe(42);
      });

      it("should convert invalid string to NaN", () => {
        expect(applyReferenceTransformation("invalid", "toNumber")).toBeNaN();
      });
    });

    describe("toBoolean Transformation", () => {
      it("should convert truthy values to true", () => {
        expect(applyReferenceTransformation("text", "toBoolean")).toBe(true);
        expect(applyReferenceTransformation(1, "toBoolean")).toBe(true);
        expect(applyReferenceTransformation({}, "toBoolean")).toBe(true);
      });

      it("should convert falsy values to false", () => {
        expect(applyReferenceTransformation("", "toBoolean")).toBe(false);
        expect(applyReferenceTransformation(0, "toBoolean")).toBe(false);
        expect(applyReferenceTransformation(null, "toBoolean")).toBe(false);
        expect(applyReferenceTransformation(undefined, "toBoolean")).toBe(false);
      });
    });

    describe("toArray Transformation", () => {
      it("should wrap non-array in array", () => {
        expect(applyReferenceTransformation("test", "toArray")).toEqual(["test"]);
        expect(applyReferenceTransformation(42, "toArray")).toEqual([42]);
      });

      it("should keep array as array", () => {
        expect(applyReferenceTransformation([1, 2, 3], "toArray")).toEqual([1, 2, 3]);
      });
    });

    describe("toObject Transformation", () => {
      it("should transform object with mapping", () => {
        const source = { firstName: "John", lastName: "Doe" };
        const mapping = [
          { sourceKey: "firstName", targetKey: "name" },
          { sourceKey: "lastName", targetKey: "surname" },
        ];

        const result = applyReferenceTransformation(source, "toObject", mapping);

        expect(result).toEqual({ name: "John", surname: "Doe" });
      });

      it("should return original value when no mapping provided", () => {
        const source = { a: 1 };
        expect(applyReferenceTransformation(source, "toObject")).toEqual({ a: 1 });
      });

      it("should handle missing source keys gracefully", () => {
        const source = { a: 1 };
        const mapping = [{ sourceKey: "missing", targetKey: "result" }];

        const result = applyReferenceTransformation(source, "toObject", mapping);

        expect(result).toEqual({ result: undefined });
      });

      it("should return original value when source is not an object", () => {
        const mapping = [{ sourceKey: "a", targetKey: "b" }];
        expect(applyReferenceTransformation("string", "toObject", mapping)).toBe("string");
        expect(applyReferenceTransformation(null, "toObject", mapping)).toBe(null);
      });
    });
  });

  describe("calculateReferenceFieldUpdates", () => {
    describe("Basic Reference Update", () => {
      it("should update field when reference value changes", () => {
        const nodes: Node<InputNodeData>[] = [
          {
            data: {
              defaultValue: {
                referenceField: "source",
                type: "reference",
              },
              type: "text",
            },
            id: "target",
            position: { x: 0, y: 0 },
            type: "input",
          },
        ];

        const prevFormValues: FormValues = { source: "old" };
        const formValues: FormValues = { source: "new", target: "old" };

        const result = calculateReferenceFieldUpdates(nodes, formValues, prevFormValues);

        expect(result).toEqual({ target: "new" });
      });

      it("should not update when reference value hasn't changed", () => {
        const nodes: Node<InputNodeData>[] = [
          {
            data: {
              defaultValue: {
                referenceField: "source",
                type: "reference",
              },
              type: "text",
            },
            id: "target",
            position: { x: 0, y: 0 },
            type: "input",
          },
        ];

        const prevFormValues: FormValues = { source: "same" };
        const formValues: FormValues = { source: "same", target: "old" };

        const result = calculateReferenceFieldUpdates(nodes, formValues, prevFormValues);

        expect(result).toEqual({});
      });

      it("should not update when reference value is undefined", () => {
        const nodes: Node<InputNodeData>[] = [
          {
            data: {
              defaultValue: {
                referenceField: "source",
                type: "reference",
              },
              type: "text",
            },
            id: "target",
            position: { x: 0, y: 0 },
            type: "input",
          },
        ];

        const prevFormValues: FormValues = {};
        const formValues: FormValues = { target: "value" };

        const result = calculateReferenceFieldUpdates(nodes, formValues, prevFormValues);

        expect(result).toEqual({});
      });

      it("should not update when reference value is null", () => {
        const nodes: Node<InputNodeData>[] = [
          {
            data: {
              defaultValue: {
                referenceField: "source",
                type: "reference",
              },
              type: "text",
            },
            id: "target",
            position: { x: 0, y: 0 },
            type: "input",
          },
        ];

        const prevFormValues: FormValues = { source: "old" };
        const formValues: FormValues = { source: null, target: "value" };

        const result = calculateReferenceFieldUpdates(nodes, formValues, prevFormValues);

        expect(result).toEqual({});
      });
    });

    describe("Manual Edit Detection", () => {
      it("should detect manual edit and skip update", () => {
        const nodes: Node<InputNodeData>[] = [
          {
            data: {
              defaultValue: {
                referenceField: "source",
                type: "reference",
              },
              type: "text",
            },
            id: "target",
            position: { x: 0, y: 0 },
            type: "input",
          },
        ];

        // User changed source from "old" to "new"
        // But target was manually changed to "custom" (not "old")
        const prevFormValues: FormValues = { source: "old", target: "old" };
        const formValues: FormValues = { source: "new", target: "custom" };

        const result = calculateReferenceFieldUpdates(nodes, formValues, prevFormValues);

        // Should not update because target was manually edited
        expect(result).toEqual({});
      });

      it("should update when field matches previous transformed value", () => {
        const nodes: Node<InputNodeData>[] = [
          {
            data: {
              defaultValue: {
                referenceField: "source",
                type: "reference",
              },
              type: "text",
            },
            id: "target",
            position: { x: 0, y: 0 },
            type: "input",
          },
        ];

        // Target still has the auto-filled value from previous source
        const prevFormValues: FormValues = { source: "old" };
        const formValues: FormValues = { source: "new", target: "old" };

        const result = calculateReferenceFieldUpdates(nodes, formValues, prevFormValues);

        // Should update because target wasn't manually edited
        expect(result).toEqual({ target: "new" });
      });
    });

    describe("With Transformations", () => {
      it("should apply toString transformation", () => {
        const nodes: Node<InputNodeData>[] = [
          {
            data: {
              defaultValue: {
                referenceField: "source",
                transformFunction: "toString",
                type: "reference",
              },
              type: "text",
            },
            id: "target",
            position: { x: 0, y: 0 },
            type: "input",
          },
        ];

        const prevFormValues: FormValues = { source: 10 };
        const formValues: FormValues = { source: 42, target: "10" };

        const result = calculateReferenceFieldUpdates(nodes, formValues, prevFormValues);

        expect(result).toEqual({ target: "42" });
      });

      it("should detect manual edit with transformation", () => {
        const nodes: Node<InputNodeData>[] = [
          {
            data: {
              defaultValue: {
                referenceField: "source",
                transformFunction: "toString",
                type: "reference",
              },
              type: "text",
            },
            id: "target",
            position: { x: 0, y: 0 },
            type: "input",
          },
        ];

        // Previous source was 10 (transformed to "10")
        // But target was manually changed to "custom"
        const prevFormValues: FormValues = { source: 10 };
        const formValues: FormValues = { source: 42, target: "custom" };

        const result = calculateReferenceFieldUpdates(nodes, formValues, prevFormValues);

        // Should not update because target was manually edited
        expect(result).toEqual({});
      });

      // Note: toObject transformation with manual edit detection is complex for objects
      // because they are compared by reference. This test covers the basic transformation
      // but doesn't test manual edit detection for objects (which is a known limitation).
      it("should apply toObject transformation (basic case)", () => {
        const _nodes: Node<InputNodeData>[] = [
          {
            data: {
              defaultValue: {
                objectMapping: [{ sourceKey: "firstName", targetKey: "name" }],
                referenceField: "source",
                transformFunction: "toObject",
                type: "reference",
              },
              type: "text",
            },
            id: "target",
            position: { x: 0, y: 0 },
            type: "input",
          },
        ];

        // Test basic transformation without edit detection complexity
        const nodes2: Node<InputNodeData>[] = [
          {
            data: {
              defaultValue: {
                objectMapping: [{ sourceKey: "a", targetKey: "b" }],
                referenceField: "source",
                transformFunction: "toObject",
                type: "reference",
              },
              type: "text",
            },
            id: "target",
            position: { x: 0, y: 0 },
            type: "input",
          },
        ];

        const prevFormValues2: FormValues = {};
        const formValues2: FormValues = {
          source: { a: 1 },
        };

        const result2 = calculateReferenceFieldUpdates(nodes2, formValues2, prevFormValues2);

        // Should successfully transform the object
        expect(result2).toEqual({ target: { b: 1 } });
      });
    });

    describe("Multiple Fields", () => {
      it("should update multiple reference fields", () => {
        const nodes: Node<InputNodeData>[] = [
          {
            data: {
              defaultValue: {
                referenceField: "source",
                type: "reference",
              },
              type: "text",
            },
            id: "target1",
            position: { x: 0, y: 0 },
            type: "input",
          },
          {
            data: {
              defaultValue: {
                referenceField: "source",
                transformFunction: "toString",
                type: "reference",
              },
              type: "text",
            },
            id: "target2",
            position: { x: 0, y: 0 },
            type: "input",
          },
        ];

        const prevFormValues: FormValues = { source: 10 };
        const formValues: FormValues = { source: 42, target1: 10, target2: "10" };

        const result = calculateReferenceFieldUpdates(nodes, formValues, prevFormValues);

        expect(result).toEqual({ target1: 42, target2: "42" });
      });

      it("should only update fields that weren't manually edited", () => {
        const nodes: Node<InputNodeData>[] = [
          {
            data: {
              defaultValue: {
                referenceField: "source",
                type: "reference",
              },
              type: "text",
            },
            id: "target1",
            position: { x: 0, y: 0 },
            type: "input",
          },
          {
            data: {
              defaultValue: {
                referenceField: "source",
                type: "reference",
              },
              type: "text",
            },
            id: "target2",
            position: { x: 0, y: 0 },
            type: "input",
          },
        ];

        const prevFormValues: FormValues = { source: "old" };
        const formValues: FormValues = {
          source: "new",
          target1: "old", // Not manually edited
          target2: "custom", // Manually edited
        };

        const result = calculateReferenceFieldUpdates(nodes, formValues, prevFormValues);

        // Only target1 should be updated
        expect(result).toEqual({ target1: "new" });
      });
    });

    describe("Edge Cases", () => {
      it("should return empty object when no nodes have reference defaults", () => {
        const nodes: Node<InputNodeData>[] = [
          {
            data: { type: "text" },
            id: "field",
            position: { x: 0, y: 0 },
            type: "input",
          },
        ];

        const prevFormValues: FormValues = {};
        const formValues: FormValues = { field: "value" };

        const result = calculateReferenceFieldUpdates(nodes, formValues, prevFormValues);

        expect(result).toEqual({});
      });

      it("should skip nodes without referenceField", () => {
        const nodes: Node<InputNodeData>[] = [
          {
            data: {
              defaultValue: {
                type: "static",
              },
              type: "text",
            },
            id: "field",
            position: { x: 0, y: 0 },
            type: "input",
          },
        ];

        const prevFormValues: FormValues = {};
        const formValues: FormValues = { field: "value" };

        const result = calculateReferenceFieldUpdates(nodes, formValues, prevFormValues);

        expect(result).toEqual({});
      });

      it("should not update when new value equals current value", () => {
        const nodes: Node<InputNodeData>[] = [
          {
            data: {
              defaultValue: {
                referenceField: "source",
                type: "reference",
              },
              type: "text",
            },
            id: "target",
            position: { x: 0, y: 0 },
            type: "input",
          },
        ];

        const prevFormValues: FormValues = { source: "old" };
        const formValues: FormValues = { source: "new", target: "new" };

        const result = calculateReferenceFieldUpdates(nodes, formValues, prevFormValues);

        // No update needed since target already has the correct value
        expect(result).toEqual({});
      });
    });
  });
});
