import { Eye, KeyRound, MoonStar, Plus, Sun, Trash2 } from "lucide-react";
import { useState } from "react";
import TreegeEditor from "@/editor/features/TreegeEditor/TreegeEditor";
import { FormValues, Meta, TreegeRenderer } from "@/renderer";
import { Button } from "@/shared/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/shared/components/ui/dialog";
import { Input } from "@/shared/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { Sheet, SheetContent, SheetTitle } from "@/shared/components/ui/sheet";
import { Switch } from "@/shared/components/ui/switch";
import { Language, LANGUAGES } from "@/shared/constants/languages";
import { useMediaQuery } from "@/shared/hooks/useMediaQuery";
import { Flow, HttpHeader } from "@/shared/types/node";
import flows from "~/example/json/treege.json";
import flowsComplex from "~/example/json/treege-all-inputs.json";

const HeadersDialog = ({
  open,
  onOpenChange,
  headers,
  onChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  headers: HttpHeader[];
  onChange: (headers: HttpHeader[]) => void;
}) => {
  const updateHeader = (index: number, patch: Partial<HttpHeader>) => {
    onChange(headers.map((h, i) => (i === index ? { ...h, ...patch } : h)));
  };

  const removeHeader = (index: number) => {
    onChange(headers.filter((_, i) => i !== index));
  };

  const addHeader = () => {
    onChange([...headers, { key: "", value: "" }]);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="tg:max-w-lg">
        <DialogHeader>
          <DialogTitle>Global headers</DialogTitle>
        </DialogHeader>
        <p className="tg:text-muted-foreground tg:text-sm">
          These headers are forwarded to every HTTP request issued by the renderer (HTTP inputs, submit). Field-level headers with the same
          key override these.
        </p>
        <div className="tg:flex tg:flex-col tg:gap-2">
          {headers.map((header, index) => (
            <div key={index} className="tg:flex tg:items-center tg:gap-2">
              <Input
                placeholder="Authorization"
                value={header.key}
                onChange={(e) => updateHeader(index, { key: e.target.value })}
              />
              <Input
                placeholder="Bearer ..."
                value={header.value}
                onChange={(e) => updateHeader(index, { value: e.target.value })}
              />
              <Button variant="ghost" size="icon" onClick={() => removeHeader(index)} aria-label="Remove header">
                <Trash2 className="tg:h-4 tg:w-4" />
              </Button>
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={addHeader}>
            <Plus className="tg:mr-2 tg:h-4 tg:w-4" /> Add header
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const EditorPanel = ({
  flow,
  onSave,
  theme,
  language,
  onTogglePreview,
  onOpenHeaders,
  onAuthorize,
}: {
  flow?: Flow;
  onSave: (data: Flow) => void;
  theme: "light" | "dark";
  language: Language;
  onTogglePreview: () => void;
  onOpenHeaders: () => void;
  onAuthorize: (headers: HttpHeader[]) => void;
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
          onAuthorize={onAuthorize}
          aiConfig={{
            apiKey,
          }}
          extraMenuItems={[
            {
              icon: <Eye />,
              label: "Toggle preview",
              onClick: onTogglePreview,
            },
            {
              icon: <KeyRound />,
              label: "Global headers",
              onClick: onOpenHeaders,
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
  headers?: HttpHeader[];
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
              flows={flow}
              language={language}
              theme={theme}
              headers={headers}
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

/**
 * Merge user-managed global headers with credentials emitted by the editor's
 * Authorize dialog. Auth headers take precedence on key collision
 * (case-insensitive) so a fresh "Authorize" overrides any matching key the
 * user might have set manually.
 */
const mergeHeaders = (base: HttpHeader[], overrides: HttpHeader[]): HttpHeader[] => {
  const out: HttpHeader[] = [];
  const seen = new Set<string>();
  for (const header of [...overrides, ...base]) {
    const key = header.key.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(header);
  }
  return out;
};

const Layout = ({ flow }: { flow?: Flow }) => {
  const [savedFlow, setSavedFlow] = useState<Flow | null>(null);
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [language, setLanguage] = useState<Language>("en");
  const [showPreview, setShowPreview] = useState<boolean | null>(null);
  const [headers, setHeaders] = useState<HttpHeader[]>([]);
  const [authHeaders, setAuthHeaders] = useState<HttpHeader[]>([]);
  const [headersDialogOpen, setHeadersDialogOpen] = useState(false);
  const isDesktop = useMediaQuery("desktop");
  const previewOpen = showPreview ?? isDesktop;
  const mergedHeaders = mergeHeaders(headers, authHeaders);

  const handleSave = (flowData: Flow) => {
    setSavedFlow(flowData);
  };

  const togglePreview = () => setShowPreview((prev) => !(prev ?? isDesktop));

  return (
    <div className="tg:h-screen tg:w-screen tg:flex tg:bg-background">
      <div className={`${isDesktop && previewOpen ? "tg:w-8/12 tg:border-r" : "tg:w-full"}`}>
        <EditorPanel
          onSave={handleSave}
          flow={flow}
          theme={theme}
          language={language}
          onTogglePreview={togglePreview}
          onOpenHeaders={() => setHeadersDialogOpen(true)}
          onAuthorize={setAuthHeaders}
        />
      </div>

      {isDesktop && previewOpen && (
        <div className="tg:w-4/12">
          <RendererPanel
            flow={savedFlow || flow}
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
            flow={savedFlow || flow}
            theme={theme}
            setTheme={setTheme}
            language={language}
            setLanguage={setLanguage}
            headers={mergedHeaders}
          />
        </SheetContent>
      </Sheet>

      <HeadersDialog open={headersDialogOpen} onOpenChange={setHeadersDialogOpen} headers={headers} onChange={setHeaders} />
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
