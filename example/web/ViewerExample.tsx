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
  "question-6": [{ data: "data:application/pdf;base64,JVBER", name: "contrat.pdf", size: 12345, type: "application/pdf" }], // file
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
 * view update. The `file` field is rendered through the `renderField` override
 * to show how an app plugs in its own document rendering.
 */
const ViewerExample = () => {
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [language, setLanguage] = useState<Language>("en");
  const [values, setValues] = useState<FormValues>(SAMPLE_VALUES);
  const flow = flowComplex as Flow;

  return (
    <div className={`tg:h-screen tg:w-screen tg:overflow-auto tg:bg-background ${theme}`}>
      <div className="tg:flex tg:items-center tg:justify-between tg:border-b tg:p-4">
        <div>
          <h2 className="tg:text-lg tg:font-semibold">TreegeViewer — all input types</h2>
          <p className="tg:mt-1 tg:text-sm tg:text-muted-foreground">Fill the form on the left, see the read-only view update on the right.</p>
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
            <TreegeViewer
              flow={flow}
              values={values}
              language={language}
              renderField={{
                file: ({ display }) =>
                  display.kind === "files" ? (
                    <div className="tg:flex tg:flex-wrap tg:gap-2">
                      {display.files.map((file, index) => (
                        <span key={`${file.name}-${index}`} className="tg:rounded tg:border tg:px-2 tg:py-1 tg:text-xs">
                          📎 {file.name}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="tg:text-sm tg:text-muted-foreground">—</span>
                  ),
              }}
            />
          </div>
        </section>
      </div>
    </div>
  );
};

export default ViewerExample;
