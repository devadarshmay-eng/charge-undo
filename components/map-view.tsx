"use client";

import "maplibre-gl/dist/maplibre-gl.css";
import { Map, Marker, ScaleControl } from "maplibre-gl";
import { useEffect, useRef } from "react";
import type { Station } from "./station-types";

type MapViewProps = { stations: Station[]; selectedId: string | null; onSelect: (station: Station) => void };
const colors: Record<string, string> = { available: "#22C55E", occupied: "#F59E0B", broken: "#EF4444", missing: "#EF4444", other: "#9CA3AF", unconfirmed: "#3B82F6", disputed: "#EF4444" };

export function MapView({ stations, selectedId, onSelect }: MapViewProps) {
  const host = useRef<HTMLDivElement>(null); const map = useRef<Map | null>(null); const markers = useRef<Marker[]>([]);
  useEffect(() => {
    if (!host.current || map.current) return;
    map.current = new Map({ container: host.current, style: "https://tiles.openfreemap.org/styles/dark", center: [76.4, 10.45], zoom: 7.4, pitch: 46, bearing: -16 });
    map.current.addControl(new ScaleControl({ maxWidth: 100, unit: "metric" }), "bottom-left");
    return () => map.current?.remove();
  }, []);
  useEffect(() => {
    if (!map.current) return; markers.current.forEach((marker) => marker.remove());
    markers.current = stations.map((station) => {
      const marker = document.createElement("button"); marker.className = `mk ${selectedId === station.id ? "sel" : ""}`;
      marker.setAttribute("aria-label", station.name); marker.innerHTML = `<span class="mk-shadow"></span><span class="mk-body"><span class="mk-inner"><i class="dot" style="background:${colors[station.status ?? "unconfirmed"]}"></i></span></span>`;
      marker.onclick = () => onSelect(station);
      return new Marker({ element: marker, anchor: "bottom" }).setLngLat([station.lng, station.lat]).addTo(map.current!);
    });
  }, [stations, selectedId, onSelect]);
  return <div id="map" ref={host} />;
}
