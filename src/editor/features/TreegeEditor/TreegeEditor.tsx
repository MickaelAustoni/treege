import "@/editor/styles/style.css";
import { Background, BackgroundVariant, Controls, MiniMap, ReactFlow, ReactFlowProvider } from "@xyflow/react";
import Logo from "@/editor/components/data-display/logo";
import { EDGE_TYPES } from "@/editor/constants/edgeTypes";
import { NODE_TYPES } from "@/editor/constants/nodeTypes";
import { TreegeEditorProvider } from "@/editor/context/TreegeEditorContext";
import DeleteNodeDialog from "@/editor/features/TreegeEditor/dialogs/DeleteNodeDialog";
import ActionsPanel from "@/editor/features/TreegeEditor/panel/ActionsPanel";
import NodeActionsSheet from "@/editor/features/TreegeEditor/sheets/NodeActionsSheet";
import useFlowConnections from "@/editor/hooks/useFlowConnections";
import { TreegeEditorProps } from "@/editor/types/editor";
import { Toaster } from "@/shared/components/ui/sonner";
import { ThemeProvider } from "@/shared/context/ThemeContext";
import { cn } from "@/shared/lib/utils";

const Flow = ({ flow, onExportJson, onSave, theme, className }: TreegeEditorProps) => {
  const { onConnect, onConnectEnd, onEdgesDelete, isValidConnection } = useFlowConnections();

  return (
    <ReactFlow
      fitView
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
      <Background gap={10} variant={BackgroundVariant.Dots} />
      <ActionsPanel onExportJson={onExportJson} onSave={onSave} />
      <Logo theme={theme} />
      <MiniMap />
      <Controls />
      <NodeActionsSheet />
      <DeleteNodeDialog />
    </ReactFlow>
  );
};

const TreegeEditor = ({ flow, onExportJson, onSave, theme = "dark", language = "en", aiConfig }: TreegeEditorProps) => (
  <ThemeProvider defaultTheme={theme} storageKey="treege-editor-theme" theme={theme}>
    <TreegeEditorProvider value={{ aiConfig, flowId: flow?.id, language }}>
      <Toaster position="bottom-center" />
      <ReactFlowProvider>
        <Flow onExportJson={onExportJson} onSave={onSave} flow={flow} theme={theme} />
      </ReactFlowProvider>
    </TreegeEditorProvider>
  </ThemeProvider>
);

export default TreegeEditor;
