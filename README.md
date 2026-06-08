<div align="center">
  <img alt="Treege" src="https://user-images.githubusercontent.com/108873902/189673125-5d1fdaf3-82d1-486f-bb16-01b0554bd4f1.png" style="padding: 20px;" width="auto" height="100" />

  <h1>Treege</h1>
  <p><strong>Build powerful decision trees with a visual node-based editor</strong></p>

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
- **Multi-Step Forms**: Group nodes are automatically turned into navigable steps with Back/Continue controls
- **Loading State**: Built-in `isLoading` prop renders a customizable skeleton while the flow is being fetched
- **Fully Customizable**: Override any component (form, inputs, ui, step, submitButton, submitButtonWrapper, loadingSkeleton)
- **Optional Dependencies**: Graceful degradation when optional packages like `react-native-document-picker` aren't installed
- **Theme Support**: Dark/light mode out of the box
- **Google API Integration**: Address autocomplete support

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

Each input renderer receives **two arguments**:

1. `field` — DOM-safe props (`id`, `name`, `value`, `placeholder`, `required`, `aria-invalid`). On the web you can spread them onto an element (`<input {...field} />`); on React Native pick the ones you need.
2. `extra` — Treege-specific props: `setValue`, `error`, `label`, `helperText`, `node`, and `missingDependencies` (the unfilled fields this input's dynamic options depend on).

```tsx
import { Text, TextInput, View } from "react-native";
import { TreegeRenderer } from "treege/renderer-native";

const CustomTextInput = (field, extra) => {
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

| Prop                    | Type                                        | Default      | Description                                                |
|-------------------------|---------------------------------------------|--------------|------------------------------------------------------------|
| `flow`                  | `Flow \| null`                              | -            | Decision tree to render                                    |
| `onSubmit`              | `(values: FormValues, meta?: Meta) => void` | -            | Form submission handler (meta includes HTTP response data) |
| `onChange`              | `(values: FormValues) => void`              | -            | Form change handler                                        |
| `validate`              | `(values, nodes) => Record<string, string>` | -            | Custom validation function                                 |
| `initialValues`         | `FormValues`                                | `{}`         | Initial form values                                        |
| `components`            | `TreegeRendererComponents`                  | -            | Custom component overrides                                 |
| `language`              | `string`                                    | `"en"`       | UI language                                                |
| `validationMode`        | `"onSubmit" \| "onChange"`                  | `"onSubmit"` | When to validate                                           |
| `theme`                 | `"light" \| "dark"`                         | `"dark"`     | Renderer theme                                             |
| `googleApiKey`          | `string`                                    | -            | API key for address input                                  |
| `headers`               | `HttpHeaders`                              | -            | HTTP headers as `{ name: value }`, applied to every request (field-level wins)   |
| `isLoading`             | `boolean`                                   | `false`      | Render a loading skeleton instead of the form              |
| `style`                 | `ViewStyle`                                 | -            | ScrollView style (RN only)                                 |
| `contentContainerStyle` | `ViewStyle`                                 | -            | Content container style (RN)                               |

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

Override default input renderers with your own. A renderer receives two
arguments: `field` (DOM-safe props, spreadable onto an element) and `extra`
(`setValue`, `error`, `label`, `helperText`, `node`, `missingDependencies`).

```tsx
import { TreegeRenderer } from "treege/renderer";

const CustomTextInput = (field, extra) => {
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

### Multi-Step Forms

When a flow contains **Group** nodes, the renderer automatically splits the form into navigable steps — each contiguous slice of visible nodes sharing the same group becomes one step, with built-in Back/Continue controls (Continue turns into Submit on the last step). Branching via conditional edges recomputes the steps on the fly.

Override the default step layout via `components.step`:

```tsx
<TreegeRenderer
  flow={flow}
  components={{
    step: ({ label, children, isFirstStep, isLastStep, canContinue, onBack, onContinue }) => (
      <section>
        <h2>{label}</h2>
        {children}
        {!isFirstStep && <button onClick={onBack}>Back</button>}
        <button disabled={!canContinue} onClick={onContinue}>
          {isLastStep ? "Submit" : "Continue"}
        </button>
      </section>
    ),
  }}
/>
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

| Prop              | Type                                     | Default  | Description                                                                                                                                                                                         |
|-------------------|------------------------------------------|----------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `flow`            | `Flow \| null`                           | `null`   | Initial decision tree                                                                                                                                                                               |
| `onSave`          | `(flow: Flow) => void`                   | -        | Callback when tree is saved                                                                                                                                                                         |
| `onExportJson`    | `() => { nodes: Node[]; edges: Edge[] }` | -        | Callback for exporting JSON data                                                                                                                                                                    |
| `language`        | `string`                                 | `"en"`   | UI language                                                                                                                                                                                         |
| `theme`           | `"light" \| "dark"`                      | `"dark"` | Editor theme                                                                                                                                                                                        |
| `aiConfig`        | `AIConfig`                               | -        | AI configuration for tree generation (see [AI Generation](./AI_GENERATION.md))                                                                                                                      |
| `className`       | `string`                                 | -        | Additional CSS class names for custom styling                                                                                                                                                       |
| `extraMenuItems`  | `ExtraMenuItem[]`                        | -        | Extra entries appended to the actions panel "more" dropdown                                                                                                                                         |
| `openApi`         | `OpenApiDocument \| string`              | -        | OpenAPI 3.x source used to power URL/route suggestions and the Authorize flow. Accepts a pre-parsed document or a URL string (the editor fetches it on mount and toasts on failure)                 |
| `openApiBaseUrl`  | `string`                                 | -        | Base URL used for OpenAPI route resolution. When set, takes precedence over the document's `servers[0].url` — useful when the spec points at a different environment than the one to call           |
| `headers`         | `HttpHeaders`                           | -        | Global HTTP headers applied to in-editor requests (e.g. the "Detect fields" button). Pass the same value you give to `TreegeRenderer` so editor previews use the same auth/headers as runtime       |
| `onAuthorize`     | `(headers: HttpHeaders) => void`        | -        | Called when the user submits the Authorize dialog. Forward the resulting headers to `TreegeRenderer` (or `TreegeRendererProvider`) so every form request is authenticated                             |
| `onHeadersChange` | `(headers: HttpHeaders) => void`        | -        | Called when the user edits headers in the built-in "Global headers" dialog. The component is controlled — update your `headers` state in response and pass the new object back via the `headers` prop |

### TreegeRenderer Props

| Prop             | Type                                        | Default      | Description                                                |
|------------------|---------------------------------------------|--------------|------------------------------------------------------------|
| `flow`          | `Flow \| null`                              | -            | Decision tree to render                                    |
| `onSubmit`       | `(values: FormValues, meta?: Meta) => void` | -            | Form submission handler (meta includes HTTP response data) |
| `onChange`       | `(values: FormValues) => void`              | -            | Form change handler                                        |
| `validate`       | `(values, nodes) => Record<string, string>` | -            | Custom validation function                                 |
| `initialValues`  | `FormValues`                                | `{}`         | Initial form values                                        |
| `components`     | `TreegeRendererComponents`                  | -            | Custom component overrides                                 |
| `language`       | `string`                                    | `"en"`       | UI language                                                |
| `validationMode` | `"onSubmit" \| "onChange"`                  | `"onSubmit"` | When to validate                                           |
| `theme`          | `"light" \| "dark"`                         | `"dark"`     | Renderer theme                                             |
| `googleApiKey`   | `string`                                    | -            | API key for address input                                  |
| `headers`        | `HttpHeaders`                              | -            | HTTP headers as `{ name: value }`, applied to every request (field-level wins)   |
| `isLoading`      | `boolean`                                   | `false`      | Render a loading skeleton instead of the form (see below)  |
| `className`      | `string`                                    | -            | Additional CSS class names for custom styling              |

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
