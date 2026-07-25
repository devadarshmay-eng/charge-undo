"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { DisclaimerBar, LegendStatusStack } from "./map-chrome";
import { MapView } from "./map-view";
import { ReportModal } from "./report-modal";
import { StationPanel } from "./station-panel";
import type { Station } from "./station-types";
import { TopBar } from "./top-bar";

const DEFAULT_USER_LOCATION = { lat: 10.0, lng: 76.3 };

function getHaversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function ChargeMap() {
  const [stations, setStations] = useState<Station[]>([]);
  const [selected, setSelected] = useState<Station | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [filters, setFilters] = useState(new Set<string>());
  const [query, setQuery] = useState("");
  const [reportOpen, setReportOpen] = useState(false);
  const [navigatingStation, setNavigatingStation] = useState<Station | null>(null);
  const [userLoc, setUserLoc] = useState(DEFAULT_USER_LOCATION);

  useEffect(() => {
    fetch("/api/stations").then(async (response) => response.ok ? response.json() as Promise<{ stations: Station[] }> : Promise.reject(new Error("Unable to load stations."))).then((data) => setStations(data.stations)).catch(console.error);
    
    if (typeof navigator !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        },
        (err) => console.log("Geolocation error, using default: ", err)
      );
    }
  }, []);

  const visible = useMemo(() => stations.filter((station) => !filters.size || filters.has(station.status ?? "unconfirmed")), [stations, filters]);
  const select = useCallback((station: Station) => { setSelected(station); setPanelOpen(true); setQuery(""); setNavigatingStation(null); }, []);
  const toggle = (filter: string) => setFilters((current) => { const next = new Set(current); next.has(filter) ? next.delete(filter) : next.add(filter); return next; });

  const routeDetails = useMemo(() => {
    if (!navigatingStation) return null;
    const distKm = getHaversineDistance(userLoc.lat, userLoc.lng, navigatingStation.lat, navigatingStation.lng);
    const timeMin = Math.round(distKm * 2); // 30 km/h is 2 mins per km
    const isIOS = typeof navigator !== "undefined" && /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    const mapsUrl = isIOS
      ? `maps://?daddr=${navigatingStation.lat},${navigatingStation.lng}`
      : `https://www.google.com/maps/dir/?api=1&destination=${navigatingStation.lat},${navigatingStation.lng}`;
    return { distKm, timeMin, mapsUrl };
  }, [navigatingStation, userLoc]);

  return <main className={panelOpen ? "mode-panel" : selected ? "mode-selected" : ""}><MapView stations={visible} selectedId={selected?.id ?? null} routeCoordinates={navigatingStation ? [[userLoc.lng, userLoc.lat], [navigatingStation.lng, navigatingStation.lat]] : null} onSelect={select} /><TopBar stations={stations} query={query} onQuery={setQuery} filters={filters} onFilter={toggle} onSelect={select} /><LegendStatusStack count={visible.length} /><StationPanel station={selected} open={panelOpen} onClose={() => setPanelOpen(false)} onReport={() => setReportOpen(true)} onNavigate={() => { setNavigatingStation(selected); setPanelOpen(false); }} /><DisclaimerBar onReport={() => setReportOpen(true)} /><ReportModal open={reportOpen} stationName={selected?.name} onClose={() => setReportOpen(false)} />{navigatingStation && routeDetails && <div id="route-preview-card" className="srf"><div className="rpc-title">{navigatingStation.name}</div><div className="rpc-meta"><span>Distance: <b>{routeDetails.distKm.toFixed(1)} km</b></span><span>Est. Time: <b>{routeDetails.timeMin} min</b></span></div><div className="rpc-approx">Approximate estimate assumes ~30 km/h average speed.</div><div style={{ display: "flex", gap: "8px" }}><button className="btn btn-pri" style={{ flex: 1 }} onClick={() => window.open(routeDetails.mapsUrl, "_blank")}>Confirm — Open in Maps</button><button className="btn" style={{ flex: "none", padding: "0 12px" }} onClick={() => setNavigatingStation(null)}>✕</button></div></div>}{visible.length === 0 && filters.size > 0 && <div id="empty-filters" className="srf show"><b>No stations match</b><p>Try removing a filter or widening the map view.</p><button className="btn btn-pri" style={{ width: "100%", justifyContent: "center" }} onClick={() => setFilters(new Set())}>Clear all filters</button></div>}</main>;
}
