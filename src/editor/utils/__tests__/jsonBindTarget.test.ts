import { json } from "@codemirror/lang-json";
import { EditorState } from "@codemirror/state";
import { describe, expect, it } from "vitest";
import { findJsonBindTargetAt } from "@/editor/utils/jsonBindTarget";

/** Build a JSON-aware editor state so `syntaxTree` resolves real nodes. */
const stateOf = (doc: string) => EditorState.create({ doc, extensions: [json()] });

describe("findJsonBindTargetAt", () => {
  it("targets a string value (with its quotes) and marks it not a token", () => {
    const doc = '{ "name": "Jean" }';
    const state = stateOf(doc);

    const result = findJsonBindTargetAt(state, doc.indexOf("Jean"));

    expect(result).not.toBeNull();
    expect(state.sliceDoc(result?.from, result?.to)).toBe('"Jean"');
    expect(result?.isToken).toBe(false);
  });

  it("targets a key", () => {
    const doc = '{ "name": "Jean" }';
    const state = stateOf(doc);

    const result = findJsonBindTargetAt(state, doc.indexOf("name"));

    expect(state.sliceDoc(result?.from, result?.to)).toBe('"name"');
    expect(result?.isToken).toBe(false);
  });

  it("targets a number value", () => {
    const doc = '{ "age": 42 }';
    const state = stateOf(doc);

    // +1 to land inside the number, not at its boundary (resolveInner uses a -1 bias).
    const result = findJsonBindTargetAt(state, doc.indexOf("42") + 1);

    expect(state.sliceDoc(result?.from, result?.to)).toBe("42");
    expect(result?.isToken).toBe(false);
  });

  it("flags an already-bound token value (isToken)", () => {
    const doc = '{ "name": "{{id1}}" }';
    const state = stateOf(doc);

    const result = findJsonBindTargetAt(state, doc.indexOf("id1"));

    expect(state.sliceDoc(result?.from, result?.to)).toBe('"{{id1}}"');
    expect(result?.isToken).toBe(true);
  });

  it("flags a bound token key", () => {
    const doc = '{ "{{id1}}": "x" }';
    const state = stateOf(doc);

    const result = findJsonBindTargetAt(state, doc.indexOf("id1"));

    expect(state.sliceDoc(result?.from, result?.to)).toBe('"{{id1}}"');
    expect(result?.isToken).toBe(true);
  });

  it("returns null when not on a key or value", () => {
    const doc = '{ "name": "Jean" }';
    const state = stateOf(doc);

    expect(findJsonBindTargetAt(state, 0)).toBeNull(); // the opening brace
    expect(findJsonBindTargetAt(state, doc.length)).toBeNull(); // past the closing brace
  });
});
