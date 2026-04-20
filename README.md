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

Treege is a modern React library for creating and rendering interactive decision trees. Built on top of ReactFlow, it provides a complete solution for building complex form flows, decision logic, and conditional workflows with an intuitive visual editor.

## Features

### Visual Editor (`treege/editor`)
- **Node-based Interface**: Drag-and-drop editor powered by ReactFlow
- **4 Node Types**: Flow, Group, Input, and UI nodes
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
- **Fully Customizable**: Override any component (FormWrapper, Group, Inputs, SubmitButton, UI elements)
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
# npm
npm install treege

# pnpm
pnpm add treege

# yarn
yarn add treege

# bun
bun add treege
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
      flows={flow}
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
        <TreegeRenderer flows={flow} onSubmit={console.log} />
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
      flows={flow}
      onSubmit={handleSubmit}
    />
  );
}
```

### Custom Styling

You can customize the appearance using the `style` and `contentContainerStyle` props:

```tsx
<TreegeRenderer
  flows={flow}
  onSubmit={handleSubmit}
  style={{ flex: 1, backgroundColor: "#f5f5f5" }}
  contentContainerStyle={{ padding: 20 }}
/>
```

### Custom Components

Override default components with your own React Native components:

```tsx
import { Text, TextInput, View } from "react-native";
import { TreegeRenderer } from "treege/renderer-native";

const CustomTextInput = ({ value, setValue, label, error }) => {
  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={{ fontSize: 14, marginBottom: 4 }}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={setValue}
        style={{
          borderWidth: 1,
          borderColor: error ? "red" : "#ccc",
          padding: 10,
          borderRadius: 8
        }}
      />
      {error && <Text style={{ color: "red", fontSize: 12 }}>{error}</Text>}
    </View>
  );
};

<TreegeRenderer
  flows={flow}
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
| `flows`                 | `Flow \| Flow[] \| null`                    | -            | Decision tree to render (single Flow or array of Flows)    |
| `onSubmit`              | `(values: FormValues, meta?: Meta) => void` | -            | Form submission handler (meta includes HTTP response data) |
| `onChange`              | `(values: FormValues) => void`              | -            | Form change handler                                        |
| `validate`              | `(values, nodes) => Record<string, string>` | -            | Custom validation function                                 |
| `initialValues`         | `FormValues`                                | `{}`         | Initial form values                                        |
| `components`            | `TreegeRendererComponents`                  | -            | Custom component overrides                                 |
| `language`              | `string`                                    | `"en"`       | UI language                                                |
| `validationMode`        | `"onSubmit" \| "onChange"`                  | `"onSubmit"` | When to validate                                           |
| `googleApiKey`          | `string`                                    | -            | API key for address input                                  |
| `style`                 | `ViewStyle`                                 | -            | ScrollView style (RN only)                                 |
| `contentContainerStyle` | `ViewStyle`                                 | -            | Content container style (RN)                               |

## Node Types

### Flow Node
Navigation node that controls the flow between different parts of the tree.

```tsx
{
  type: "flow",
  data: {
    targetId: "next-node-id",
    label: "Continue"
  }
}
```

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
Container for organizing multiple nodes together.

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

Create dynamic flows with conditional logic:

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

Override default input renderers with your own:

```tsx
import { TreegeRenderer } from "treege/renderer";

const CustomTextInput = ({ node }) => {
  return <input className="my-custom-input" />;
};

<TreegeRenderer
  flows={flow}
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
  flows={flow}
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

Configure the renderer globally using the TreegeConfigProvider:

```tsx
import { TreegeConfigProvider } from "treege/renderer";

function App() {
  return (
    <TreegeConfigProvider
      config={{
        language: "fr",
        googleApiKey: "your-google-api-key",
        components: {
          // Your custom components
        }
      }}
    >
      <TreegeRenderer flows={flow} />
    </TreegeConfigProvider>
  );
}
```

### Programmatic Control

Use the `useTreegeRenderer` hook for programmatic control:

```tsx
import { useTreegeRenderer } from "treege/renderer";

function CustomForm() {
  const { values, setFieldValue, submit, reset } = useTreegeRenderer();

  return (
    <div>
      <button onClick={() => setFieldValue("email", "test@example.com")}>
        Prefill Email
      </button>
      <button onClick={submit}>Submit</button>
      <button onClick={reset}>Reset</button>
    </div>
  );
}
```

## Examples

Check out the `/example` directory for complete examples:

```bash
# Run the example app
bun example
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

- **TreegeConfigProvider Example**: [http://localhost:5173/example-treege-config-provider](http://localhost:5173/example-treege-config-provider)
  - Shows global configuration with TreegeConfigProvider

## API Reference

### TreegeEditor Props

| Prop           | Type                                     | Default  | Description                                                                    |
|----------------|------------------------------------------|----------|--------------------------------------------------------------------------------|
| `flow`         | `Flow \| null`                           | `null`   | Initial decision tree                                                          |
| `onSave`       | `(flow: Flow) => void`                   | -        | Callback when tree is saved                                                    |
| `onExportJson` | `() => { nodes: Node[]; edges: Edge[] }` | -        | Callback for exporting JSON data                                               |
| `language`     | `string`                                 | `"en"`   | UI language                                                                    |
| `theme`        | `"light" \| "dark"`                      | `"dark"` | Editor theme                                                                   |
| `aiConfig`     | `AIConfig`                               | -        | AI configuration for tree generation (see [AI Generation](./AI_GENERATION.md)) |
| `className`    | `string`                                 | -        | Additional CSS class names for custom styling                                  |

### TreegeRenderer Props

| Prop             | Type                                        | Default      | Description                                                |
|------------------|---------------------------------------------|--------------|------------------------------------------------------------|
| `flows`          | `Flow \| Flow[] \| null`                    | -            | Decision tree to render (single Flow or array of Flows)    |
| `onSubmit`       | `(values: FormValues, meta?: Meta) => void` | -            | Form submission handler (meta includes HTTP response data) |
| `onChange`       | `(values: FormValues) => void`              | -            | Form change handler                                        |
| `validate`       | `(values, nodes) => Record<string, string>` | -            | Custom validation function                                 |
| `initialValues`  | `FormValues`                                | `{}`         | Initial form values                                        |
| `components`     | `TreegeRendererComponents`                  | -            | Custom component overrides                                 |
| `language`       | `string`                                    | `"en"`       | UI language                                                |
| `validationMode` | `"onSubmit" \| "onChange"`                  | `"onSubmit"` | When to validate                                           |
| `theme`          | `"light" \| "dark"`                         | `"dark"`     | Renderer theme                                             |
| `googleApiKey`   | `string`                                    | -            | API key for address input                                  |
| `className`      | `string`                                    | -            | Additional CSS class names for custom styling              |

## Development

```bash
# Install dependencies
yarn install

# Start dev server
yarn dev

# Build library
yarn build

# Run linter and type check
yarn lint

# Preview build
yarn preview
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

- [GitHub Issues](https://github.com/Tracktor/treege/issues)
- [Repository](https://github.com/Tracktor/treege)
