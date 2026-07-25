"use client";
import type { Station } from "./station-types";

type Props = {
  stations: Station[];
  query: string;
  onQuery: (query: string) => void;
  filters: Set<string>;
  onFilter: (filter: string) => void;
  onSelect: (station: Station) => void;
  showSavedOnly: boolean;
  onToggleSavedOnly: () => void;
  allKerala: boolean;
  onToggleAllKerala: () => void;
};

const filters = [
  ["available", "Available"],
  ["occupied", "In use"],
  ["unconfirmed", "Unconfirmed"],
  ["disputed", "Disputed"]
];

export function TopBar({
  stations,
  query,
  onQuery,
  filters: active,
  onFilter,
  onSelect,
  showSavedOnly,
  onToggleSavedOnly,
  allKerala,
  onToggleAllKerala
}: Props) {
  const results = query
    ? stations
        .filter((s) =>
          `${s.name} ${s.address} ${s.operator ?? ""} ${s.connectorType ?? ""}`
            .toLowerCase()
            .includes(query.toLowerCase())
        )
        .slice(0, 7)
    : [];

  return (
    <header id="topbar">
      <div className="row1">
        <div className="logo-lockup">
          <span className="ev">EV</span>
          <span className="undo">Undo</span>
        </div>
        <div id="searchwrap" className={query ? "has-q" : ""}>
          <div id="searchbox" className="srf">
            <span>⌕</span>
            <input
              id="search-input"
              value={query}
              onChange={(event) => onQuery(event.target.value)}
              placeholder="Search stations"
            />
            <button id="clear-search" onClick={() => onQuery("")}>
              ×
            </button>
          </div>
          {query && (
            <div id="search-drop" className="srf open">
              {results.length ? (
                results.map((station) => (
                  <button className="sd-row" key={station.id} onClick={() => onSelect(station)}>
                    <span className="st-ic">
                      <i className="sdot" />
                    </span>
                    <span className="sd-main">
                      <b className="sd-name">{station.name}</b>
                      <small className="sd-sub">{station.operator ?? station.address}</small>
                    </span>
                    <span className="sd-side">{station.connectorType ?? ""}</span>
                  </button>
                ))
              ) : (
                <div className="sd-empty">
                  <b>No matches for “{query}”</b>
                  Try an operator or neighborhood.
                </div>
              )}
            </div>
          )}
        </div>
        <button
          className={`icobtn srf ${showSavedOnly ? "on" : ""}`}
          aria-label="Saved stations"
          onClick={onToggleSavedOnly}
          style={{
            color: showSavedOnly ? "#FF5C5C" : undefined,
            borderColor: showSavedOnly ? "rgba(255, 92, 92, 0.4)" : undefined,
            background: showSavedOnly ? "rgba(255, 92, 92, 0.08)" : undefined
          }}
        >
          {showSavedOnly ? "♥" : "♡"}
        </button>
        <a
          href="/about"
          className="icobtn srf"
          title="About EVUndo"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            textDecoration: "none",
            fontSize: "14px"
          }}
        >
          ℹ
        </a>
      </div>
      <nav id="chipbar">
        <button
          className={`chip ${allKerala ? "on" : ""}`}
          onClick={onToggleAllKerala}
          style={{
            borderColor: allKerala ? "var(--lime)" : undefined,
            background: allKerala ? "rgba(198, 255, 61, 0.08)" : undefined,
            color: allKerala ? "var(--lime)" : undefined
          }}
        >
          <i className="cdot" style={{ background: allKerala ? "var(--lime)" : undefined }} />
          All Kerala
        </button>
        {filters.map(([key, label]) => (
          <button
            className={`chip ${active.has(key) ? "on" : ""}`}
            key={key}
            onClick={() => onFilter(key)}
          >
            <i className="cdot" />
            {label}
          </button>
        ))}
      </nav>
    </header>
  );
}
