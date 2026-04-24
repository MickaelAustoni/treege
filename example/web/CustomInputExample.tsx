/**
 * Example: Custom Input Components with TreegeRenderer
 *
 * This example demonstrates how to create custom input components
 * using the simplified API that provides value, setValue, and error as props.
 */

import type { InputRenderProps } from "@/renderer/types/renderer";
import { TreegeRenderer } from "@/renderer";
import flows from "~/example/json/treege.json";
import { Flow } from "@/shared/types/node";
import { ChangeEvent } from "react";

// ✅ Example 1: Simple custom text input (recommended approach)
// Define your component OUTSIDE the render function to avoid re-creation and focus loss
// Notice how value and setValue are now properly typed as string!
// Also notice how label, placeholder, and helperText are already translated!
const CustomTextInput = ({ node, value, setValue, error, label, placeholder, helperText, id, name }: InputRenderProps<"text">) => {
  return (
    <div className="tg:mb-4">
      <label className="tg:block tg:text-sm tg:font-medium tg:mb-1" htmlFor={id}>
        {label} {/* ✅ Already translated based on current language! */}
        {node.data.required && <span className="tg:text-red-500 tg:ml-1">*</span>}
      </label>
      <input
        id={id}
        name={name}
        type="text"
        value={value} // ✅ TypeScript knows this is a string
        onChange={(e) => setValue(e.target.value)} // ✅ TypeScript knows setValue accepts a string
        placeholder={placeholder} // ✅ Already translated!
        className="tg:w-full tg:border tg:border-gray-300 tg:rounded tg:px-3 tg:py-2 tg:focus:outline-none tg:focus:ring-2 tg:focus:ring-blue-500"
      />
      {error && <p className="tg:text-red-500 tg:text-sm tg:mt-1">{error}</p>}
      {helperText && !error && (
        <p className="tg:text-gray-500 tg:text-sm tg:mt-1">
          {helperText} {/* ✅ Already translated! */}
        </p>
      )}
    </div>
  );
};

// ✅ Example 2: Custom number input with validation
// Notice how value is properly typed as number | null
const CustomNumberInput = ({ node, value, setValue, error, label, id, name, placeholder }: InputRenderProps<"number">) => {
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const numValue = e.target.value === "" ? null : Number(e.target.value);
    setValue(numValue); // ✅ TypeScript knows setValue accepts number | null
  };

  return (
    <div className="tg:mb-4">
      <label className="tg:block tg:text-sm tg:font-medium tg:mb-1" htmlFor={id}>
        {label} {/* ✅ Already translated! */}
        {node.data.required && <span className="tg:text-red-500 tg:ml-1">*</span>}
      </label>
      <input
        id={id}
        name={name}
        placeholder={placeholder}
        type="number"
        value={value ?? ""} // ✅ TypeScript knows value is number | null
        onChange={handleChange}
        className="tg:w-full tg:border tg:border-gray-300 tg:rounded tg:px-3 tg:py-2 tg:focus:outline-none tg:focus:ring-2 tg:focus:ring-blue-500"
      />
      {error && <p className="tg:text-red-500 tg:text-sm tg:mt-1">{error}</p>}
    </div>
  );
};

// ✅ Example 3: Custom select input with styling
// Notice how value is properly typed as string | string[]
// Note: option labels still need manual translation as they're not in InputRenderProps
const CustomSelectInput = ({ node, value, setValue, error, label, id, name }: InputRenderProps<"select">) => {
  // Extract string value from union type
  const selectValue = Array.isArray(value) ? value[0] ?? "" : value;

  return (
    <div className="tg:mb-4">
      <label className="tg:block tg:text-sm tg:font-medium tg:mb-1" htmlFor={id}>
        {label} {/* ✅ Already translated! */}
        {node.data.required && <span className="tg:text-red-500 tg:ml-1">*</span>}
      </label>
      <select
        id={id}
        name={name}
        value={selectValue}
        onChange={(e) => setValue(e.target.value)}
        className="tg:w-full tg:border tg:border-gray-300 tg:rounded tg:px-3 tg:py-2 tg:focus:outline-none tg:focus:ring-2 tg:focus:ring-blue-500"
      >
        <option value="">-- Select --</option>
        {node.data.options?.map((option) => (
          <option key={option.value} value={option.value}>
            {/* Note: Options still need manual translation */}
            {typeof option.label === "string" ? option.label : option.label?.en}
          </option>
        ))}
      </select>
      {error && <p className="tg:text-red-500 tg:text-sm tg:mt-1">{error}</p>}
    </div>
  );
};

// ✅ Example 4: Using custom inputs in TreegeRenderer
const CustomInputsExample = () => {
  const handleSubmit = (values: Record<string, any>) => {
    console.log("Form submitted with values:", values);
  };

  return (
      <div className={"tg:p-6"}>
        <TreegeRenderer
          flows={flows as Flow}
          onSubmit={handleSubmit}
          components={{
            inputs: {
              text: CustomTextInput,
              number: CustomNumberInput,
              select: CustomSelectInput,
            },
          }}
        />
      </div>
  );
};

// ❌ WRONG: Inline function (will cause focus loss on every keystroke)
export const WrongExample = () => {
  return (
    <TreegeRenderer
      flows={flows as Flow}
      onSubmit={() => {}}
      components={{
        inputs: {
          // ❌ Don't do this - function is recreated on every render
          text: (props: InputRenderProps<"text">) => {
            return <input value={props.value} onChange={(e) => props.setValue(e.target.value)} />;
          },
        },
      }}
    />
  );
};

// ✅ CORRECT: Component reference (maintains focus)
export const CorrectExample = () => {
  return (
    <TreegeRenderer
      flows={flows as Flow}
      onSubmit={() => {}}
      components={{
        inputs: {
          // ✅ Do this - stable component reference
          text: CustomTextInput,
        },
      }}
    />
  );
};

export default CustomInputsExample;
