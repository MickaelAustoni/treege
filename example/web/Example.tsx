import { MoonStar, Sun } from "lucide-react";
import { useState } from "react";
import TreegeEditor from "@/editor/features/TreegeEditor/TreegeEditor";
import { FormValues, Meta, TreegeRenderer } from "@/renderer";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { Switch } from "@/shared/components/ui/switch";
import { Language, LANGUAGES } from "@/shared/constants/languages";
import { Flow } from "@/shared/types/node";
import flows from "~/example/json/treege.json";
import flowsComplex from "~/example/json/treege-all-inputs.json";

const EditorPanel = ({
  flow,
  onSave,
  theme,
  language,
}: {
  flow?: Flow;
  onSave: (data: Flow) => void;
  theme: "light" | "dark";
  language: Language;
}) => {
  const apiKey = import.meta.env?.VITE_AI_API_KEY || "";

  return (
    <div className="tg:h-full tg:flex tg:flex-col">
      <div className="tg:flex-1">
        <TreegeEditor
          onSave={onSave}
          flow={flow}
          theme={theme}
          language={language}
          aiConfig={{
            apiKey,
          }}
        />
      </div>
    </div>
  );
};

const RendererPanel = ({
  flow,
  theme,
  setTheme,
  language,
  setLanguage,
}: {
  flow?: Flow | null;
  theme: "light" | "dark";
  setTheme: (t: "light" | "dark") => void;
  language: Language;
  setLanguage: (l: Language) => void;
}) => {
  const [formValues, setFormValues] = useState<FormValues>({});
  const hasNodes = flow && flow.nodes.length > 0;

  const handleSubmit = (values: FormValues, meta?: Meta) => {
    console.log("Form submitted:", values);

    if (meta) {
      console.log("Meta:", meta);
    }

    // Alert form values as JSON and meta
    alert(JSON.stringify({
      formValues,
      meta,
    }, null, 2));
  };

  return (
    <div className={`tg:h-full tg:flex tg:flex-col tg:bg-background ${theme}`}>
      <div className="tg:p-4 tg:border-b tg:flex tg:justify-between tg:items-center">
        <div>
          <h2 className="tg:text-lg tg:font-semibold">Form Preview</h2>
          <p className="tg:text-sm tg:text-muted-foreground tg:mt-1">
            {hasNodes ? `${flow.nodes.length} nodes, ${flow.edges.length} edges` : "Save to see the render"}
          </p>
        </div>
        <div className="tg:flex tg:gap-4 tg:items-center">
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
          <div className="tg:flex tg:gap-2 tg:items-center">
            <Sun size={15} />
            <Switch
              checked={theme === "dark"}
              onCheckedChange={(checked) => {
                setTheme(checked ? "dark" : "light");
              }}
            />
            <MoonStar size={15} />
          </div>
        </div>
      </div>
      <div className="tg:flex-1 tg:overflow-auto tg:p-6">
        {hasNodes && flow ? (
          <>
            <TreegeRenderer
              flows={flow}
              language={language}
              theme={theme}
              validationMode="onSubmit"
              onSubmit={handleSubmit}
              onChange={setFormValues}
            />
            <div className="tg:mt-8 tg:p-4 tg:border tg:rounded-lg">
              <h3 className="tg:font-semibold tg:mb-2">Current values:</h3>
              <pre className="tg:text-xs tg:p-2 tg:rounded tg:overflow-auto">{JSON.stringify(formValues, null, 2)}</pre>
            </div>
          </>
        ) : (
          <div className="tg:flex tg:items-center tg:justify-center tg:h-full tg:text-gray-400">
            <div className="tg:text-center">
              <svg className="tg:mx-auto tg:h-12 tg:w-12 tg:text-gray-300 tg:mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <p className="tg:text-lg">No form to display</p>
              <p className="tg:text-sm tg:mt-2">Create your form in the editor and click &quot;Save&quot;</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const Layout = ({ flow }: { flow?: Flow }) => {
  const [savedFlow, setSavedFlow] = useState<Flow | null>(null);
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [language, setLanguage] = useState<Language>("en");

  const handleSave = (flowData: Flow) => {
    setSavedFlow(flowData);
  };

  return (
    <div className="tg:h-screen tg:w-screen tg:flex tg:bg-background">
      <div className="tg:w-8/12 tg:border-r">
        <EditorPanel onSave={handleSave} flow={flow} theme={theme} language={language} />
      </div>
      <div className="tg:w-4/12">
        <RendererPanel flow={savedFlow || flow} theme={theme} setTheme={setTheme} language={language} setLanguage={setLanguage} />
      </div>
    </div>
  );
};


const Example = ({ demo, all } : { demo?: boolean; all?: boolean }) => {
  if(demo){
    return <Layout flow={flows as Flow} />
  }

  if(all){
    return <Layout flow={flowsComplex as Flow} />
  }

  return  <Layout />

};

export default Example;
