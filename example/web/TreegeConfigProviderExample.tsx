/**
 * Example: Using TreegeConfigProvider for global configuration
 *
 * This example demonstrates how to use TreegeConfigProvider to set
 * global defaults for all TreegeRenderer instances in your app.
 */

import { TreegeConfigProvider, TreegeRenderer, type InputExtraProps, type InputFieldProps } from "@/renderer";
import flow from "~/example/json/treege.json";
import { Flow } from "@/shared/types/node";

// Define your custom components once. `field` is spreadable onto the input;
// `extra` carries setValue and the already-translated label/helperText.
const CustomTextInput = (field: InputFieldProps<"text">, extra: InputExtraProps<"text">) => {
  return (
    <div className="tg:mb-4">
      <label className="tg:block tg:text-sm tg:font-medium tg:mb-1" htmlFor={field.id}>
        {extra.label}
        {extra.node.data.required && <span className="tg:text-red-500 tg:ml-1">*</span>}
      </label>
      <input
        {...field}
        type="text"
        onChange={(e) => extra.setValue(e.target.value)}
        className="tg:w-full tg:border tg:border-gray-300 tg:rounded tg:px-3 tg:py-2 tg:focus:outline-none tg:focus:ring-2 tg:focus:ring-blue-500 tg:bg-blue-300"
      />
      {extra.error && <p className="tg:text-red-500 tg:text-sm tg:mt-1">{extra.error}</p>}
      {extra.helperText && !extra.error && <p className="tg:text-gray-500 tg:text-sm tg:mt-1">{extra.helperText}</p>}
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
        <TreegeRenderer flow={flow as Flow} onSubmit={(values) => console.log("Form 1:", values)} />

        {/* This renderer also inherits the config */}
        <TreegeRenderer flow={flow as Flow} onSubmit={(values) => console.log("Form 2:", values)} />

        {/* This renderer overrides the theme (props take precedence) */}
        <TreegeRenderer
          flow={flow as Flow}
          onSubmit={(values) => console.log("Form 3:", values)}
        />
      </div>
    </TreegeConfigProvider>
  );
};

export default TreegeConfigProviderExample;
