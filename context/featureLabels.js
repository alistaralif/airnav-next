export function getFeatureSubtitle(feature) {
  const props = feature?.properties || {};
  const name = props.NAME || props.name || "";
  const warningCategory = String(props.category || props.warning || "").toLowerCase();

  if (props.type === "SID" || props.type === "STAR") {
    return [props.type, props.runway].filter(Boolean).join(" - ");
  }

  if (props.type === "ATS Route") {
    return "ATS Route";
  }

  if (props["fir-label"]) {
    return "Sector";
  }

  if (name.toUpperCase().includes("FIR")) {
    return "FIR";
  }

  if (warningCategory === "prohibited") {
    return "Prohibited Area";
  }

  if (warningCategory === "restricted") {
    return "Restricted Area";
  }

  if (warningCategory === "danger") {
    return "Danger Area";
  }

  if (props.dme === "true") {
    return "DME Waypoint";
  }

  if (props.dme === "false" || feature?.geometry?.type === "Point") {
    return "Waypoint";
  }

  if (props.subtitle) {
    return props.subtitle;
  }

  return props.TYPE || props.type || feature?.geometry?.type || "";
}
