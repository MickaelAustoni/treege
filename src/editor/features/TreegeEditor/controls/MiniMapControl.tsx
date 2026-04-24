import { ControlButton } from "@xyflow/react";
import { MapPin, MapPinMinusInside } from "lucide-react";

interface MiniMapControlProps {
  show: boolean;
  onToggle: () => void;
}

const MiniMapControl = ({ show, onToggle }: MiniMapControlProps) => (
  <ControlButton onClick={onToggle} title={show ? "Hide minimap" : "Show minimap"}>
    {show ? <MapPinMinusInside /> : <MapPin />}
  </ControlButton>
);

export default MiniMapControl;
