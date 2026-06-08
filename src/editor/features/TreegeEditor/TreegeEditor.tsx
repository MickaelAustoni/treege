import { Background, BackgroundVariant, Controls, MiniMap, ReactFlow, ReactFlowProvider } from "@xyflow/react";
import { useCallback, useState } from "react";
import Logo from "@/editor/components/branding/Logo";
import EditorStyles from "@/editor/components/styles/EditorStyles";
import { EDGE_TYPES } from "@/editor/constants/edgeTypes";
import { NODE_TYPES } from "@/editor/constants/nodeTypes";
import { OpenApiProvider } from "@/editor/context/OpenApiContext";
import { TreegeEditorRuntimeProvider } from "@/editor/context/TreegeEditorRuntimeProvider";
import MiniMapControl from "@/editor/features/TreegeEditor/controls/MiniMapControl";
import ChangeNodeTypeDialog from "@/editor/features/TreegeEditor/dialogs/ChangeNodeTypeDialog";
import DeleteNodeDialog from "@/editor/features/TreegeEditor/dialogs/DeleteNodeDialog";
import AutoLayout from "@/editor/features/TreegeEditor/layout/AutoLayout";
import ActionsPanel from "@/editor/features/TreegeEditor/panel/ActionsPanel";
import MultiSelectionPanel from "@/editor/features/TreegeEditor/panel/MultiSelectionPanel";
import NodeActionsSheet from "@/editor/features/TreegeEditor/sheets/NodeActionsSheet";
import useFlowConnections from "@/editor/hooks/useFlowConnections";
import useUndoRedo from "@/editor/hooks/useUndoRedo";
import { TreegeEditorProps } from "@/editor/types/editor";
import { Toaster } from "@/shared/components/ui/sonner";
import { PortalContainerProvider } from "@/shared/context/PortalContainerContext";
import { ThemeProvider } from "@/shared/context/ThemeContext";
import { useMediaQuery } from "@/shared/hooks/useMediaQuery";
import { cn } from "@/shared/lib/utils";

const Flow = ({
  flow,
  onExportJson,
  onSave,
  theme,
  className,
  extraMenuItems,
  onAuthorize,
  headers,
  onHeadersChange,
}: TreegeEditorProps) => {
  const [showMiniMap, setShowMiniMap] = useState(false);
  const [portalContainer, setPortalContainer] = useState<HTMLDivElement | null>(null);
  const { onConnect, onConnectEnd, onEdgesDelete, isValidConnection } = useFlowConnections();
  const { onBeforeDelete, takeSnapshot } = useUndoRedo({ enableShortcuts: true });
  const isMobile = useMediaQuery("mobile");

  return (
    <PortalContainerProvider container={portalContainer}>
      <ReactFlow
        ref={setPortalContainer}
        fitView
        panOnScroll
        minZoom={0.1}
        fitViewOptions={{ maxZoom: isMobile ? 0.6 : 1 }}
        colorMode={theme}
        selectNodesOnDrag={false}
        nodesDraggable={false}
        nodeTypes={NODE_TYPES}
        edgeTypes={EDGE_TYPES}
        defaultEdges={flow?.edges || []}
        defaultNodes={flow?.nodes || []}
        defaultEdgeOptions={{ zIndex: 0 }}
        onConnect={onConnect}
        onConnectEnd={onConnectEnd}
        onEdgesDelete={onEdgesDelete}
        onNodeDragStart={takeSnapshot}
        onBeforeDelete={onBeforeDelete}
        isValidConnection={isValidConnection}
        className={cn(className, "treege")}
      >
        <AutoLayout />
        <Background gap={10} variant={BackgroundVariant.Dots} />
        <ActionsPanel
          onExportJson={onExportJson}
          onSave={onSave}
          extraMenuItems={extraMenuItems}
          onAuthorize={onAuthorize}
          headers={headers}
          onHeadersChange={onHeadersChange}
        />
        <Logo theme={theme} />
        <MultiSelectionPanel />
        <Controls showInteractive={false}>
          <MiniMapControl show={showMiniMap} onToggle={() => setShowMiniMap((prev) => !prev)} />
        </Controls>
        <NodeActionsSheet />
        <DeleteNodeDialog />
        <ChangeNodeTypeDialog />
        {showMiniMap && <MiniMap />}
      </ReactFlow>
    </PortalContainerProvider>
  );
};

const TreegeEditor = ({
  flow,
  onExportJson,
  onSave,
  onLanguageChange,
  aiConfig,
  extraMenuItems,
  openApi,
  baseUrl,
  openApiBaseUrl,
  onAuthorize,
  headers,
  onHeadersChange,
  language: controlledLanguage,
  theme = "dark",
  defaultLanguage = "en",
}: TreegeEditorProps) => {
  // Controlled/uncontrolled language: `language` (when defined) always wins;
  // otherwise the editor owns the value internally, seeded by `defaultLanguage`.
  const isControlled = controlledLanguage !== undefined;
  const [internalLanguage, setInternalLanguage] = useState(defaultLanguage);
  const language = isControlled ? controlledLanguage : internalLanguage;

  const handleLanguageChange = useCallback(
    (next: string) => {
      if (!isControlled) {
        setInternalLanguage(next);
      }
      onLanguageChange?.(next);
    },
    [isControlled, onLanguageChange],
  );

  return (
    <>
      <EditorStyles />
      <ThemeProvider defaultTheme={theme} storageKey="treege-editor-theme" theme={theme}>
        <Toaster position="bottom-center" />
        <TreegeEditorRuntimeProvider value={{ aiConfig, flowId: flow?.id, headers, language, setLanguage: handleLanguageChange }}>
          <OpenApiProvider initialDocument={openApi} initialBaseUrl={baseUrl ?? openApiBaseUrl}>
            <ReactFlowProvider>
              <Flow
                onExportJson={onExportJson}
                onSave={onSave}
                flow={flow}
                theme={theme}
                extraMenuItems={extraMenuItems}
                onAuthorize={onAuthorize}
                headers={headers}
                onHeadersChange={onHeadersChange}
              />
            </ReactFlowProvider>
          </OpenApiProvider>
        </TreegeEditorRuntimeProvider>
      </ThemeProvider>
    </>
  );
};

export default TreegeEditor;
