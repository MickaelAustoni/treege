import { BaseEdge, EdgeLabelRenderer, type EdgeProps, getBezierPath, useReactFlow } from "@xyflow/react";
import { memo } from "react";
import { useIsIntraChainEdge } from "@/editor/hooks/useChainPosition";

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
  const isIntraChain = useIsIntraChainEdge(source, target);
  const [edgePath, labelX, labelY] = getBezierPath({
    sourcePosition,
    sourceX,
    sourceY,
    targetPosition,
    targetX,
    targetY,
  });

  const { setEdges } = useReactFlow();
  const onEdgeClick = () => {
    setEdges((edges) => edges.filter((edge) => edge.id !== id));
  };

  if (isIntraChain) {
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
