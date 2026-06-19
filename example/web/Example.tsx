import { Eye, MoonStar, Sun, Form } from "lucide-react";
import { useState } from "react";
import TreegeEditor from "@/editor/features/TreegeEditor/TreegeEditor";
import { FormValues, Meta, TreegeRenderer } from "@/renderer";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { Sheet, SheetContent, SheetTitle } from "@/shared/components/ui/sheet";
import { Switch } from "@/shared/components/ui/switch";
import { Language, LANGUAGES } from "@/shared/constants/languages";
import { useMediaQuery } from "@/shared/hooks/useMediaQuery";
import { Flow, HttpHeaders } from "@/shared/types/node";
import flow from "~/example/json/treege.json";
import flowComplex from "~/example/json/treege-all-inputs.json";
import { Separator } from "@/shared/components/ui/separator"

const baseUrl = import.meta.env.VITE_BASE_URL || import.meta.env.VITE_OPENAPI_BASE_URL || undefined;

const EditorPanel = ({
  flow,
  onChange,
  theme,
  onTogglePreview,
  onAuthorize,
  headers,
  onHeadersChange,
}: {
  flow?: Flow;
  onChange: (data: Flow) => void;
  theme: "light" | "dark";
  language: Language;
  onTogglePreview: () => void;
  onAuthorize: (headers: HttpHeaders) => void;
  headers?: HttpHeaders;
  onHeadersChange: (headers: HttpHeaders) => void;
}) => {
  const apiKey = import.meta.env.VITE_AI_API_KEY ?? "";
  const openApiUrl = import.meta.env.VITE_OPENAPI_URL || undefined;


  return (
    <div className="tg:h-full tg:flex tg:flex-col">
      <div className="tg:flex-1">
        <TreegeEditor
          onChange={onChange}
          flow={flow}
          theme={theme}
          onAuthorize={onAuthorize}
          headers={headers}
          onHeadersChange={onHeadersChange}
          openApi={openApiUrl}
          baseUrl={baseUrl}
          aiConfig={{
            apiKey,
          }}
          extraMenuItems={[
            {
              icon: <Eye />,
              label: "Toggle preview",
              onClick: onTogglePreview,
            },
          ]}
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
  inSheet,
  headers,
}: {
  flow?: Flow | null;
  theme: "light" | "dark";
  setTheme: (t: "light" | "dark") => void;
  language: Language;
  setLanguage: (l: Language) => void;
  inSheet?: boolean;
  headers?: HttpHeaders;
}) => {
  const [formValues, setFormValues] = useState<FormValues>({});
  const hasNodes = flow && flow.nodes.length > 0;

  const handleSubmit = (values: FormValues, meta?: Meta) => {
    console.log("Form submitted:", values);

    if (meta) {
      console.log("Meta:", meta);
    }

    // Alert the submitted payload (output template applied) as JSON and meta
    alert(JSON.stringify({
      values,
      meta,
    }, null, 2));
  };

  return (
    <div className={`tg:h-full tg:flex tg:flex-col tg:bg-background ${theme}`}>
      <div className="tg:p-4 tg:border-b tg:flex tg:justify-between tg:items-center">
        <div>
          <h2 className="tg:text-lg tg:font-semibold">Form Preview</h2>
          <p className="tg:text-sm tg:text-muted-foreground tg:mt-1">
            {hasNodes ? `${flow.nodes.length} nodes, ${flow.edges.length} edges` : "Add a field in the editor to see it live"}
          </p>
        </div>
        <div className={`tg:flex tg:gap-4 tg:items-center ${inSheet ? "tg:pr-10" : ""}`}>
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
              baseUrl={baseUrl}
              flow={flow}
              language={language}
              theme={theme}
              headers={headers}
              validationMode="onSubmit"
              onSubmit={handleSubmit}
              onChange={setFormValues}
            />

            <Separator className="tg:max-w-2xl tg:mx-auto tg:my-10"/>

            <div className="tg:mt-8 tg:p-4 tg:border tg:rounded-lg tg:max-w-2xl tg:mx-auto">
              <h3 className="tg:font-semibold tg:mb-2">Current values :</h3>
              <pre className="tg:text-xs tg:p-2 tg:rounded tg:overflow-auto">{JSON.stringify(formValues, null, 2)}</pre>
            </div>
          </>
        ) : (
          <div className="tg:flex tg:items-center tg:justify-center tg:h-full tg:text-gray-400">
            <div className="tg:text-center">
              <Form size={50} className="tg:mx-auto tg:mb-4" />
              <p className="tg:text-lg">No form to display</p>
              <p className="tg:text-sm tg:mt-2">Add a field in the editor to see it render live</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Merge user-managed global headers with credentials emitted by the editor's
 * Authorize dialog. Auth headers take precedence on key collision
 * (case-insensitive) so a fresh "Authorize" overrides any matching key the
 * user might have set manually.
 */
const mergeHeaders = (base: HttpHeaders, overrides: HttpHeaders): HttpHeaders => {
  const out: HttpHeaders = {};
  const seen = new Set<string>();

  for (const [key, value] of [...Object.entries(overrides), ...Object.entries(base)]) {
    const lowerKey = key.toLowerCase();
    if (seen.has(lowerKey)) continue;
    seen.add(lowerKey);
    out[key] = value;
  }
  return out;
};

/**
 * Seed the example's global headers with `Authorization: Bearer <token>` when
 * `VITE_BEARER_TOKEN` is set. Lets devs hit protected APIs without going
 * through the Authorize dialog on every reload.
 */
const initialHeaders = (): HttpHeaders => {
  const token = import.meta.env.VITE_BEARER_TOKEN?.trim();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const Layout = ({ flow }: { flow?: Flow }) => {
  const [liveFlow, setLiveFlow] = useState<Flow | null>(null);
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [language, setLanguage] = useState<Language>("en");
  const [showPreview, setShowPreview] = useState<boolean | null>(null);
  const [headers, setHeaders] = useState<HttpHeaders>(initialHeaders);
  const [authHeaders, setAuthHeaders] = useState<HttpHeaders>({});
  const isDesktop = useMediaQuery("desktop");
  const previewOpen = showPreview ?? isDesktop;
  const mergedHeaders = mergeHeaders(headers, authHeaders);
  const previewFlow = liveFlow ?? flow ?? null;

  const togglePreview = () => setShowPreview((prev) => !(prev ?? isDesktop));

  return (
    <div className="tg:h-screen tg:w-screen tg:flex tg:bg-background">
      <div className={`${isDesktop && previewOpen ? "tg:w-8/12 tg:border-r" : "tg:w-full"}`}>
        <EditorPanel
          onChange={setLiveFlow}
          flow={flow}
          theme={theme}
          language={language}
          onTogglePreview={togglePreview}
          onAuthorize={setAuthHeaders}
          headers={mergedHeaders}
          onHeadersChange={setHeaders}
        />
      </div>

      {isDesktop && previewOpen && (
        <div className="tg:w-4/12">
          <RendererPanel
            flow={previewFlow}
            theme={theme}
            setTheme={setTheme}
            language={language}
            setLanguage={setLanguage}
            headers={mergedHeaders}
          />
        </div>
      )}

      <Sheet open={!isDesktop && previewOpen} onOpenChange={(open) => setShowPreview(open)}>
        <SheetContent side="right" className="tg:w-full tg:md:w-3/4 tg:max-w-none tg:p-0 tg:sm:max-w-none">
          <SheetTitle className="tg:sr-only">Form Preview</SheetTitle>
          <RendererPanel
            inSheet
            flow={previewFlow}
            theme={theme}
            setTheme={setTheme}
            language={language}
            setLanguage={setLanguage}
            headers={mergedHeaders}
          />
        </SheetContent>
      </Sheet>
    </div>
  );
};


const Example = ({ demo, all } : { demo?: boolean; all?: boolean }) => {
  if(demo){
    return <Layout flow={flow as Flow} />
  }

  if(all){
    return <Layout flow={flowComplex as Flow} />
  }

  return  <Layout />

};

export default Example;
