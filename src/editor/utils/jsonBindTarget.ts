import { syntaxTree } from "@codemirror/language";
import type { EditorState } from "@codemirror/state";

/** Minimal shape of a Lezer syntax node (avoids a direct @lezer/common dep). */
interface SyntaxNodeLike {
  name: string;
  from: number;
  to: number;
  parent: SyntaxNodeLike | null;
}

/** A string that is *only* a single field token, e.g. `{{id}}` or `"{{id}}"`. */
const TOKEN_TEST = /^"?\{\{[\w-]+}}"?$/;
/** JSON primitive value node names (a key is a `String` under a `PropertyName`). */
const VALUE_NODE_NAMES = new Set(["Number", "True", "False", "Null"]);

export interface JsonBindTarget {
  /** Start offset of the key/value node to replace. */
  from: number;
  /** End offset of the key/value node to replace. */
  to: number;
  /** Whether the node is already a `{{token}}` (so the menu can offer "unbind"). */
  isToken: boolean;
}

/**
 * Find the JSON key or value node under `pos`, so a click there can bind a
 * field. Returns the range to replace and whether it is already a token, or
 * `null` when `pos` is not on a key/value (e.g. on punctuation/whitespace).
 */
export const findJsonBindTargetAt = (state: EditorState, pos: number): JsonBindTarget | null => {
  // Walk up from the resolved node until we hit a key or value node.
  const findBindTargetFromNode = (node: SyntaxNodeLike | null): JsonBindTarget | null => {
    if (!node) {
      return null;
    }

    const isKeyString = node.name === "String" && node.parent?.name === "PropertyName";
    const target =
      node.name === "PropertyName" ? node : isKeyString ? node : node.name === "String" || VALUE_NODE_NAMES.has(node.name) ? node : null;

    if (target) {
      return { from: target.from, isToken: TOKEN_TEST.test(state.sliceDoc(target.from, target.to)), to: target.to };
    }

    return findBindTargetFromNode(node.parent);
  };

  return findBindTargetFromNode(syntaxTree(state).resolveInner(pos, -1) as unknown as SyntaxNodeLike | null);
};
