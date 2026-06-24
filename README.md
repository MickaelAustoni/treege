<div align="center">
  <img alt="Treege" src="https://user-images.githubusercontent.com/108873902/189673125-5d1fdaf3-82d1-486f-bb16-01b0554bd4f1.png" style="padding: 20px;" width="auto" height="100" />

  <h1>Treege</h1>
  <p><strong>Building complex, dynamic forms has never been this simple</strong></p>

  [![npm version](https://badge.fury.io/js/treege.svg)](https://badge.fury.io/js/treege)
  [![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

  <p>
    <a href="https://treege.io/">🌐 Website</a> •
    <a href="https://treege.io/playground/">🎮 Playground</a> •
    <a href="#features">Features</a> •
    <a href="#installation">Installation</a> •
    <a href="#quick-start">Quick Start</a> •
    <a href="#examples">Examples</a> •
    <a href="./AI_GENERATION.md">🪄 AI Generation</a>
  </p>
</div>

---

## Overview

Treege is a modern React library for creating and rendering interactive decision trees. Built on top of ReactFlow, it provides a complete solution for building complex form flow, decision logic, and conditional workflows with an intuitive visual editor.

## Features

### Visual Editor (`treege/editor`)
- **Node-based Interface**: Drag-and-drop editor powered by ReactFlow
- **3 Node Types**: Input, UI, and Group nodes
- **Conditional Edges**: Advanced logic with AND/OR operators (`===`, `!==`, `>`, `<`, `>=`, `<=`)
- **AI-Powered Generation**: Generate decision trees from natural language descriptions using Gemini, OpenAI, DeepSeek, or Claude ([Learn more](./AI_GENERATION.md))
- **Multi-language Support**: Built-in translation system for all labels
- **Type-safe**: Full TypeScript support
- **Mini-map & Controls**: Navigation tools for complex trees
- **Theme Support**: Dark/light mode with customizable backgrounds

### Runtime Renderer (`treege/renderer`)
- **Production Ready**: Full-featured form generation and validation system
- **16 Input Types**: text, number, select, checkbox, radio, date, daterange, time, timerange, file, address, http, textarea, password, switch, autocomplete, and hidden
- **Cross-Platform**: Full support for both React Web and React Native with dedicated implementations
- **HTTP Integration**: Built-in API integration with response mapping and search functionality
- **Advanced Validation**: Required fields, pattern matching, custom validation functions
- **Security**: Built-in input sanitization to prevent XSS attacks
- **Enhanced Error Messages**: Clear, user-friendly error messages for HTTP inputs and validation
- **Conditional Logic**: Dynamic field visibility based on user input and conditional edges
- **Multi-Step Forms**: Group nodes are automatically turned into navigable steps with Back/Continue controls, an `onBack` bridge to outer flows, and external-button submission via `formId`
- **Edit Mode**: Pre-fill with `initialValues` (accepts name keys, reactive) to round-trip and edit previously submitted records
- **Loading State**: Built-in `isLoading` prop renders a customizable skeleton while the flow is being fetched, plus `isSubmitting` to drive the button's loading state from async submits
- **Fully Customizable**: Override any component (form, inputs, inputLabel, ui, step, submitButton, submitButtonWrapper, loadingSkeleton)
- **Optional Dependencies**: Graceful degradation when optional packages like `react-native-document-picker` aren't installed
- **Theme Support**: Dark/light mode out of the box
- **Google API Integration**: Address autocomplete support
- **Read-Only Viewer**: `TreegeViewer` renders a submitted flow as a label/value recap — same branch-visibility and formatting as the form, works with or without a flow (self-describing values), supports collapse, with a headless `getViewerFields` core for custom layouts

### Developer Experience
- **Modular**: Import only what you need (editor, renderer, or both)
- **Modern Stack**: React 18/19, TailwindCSS 4, TypeScript 5
- **Well-typed**: Comprehensive TypeScript definitions
- **Production Ready**: Battle-tested and actively maintained

## Installation

```bash
# bun
bun add treege

# npm
npm install treege

# pnpm
pnpm add treege

# yarn
yarn add treege
```

## Quick Start

### Using the Editor

Create and edit decision trees visually:

```tsx
import { TreegeEditor } from "treege/editor";
import type { Flow } from "treege";

function App() {
  const [flow, setFlow] = useState<Flow | null>(null);

  const handleSave = (updatedFlow: Flow) => {
    setFlow(updatedFlow);
    console.log("Decision tree saved:", updatedFlow);
  };

  return (
    <TreegeEditor
      flow={flow}
      onSave={handleSave}
    />
  );
}
```

### Using the Renderer

Render interactive forms from decision trees:

```tsx
import { TreegeRenderer } from "treege/renderer";
import type { Flow, FormValues } from "treege";

function App() {
  const flow: Flow = {
    id: "flow-1",
    nodes: [
      {
        id: "start",
        type: "input",
        data: {
          name: "username",
          label: "Enter your username",
          required: true
        }
      }
    ],
    edges: []
  };

  const handleSubmit = (values: FormValues) => {
    console.log("Form submitted:", values);
  };

  return (
    <TreegeRenderer
      flow={flow}
      onSubmit={handleSubmit}
    />
  );
}
```

### Using Both Together

```tsx
import { TreegeEditor } from "treege/editor";
import { TreegeRenderer } from "treege/renderer";
import { useState } from "react";

function App() {
  const [flow, setFlow] = useState(null);
  const [mode, setMode] = useState<"edit" | "preview">("edit");

  return (
    <div>
      <button onClick={() => setMode(mode === "edit" ? "preview" : "edit")}>
        {mode === "edit" ? "Preview" : "Edit"}
      </button>

      {mode === "edit" ? (
        <TreegeEditor flow={flow} onSave={setFlow} />
      ) : (
        <TreegeRenderer flow={flow} onSubmit={console.log} />
      )}
    </div>
  );
}
```

### Live Preview (Editor → Renderer)

Use the editor's `onChange` (debounced) to render the form **live** next to the editor — no Save click needed. Because `onChange` isn't gated on having input nodes, the preview also reflects an emptied canvas after Clear. Omit `onSave` to hide the Save button entirely when you rely solely on live updates:

```tsx
import { TreegeEditor } from "treege/editor";
import { TreegeRenderer } from "treege/renderer";
import { useState } from "react";
import type { Flow } from "treege";

function App() {
  const [flow, setFlow] = useState<Flow | null>(null);

  return (
    <div style={{ display: "flex" }}>
      <TreegeEditor onChange={setFlow} /> {/* live, no Save button */}
      <TreegeRenderer flow={flow} onSubmit={console.log} />
    </div>
  );
}
```

## Read-Only Viewer (`TreegeViewer`)

Once a form has been submitted, `TreegeViewer` renders the result as a read-only **label / value recap** — no inputs, no validation. With a `flow` it replays the submitted `flowResponse` through the renderer's branch-visibility logic, so only the fields that were actually reachable for those values are shown. Option values resolve to their labels, dates/ranges and i18n labels are formatted exactly like the form, and `hidden`/`submit` fields are excluded.

```tsx
import { TreegeRenderer, TreegeViewer } from "treege/renderer";
import { useState } from "react";
import type { Flow, FormValues } from "treege";

function App({ flow }: { flow: Flow }) {
  const [submitted, setSubmitted] = useState<FormValues | null>(null);

  if (submitted) {
    return <TreegeViewer flow={flow} flowResponse={submitted} language="en" />;
  }

  return <TreegeRenderer flow={flow} onSubmit={setSubmitted} />;
}
```

### Without a flow

When you only have stored, self-describing values (e.g. a persisted `WorkflowValue[]`) and no flow definition, omit `flow` and pass them as `flowResponse`. Each entry carries its own `{ name, type, value, label }`, so values are still formatted by type. `flowResponse` is **typed conditionally on `flow`**: with a flow it's `FormValues`, without a flow it's `FlowResponseEntry[]`.

```tsx
<TreegeViewer
  flowResponse={[
    { name: "city", type: "text", value: "Paris", label: { en: "City" } },
    { name: "dates", type: "daterange", value: "2026-06-01,2026-07-15", label: { en: "Dates" } },
  ]}
/>
```

### Props

| Prop                    | Type                                                             | Default                 | Description                                                                                       |
|-------------------------|------------------------------------------------------------------|-------------------------|---------------------------------------------------------------------------------------------------|
| `flow`                  | `Flow`                                                           | -                       | The flow the values were submitted against (omit for flow-less mode)                              |
| `flowResponse`          | `FormValues` *(with `flow`)* / `FlowResponseEntry[]` *(without)* | -                       | The submitted values — type is conditional on `flow`                                              |
| `language`              | `string`                                                         | provider, then `"en"`   | Language used to resolve translatable labels/options                                              |
| `theme`                 | `"light" \| "dark"`                                              | provider, then `"dark"` | Light/dark theme (falls back to the `TreegeRendererProvider` config)                              |
| `baseUrl`               | `string`                                                         | -                       | Resolves relative file paths into absolute URLs; `data:`/`blob:`/absolute URLs are left untouched |
| `excludedFields`        | `string[]`                                                       | -                       | Field names (or ids) to hide from the view                                                        |
| `excludeEmptyFields`    | `boolean`                                                        | `false`                 | Hide fields that have no submitted value (instead of showing `emptyText`)                         |
| `collapsed`             | `boolean`                                                        | `false`                 | When `true`, only the first `collapsedVisibleCount` fields are rendered                           |
| `collapsedVisibleCount` | `number`                                                         | -                       | Number of fields kept visible while `collapsed` (defaults to all)                                 |
| `emptyText`             | `string`                                                         | `"—"`                   | Text shown when a field has no submitted value                                                    |
| `className`             | `string`                                                         | -                       | Extra class names on the root element                                                             |
| `renderField`           | `Partial<Record<InputType, (field) => ReactNode>>`               | -                       | Per-type rendering overrides for the value cell (typically `file`)                                |
| `renderRow`             | `(field, defaultRow) => ReactNode`                               | -                       | Wrap or replace a whole field row (label + value)                                                 |

### Collapse

`collapsed` + `collapsedVisibleCount` are controlled — you render the toggle and own the state. While collapsed, only the first N fields show:

```tsx
const [collapsed, setCollapsed] = useState(true);

<>
  <button onClick={() => setCollapsed((c) => !c)}>{collapsed ? "Show all" : "Show less"}</button>
  <TreegeViewer flow={flow} flowResponse={submitted} collapsed={collapsed} collapsedVisibleCount={3} />
</>
```

### Customizing rendering

Use `renderField` to override the value cell for a specific input type — most often `file`, to render thumbnails from your own storage — while every other type keeps its built-in rendering. Use `renderRow` to control the whole row layout (label + value):

```tsx
<TreegeViewer
  flow={flow}
  flowResponse={submitted}
  language="fr"
  excludedFields={["internalNote"]}
  renderField={{ file: ({ rawValue }) => <Thumbnails files={rawValue} /> }}
/>
```

### Headless usage

`TreegeViewer` is a thin layer over two field builders that return the ordered, display-ready fields — use them directly for a fully custom layout (a table, a PDF, columns…):

- `getViewerFields(flow, values, { language, baseUrl })` — flow-based resolution.
- `viewerFieldsFromResponse(response, { language })` — flow-less, from self-describing entries.

```tsx
import { getViewerFields } from "treege/renderer";

const fields = getViewerFields(flow, values, { language: "en", baseUrl });

fields.forEach((field) => {
  // field.label, field.type, field.rawValue
  // field.display — normalized, render-ready value:
  //   { kind: "text", text }   | { kind: "boolean", checked }
  //   { kind: "tags", tags }   | { kind: "files", files } | { kind: "empty" }
});
```

## Module Structure

Treege provides multiple import paths for optimal bundle size:

```tsx
// Import everything (editor + renderer + types)
import { TreegeEditor, TreegeRenderer } from "treege";

// Import only the editor
import { TreegeEditor } from "treege/editor";

// Import only the web renderer
import { TreegeRenderer } from "treege/renderer";

// Import only the React Native renderer
import { TreegeRenderer } from "treege/renderer-native";
```

## React Native Support

Treege 3.0 includes full React Native support with a dedicated renderer implementation.

### Installation for React Native

```bash
# Install Treege
npm install treege

# Install peer dependencies
npm install react-native

# Optional: Install for file input support
npm install react-native-document-picker
```

### Basic Usage

```tsx
import { TreegeRenderer } from "treege/renderer-native";
import type { Flow, FormValues } from "treege";

function App() {
  const flow: Flow = {
    id: "flow-1",
    nodes: [
      {
        id: "name",
        type: "input",
        data: {
          type: "text",
          name: "fullName",
          label: "Full Name",
          required: true
        }
      },
      {
        id: "email",
        type: "input",
        data: {
          type: "text",
          name: "email",
          label: "Email",
          required: true,
          pattern: "^[\\w-\\.]+@([\\w-]+\\.)+[\\w-]{2,4}$"
        }
      }
    ],
    edges: []
  };

  const handleSubmit = (values: FormValues) => {
    console.log("Form submitted:", values);
  };

  return (
    <TreegeRenderer
      flow={flow}
      onSubmit={handleSubmit}
    />
  );
}
```

### Custom Styling

You can customize the appearance using the `style` and `contentContainerStyle` props:

```tsx
<TreegeRenderer
  flow={flow}
  onSubmit={handleSubmit}
  style={{ flex: 1, backgroundColor: "#f5f5f5" }}
  contentContainerStyle={{ padding: 20 }}
/>
```

### Custom Components

Override default components with your own React Native components.

Each input renderer is a **React component** receiving a single props object with two keys:

1. `field` — DOM-safe props (`id`, `name`, `value`, `placeholder`, `required`, `aria-invalid`). On the web you can spread them onto an element (`<input {...field} />`); on React Native pick the ones you need.
2. `extra` — Treege-specific props: `setValue`, `error`, `label`, `helperText`, `node`, `InputLabel` (the resolved, overridable label component), and `missingDependencies` (the unfilled fields this input's dynamic options depend on).

```tsx
import { Text, TextInput, View } from "react-native";
import { TreegeRenderer } from "treege/renderer-native";

const CustomTextInput = ({ field, extra }) => {
  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={{ fontSize: 14, marginBottom: 4 }}>{extra.label}</Text>
      <TextInput
        value={field.value}
        placeholder={field.placeholder}
        onChangeText={extra.setValue}
        style={{
          borderWidth: 1,
          borderColor: extra.error ? "red" : "#ccc",
          padding: 10,
          borderRadius: 8
        }}
      />
      {extra.error && <Text style={{ color: "red", fontSize: 12 }}>{extra.error}</Text>}
      {extra.missingDependencies.length > 0 && (
        <Text style={{ color: "#b45309", fontSize: 12 }}>
          Please fill in first: {extra.missingDependencies.map((d) => d.label).join(", ")}
        </Text>
      )}
    </View>
  );
};

<TreegeRenderer
  flow={flow}
  components={{
    inputs: {
      text: CustomTextInput
    }
  }}
/>
```

### Supported Input Types

The React Native renderer includes default implementations for all input types:

**Fully Implemented (Vanilla React Native)**:
- `text`, `number`, `textarea`, `password`
- `checkbox`, `switch`, `hidden`

**With Optional Dependencies** (gracefully degrades if not installed):
- `file` - Requires [react-native-document-picker](https://github.com/rnmods/react-native-document-picker) (optional)

**Requires Custom Implementation** (placeholder provided):
- `select`, `radio`, `autocomplete`
- `date`, `daterange`, `time`, `timerange`
- `address`, `http`

You can implement these inputs using popular React Native libraries:
- [@react-native-picker/picker](https://github.com/react-native-picker/picker) for `select` and `radio`
- [react-native-date-picker](https://github.com/henninghall/react-native-date-picker) for `date` and `time` inputs
- [@react-native-community/google-places-autocomplete](https://github.com/FaridSafi/react-native-google-places-autocomplete) for `address`

### API Reference

The React Native renderer shares the same API as the web renderer, with some platform-specific props:

| Prop                    | Type                                        | Default      | Description                                                                                                     |
|-------------------------|---------------------------------------------|--------------|-----------------------------------------------------------------------------------------------------------------|
| `flow`                  | `Flow \| null`                              | -            | Decision tree to render                                                                                         |
| `onSubmit`              | `(values: FormValues, meta?: Meta) => void` | -            | Form submission handler (meta includes HTTP response data)                                                      |
| `onChange`              | `(values: FormValues) => void`              | -            | Form change handler                                                                                             |
| `validate`              | `(values, nodes) => Record<string, string>` | -            | Custom validation function                                                                                      |
| `initialValues`         | `FormValues`                                | `{}`         | Pre-fill values to edit a record. Accepts `node.id` or name keys; reactive (re-seeds if it changes after mount) |
| `components`            | `TreegeRendererComponents`                  | -            | Custom component overrides                                                                                      |
| `language`              | `string`                                    | `"en"`       | UI language                                                                                                     |
| `validationMode`        | `"onSubmit" \| "onChange"`                  | `"onSubmit"` | When to validate                                                                                                |
| `theme`                 | `"light" \| "dark"`                         | `"dark"`     | Renderer theme                                                                                                  |
| `googleApiKey`          | `string`                                    | -            | API key for address input                                                                                       |
| `headers`               | `HttpHeaders`                               | -            | HTTP headers as `{ name: value }`, applied to every request (field-level wins)                                  |
| `isLoading`             | `boolean`                                   | `false`      | Render a loading skeleton instead of the form                                                                   |
| `isSubmitting`          | `boolean`                                   | `false`      | Force the submit/continue button into its loading state (OR-ed with internal state)                             |
| `onBack`                | `() => void`                                | -            | Called when Back is clicked on the first step; bridges to an outer flow                                         |
| `style`                 | `ViewStyle`                                 | -            | ScrollView style (RN only)                                                                                      |
| `contentContainerStyle` | `ViewStyle`                                 | -            | Content container style (RN)                                                                                    |

## Node Types

Treege has three node types: `input`, `ui`, and `group`. Navigation is automatic — group nodes drive step navigation and conditional edges drive branching.

### Input Node
Form input with validation, patterns, and conditional logic.

```tsx
{
  type: "input",
  data: {
    type: "text",
    name: "email",
    label: "Email Address",
    required: true,
    pattern: "^[\\w-\\.]+@([\\w-]+\\.)+[\\w-]{2,4}$",
    errorMessage: "Please enter a valid email"
  }
}
```

Supported input types: `text`, `number`, `textarea`, `password`, `select`, `radio`, `checkbox`, `switch`, `autocomplete`, `date`, `daterange`, `time`, `timerange`, `file`, `address`, `http`, `hidden`

### Group Node
Container for organizing multiple nodes together. Groups also drive **multi-step forms**: at runtime each group of visible nodes becomes a navigable step (Back/Continue). Child nodes belong to a group via their `parentId`.

```tsx
{
  type: "group",
  data: {
    label: "Personal Information"
  }
}
```

### UI Node
Display-only elements for visual organization and content display.

```tsx
{
  type: "ui",
  data: {
    type: "title", // or "divider"
    label: "Welcome to the form"
  }
}
```

Supported UI types:
- `title` - Display headings and titles
- `divider` - Visual separator between sections

## Conditional Edges

Create dynamic flow with conditional logic:

```tsx
{
  type: "conditional",
  data: {
    conditions: [
      {
        field: "age",
        operator: ">=",
        value: "18"
      },
      {
        field: "country",
        operator: "===",
        value: "US"
      }
    ],
    logicalOperator: "AND"
  }
}
```

Supported operators: `===`, `!==`, `>`, `<`, `>=`, `<=`

## Translation Support

Treege supports multiple languages out of the box:

```tsx
{
  type: "input",
  data: {
    label: {
      en: "First Name",
      fr: "Prénom",
      es: "Nombre"
    }
  }
}
```

## Customization

### Custom Input Components

Override default input renderers with your own. A renderer is a React component
receiving a single props object: `field` (DOM-safe props, spreadable onto an
element) and `extra` (`setValue`, `error`, `label`, `helperText`, `node`,
`InputLabel`, `missingDependencies`).

```tsx
import { TreegeRenderer } from "treege/renderer";

const CustomTextInput = ({ field, extra }) => {
  return (
    <label>
      {extra.label}
      <input
        {...field}
        className="my-custom-input"
        onChange={(e) => extra.setValue(e.target.value)}
      />
      {extra.error && <span className="error">{extra.error}</span>}
    </label>
  );
};

<TreegeRenderer
  flow={flow}
  components={{
    inputs: {
      text: CustomTextInput
    }
  }}
/>
```

### Custom Input Label

All default inputs render their label through a single shared component, `DefaultInputLabel`. Override it once via `components.inputLabel` to restyle every field label at once. It receives `{ label, required, htmlFor }` (web) and **renders nothing when the field has no label** — so the technical `name` key never leaks into the form. Each input also exposes the resolved label as `extra.InputLabel`, so custom inputs can reuse it:

```tsx
<TreegeRenderer
  flow={flow}
  components={{
    inputLabel: ({ label, required, htmlFor }) =>
      label ? (
        <label htmlFor={htmlFor} className="my-label">
          {label}
          {required && <span className="text-red-500"> *</span>}
        </label>
      ) : null,
  }}
/>
```

Accessibility is preserved even without a visible label: the default inputs fall back to `aria-label={label || node.data.name}` on the control itself.

### Custom Validation

Add custom validation logic:

```tsx
<TreegeRenderer
  flow={flow}
  validate={(values, visibleNodes) => {
    const errors = {};

    if (values.password !== values.confirmPassword) {
      errors.confirmPassword = "Passwords must match";
    }

    return errors;
  }}
/>
```

### Validation Modes

Control when validation occurs:

```tsx
// Validate only on submit (default)
<TreegeRenderer validationMode="onSubmit" />

// Validate on every change
<TreegeRenderer validationMode="onChange" />
```

### HTTP Input Integration

Use the HTTP input type to fetch and map data from APIs:

```tsx
{
  type: "input",
  data: {
    type: "http",
    name: "country",
    label: "Select your country",
    httpConfig: {
      method: "GET",
      url: "https://api.example.com/countries",
      responsePath: "$.data.countries", // JSONPath to extract data
      mapping: {
        label: "name",
        value: "code"
      },
      searchParam: "query", // Enable search functionality
      fetchOnMount: true
    }
  }
}
```

### Global Configuration

Configure the renderer globally using the TreegeRendererProvider:

```tsx
import { TreegeRendererProvider } from "treege/renderer";

function App() {
  return (
    <TreegeRendererProvider
      language="fr"
      googleApiKey="your-google-api-key"
      components={{
        // Your custom components
      }}
    >
      <TreegeRenderer flow={flow} />
    </TreegeRendererProvider>
  );
}
```

### Loading State

When the flow is being fetched asynchronously, pass `isLoading` to render a skeleton in place of the form:

```tsx
function App() {
  const { data: flow, isPending } = useQuery(/* ... */);

  return <TreegeRenderer flow={flow ?? null} isLoading={isPending} onSubmit={console.log} />;
}
```

Customize the skeleton via `components.loadingSkeleton`:

```tsx
<TreegeRenderer
  flow={flow}
  isLoading={isPending}
  components={{
    loadingSkeleton: () => <MyCustomSkeleton />,
  }}
/>
```

### Editing an Existing Submission

To edit a record that was already filled in, pass it to `initialValues`. The keys can be either `node.id` **or** the same name-based keys you receive from `onSubmit`/`onChange`, so you can round-trip the submitted object directly — no remapping needed:

```tsx
const handleSubmit = (values) => save(values); // e.g. { firstName: "Alice", email: "a@b.com" }

// later, to edit the saved record:
<TreegeRenderer flow={flow} initialValues={savedRecord} onSubmit={handleSubmit} />
```

`initialValues` is **reactive**: if it changes after mount (e.g. an async-fetched record resolves later), the form is re-seeded automatically — no `key` prop or `isLoading` gate required. Passing a new object of identical content does not reset the form, so in-progress edits are preserved.

```tsx
const { data } = useQuery(/* ... */);
<TreegeRenderer flow={flow} initialValues={data ?? {}} onSubmit={handleSubmit} />
```

#### Pre-filling file fields

A `file` field's value is a serializable object (never a DOM `File`, so it round-trips through JSON):

```ts
type SerializableFile = {
  name: string;
  size: number;
  type: string;
  lastModified: number;
  data: string; // base64 data-URL (web) or file URI (native)
};
```

The stored value is a single `SerializableFile` (or an array when the field is `multiple`, or `null`). Pass the same shape in `initialValues` to pre-fill a file field when editing — the renderer lists the files and lets the user remove them or add more. Only `name`/`size` are needed for display, so `data` can hold a server URL for already-uploaded files:

```tsx
<TreegeRenderer
  flow={flow}
  initialValues={{
    attachment: { name: "contract.pdf", size: 24576, type: "application/pdf", lastModified: 0, data: "https://cdn.example.com/contract.pdf" },
  }}
  onSubmit={handleSubmit}
/>
```

### Submitting State

Pass `isSubmitting` to keep the submit/continue button in its loading state (spinner + disabled) while an async `onSubmit` resolves on your side. It's OR-ed with the renderer's own internal submitting state (e.g. during an HTTP `submitConfig` call):

```tsx
<TreegeRenderer flow={flow} isSubmitting={mutation.isPending} onSubmit={handleSubmit} />
```

### Multi-Step Forms

When a flow contains **Group** nodes, the renderer automatically splits the form into navigable steps — each contiguous slice of visible nodes sharing the same group becomes one step, with built-in Back/Continue controls (Continue turns into Submit on the last step). Branching via conditional edges recomputes the steps on the fly.

Override the default step layout via `components.step`:

```tsx
<TreegeRenderer
  flow={flow}
  components={{
    step: ({ label, children, canGoBack, isLastStep, canContinue, isSubmitting, onBack, onContinue }) => (
      <section>
        <h2>{label}</h2>
        {children}
        {canGoBack && <button onClick={onBack}>Back</button>}
        <button disabled={!canContinue || isSubmitting} onClick={onContinue}>
          {isSubmitting ? "Submitting…" : isLastStep ? "Submit" : "Continue"}
        </button>
      </section>
    ),
  }}
/>
```

Use **`canGoBack`** (not `!isFirstStep`) to decide whether to show the Back control: it's `true` on any step past the first, and also on the first step when an `onBack` prop is provided.

#### Bridging navigation to an outer flow

When the renderer is embedded in a surrounding wizard (e.g. a modal with its own steps), use `onBack` to step back out of the renderer's first step, and `formId` to drive submission from an external button:

```tsx
<TreegeRenderer
  flow={flow}
  formId="treege-form"
  onBack={() => modal.goToPreviousStep()} // Back on step 0 → previous modal step
  onSubmit={handleSubmit}
/>

// A submit button living outside the renderer (web): only submits on the last
// step — on earlier steps it advances, like the built-in Continue button.
<button type="submit" form="treege-form">Save</button>
```

### Headless / Programmatic Control

Use the `useTreegeRenderer` hook to drive the form yourself (headless mode). It takes the same configuration as `TreegeRenderer` and returns the full form state and control methods:

```tsx
import { useTreegeRenderer } from "treege/renderer";

function CustomForm({ flow }) {
  const {
    formValues,
    setFieldValue,
    handleSubmit,
    formErrors,
    visibleNodes,
    isSubmitting,
    currentStep,
    goToNextStep,
    goToPreviousStep,
  } = useTreegeRenderer({
    flow,
    onSubmit: (values) => console.log("Submitted:", values),
  });

  return (
    <div>
      <button onClick={() => setFieldValue("email", "test@example.com")}>
        Prefill Email
      </button>
      <button onClick={handleSubmit} disabled={isSubmitting}>
        Submit
      </button>
    </div>
  );
}
```

> The `useTreegeRenderer` return type is exported as `UseTreegeRendererReturn` for TypeScript consumers building custom components.

## Examples

Check out the `/example` directory for complete examples:

```bash
# Run the web example app (Vite, opens /example)
bun run example

# Run the React Native example app (Expo)
bun run example:native
```

### Available Example URLs

Once the development server is running, you can access these examples:

- **Default Example**: [http://localhost:5173/](http://localhost:5173/)
  - Basic demonstration of Treege functionality

- **Demo Example**: [http://localhost:5173/example](http://localhost:5173/example)
  - Full featured demo showcasing the library capabilities

- **All Inputs Example**: [http://localhost:5173/example-all-inputs](http://localhost:5173/example-all-inputs)
  - Comprehensive showcase of all 16 input types

- **Custom Input Example**: [http://localhost:5173/example-custom-input](http://localhost:5173/example-custom-input)
  - Demonstrates how to create and integrate custom input components

- **TreegeRendererProvider Example**: [http://localhost:5173/example-treege-renderer-provider](http://localhost:5173/example-treege-renderer-provider)
  - Shows global configuration with TreegeRendererProvider

## API Reference

### TreegeEditor Props

| Prop              | Type                                     | Default  | Description                                                                                                                                                                                                                                                                                              |
|-------------------|------------------------------------------|----------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `flow`            | `Flow \| null`                           | `null`   | Initial decision tree                                                                                                                                                                                                                                                                                    |
| `onSave`          | `(flow: Flow) => void`                   | -        | Callback when the user saves the tree. The **Save button is only rendered when this prop is provided**, and is no longer disabled on an empty canvas (so a cleared flow can be saved)                                                                                                                    |
| `onChange`        | `(flow: Flow) => void`                   | -        | Called (debounced ~150 ms) on every canvas change with the current flow. Use it for **live preview / autosave**. Unlike `onSave` it isn't gated on having input nodes, so it also reports an emptied canvas after Clear, and it does **not** strip sensitive headers (live consumers need the real flow) |
| `onExportJson`    | `() => { nodes: Node[]; edges: Edge[] }` | -        | Callback for exporting JSON data                                                                                                                                                                                                                                                                         |
| `language`        | `string`                                 | `"en"`   | UI language                                                                                                                                                                                                                                                                                              |
| `theme`           | `"light" \| "dark"`                      | `"dark"` | Editor theme                                                                                                                                                                                                                                                                                             |
| `aiConfig`        | `AIConfig`                               | -        | AI configuration for tree generation (see [AI Generation](./AI_GENERATION.md))                                                                                                                                                                                                                           |
| `className`       | `string`                                 | -        | Additional CSS class names for custom styling                                                                                                                                                                                                                                                            |
| `extraMenuItems`  | `ExtraMenuItem[]`                        | -        | Extra entries appended to the actions panel "more" dropdown                                                                                                                                                                                                                                              |
| `openApi`         | `OpenApiDocument \| string`              | -        | OpenAPI 3.x source used to power URL/route suggestions and the Authorize flow. Accepts a pre-parsed document or a URL string (the editor fetches it on mount and toasts on failure)                                                                                                                      |
| `baseUrl`         | `string`                                 | -        | Base URL the tree runs against. HTTP/options-source urls are stored relative to it, shown as a read-only prefix, and used to resolve the "Detect fields" probe. Pass the same value as `TreegeRenderer`'s `baseUrl`                                                                                      |
| `headers`         | `HttpHeaders`                            | -        | Global HTTP headers applied to in-editor requests (e.g. the "Detect fields" button). Pass the same value you give to `TreegeRenderer` so editor previews use the same auth/headers as runtime                                                                                                            |
| `onAuthorize`     | `(headers: HttpHeaders) => void`         | -        | Called when the user submits the Authorize dialog. Forward the resulting headers to `TreegeRenderer` (or `TreegeRendererProvider`) so every form request is authenticated                                                                                                                                |
| `onHeadersChange` | `(headers: HttpHeaders) => void`         | -        | Called when the user edits headers in the built-in "Global headers" dialog. The component is controlled — update your `headers` state in response and pass the new object back via the `headers` prop                                                                                                    |

### TreegeRenderer Props

| Prop             | Type                                        | Default      | Description                                                                                                                                                               |
|------------------|---------------------------------------------|--------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `flow`           | `Flow \| null`                              | -            | Decision tree to render                                                                                                                                                   |
| `onSubmit`       | `(values: FormValues, meta?: Meta) => void` | -            | Form submission handler (meta includes HTTP response data)                                                                                                                |
| `onChange`       | `(values: FormValues) => void`              | -            | Form change handler                                                                                                                                                       |
| `validate`       | `(values, nodes) => Record<string, string>` | -            | Custom validation function                                                                                                                                                |
| `initialValues`  | `FormValues`                                | `{}`         | Pre-fill values to edit a submitted record. Accepts `node.id` **or** name keys (same shape as `onSubmit`); reactive — re-seeds if it changes after mount (see below)      |
| `components`     | `TreegeRendererComponents`                  | -            | Custom component overrides                                                                                                                                                |
| `language`       | `string`                                    | `"en"`       | UI language                                                                                                                                                               |
| `validationMode` | `"onSubmit" \| "onChange"`                  | `"onSubmit"` | When to validate                                                                                                                                                          |
| `theme`          | `"light" \| "dark"`                         | `"dark"`     | Renderer theme                                                                                                                                                            |
| `googleApiKey`   | `string`                                    | -            | API key for address input                                                                                                                                                 |
| `headers`        | `HttpHeaders`                               | -            | HTTP headers as `{ name: value }`, applied to every request (field-level wins)                                                                                            |
| `isLoading`      | `boolean`                                   | `false`      | Render a loading skeleton instead of the form (see below)                                                                                                                 |
| `isSubmitting`   | `boolean`                                   | `false`      | Force the submit/continue button into its loading state (spinner + disabled). OR-ed with the internal submitting state — useful with an async `onSubmit`                  |
| `onBack`         | `() => void`                                | -            | Called when Back is clicked on the **first step**; bridges back-navigation to an outer flow (e.g. a parent modal). Shows a Back button on step 0 when provided            |
| `formId`         | `string`                                    | -            | Sets the `<form>` `id` so a submit button outside the renderer can target it via the native `form` attribute. Web only; submits only on the last step in multi-step flows |
| `className`      | `string`                                    | -            | Additional CSS class names for custom styling                                                                                                                             |

## Development

```bash
# Install dependencies
bun install

# Start dev server
bun run dev

# Build library
bun run build

# Run linter and type check
bun run lint

# Preview build
bun run preview
```

## Tech Stack

- **React** - UI library
- **TypeScript** - Type safety
- **TailwindCSS** 4 - Styling
- **ReactFlow** - Node-based UI
- **Vite** - Build tool

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT

## Credits

Created and maintained by [Mickaël Austoni](https://github.com/MickaelAustoni)

## Support

- [GitHub Issues](https://github.com/MickaelAustoni/treege/issues)
- [Repository](https://github.com/MickaelAustoni/treege)
