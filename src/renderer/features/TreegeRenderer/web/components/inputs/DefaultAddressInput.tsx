import { MapPin } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useTreegeRendererContext } from "@/renderer/context/TreegeRendererContext";
import { useTranslate } from "@/renderer/hooks/useTranslate";
import { InputRenderProps } from "@/renderer/types/renderer";
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from "@/shared/components/ui/command";
import { FormDescription, FormError, FormItem } from "@/shared/components/ui/form";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";

type AddressSuggestion = {
  label: string;
  value: string;
};

/**
 * Fetch address suggestions from Nominatim (OpenStreetMap)
 */
const fetchNominatimSuggestions = async (query: string, language?: string): Promise<AddressSuggestion[]> => {
  if (!query || query.trim().length < 3) {
    return [];
  }

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=jsonv2&addressdetails=1&limit=5`,
      {
        headers: {
          Accept: "application/json",
          "User-Agent": "Treege Renderer",
          ...(language && { "Accept-Language": language }),
        },
      },
    );

    if (!response.ok) {
      return [];
    }

    const data = await response.json();

    return data.map((item: { display_name: string }) => ({
      label: item.display_name,
      value: item.display_name,
    }));
  } catch (error) {
    console.error("Nominatim fetch error:", error);
    return [];
  }
};

/**
 * Fetch address suggestions from Google Places using the SDK
 */
const fetchGooglePlacesSuggestions = (query: string): Promise<AddressSuggestion[]> => {
  if (!query || query.trim().length < 3) {
    return Promise.resolve([]);
  }

  return new Promise((resolve) => {
    if (!window.google?.maps?.places) {
      console.warn("Google Places SDK not loaded yet");
      resolve([]);
      return;
    }

    const service = new window.google.maps.places.AutocompleteService();
    service.getPlacePredictions({ input: query }, (predictions, status) => {
      if (status !== google.maps.places.PlacesServiceStatus.OK || !predictions) {
        console.warn("Google Places API status:", status);
        resolve([]);
        return;
      }

      resolve(
        predictions.map((prediction) => ({
          label: prediction.description,
          value: prediction.description,
        })),
      );
    });
  });
};

const DefaultAddressInput = ({ node, value, setValue, error, label, placeholder, helperText, id, name }: InputRenderProps<"address">) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const { googleApiKey, language } = useTreegeRendererContext();
  const t = useTranslate();

  const handleSelectSuggestion = useCallback(
    (suggestion: AddressSuggestion) => {
      setValue(suggestion.value);
      setSearchQuery(suggestion.value);
      setPopoverOpen(false);
    },
    [setValue],
  );

  const handleInputChange = useCallback(
    (newValue: string) => {
      setValue(newValue);
      setSearchQuery(newValue);

      if (newValue.length >= 3) {
        setPopoverOpen(true);
      }
    },
    [setValue],
  );

  /**
   * Debounced fetch of address suggestions from Google Places (when an API key
   * is available) or Nominatim. Skips queries shorter than 3 characters and
   * cancels any in-flight timer when the query changes.
   */
  useEffect(() => {
    if (!searchQuery || searchQuery.trim().length < 3) {
      setSuggestions([]);
      return undefined;
    }

    const timer = setTimeout(async () => {
      const results = googleApiKey
        ? await fetchGooglePlacesSuggestions(searchQuery)
        : await fetchNominatimSuggestions(searchQuery, language);

      setSuggestions(results);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, googleApiKey, language]);

  return (
    <>
      {googleApiKey && <script async src={`https://maps.googleapis.com/maps/api/js?key=${googleApiKey}&libraries=places`} />}
      <FormItem className="tg:mb-4">
        <Label htmlFor={id}>
          {label || node.data.name}
          {node.data.required && <span className="tg:text-red-500">*</span>}
        </Label>
        <div className="tg:relative">
          <Input
            type="text"
            id={id}
            name={name}
            value={value || ""}
            onChange={(e) => handleInputChange(e.target.value)}
            onFocus={() => {
              if (suggestions.length > 0) {
                setPopoverOpen(true);
              }
            }}
            placeholder={placeholder || t("renderer.defaultAddressInput.enterAddress")}
            className="tg:pr-10"
            autoComplete="off"
          />
          <MapPin className="tg:-translate-y-1/2 tg:pointer-events-none tg:absolute tg:top-1/2 tg:right-3 tg:h-4 tg:w-4 tg:text-muted-foreground" />
          {popoverOpen && (
            <div className="tg:absolute tg:z-50 tg:mt-1 tg:w-full tg:rounded-md tg:border tg:bg-popover tg:shadow-md">
              <Command>
                <CommandList>
                  <CommandEmpty>{t("renderer.defaultAddressInput.noAddressesFound")}</CommandEmpty>
                  <CommandGroup>
                    {suggestions.map((suggestion, index) => (
                      <CommandItem
                        key={index}
                        value={suggestion.value}
                        onSelect={() => handleSelectSuggestion(suggestion)}
                        onMouseDown={(e) => e.preventDefault()}
                      >
                        <MapPin className="tg:mr-2 tg:h-4 tg:w-4" />
                        {suggestion.label}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </div>
          )}
        </div>
        {error && <FormError>{error}</FormError>}
        {helperText && !error && <FormDescription>{helperText}</FormDescription>}
      </FormItem>
    </>
  );
};

export default DefaultAddressInput;
