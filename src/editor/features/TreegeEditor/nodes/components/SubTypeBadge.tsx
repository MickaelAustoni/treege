import {
  AlignLeft,
  Calendar,
  CalendarRange,
  CaseSensitive,
  CheckSquare,
  ChevronDown,
  CircleDot,
  Clock,
  Cloud,
  EyeOff,
  Hash,
  Heading,
  KeyRound,
  ListFilter,
  type LucideIcon,
  MapPin,
  Minus,
  Paperclip,
  RectangleEllipsis,
  Search,
  Send,
  ToggleLeft,
} from "lucide-react";
import { MouseEvent } from "react";
import useFlowActions from "@/editor/hooks/useFlowActions";
import useTranslate from "@/editor/hooks/useTranslate";
import { Badge } from "@/shared/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/shared/components/ui/dropdown-menu";
import { INPUT_TYPE } from "@/shared/constants/inputType";
import { UI_TYPE } from "@/shared/constants/uiType";
import { cn } from "@/shared/lib/utils";

type SubTypeOwnerType = "input" | "ui";

interface SubTypeBadgeProps {
  nodeId: string;
  type: SubTypeOwnerType;
  subType?: string;
}

const SUB_TYPE_OPTIONS: Record<SubTypeOwnerType, readonly string[]> = {
  input: Object.values(INPUT_TYPE),
  ui: Object.values(UI_TYPE),
};

const SUB_TYPE_ICONS: Record<string, LucideIcon> = {
  [INPUT_TYPE.address]: MapPin,
  [INPUT_TYPE.autocomplete]: Search,
  [INPUT_TYPE.checkbox]: CheckSquare,
  [INPUT_TYPE.date]: Calendar,
  [INPUT_TYPE.daterange]: CalendarRange,
  [INPUT_TYPE.file]: Paperclip,
  [INPUT_TYPE.hidden]: EyeOff,
  [INPUT_TYPE.http]: Cloud,
  [INPUT_TYPE.number]: Hash,
  [INPUT_TYPE.password]: KeyRound,
  [INPUT_TYPE.radio]: CircleDot,
  [INPUT_TYPE.select]: ListFilter,
  [INPUT_TYPE.submit]: Send,
  [INPUT_TYPE.switch]: ToggleLeft,
  [INPUT_TYPE.text]: CaseSensitive,
  [INPUT_TYPE.textarea]: AlignLeft,
  [INPUT_TYPE.time]: Clock,
  [INPUT_TYPE.timerange]: Clock,
  [UI_TYPE.divider]: Minus,
  [UI_TYPE.title]: Heading,
};

const SubTypeBadge = ({ nodeId, type, subType }: SubTypeBadgeProps) => {
  const { updateNodeData } = useFlowActions();
  const t = useTranslate();
  const options = SUB_TYPE_OPTIONS[type];
  const stopPropagation = (event: MouseEvent) => event.stopPropagation();
  const Icon = (subType && SUB_TYPE_ICONS[subType]) || RectangleEllipsis;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild onClick={stopPropagation}>
        <Badge variant="default" className="nodrag nopan cursor-pointer px-1.5 py-0 text-[10px] capitalize [&>svg]:size-2.5">
          <Icon className="mt-0.5" />
          {subType || t("editor.selectInputType.type")}
          <ChevronDown />
        </Badge>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="treege-scrollbar max-h-60" onClick={stopPropagation}>
        {options.map((option) => {
          const OptionIcon = SUB_TYPE_ICONS[option] ?? RectangleEllipsis;
          return (
            <DropdownMenuItem
              key={option}
              onClick={() => updateNodeData(nodeId, { type: option })}
              className={cn("capitalize", option === subType && "bg-accent")}
            >
              <OptionIcon />
              {option}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default SubTypeBadge;
