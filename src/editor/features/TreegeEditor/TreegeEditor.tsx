import { Background, BackgroundVariant, Controls, MiniMap, ReactFlow, ReactFlowProvider } from "@xyflow/react";
import { useCallback, useEffect, useState } from "react";
import Logo from "@/editor/components/branding/Logo";
import EditorStyles from "@/editor/components/styles/EditorStyles";
import { EDGE_TYPES } from "@/editor/constants/edgeTypes";
import { NODE_TYPES } from "@/editor/constants/nodeTypes";
import { OpenApiProvider } from "@/editor/context/OpenApiContext";
import { TreegeEditorRuntimeProvider, useTreegeEditorRuntime } from "@/editor/context/TreegeEditorRuntimeProvider";
import MiniMapControl from "@/editor/features/TreegeEditor/controls/MiniMapControl";
import ChangeNodeTypeDialog from "@/editor/features/TreegeEditor/dialogs/ChangeNodeTypeDialog";
import DeleteNodeDialog from "@/editor/features/TreegeEditor/dialogs/DeleteNodeDialog";
import AutoLayout from "@/editor/features/TreegeEditor/layout/AutoLayout";
import FlowChangeEmitter from "@/editor/features/TreegeEditor/listeners/FlowChangeEmitter";
import ProgressiveMount, { needsProgressiveMount } from "@/editor/features/TreegeEditor/listeners/ProgressiveMount";
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

/** Small flows mount in one commit: warm the node previews shortly after. */
const PREVIEW_WARMUP_DELAY_MS = 500;

const Flow = ({
  flow,
  onExportJson,
  onSave,
  onChange,
  theme,
  className,
  extraMenuItems,
  onAuthorize,
  headers,
  onHeadersChange,
}: TreegeEditorProps) => {
  const [progressive] = useState(() => needsProgressiveMount(flow)); // Large flows are fed to the canvas in batches (see ProgressiveMount) instead of one blocking commit.
  const [showMiniMap, setShowMiniMap] = useState(false);
  const [portalContainer, setPortalContainer] = useState<HTMLDivElement | null>(null);
  const { onConnect, onConnectEnd, onEdgesDelete, isValidConnection } = useFlowConnections();
  const { onBeforeDelete, takeSnapshot } = useUndoRedo({ enableShortcuts: true });
  const isMobile = useMediaQuery("mobile");
  const { warmUpPreviews } = useTreegeEditorRuntime();

  // Once the flow is on screen, previews may fetch without waiting for a
  // hover: large flows are warmed by ProgressiveMount when the layout settles,
  // small ones by this short post-mount timer.
  useEffect(() => {
    if (progressive) {
      return undefined;
    }
    const timer = window.setTimeout(warmUpPreviews, PREVIEW_WARMUP_DELAY_MS);

    return () => clearTimeout(timer);
  }, [progressive, warmUpPreviews]);

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
        defaultEdges={progressive ? [] : flow?.edges || []}
        defaultNodes={progressive ? [] : flow?.nodes || []}
        defaultEdgeOptions={{ zIndex: 0 }}
        onConnect={onConnect}
        onConnectEnd={onConnectEnd}
        onEdgesDelete={onEdgesDelete}
        onNodeDragStart={takeSnapshot}
        onBeforeDelete={onBeforeDelete}
        isValidConnection={isValidConnection}
        className={cn(className, "treege treege-editor")}
      >
        <AutoLayout />
        {progressive && flow && (
          <ProgressiveMount flow={flow} fitViewOptions={{ maxZoom: isMobile ? 0.6 : 1 }} onSettled={warmUpPreviews} />
        )}
        <FlowChangeEmitter onChange={onChange} />
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
  onChange,
  onLanguageChange,
  aiConfig,
  extraMenuItems,
  openApi,
  baseUrl,
  onAuthorize,
  headers,
  onHeadersChange,
  language: controlledLanguage,
  theme = "dark",
  defaultLanguage = "en",
}: TreegeEditorProps) => {
  const [internalLanguage, setInternalLanguage] = useState(defaultLanguage);
  const isControlled = controlledLanguage !== undefined;
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
          <OpenApiProvider initialDocument={openApi} initialBaseUrl={baseUrl}>
            <ReactFlowProvider>
              <Flow
                onExportJson={onExportJson}
                onSave={onSave}
                onChange={onChange}
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
