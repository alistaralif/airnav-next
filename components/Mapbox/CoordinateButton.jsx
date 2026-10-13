/**
 * CoordinateButton.jsx
 *
 * A floating button to toggle the coordinate picker on/off
 */
import { PiMapPinSimpleArea } from "react-icons/pi";

export default function CoordinateButton({ isActive, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`measurement-button ${isActive ? 'active' : ''}`}
      title={isActive ? "Disable coordinate picker" : "Enable coordinate picker"}
    >
      <PiMapPinSimpleArea size={20} />
      <span>{isActive ? 'Picking' : 'Coordinates'}</span>
    </button>
  );
}
