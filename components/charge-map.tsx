"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { DisclaimerBar, LegendStatusStack } from "./map-chrome";
import { MapView } from "./map-view";
import { ReportModal } from "./report-modal";
import { StationPanel } from "./station-panel";
import type { Station } from "./station-types";
import { TopBar } from "./top-bar";
export function ChargeMap() {
  const [stations, setStations] = useState<Station[]>([]); const [selected, setSelected] = useState<Station | null>(null); const [panelOpen, setPanelOpen] = useState(false); const [filters, setFilters] = useState(new Set<string>()); const [query, setQuery] = useState(""); const [reportOpen, setReportOpen] = useState(false);
  useEffect(() => { fetch("/api/stations").then(async (response) => response.ok ? response.json() as Promise<{ stations: Station[] }> : Promise.reject(new Error("Unable to load stations."))).then((data) => setStations(data.stations)).catch(console.error); }, []);
  const visible = useMemo(() => stations.filter((station) => !filters.size || filters.has(station.status ?? "unconfirmed")), [stations, filters]);
  const select = useCallback((station: Station) => { setSelected(station); setPanelOpen(true); setQuery(""); }, []);
  const toggle = (filter: string) => setFilters((current) => { const next = new Set(current); next.has(filter) ? next.delete(filter) : next.add(filter); return next; });
  return <main className={panelOpen ? "mode-panel" : selected ? "mode-selected" : ""}><MapView stations={visible} selectedId={selected?.id ?? null} onSelect={select} /><TopBar stations={stations} query={query} onQuery={setQuery} filters={filters} onFilter={toggle} onSelect={select} /><LegendStatusStack count={visible.length} /><StationPanel station={selected} open={panelOpen} onClose={() => setPanelOpen(false)} onReport={() => setReportOpen(true)} /><DisclaimerBar onReport={() => setReportOpen(true)} /><ReportModal open={reportOpen} stationName={selected?.name} onClose={() => setReportOpen(false)} /></main>;
}
