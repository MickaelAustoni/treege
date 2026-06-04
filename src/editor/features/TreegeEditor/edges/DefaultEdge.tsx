import { BaseEdge, EdgeLabelRenderer, type EdgeProps, getBezierPath, useReactFlow } from "@xyflow/react";
import { memo } from "react";
import { useIsStackedEdge } from "@/editor/hooks/useIsStackedEdge";

const DefaultEdge = ({
  id,
  source,
  target,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style,
  markerEnd,
  selected,
}: EdgeProps) => {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourcePosition,
    sourceX,
    sourceY,
    targetPosition,
    targetX,
    targetY,
  });

  const { setEdges } = useReactFlow();
  const isStacked = useIsStackedEdge(source, target);

  const onEdgeClick = () => {
    setEdges((edges) => edges.filter((edge) => edge.id !== id));
  };

  // Stacked edges are visually merged (border-to-border) and carry no line. The
  // insert/branch affordances now live on the source node's bottom controls
  // (see BottomHandleDropdown), so nothing is rendered here.
  if (isStacked) {
    return null;
  }

  return (
    <>
      <BaseEdge path={edgePath} markerEnd={markerEnd} style={style} />
      <EdgeLabelRenderer>
        {selected && (
          <div
            className="button-edge__label nodrag nopan"
            style={{
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            }}
          >
            <button type="button" className="button-edge__button" onClick={onEdgeClick} aria-label="Remove edge">
              ×
            </button>
          </div>
        )}
      </EdgeLabelRenderer>
    </>
  );
};

export default memo(DefaultEdge);
