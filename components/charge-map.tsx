"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { DisclaimerBar, LegendStatusStack } from "./map-chrome";
import { MapView } from "./map-view";
import { ReportModal } from "./report-modal";
import { StationPanel } from "./station-panel";
import type { Station } from "./station-types";
import { TopBar } from "./top-bar";

const DEFAULT_USER_LOCATION = { lat: 10.0, lng: 76.3 };

const getDeviceId = () => {
  if (typeof window === "undefined") return "";
  let id = localStorage.getItem("device_id");
  if (!id) {
    id = "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (c) =>
      (+c ^ crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (+c / 4))).toString(16)
    );
    localStorage.setItem("device_id", id);
  }
  return id;
};

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
  const [reportMode, setReportMode] = useState<"report" | "add">("report");
  const [navigatingStation, setNavigatingStation] = useState<Station | null>(null);
  const [userLoc, setUserLoc] = useState(DEFAULT_USER_LOCATION);
  
  // Viewport tracking & sparse density banner states
  const [mapCenter, setMapCenter] = useState(DEFAULT_USER_LOCATION);
  const [dismissedCenter, setDismissedCenter] = useState<{ lat: number; lng: number } | null>(null);

  const fetchStations = useCallback(async () => {
    try {
      const response = await fetch("/api/stations");
      if (response.ok) {
        const data = await response.json();
        setStations(data.stations);
        if (selected) {
          const updated = data.stations.find((s: Station) => s.id === selected.id);
          if (updated) setSelected(updated);
        }
      }
    } catch (e) {
      console.error("Unable to load stations:", e);
    }
  }, [selected]);

  useEffect(() => {
    fetchStations();
    
    if (typeof navigator !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          setMapCenter({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        },
        (err) => console.log("Geolocation error, using default: ", err)
      );
    }

    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("add") === "true") {
        setReportMode("add");
        setReportOpen(true);
      }
    }
  }, []);

  const visible = useMemo(() => stations.filter((station) => !filters.size || filters.has(station.status ?? "unconfirmed")), [stations, filters]);
  const select = useCallback((station: Station) => { setSelected(station); setPanelOpen(true); setQuery(""); setNavigatingStation(null); }, []);
  const toggle = (filter: string) => setFilters((current) => { const next = new Set(current); next.has(filter) ? next.delete(filter) : next.add(filter); return next; });

  const onConfirmReport = async (reportId: string, turnstileToken: string) => {
    if (selected) {
      setSelected(prev => prev ? { ...prev, status: "available" } : null);
      setStations(prev => prev.map(s => s.id === selected.id ? { ...s, status: "available" } : s));
    }
    const res = await fetch(`/api/reports/${reportId}/confirm`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-device-id": getDeviceId()
      },
      body: JSON.stringify({ turnstileToken })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to confirm report.");
    await fetchStations();
  };

  const onFlagReport = async (reportId: string, turnstileToken: string) => {
    if (selected) {
      setSelected(prev => prev ? { ...prev, status: "disputed" } : null);
      setStations(prev => prev.map(s => s.id === selected.id ? { ...s, status: "disputed" } : s));
    }
    const res = await fetch(`/api/reports/${reportId}/flag`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-device-id": getDeviceId()
      },
      body: JSON.stringify({ turnstileToken })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to flag report.");
    await fetchStations();
  };

  const onRateStation = async (stationId: string, score: number, turnstileToken: string) => {
    if (selected) {
      setSelected(prev => prev ? { ...prev, ratingAverage: score } : null);
      setStations(prev => prev.map(s => s.id === selected.id ? { ...s, ratingAverage: score } : s));
    }
    const res = await fetch(`/api/stations/${stationId}/rate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-device-id": getDeviceId()
      },
      body: JSON.stringify({ score, turnstileToken })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to submit rating.");
    await fetchStations();
  };

  const onSubmitSuccess = async (data: any) => {
    await fetchStations();
    if (data.type === "add" && data.station) {
      setSelected(data.station);
      setPanelOpen(true);
    }
  };

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

  // Compute pin density around mapCenter (radius 10km)
  const density = useMemo(() => {
    let count = 0;
    for (const s of stations) {
      const dist = getHaversineDistance(mapCenter.lat, mapCenter.lng, s.lat, s.lng);
      if (dist <= 10) count++;
    }
    return count;
  }, [stations, mapCenter]);

  // Check if sparse density banner should show
  const showBanner = useMemo(() => {
    if (density >= 3) return false;
    if (dismissedCenter) {
      const dist = getHaversineDistance(dismissedCenter.lat, dismissedCenter.lng, mapCenter.lat, mapCenter.lng);
      if (dist < 10) return false;
    }
    return true;
  }, [density, dismissedCenter, mapCenter]);

  return (
    <main className={panelOpen ? "mode-panel" : selected ? "mode-selected" : ""}>
      <MapView
        stations={visible}
        selectedId={selected?.id ?? null}
        routeCoordinates={navigatingStation ? [[userLoc.lng, userLoc.lat], [navigatingStation.lng, navigatingStation.lat]] : null}
        onSelect={select}
        onViewportChange={setMapCenter}
      />
      <TopBar
        stations={stations}
        query={query}
        onQuery={setQuery}
        filters={filters}
        onFilter={toggle}
        onSelect={select}
      />
      <LegendStatusStack count={visible.length} />
      
      <StationPanel
        station={selected}
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
        onReport={() => {
          setReportMode("report");
          setReportOpen(true);
        }}
        onNavigate={() => {
          setNavigatingStation(selected);
          setPanelOpen(false);
        }}
        onConfirmReport={onConfirmReport}
        onFlagReport={onFlagReport}
        onRateStation={onRateStation}
      />
      
      <DisclaimerBar onReport={() => {
        setReportMode("report");
        setReportOpen(true);
      }} />
      
      <ReportModal
        open={reportOpen}
        mode={reportMode}
        station={selected}
        userLoc={reportMode === "add" ? mapCenter : userLoc}
        onClose={() => setReportOpen(false)}
        onSubmitSuccess={onSubmitSuccess}
      />

      {showBanner && (
        <div
          className="srf"
          style={{
            position: "fixed",
            top: "108px",
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 25,
            padding: "10px 16px",
            borderRadius: "20px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            fontSize: "12px",
            fontWeight: "500",
            boxShadow: "0 4px 12px rgba(0,0,0,0.25)"
          }}
        >
          <span>📍 Not many stations here — be the first to add one</span>
          <button
            className="btn btn-pri"
            style={{ padding: "4px 8px", fontSize: "11px", borderRadius: "10px" }}
            onClick={() => {
              setReportMode("add");
              setReportOpen(true);
            }}
          >
            Add Station
          </button>
          <button
            onClick={() => setDismissedCenter(mapCenter)}
            style={{ background: "none", border: "none", color: "var(--dim)", cursor: "pointer", fontSize: "14px", padding: "0 4px" }}
          >
            ✕
          </button>
        </div>
      )}
      
      {navigatingStation && routeDetails && (
        <div id="route-preview-card" className="srf">
          <div className="rpc-title">{navigatingStation.name}</div>
          <div className="rpc-meta">
            <span>Distance: <b>{routeDetails.distKm.toFixed(1)} km</b></span>
            <span>Est. Time: <b>{routeDetails.timeMin} min</b></span>
          </div>
          <div className="rpc-approx">Approximate estimate assumes ~30 km/h average speed.</div>
          <div style={{ display: "flex", gap: "8px" }}>
            <button className="btn btn-pri" style={{ flex: 1 }} onClick={() => window.open(routeDetails.mapsUrl, "_blank")}>
              Confirm — Open in Maps
            </button>
            <button className="btn" style={{ flex: "none", padding: "0 12px" }} onClick={() => setNavigatingStation(null)}>
              ✕
            </button>
          </div>
        </div>
      )}
      
      {!navigatingStation && (
        <button
          id="btn-add-station"
          className="btn btn-pri"
          style={{
            position: "fixed",
            right: "12px",
            bottom: "80px",
            zIndex: 25,
            borderRadius: "50%",
            width: "44px",
            height: "44px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "24px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.3)"
          }}
          onClick={() => {
            setReportMode("add");
            setReportOpen(true);
          }}
          title="Add Missing Station"
        >
          +
        </button>
      )}

      {visible.length === 0 && filters.size > 0 && (
        <div id="empty-filters" className="srf show">
          <b>No stations match</b>
          <p>Try removing a filter or widening the map view.</p>
          <button className="btn btn-pri" style={{ width: "100%", justifyContent: "center" }} onClick={() => setFilters(new Set())}>
            Clear all filters
          </button>
        </div>
      )}

      <div id="location-inaccurate-notice">
        Some locations may be inaccurate. Help improve the map by{" "}
        <button
          onClick={() => {
            setReportMode("add");
            setReportOpen(true);
          }}
          style={{
            background: "none",
            border: "none",
            color: "var(--blue)",
            textDecoration: "underline",
            padding: 0,
            cursor: "pointer",
            fontWeight: "500"
          }}
        >
          reporting incorrect station locations
        </button>
        .
      </div>
    </main>
  );
}
