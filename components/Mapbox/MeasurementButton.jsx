/**
 * MeasurementButton.jsx
 * 
 * A floating button to toggle the measurement tool on/off
 */
import { Ruler } from "lucide-react";
import { formatDistance, NM_THRESHOLD, KM_THRESHOLD } from "./distanceUtils";

export default function MeasurementButton({ isActive, onClick, measurement }) {
  return (
    <div className="measurement-controls">
      {/* <div className="measurement-info-wrapper"> */}
        <button
          onClick={onClick}
          className={`measurement-button ${isActive ? 'active' : ''}`}
          title={isActive ? "Disable measurement" : "Enable measurement"}
        >
          <Ruler size={20} />
          <span>{isActive ? 'Measuring' : 'Measure'}</span>
        </button>

        {isActive && (
          measurement ? (
            <div className="measurement-info">
              <div className="measurement-value nm">
                <strong>{formatDistance(measurement.nm, NM_THRESHOLD)}</strong> NM
              </div>
              <div className="measurement-value km">
                <strong>{formatDistance(measurement.km, KM_THRESHOLD)}</strong> KM
              </div>
            </div>
          ) : ""
        //   (
        //     <div className="measurement-hint">
        //       Click on the map to place pins
        //     </div>
        //   )
        )}
      {/* </div> */}
    </div>
  );
}