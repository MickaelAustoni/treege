import "@/editor/styles/style.css";
import { Background, BackgroundVariant, Controls, MiniMap, ReactFlow, ReactFlowProvider } from "@xyflow/react";
import { useState } from "react";
import Logo from "@/editor/components/data-display/logo";
import { EDGE_TYPES } from "@/editor/constants/edgeTypes";
import { NODE_TYPES } from "@/editor/constants/nodeTypes";
import { TreegeEditorProvider } from "@/editor/context/TreegeEditorContext";
import MiniMapControl from "@/editor/features/TreegeEditor/controls/MiniMapControl";
import ChangeNodeTypeDialog from "@/editor/features/TreegeEditor/dialogs/ChangeNodeTypeDialog";
import DeleteNodeDialog from "@/editor/features/TreegeEditor/dialogs/DeleteNodeDialog";
import AutoLayout from "@/editor/features/TreegeEditor/layout/AutoLayout";
import ActionsPanel from "@/editor/features/TreegeEditor/panel/ActionsPanel";
import NodeActionsSheet from "@/editor/features/TreegeEditor/sheets/NodeActionsSheet";
import useFlowConnections from "@/editor/hooks/useFlowConnections";
import { TreegeEditorProps } from "@/editor/types/editor";
import { Toaster } from "@/shared/components/ui/sonner";
import { ThemeProvider } from "@/shared/context/ThemeContext";
import { useMediaQuery } from "@/shared/hooks/useMediaQuery";
import { cn } from "@/shared/lib/utils";

const Flow = ({ flow, onExportJson, onSave, theme, className, extraMenuItems }: TreegeEditorProps) => {
  const { onConnect, onConnectEnd, onEdgesDelete, isValidConnection } = useFlowConnections();
  const [showMiniMap, setShowMiniMap] = useState(false);
  const isMobile = useMediaQuery("mobile");

  return (
    <ReactFlow
      fitView
      minZoom={0.1}
      fitViewOptions={{ maxZoom: isMobile ? 0.6 : 1 }}
      colorMode={theme}
      selectNodesOnDrag={false}
      nodeTypes={NODE_TYPES}
      edgeTypes={EDGE_TYPES}
      defaultEdges={flow?.edges || []}
      defaultNodes={flow?.nodes || []}
      onConnect={onConnect}
      onConnectEnd={onConnectEnd}
      onEdgesDelete={onEdgesDelete}
      isValidConnection={isValidConnection}
      className={cn(className, "treege")}
    >
      <AutoLayout />
      <Background gap={10} variant={BackgroundVariant.Dots} />
      <ActionsPanel onExportJson={onExportJson} onSave={onSave} extraMenuItems={extraMenuItems} />
      <Logo theme={theme} />
      {showMiniMap && <MiniMap />}
      <Controls>
        <MiniMapControl show={showMiniMap} onToggle={() => setShowMiniMap((prev) => !prev)} />
      </Controls>
      <NodeActionsSheet />
      <DeleteNodeDialog />
      <ChangeNodeTypeDialog />
    </ReactFlow>
  );
};

const TreegeEditor = ({ flow, onExportJson, onSave, theme = "dark", language = "en", aiConfig, extraMenuItems }: TreegeEditorProps) => (
  <ThemeProvider defaultTheme={theme} storageKey="treege-editor-theme" theme={theme}>
    <TreegeEditorProvider value={{ aiConfig, flowId: flow?.id, language }}>
      <Toaster position="bottom-center" />
      <ReactFlowProvider>
        <Flow onExportJson={onExportJson} onSave={onSave} flow={flow} theme={theme} extraMenuItems={extraMenuItems} />
      </ReactFlowProvider>
    </TreegeEditorProvider>
  </ThemeProvider>
);

export default TreegeEditor;
