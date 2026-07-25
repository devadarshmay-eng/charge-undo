"use client";

type LegendStatusStackProps = {
  count: number;
  is3D: boolean;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onToggle3D: () => void;
  onLocate: () => void;
};

export function LegendStatusStack({
  count,
  is3D,
  onZoomIn,
  onZoomOut,
  onToggle3D,
  onLocate
}: LegendStatusStackProps) {
  return (
    <>
      <aside id="rail">
        <div className="rail-grp">
          <button aria-label="Zoom in" onClick={onZoomIn}>+</button>
          <button aria-label="Zoom out" onClick={onZoomOut}>−</button>
          <button className={is3D ? "on" : ""} aria-label="Toggle 3D" onClick={onToggle3D}>3D</button>
        </div>
        <div className="rail-grp">
          <button aria-label="Locate" onClick={onLocate}>⌖</button>
        </div>
      </aside>
      <div id="statusstack">
        <span className="pill"><i className="pd" />{count} stations</span>
        <span className="pill"><i className="pd" />GPS · ±8 m</span>
      </div>
    </>
  );
}

export function DisclaimerBar({ onReport }: { onReport: () => void }) {
  return (
    <footer id="disclaimer">
      Some locations may be inaccurate.{" "}
      <button onClick={onReport}>
        Help improve the map by reporting incorrect station locations.
      </button>
      {" · Developed by "}
      <a href="https://devadarsh.pages.dev" target="_blank" rel="noopener noreferrer">
        Devadarsh Anoop
      </a>
    </footer>
  );
}
