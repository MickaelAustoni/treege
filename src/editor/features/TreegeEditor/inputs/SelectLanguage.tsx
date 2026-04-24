import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { LANGUAGES } from "@/shared/constants/languages";
import { Language } from "@/shared/types/languages";

export interface SelectLanguageProps {
  value?: Language;
  onValueChange?: (value: Language) => void;
}

const SelectLanguage = ({ value = "en", onValueChange }: SelectLanguageProps) => (
  <Select value={value} onValueChange={onValueChange}>
    <SelectTrigger className="tg:uppercase">
      <SelectValue placeholder="" />
    </SelectTrigger>
    <SelectContent>
      <SelectGroup>
        {Object.values(LANGUAGES).map((type) => (
          <SelectItem key={type} value={type} className="tg:uppercase">
            {type}
          </SelectItem>
        ))}
      </SelectGroup>
    </SelectContent>
  </Select>
);

export default SelectLanguage;
