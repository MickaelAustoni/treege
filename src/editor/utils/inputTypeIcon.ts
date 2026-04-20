import type { LucideIcon } from "lucide-react";
import { DEFAULT_INPUT_TYPE_ICON, INPUT_TYPE_ICONS } from "@/editor/constants/inputTypeIcons";

/**
 * Returns the Lucide icon associated with an input or UI type.
 * Falls back to DEFAULT_INPUT_TYPE_ICON when no match is found.
 */
export const getInputTypeIcon = (type?: string): LucideIcon => (type && INPUT_TYPE_ICONS[type]) || DEFAULT_INPUT_TYPE_ICON;
