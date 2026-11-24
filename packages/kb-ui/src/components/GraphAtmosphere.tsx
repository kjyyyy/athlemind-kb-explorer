/** Decorative layers behind the WebGL graph (no interaction). */

export function GraphAtmosphere() {
  return (
  <>
      <div className="graph-atmo-base" aria-hidden />
      <div className="graph-atmo-grid" aria-hidden />
      <div className="graph-atmo-glow graph-atmo-glow--brand" aria-hidden />
      <div className="graph-atmo-glow graph-atmo-glow--accent" aria-hidden />
      <div className="graph-atmo-vignette" aria-hidden />
      <div className="graph-atmo-noise" aria-hidden />
    </>
  );
}