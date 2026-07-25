"use client";

import "maplibre-gl/dist/maplibre-gl.css";
import { Map, Marker, ScaleControl, GeoJSONSource } from "maplibre-gl";
import { useEffect, useRef } from "react";
import type { Station } from "./station-types";

type MapViewProps = { stations: Station[]; selectedId: string | null; routeCoordinates: [number, number][] | null; onSelect: (station: Station) => void };
const colors: Record<string, string> = { available: "#C6FF3D", occupied: "#B6A3FF", broken: "#FF5C5C", missing: "#FF5C5C", other: "#9CA3AF", unconfirmed: "#B6A3FF", disputed: "#FF5C5C" };

export function MapView({ stations, selectedId, routeCoordinates, onSelect }: MapViewProps) {
  const host = useRef<HTMLDivElement>(null); const map = useRef<Map | null>(null); const markers = useRef<Marker[]>([]);
  useEffect(() => {
    if (!host.current || map.current) return;
    map.current = new Map({ container: host.current, style: "https://tiles.openfreemap.org/styles/dark", center: [76.4, 10.45], zoom: 7.4, pitch: 46, bearing: -16 });
    map.current.addControl(new ScaleControl({ maxWidth: 100, unit: "metric" }), "bottom-left");
    
    map.current.on("load", () => {
      if (!map.current) return;
      map.current.addSource("route", {
        type: "geojson",
        data: { type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: [] } }
      });
      map.current.addLayer({
        id: "route-glow",
        type: "line",
        source: "route",
        layout: { "line-join": "round", "line-cap": "round" },
        paint: { "line-color": "#B6A3FF", "line-width": 9, "line-opacity": 0.22, "line-blur": 4 }
      });
      map.current.addLayer({
        id: "route-line",
        type: "line",
        source: "route",
        layout: { "line-join": "round", "line-cap": "round" },
        paint: { "line-color": "#5B9BF8", "line-width": 3.5 }
      });
    });

    return () => map.current?.remove();
  }, []);

  useEffect(() => {
    if (!map.current) return;
    const source = map.current.getSource("route") as GeoJSONSource;
    if (!source || source.type !== "geojson") return;
    if (routeCoordinates && routeCoordinates.length > 0) {
      source.setData({
        type: "Feature",
        properties: {},
        geometry: { type: "LineString", coordinates: routeCoordinates }
      });
      map.current.flyTo({
        center: routeCoordinates[1] as [number, number],
        zoom: 14.5,
        pitch: 50,
        bearing: -10,
        duration: 1500
      });
    } else {
      source.setData({
        type: "Feature",
        properties: {},
        geometry: { type: "LineString", coordinates: [] }
      });
    }
  }, [routeCoordinates]);

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

