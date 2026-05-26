import type { LucideIcon } from "lucide-react";
import { DEFAULT_SUB_TYPE_ICON, SUB_TYPE_ICONS } from "@/editor/constants/subTypeIcons";

/**
 * Returns the Lucide icon associated with an input or UI sub-type.
 * Falls back to DEFAULT_SUB_TYPE_ICON when no match is found.
 */
export const getSubTypeIcon = (subType?: string): LucideIcon => (subType && SUB_TYPE_ICONS[subType]) || DEFAULT_SUB_TYPE_ICON;
