import { autocompletion, type CompletionContext, startCompletion } from "@codemirror/autocomplete";
import { json } from "@codemirror/lang-json";
import { syntaxTree } from "@codemirror/language";
import CodeMirror, {
  Decoration,
  type DecorationSet,
  type EditorState,
  EditorView,
  MatchDecorator,
  ViewPlugin,
  WidgetType,
} from "@uiw/react-codemirror";
import { useMemo } from "react";
import useTranslate from "@/editor/hooks/useTranslate";
import { useTheme } from "@/shared/context/ThemeContext";

interface FieldRef {
  nodeId: string;
  label: string;
}

interface JsonTemplateEditorProps {
  /** The raw JSON template string (source of truth). */
  value: string;
  onChange: (next: string) => void;
  /** Fields that can be bound to a key or value. */
  fields: FieldRef[];
}

/** Minimal shape of a Lezer syntax node (avoids a direct @lezer/common dep). */
interface SyntaxNodeLike {
  name: string;
  from: number;
  to: number;
  parent: SyntaxNodeLike | null;
}

const TOKEN_REGEXP = /"\{\{([\w-]+)}}"|\{\{([\w-]+)}}/g; // A bound field token, optionally wrapped in JSON quotes: `{{id}}` or `"{{id}}"`.
const TOKEN_TEST = /^"?\{\{[\w-]+}}"?$/;
const VALUE_NODE_NAMES = new Set(["Number", "True", "False", "Null"]); // JSON primitive value node names (a key is a `String` under a `PropertyName`).

/** Renders a `{{nodeId}}` token as a readable, atomic pill showing the field label. */
class TokenWidget extends WidgetType {
  constructor(
    readonly nodeId: string,
    readonly label: string,
  ) {
    super();
  }
  eq(other: TokenWidget) {
    return other.nodeId === this.nodeId && other.label === this.label;
  }
  toDOM() {
    const span = document.createElement("span");
    span.className = "tg-cm-token";
    span.textContent = this.label;
    span.title = `{{${this.nodeId}}}`;
    return span;
  }
  ignoreEvent() {
    return false;
  }
}

const tokenTheme = EditorView.baseTheme({
  ".tg-cm-token": {
    backgroundColor: "rgba(59, 130, 246, 0.15)",
    borderRadius: "4px",
    color: "#1d4ed8",
    cursor: "pointer",
    fontWeight: "500",
    padding: "0 4px",
    whiteSpace: "nowrap",
  },
  "&dark .tg-cm-token": {
    backgroundColor: "rgba(59, 130, 246, 0.25)",
    color: "#93c5fd",
  },
});

/**
 * Find the JSON key or value node under `pos`, so a click there can bind a
 * field. Returns the range to replace and whether it is already a token.
 */
const findBindable = (state: EditorState, pos: number): { from: number; to: number; isToken: boolean } | null => {
  let node = syntaxTree(state).resolveInner(pos, -1) as unknown as SyntaxNodeLike | null;

  while (node) {
    const isKeyString = node.name === "String" && node.parent?.name === "PropertyName";
    const target =
      node.name === "PropertyName" ? node : isKeyString ? node : node.name === "String" || VALUE_NODE_NAMES.has(node.name) ? node : null;

    if (target) {
      return { from: target.from, isToken: TOKEN_TEST.test(state.sliceDoc(target.from, target.to)), to: target.to };
    }
    node = node.parent;
  }

  return null;
};

const JsonTemplateEditor = ({ value, onChange, fields }: JsonTemplateEditorProps) => {
  const t = useTranslate();
  const { theme } = useTheme();

  const colorMode: "dark" | "light" =
    theme === "dark"
      ? "dark"
      : theme === "light"
        ? "light"
        : typeof window !== "undefined" && window.matchMedia?.("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light";

  const isInvalid = useMemo(() => {
    if (!value.trim()) {
      return false;
    }
    try {
      JSON.parse(value);
      return false;
    } catch {
      return true;
    }
  }, [value]);

  const extensions = useMemo(() => {
    const labelOf = (nodeId: string) => fields.find((field) => field.nodeId === nodeId)?.label ?? nodeId;

    const matcher = new MatchDecorator({
      decoration: (match) => Decoration.replace({ widget: new TokenWidget(match[1] ?? match[2], labelOf(match[1] ?? match[2])) }),
      regexp: TOKEN_REGEXP,
    });

    const tokenPlugin = ViewPlugin.fromClass(
      class {
        decorations: DecorationSet;
        constructor(view: EditorView) {
          this.decorations = matcher.createDeco(view);
        }
        update(update: Parameters<MatchDecorator["updateDeco"]>[0]) {
          this.decorations = matcher.updateDeco(update, this.decorations);
        }
      },
      {
        decorations: (plugin) => plugin.decorations,
        // Atomic pills: the caret skips over them and backspace removes the whole token.
        provide: (plugin) => EditorView.atomicRanges.of((view) => view.plugin(plugin)?.decorations ?? Decoration.none),
      },
    );

    const completionSource = (context: CompletionContext) => {
      const typed = context.matchBefore(/\{\{[\w-]*$/); // Typing `{{` anywhere: insert a bare token (the user is usually inside quotes already).

      if (typed) {
        return {
          from: typed.from,
          options: fields.map((field) => ({ apply: `{{${field.nodeId}}}`, detail: field.nodeId, label: field.label, type: "variable" })),
        };
      }

      // Clicking a key/value (explicit) opens the field menu over that node.
      if (!context.explicit) {
        return null;
      }

      const target = findBindable(context.state, context.pos);

      if (!target) {
        return null;
      }

      const options = fields.map((field) => ({
        apply: `"{{${field.nodeId}}}"`,
        detail: field.nodeId,
        label: field.label,
        type: "variable",
      }));
      if (target.isToken) {
        options.unshift({ apply: '""', detail: "", label: t("editor.jsonTemplate.unbind"), type: "text" });
      }
      return { filter: false, from: target.from, options, to: target.to };
    };

    // Open the field menu when a key or value is clicked.
    const clickToBind = EditorView.domEventHandlers({
      mousedown(event, view) {
        const pos = view.posAtCoords({ x: event.clientX, y: event.clientY });
        if (pos == null || !findBindable(view.state, pos)) {
          return false;
        }
        // Let the click place the caret first, then open the menu at that node.
        requestAnimationFrame(() => startCompletion(view));
        return false;
      },
    });

    return [json(), tokenTheme, tokenPlugin, autocompletion({ override: [completionSource] }), clickToBind, EditorView.lineWrapping];
  }, [fields, t]);

  return (
    <div className="tg:space-y-2">
      <div className={`tg:overflow-hidden tg:rounded-md tg:border ${isInvalid ? "tg:border-destructive" : "tg:border-input"}`}>
        <CodeMirror
          value={value}
          onChange={onChange}
          extensions={extensions}
          theme={colorMode}
          placeholder={t("editor.jsonTemplate.placeholder")}
          minHeight="120px"
          basicSetup={{ autocompletion: false, closeBrackets: false, foldGutter: false }}
          style={{ fontSize: "12px" }}
        />
      </div>

      <p className="tg:text-muted-foreground tg:text-xs">{t("editor.jsonTemplate.hint")}</p>

      {isInvalid && <p className="tg:text-destructive tg:text-xs">{t("editor.jsonTemplate.invalidJson")}</p>}
    </div>
  );
};

export default JsonTemplateEditor;
