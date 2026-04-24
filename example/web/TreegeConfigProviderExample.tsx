/**
 * Example: Using TreegeConfigProvider for global configuration
 *
 * This example demonstrates how to use TreegeConfigProvider to set
 * global defaults for all TreegeRenderer instances in your app.
 */

import { TreegeConfigProvider, TreegeRenderer, type InputRenderProps } from "@/renderer";
import flows from "~/example/json/treege.json";
import { Flow } from "@/shared/types/node";

// Define your custom components once
const CustomTextInput = ({ node, value, setValue, error }: InputRenderProps<"text">) => {
  return (
    <div className="tg:mb-4">
      <label className="tg:block tg:text-sm tg:font-medium tg:mb-1">
        {typeof node.data.label === "string" ? node.data.label : node.data.label?.en}
        {node.data.required && <span className="tg:text-red-500 tg:ml-1">*</span>}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={typeof node.data.placeholder === "string" ? node.data.placeholder : node.data.placeholder?.en}
        className="tg:w-full tg:border tg:border-gray-300 tg:rounded tg:px-3 tg:py-2 tg:focus:outline-none tg:focus:ring-2 tg:focus:ring-blue-500 tg:bg-blue-300"
      />
      {error && <p className="tg:text-red-500 tg:text-sm tg:mt-1">{error}</p>}
      {node.data.helperText && !error && (
        <p className="tg:text-gray-500 tg:text-sm tg:mt-1">
          {typeof node.data.helperText === "string" ? node.data.helperText : node.data.helperText?.en}
        </p>
      )}
    </div>
  );
};

// Configure once at the app level
const TreegeConfigProviderExample = () => {
  return (
    <TreegeConfigProvider
      googleApiKey="YOUR_GOOGLE_API_KEY_HERE"
      theme="light"
      language="en"
      components={{
        inputs: {
          text: CustomTextInput,
        },
      }}
    >
      <div className="tg:app">
        <h1 className={"tg:text-center tg:mb-10"}>My App with Treege Config Provider</h1>

        {/* This renderer inherits all config from provider */}
        <TreegeRenderer flows={flows as Flow} onSubmit={(values) => console.log("Form 1:", values)} />

        {/* This renderer also inherits the config */}
        <TreegeRenderer flows={flows as Flow} onSubmit={(values) => console.log("Form 2:", values)} />

        {/* This renderer overrides the theme (props take precedence) */}
        <TreegeRenderer
          flows={flows as Flow}

          onSubmit={(values) => console.log("Form 3:", values)}
        />
      </div>
    </TreegeConfigProvider>
  );
};

export default TreegeConfigProviderExample;
