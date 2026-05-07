import { useReactFlow } from "@xyflow/react";
import { Pencil, PlusCircle } from "lucide-react";
import { nanoid } from "nanoid";
import { useEffect, useId, useState } from "react";
import { toast } from "sonner";
import useNodesSelection from "@/editor/hooks/useNodesSelection";
import useTranslate from "@/editor/hooks/useTranslate";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/components/ui/popover";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { isGroupNode } from "@/shared/utils/nodeTypeGuards";

const SelectNodeGroup = () => {
  const [newGroupLabel, setNewGroupLabel] = useState("");
  const [renameLabel, setRenameLabel] = useState("");
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [renameOpen, setRenameOpen] = useState(false);
  const { selectedNode, groupNodes } = useNodesSelection();
  const { setNodes } = useReactFlow();
  const currentParentId = selectedNode?.parentId || "none";
  const isGroup = isGroupNode(selectedNode);
  const t = useTranslate();
  const selectGroupId = useId();
  const inputGroupId = useId();
  const renameInputId = useId();
  const currentParentGroup = currentParentId === "none" ? undefined : groupNodes.find((node) => node.id === currentParentId);
  const currentParentLabel = currentParentGroup?.data?.label?.en ?? "";

  const handleGroupChange = (parentId: string) => {
    if (!selectedNode) {
      return;
    }

    setNodes((nds) => {
      if (parentId === "none") {
        return nds.map((node) => {
          if (node.id === selectedNode.id) {
            const { parentId: parentIdDeleted, extent, ...rest } = node;
            return rest;
          }
          return node;
        });
      }

      const groupNode = nds.find((n) => n.id === parentId);
      if (!groupNode) {
        return nds;
      }

      return nds.map((node) => {
        if (node.id === selectedNode.id) {
          const { extent, ...rest } = node;
          return {
            ...rest,
            parentId,
          };
        }
        return node;
      });
    });
  };

  const handleCreateGroup = () => {
    if (!(newGroupLabel.trim() && selectedNode)) {
      return;
    }

    const existingGroup = groupNodes.find((node) => {
      const label = node.data?.label?.en || node.data?.label;
      return String(label).toLowerCase() === newGroupLabel.trim().toLowerCase();
    });

    if (existingGroup) {
      toast.error("This group already exists", {
        description: "Use the selector to add the node to an existing group.",
      });
      return;
    }

    const newGroupId = nanoid();

    setNodes((nds) => {
      const newGroupNode = {
        data: {
          label: {
            en: newGroupLabel.trim(),
          },
        },
        hidden: true,
        id: newGroupId,
        position: { x: 0, y: 0 },
        type: "group",
      };

      // Parent nodes must be before their children in the nodes array
      const updatedNodes = nds.map((node) => {
        if (node.id === selectedNode.id) {
          const { extent, ...rest } = node;
          return {
            ...rest,
            parentId: newGroupId,
          };
        }
        return node;
      });

      return [newGroupNode, ...updatedNodes];
    });

    setNewGroupLabel("");
    setPopoverOpen(false);

    toast.success("Group created", {
      description: `The group "${newGroupLabel.trim()}" has been created successfully.`,
    });
  };

  const handleRenameGroup = () => {
    if (!(renameLabel.trim() && currentParentGroup)) {
      return;
    }

    const trimmed = renameLabel.trim();
    const conflict = groupNodes.find(
      (node) => node.id !== currentParentGroup.id && String(node.data?.label?.en ?? "").toLowerCase() === trimmed.toLowerCase(),
    );
    if (conflict) {
      toast.error("This group already exists", {
        description: "Choose a different name.",
      });
      return;
    }

    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === currentParentGroup.id) {
          return {
            ...node,
            data: {
              ...node.data,
              label: {
                ...(node.data?.label as Record<string, string> | undefined),
                en: trimmed,
              },
            },
          };
        }
        return node;
      }),
    );

    setRenameOpen(false);
  };

  /**
   * Sync the rename input with the currently selected parent group whenever the popover opens
   */
  useEffect(() => {
    if (renameOpen) {
      setRenameLabel(String(currentParentLabel ?? ""));
    }
  }, [renameOpen, currentParentLabel]);

  if (isGroup) {
    return null;
  }

  return (
    <div className="tg:space-y-2">
      <Label htmlFor={selectGroupId}>{t("editor.selectNodeGroup.group")}</Label>
      <div className="tg:flex tg:gap-2">
        <Select value={currentParentId} onValueChange={handleGroupChange}>
          <SelectTrigger id={selectGroupId} className="tg:flex-1">
            <SelectValue placeholder={t("editor.selectNodeGroup.noGroup")} />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="none">{t("editor.selectNodeGroup.noGroup")}</SelectItem>
              {groupNodes.map((node) => (
                <SelectItem key={node.id} value={node.id}>
                  {node.data.label?.en ? String(node.data.label?.en) : node.id}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>

        {currentParentGroup && (
          <Popover open={renameOpen} onOpenChange={setRenameOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="icon" title={t("editor.selectNodeGroup.renameGroup")}>
                <Pencil className="tg:h-4 tg:w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="tg:w-80" align="end" disablePortal>
              <div className="tg:space-y-4">
                <div className="tg:space-y-2">
                  <h4 className="tg:font-medium tg:leading-none">{t("editor.selectNodeGroup.renameGroup")}</h4>
                </div>
                <div className="tg:space-y-2">
                  <Label htmlFor={renameInputId}>{t("editor.selectNodeGroup.groupName")}</Label>
                  <Input
                    autoFocus
                    id={renameInputId}
                    value={renameLabel}
                    onChange={(e) => setRenameLabel(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleRenameGroup();
                      }
                    }}
                  />
                </div>
                <div className="tg:flex tg:justify-end tg:gap-2">
                  <Button variant="outline" size="sm" onClick={() => setRenameOpen(false)}>
                    {t("common.cancel")}
                  </Button>
                  <Button size="sm" onClick={handleRenameGroup} disabled={!renameLabel.trim()}>
                    {t("common.save")}
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        )}

        <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="icon" title={t("editor.selectNodeGroup.createNewGroup")}>
              <PlusCircle className="tg:h-4 tg:w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="tg:w-80" align="end" disablePortal>
            <div className="tg:space-y-4">
              <div className="tg:space-y-2">
                <h4 className="tg:font-medium tg:leading-none">{t("editor.selectNodeGroup.newGroup")}</h4>
                <p className="tg:text-muted-foreground tg:text-sm">{t("editor.selectNodeGroup.newGroupDescription")}</p>
              </div>
              <div className="tg:space-y-2">
                <Label htmlFor={inputGroupId}>{t("editor.selectNodeGroup.groupName")}</Label>
                <Input
                  autoFocus
                  id={inputGroupId}
                  value={newGroupLabel}
                  onChange={(e) => setNewGroupLabel(e.target.value)}
                  placeholder="Ex: Step 1 - Personal info"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleCreateGroup();
                    }
                  }}
                />
              </div>
              <div className="tg:flex tg:justify-end tg:gap-2">
                <Button variant="outline" size="sm" onClick={() => setPopoverOpen(false)}>
                  {t("common.cancel")}
                </Button>
                <Button size="sm" onClick={handleCreateGroup} disabled={!newGroupLabel.trim()}>
                  {t("common.create")}
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
};

export default SelectNodeGroup;
