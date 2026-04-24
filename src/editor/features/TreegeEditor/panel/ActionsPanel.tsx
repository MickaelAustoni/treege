import { type Edge, type Node, Panel, useEdges, useNodes, useReactFlow } from "@xyflow/react";
import { ArrowRightFromLine, Copy, Download, EllipsisVertical, Plus, Save, Trash2 } from "lucide-react";
import { nanoid } from "nanoid";
import { ChangeEvent, useCallback, useEffect, useRef } from "react";
import { toast } from "sonner";
import { DEFAULT_NODE } from "@/editor/constants/defaultNode";
import { useTreegeEditorContext } from "@/editor/context/TreegeEditorContext";
import { AIGeneratorDialog } from "@/editor/features/TreegeEditor/panel/AIGeneratorDialog";
import useTranslate from "@/editor/hooks/useTranslate";
import { Button } from "@/shared/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
import { ExtraMenuItem } from "@/editor/types/editor";
import { Flow } from "@/shared/types/node";

export interface ActionsPanelProps {
  onExportJson?: (data: Flow) => void;
  onSave?: (data: Flow) => void;
  extraMenuItems?: ExtraMenuItem[];
}

const uniqueId = nanoid();

const ActionsPanel = ({ onExportJson, onSave, extraMenuItems }: ActionsPanelProps) => {
  const { flowId, setFlowId, aiConfig } = useTreegeEditorContext();
  const { setNodes, setEdges, addNodes, screenToFlowPosition } = useReactFlow();
  const id = flowId || uniqueId;
  const nodes = useNodes();
  const edges = useEdges();
  const inputFileRef = useRef<HTMLInputElement>(null);
  const t = useTranslate();

  const handleAddNode = () => {
    const centerX = (window.innerWidth || 0) / 2;
    const centerY = (window.innerHeight || 0) / 2;
    const nodeWidth = parseInt(getComputedStyle(document.documentElement).getPropertyValue("--node-width"), 10);
    const nodeHeight = parseInt(getComputedStyle(document.documentElement).getPropertyValue("--node-height"), 10);
    const position = screenToFlowPosition({ x: centerX - nodeWidth, y: centerY - nodeHeight });

    addNodes([
      {
        ...DEFAULT_NODE,
        id: nanoid(),
        position,
        selected: true,
      },
    ]);
  };

  const handleImport = ({ target }: ChangeEvent<HTMLInputElement>) => {
    const file = target.files?.[0];

    if (!file) {
      return;
    }

    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target?.result as string);

        if (json && Array.isArray(json.nodes) && Array.isArray(json.edges)) {
          setNodes(json.nodes);
          setEdges(json.edges);
          toast.success(t("editor.actionsPanel.importSuccess"), {
            description: t("editor.actionsPanel.importSuccessDesc"),
          });
        } else {
          toast.error(t("editor.actionsPanel.invalidJson"), {
            description: t("editor.actionsPanel.invalidJsonDesc"),
          });
        }
      } catch (error) {
        console.warn(error);
        toast.error(t("editor.actionsPanel.parseError"), {
          description: t("editor.actionsPanel.parseErrorDesc"),
        });
      }

      if (inputFileRef.current) {
        inputFileRef.current.value = "";
      }
    };

    reader.readAsText(file);
  };

  const handleExport = () => {
    const data = { edges, id, nodes };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");

    a.href = url;
    a.download = "treege.json";
    a.click();

    // Revoke the object URL to prevent memory leaks
    URL.revokeObjectURL(url);

    toast.success(t("editor.actionsPanel.downloadSuccess"), {
      description: t("editor.actionsPanel.downloadSuccessDesc"),
    });

    if (!flowId) {
      setFlowId?.(id);
    }

    onExportJson?.(data);
  };

  const handleSave = useCallback(() => {
    if (!flowId) {
      setFlowId?.(id);
    }

    onSave?.({ edges, id, nodes });
  }, [edges, flowId, id, nodes, onSave, setFlowId]);

  const handleCopyId = async () => {
    try {
      await navigator.clipboard.writeText(id);
      toast.success(t("editor.actionsPanel.idCopied"), {
        description: id,
      });
    } catch {
      toast.error(t("editor.actionsPanel.copyFailed"));
    }
  };

  const handleClear = () => {
    setNodes([]);
    setEdges([]);
    toast.success(t("editor.actionsPanel.clearSuccess"), {
      description: t("editor.actionsPanel.clearSuccessDesc"),
    });
  };

  const handleAIGenerate = (data: { edges: Edge[]; nodes: Node[] }) => {
    setNodes(data.nodes);
    setEdges(data.edges);
  };

  /**
   * Handle keyboard shortcut for saving (Ctrl+S or Cmd+S)
   */
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Check if Ctrl+S (Windows/Linux) or Cmd+S (Mac) is pressed
      if ((event.ctrlKey || event.metaKey) && event.key === "s") {
        event.preventDefault(); // Prevent browser's default save dialog
        handleSave();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleSave]);

  return (
    <Panel position="top-right" className="tg:flex tg:gap-2">
      <AIGeneratorDialog aiConfig={aiConfig} onGenerate={handleAIGenerate} />

      <Button variant="outline" size="sm" onClick={handleAddNode}>
        <Plus /> <span className="tg:hidden tg:md:inline">{t("editor.actionsPanel.addNode")}</span>
      </Button>

      <Button variant="outline" size="sm" onClick={handleSave}>
        <Save /> <span className="tg:hidden tg:md:inline">{t("common.save")}</span>
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            <EllipsisVertical />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuLabel className="tg:font-normal">
            <div className="tg:flex tg:flex-col tg:gap-1">
              <span className="tg:text-muted-foreground tg:text-xs">Flow ID</span>
              <button
                onClick={handleCopyId}
                className="tg:flex tg:items-center tg:gap-2 tg:font-mono tg:text-muted-foreground tg:transition-colors tg:hover:text-primary"
                type="button"
              >
                <Copy className="tg:h-3 tg:w-3" />
                <span className="tg:truncate tg:text-xs">{id}</span>
              </button>
            </div>
          </DropdownMenuLabel>

          <DropdownMenuSeparator />

          <DropdownMenuGroup>
            <DropdownMenuItem onClick={() => inputFileRef?.current?.click()}>
              <Download /> {t("editor.actionsPanel.importJson")}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleExport}>
              <ArrowRightFromLine /> {t("editor.actionsPanel.exportJson")}
            </DropdownMenuItem>
          </DropdownMenuGroup>

          {extraMenuItems && extraMenuItems.length > 0 && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                {extraMenuItems.map((item, index) => (
                  <DropdownMenuItem
                    key={index}
                    onClick={item.onClick}
                    className={item.destructive ? "tg:text-destructive tg:focus:text-destructive" : undefined}
                  >
                    {item.icon}
                    {item.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuGroup>
            </>
          )}

          <DropdownMenuSeparator />

          <DropdownMenuGroup>
            <DropdownMenuItem onClick={handleClear} className="tg:text-destructive tg:focus:text-destructive">
              <Trash2 className="tg:text-destructive" /> {t("editor.actionsPanel.clear")}
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      <input type="file" accept="application/json,.json" className="tg:hidden" ref={inputFileRef} onChange={handleImport} />
    </Panel>
  );
};
export default ActionsPanel;
