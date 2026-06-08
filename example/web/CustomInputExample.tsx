/**
 * Example: Custom Input Components with TreegeRenderer
 *
 * Custom input renderers receive TWO arguments:
 *   1. `field` — DOM-safe props you can spread straight onto an element:
 *      `<input {...field} />` (id, name, value, placeholder, required, aria-invalid).
 *   2. `extra` — Treege-specific props: setValue, error, label, helperText,
 *      missingDependencies, node, etc. (NOT DOM attributes).
 */

import { ChangeEvent } from "react";
import { TreegeRenderer } from "@/renderer";
import type { InputExtraProps, InputFieldProps } from "@/renderer/types/renderer";
import { Flow, InputOption } from "@/shared/types/node";
import flow from "~/example/json/treege.json";

// ✅ Example 1: Simple custom text input (recommended approach)
// Define your component OUTSIDE the render function to avoid re-creation and focus loss.
// `field` is spreadable onto the input; `extra` carries setValue + translated label/helperText.
const CustomTextInput = (field: InputFieldProps<"text">, extra: InputExtraProps<"text">) => {
  return (
    <div className="tg:mb-4">
      <label className="tg:block tg:text-sm tg:font-medium tg:mb-1" htmlFor={field.id}>
        {extra.label} {/* ✅ Already translated based on current language! */}
        {extra.node.data.required && <span className="tg:text-red-500 tg:ml-1">*</span>}
      </label>
      <input
        {...field} // ✅ id, name, value, placeholder, required, aria-invalid — all DOM-safe
        type="text"
        onChange={(e) => extra.setValue(e.target.value)} // ✅ setValue is typed as (value: string) => void
        className="tg:w-full tg:border tg:border-gray-300 tg:rounded tg:px-3 tg:py-2 tg:focus:outline-none tg:focus:ring-2 tg:focus:ring-blue-500"
      />
      {extra.error && <p className="tg:text-red-500 tg:text-sm tg:mt-1">{extra.error}</p>}
      {extra.helperText && !extra.error && <p className="tg:text-gray-500 tg:text-sm tg:mt-1">{extra.helperText}</p>}
    </div>
  );
};

// ✅ Example 2: Custom number input — spread `field`, then override `value` for the null case.
const CustomNumberInput = (field: InputFieldProps<"number">, extra: InputExtraProps<"number">) => {
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const numValue = e.target.value === "" ? null : Number(e.target.value);
    extra.setValue(numValue); // ✅ setValue is typed as (value: number | null) => void
  };

  return (
    <div className="tg:mb-4">
      <label className="tg:block tg:text-sm tg:font-medium tg:mb-1" htmlFor={field.id}>
        {extra.label}
        {extra.node.data.required && <span className="tg:text-red-500 tg:ml-1">*</span>}
      </label>
      <input
        {...field}
        type="number"
        value={field.value ?? ""} // override: <input> can't take `null`
        onChange={handleChange}
        className="tg:w-full tg:border tg:border-gray-300 tg:rounded tg:px-3 tg:py-2 tg:focus:outline-none tg:focus:ring-2 tg:focus:ring-blue-500"
      />
      {extra.error && <p className="tg:text-red-500 tg:text-sm tg:mt-1">{extra.error}</p>}
    </div>
  );
};

// ✅ Example 3: Custom select — also shows `missingDependencies`.
// When this field's options come from an API whose URL references another field
// (e.g. `.../entities/{{plan_de_compte}}/sub-entities`), `extra.missingDependencies`
// lists the fields the user must fill first.
const CustomSelectInput = (field: InputFieldProps<"select">, extra: InputExtraProps<"select">) => {
  const selectValue = Array.isArray(field.value) ? (field.value[0] ?? "") : field.value;
  const blocked = extra.missingDependencies.length > 0;

  return (
    <div className="tg:mb-4">
      <label className="tg:block tg:text-sm tg:font-medium tg:mb-1" htmlFor={field.id}>
        {extra.label}
        {extra.node.data.required && <span className="tg:text-red-500 tg:ml-1">*</span>}
      </label>
      <select
        id={field.id}
        name={field.name}
        value={selectValue}
        disabled={blocked}
        onChange={(e) => extra.setValue(e.target.value)}
        className="tg:w-full tg:border tg:border-gray-300 tg:rounded tg:px-3 tg:py-2 tg:focus:outline-none tg:focus:ring-2 tg:focus:ring-blue-500"
      >
        <option value="">-- Select --</option>
        {extra.node.data.options?.map((option: InputOption) => (
          <option key={option.value} value={option.value}>
            {typeof option.label === "string" ? option.label : option.label?.en}
          </option>
        ))}
      </select>
      {blocked && (
        <p className="tg:text-amber-600 tg:text-sm tg:mt-1">
          Please fill in first: {extra.missingDependencies.map((dependency) => dependency.label).join(", ")}
        </p>
      )}
      {extra.error && <p className="tg:text-red-500 tg:text-sm tg:mt-1">{extra.error}</p>}
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
        flow={flow as Flow}
        onSubmit={handleSubmit}
        components={{
          inputs: {
            number: CustomNumberInput,
            select: CustomSelectInput,
            text: CustomTextInput,
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
      flow={flow as Flow}
      onSubmit={() => {}}
      components={{
        inputs: {
          // ❌ Don't do this - function is recreated on every render
          text: (field, extra) => <input {...field} onChange={(e) => extra.setValue(e.target.value)} />,
        },
      }}
    />
  );
};

// ✅ CORRECT: Component reference (maintains focus)
export const CorrectExample = () => {
  return (
    <TreegeRenderer
      flow={flow as Flow}
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
