import { MoonStar, Sun } from "lucide-react";
import { useState } from "react";
import { FormValues, TreegeRenderer, TreegeViewer } from "@/renderer";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { Switch } from "@/shared/components/ui/switch";
import { LANGUAGES, Language } from "@/shared/constants/languages";
import { Flow } from "@/shared/types/node";
import flowComplex from "~/example/json/treege-all-inputs.json";

const baseUrl = import.meta.env.VITE_BASE_URL || import.meta.env.VITE_OPENAPI_BASE_URL || undefined;

/**
 * Drop group nodes and their `parentId` links so the form renders flat — a
 * single page with no step navigation (groups are what split a form into steps).
 */
const flatten = (source: Flow): Flow => ({
  ...source,
  nodes: source.nodes.filter((node) => node.type !== "group").map(({ parentId, ...node }) => node),
});

// All input types, flattened to a single step (no group → no step navigation).
const flow = flatten(flowComplex as Flow);

/**
 * Sample submission covering every input type, so the viewer is populated on
 * load. Keyed by field `name` — the same shape `TreegeRenderer.onSubmit`
 * returns, which `TreegeViewer` consumes directly.
 */
const SAMPLE_VALUES: FormValues = {
  "question-1": "10 Downing Street, London, UK", // address
  "question-2": "option-2", // autocomplete
  "question-3": ["option-1", "option-3"], // checkbox (multi)
  "question-4": "2026-06-01T00:00:00.000Z", // date
  "question-5": ["2026-06-01T00:00:00.000Z", "2026-07-15T00:00:00.000Z"], // daterange
  // file — accepts SerializableFiles (base64 image, document) and bare URL strings
  "question-6": [
    {
      data: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='64' height='64'%3E%3Crect width='64' height='64' fill='%234f46e5'/%3E%3Ctext x='32' y='38' font-size='10' fill='white' text-anchor='middle'%3EIMG%3C/text%3E%3C/svg%3E",
      name: "photo.svg",
      size: 0,
      type: "image/svg+xml",
    },
    { data: "data:application/pdf;base64,JVBERi0xLjQK", name: "contrat.pdf", size: 12345, type: "application/pdf" },
    "https://www.example.com/files/rapport-annuel.pdf", // A remote document, given as a plain URL
    "https://fastly.picsum.photos/id/940/200/300.jpg?hmac=H13hOo0ZH4iX7fShH_p1dNg8gyZKXZIUNFfR74kIO7k", // Image from url
  ],
  "question-8": "42", // number
  "question-9": "hunter2", // password
  "question-10": "option-1", // radio
  "question-11": "option-2", // select
  "question-12": true, // switch
  "question-13": "Hello world", // text
  "question-14": "Multi\nline\ntext", // textarea
  "question-15": "14:30", // time
  "question-16": ["08:00", "17:30"], // timerange
};

const Toolbar = ({
  theme,
  setTheme,
  language,
  setLanguage,
}: {
  theme: "light" | "dark";
  setTheme: (theme: "light" | "dark") => void;
  language: Language;
  setLanguage: (language: Language) => void;
}) => (
  <div className="tg:flex tg:items-center tg:gap-4">
    <Select value={language} onValueChange={(value) => setLanguage(value as Language)}>
      <SelectTrigger>
        <SelectValue placeholder="Select language" />
      </SelectTrigger>
      <SelectContent>
        {Object.entries(LANGUAGES).map(([code, value]) => (
          <SelectItem key={code} value={value}>
            {code.toUpperCase()}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
    <div className="tg:flex tg:items-center tg:gap-2">
      <Sun size={15} />
      <Switch checked={theme === "dark"} onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")} />
      <MoonStar size={15} />
    </div>
  </div>
);

/**
 * Demonstrates `TreegeViewer` against a flow exercising every input type.
 *
 * Left: the form (pre-filled with `SAMPLE_VALUES`). Right: a live, read-only
 * `TreegeViewer` of the current values — edit a field on the left and watch the
 * view update. Files use the built-in rendering: images preview inline, other
 * documents become download links (override per type via `renderField`).
 */
const ViewerExample = () => {
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [language, setLanguage] = useState<Language>("en");
  const [values, setValues] = useState<FormValues>(SAMPLE_VALUES);

  return (
    <div className={`tg:h-screen tg:w-screen tg:overflow-auto tg:bg-background ${theme}`}>
      <div className="tg:flex tg:items-center tg:justify-between tg:border-b tg:p-4">
        <div>
          <h2 className="tg:text-lg tg:font-semibold">TreegeViewer — all input types</h2>
          <p className="tg:mt-1 tg:text-sm tg:text-muted-foreground">
            Flat form (no steps). Fill it on the left, see the read-only view update on the right.
          </p>
        </div>
        <Toolbar theme={theme} setTheme={setTheme} language={language} setLanguage={setLanguage} />
      </div>

      <div className="tg:grid tg:grid-cols-1 tg:gap-6 tg:p-6 tg:lg:grid-cols-2">
        <section>
          <h3 className="tg:mb-4 tg:font-semibold">Form</h3>
          <TreegeRenderer
            baseUrl={baseUrl}
            flow={flow}
            language={language}
            theme={theme}
            initialValues={SAMPLE_VALUES}
            validationMode="onSubmit"
            onChange={setValues}
          />
        </section>

        <section>
          <h3 className="tg:mb-4 tg:font-semibold">Viewer (read-only)</h3>
          <div className="tg:rounded-lg tg:border tg:p-4">
            <TreegeViewer flow={flow} values={values} language={language} />
          </div>
        </section>
      </div>
    </div>
  );
};

export default ViewerExample;
