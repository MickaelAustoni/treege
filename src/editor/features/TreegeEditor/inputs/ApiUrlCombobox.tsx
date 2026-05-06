import { Globe } from "lucide-react";
import { ComponentProps, ReactNode, useState } from "react";
import { useOpenApi } from "@/editor/context/OpenApiContext";
import useTranslate from "@/editor/hooks/useTranslate";
import { ApiRouteMethod } from "@/editor/types/openapi";
import { resolveRouteUrl } from "@/editor/utils/openapi";
import { Button } from "@/shared/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/shared/components/ui/command";
import { Input } from "@/shared/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/components/ui/popover";

interface ApiUrlComboboxProps extends Omit<ComponentProps<typeof Input>, "onChange" | "value" | "children"> {
  value: string;
  /**
   * Called whenever the URL changes. When `method` is set, the user picked
   * a route from the OpenAPI document — callers should also update their
   * HTTP method state accordingly.
   */
  onChange: (url: string, method?: ApiRouteMethod) => void;
  /**
   * Optional trailing adornments rendered next to the input (e.g. a variable
   * picker). Always rendered, regardless of whether an OpenAPI document is
   * loaded.
   */
  children?: ReactNode;
}

const METHOD_BADGE_COLOR: Record<ApiRouteMethod, string> = {
  DELETE: "tg:bg-red-500/15 tg:text-red-700 dark:tg:text-red-300",
  GET: "tg:bg-blue-500/15 tg:text-blue-700 dark:tg:text-blue-300",
  PATCH: "tg:bg-purple-500/15 tg:text-purple-700 dark:tg:text-purple-300",
  POST: "tg:bg-green-500/15 tg:text-green-700 dark:tg:text-green-300",
  PUT: "tg:bg-amber-500/15 tg:text-amber-700 dark:tg:text-amber-300",
};

/**
 * URL field that augments a regular `<Input>` with a Popover suggesting
 * routes from the editor-loaded OpenAPI document. The user can either type
 * a custom URL freely (current behavior preserved) or click the Globe icon
 * to pick a route — selecting one resolves the URL with the document's
 * server and emits the route's HTTP method back to the caller.
 *
 * When no OpenAPI document is loaded, the Globe trigger is hidden and the
 * component is functionally identical to a plain `<Input>`.
 */
const ApiUrlCombobox = ({ value, onChange, placeholder, children, ...inputProps }: ApiUrlComboboxProps) => {
  const [open, setOpen] = useState(false);
  const { document, routes } = useOpenApi();
  const t = useTranslate();

  const handleSelectRoute = (path: string, method: ApiRouteMethod) => {
    if (!document) {
      return;
    }
    onChange(resolveRouteUrl(document, path), method);
    setOpen(false);
  };

  return (
    <div className="tg:flex tg:gap-2">
      <Input className="tg:flex-1" value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} {...inputProps} />
      {routes.length > 0 && (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button type="button" variant="outline" size="icon" aria-label={t("editor.apiUrlCombobox.browseRoutes")}>
              <Globe className="tg:h-4 tg:w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="tg:w-[28rem] tg:p-0">
            <Command>
              <CommandInput placeholder={t("editor.apiUrlCombobox.searchRoutes")} />
              <CommandList className="tg:max-h-72">
                <CommandEmpty>{t("editor.apiUrlCombobox.noRoutes")}</CommandEmpty>
                <CommandGroup>
                  {routes.map((route) => {
                    const key = `${route.method} ${route.path}`;
                    return (
                      <CommandItem
                        key={key}
                        value={key + (route.summary ?? "") + (route.operationId ?? "")}
                        onSelect={() => handleSelectRoute(route.path, route.method)}
                        className="tg:flex tg:items-center tg:gap-2"
                      >
                        <span
                          className={`tg:inline-flex tg:min-w-14 tg:justify-center tg:rounded tg:px-1.5 tg:py-0.5 tg:font-mono tg:text-[10px] tg:font-semibold ${METHOD_BADGE_COLOR[route.method]}`}
                        >
                          {route.method}
                        </span>
                        <span className="tg:truncate tg:font-mono tg:text-xs">{route.path}</span>
                        {route.summary && (
                          <span className="tg:ml-auto tg:truncate tg:text-muted-foreground tg:text-xs">{route.summary}</span>
                        )}
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      )}
      {children}
    </div>
  );
};

export default ApiUrlCombobox;
