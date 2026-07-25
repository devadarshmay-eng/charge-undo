"use client";

import "maplibre-gl/dist/maplibre-gl.css";
import { Map, Marker, ScaleControl, GeoJSONSource } from "maplibre-gl";
import { forwardRef, useImperativeHandle, useEffect, useRef } from "react";
import type { Station } from "./station-types";

type MapViewProps = {
  stations: Station[];
  selectedId: string | null;
  routeCoordinates: [number, number][] | null;
  onSelect: (station: Station) => void;
  onViewportChange: (center: { lat: number; lng: number }) => void;
  userLoc: { lat: number; lng: number } | null;
};

export interface MapViewRef {
  zoomIn: () => void;
  zoomOut: () => void;
  toggle3D: () => boolean;
  locate: (userLoc: { lat: number; lng: number }) => void;
  fitBounds: (stations: Station[]) => void;
}

const colors: Record<string, string> = {
  available: "#C6FF3D",
  occupied: "#B6A3FF",
  broken: "#FF5C5C",
  missing: "#FF5C5C",
  other: "#9CA3AF",
  unconfirmed: "#B6A3FF",
  disputed: "#FF5C5C"
};

export const MapView = forwardRef<MapViewRef, MapViewProps>(
  ({ stations, selectedId, routeCoordinates, onSelect, onViewportChange, userLoc }, ref) => {
    const host = useRef<HTMLDivElement>(null);
    const map = useRef<Map | null>(null);
    const markers = useRef<Marker[]>([]);
    const userMarker = useRef<Marker | null>(null);

    const fitBoundsToStations = (targetStations: Station[]) => {
      if (!map.current || targetStations.length === 0) return;
      
      const bounds = targetStations.reduce(
        (acc, station) => {
          return [
            [Math.min(acc[0][0], station.lng), Math.min(acc[0][1], station.lat)],
            [Math.max(acc[1][0], station.lng), Math.max(acc[1][1], station.lat)]
          ];
        },
        [
          [targetStations[0].lng, targetStations[0].lat],
          [targetStations[0].lng, targetStations[0].lat]
        ]
      );

      map.current.fitBounds(bounds as [[number, number], [number, number]], {
        padding: { top: 80, bottom: 80, left: 50, right: 50 },
        maxZoom: 13,
        duration: 1200
      });
    };

    useImperativeHandle(ref, () => ({
      zoomIn: () => {
        map.current?.zoomIn();
      },
      zoomOut: () => {
        map.current?.zoomOut();
      },
      toggle3D: () => {
        if (!map.current) return false;
        const currentPitch = map.current.getPitch();
        const is3DActive = currentPitch > 0;
        if (is3DActive) {
          map.current.easeTo({ pitch: 0, bearing: 0, duration: 800 });
          return false;
        } else {
          map.current.easeTo({ pitch: 46, bearing: -16, duration: 800 });
          return true;
        }
      },
      locate: (loc) => {
        if (!map.current) return;
        map.current.flyTo({
          center: [loc.lng, loc.lat],
          zoom: 13,
          duration: 1500
        });
      },
      fitBounds: (targetStations) => {
        fitBoundsToStations(targetStations);
      }
    }));

    useEffect(() => {
      if (!host.current || map.current) return;
      
      map.current = new Map({
        container: host.current,
        style: "https://tiles.openfreemap.org/styles/dark",
        center: [76.4, 10.45],
        zoom: 7.4,
        pitch: 0,
        bearing: 0
      });

      map.current.on("error", (e) => {
        console.error("MapLibre load/rendering error details:", e);
      });

      map.current.addControl(new ScaleControl({ maxWidth: 100, unit: "metric" }), "bottom-left");
      
      map.current.on("moveend", () => {
        if (map.current) {
          const center = map.current.getCenter();
          onViewportChange({ lat: center.lat, lng: center.lng });
        }
      });

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
        
        // If userLoc is already loaded, position marker right away on load
        if (userLoc) {
          positionUserMarker(userLoc);
        }
        
        const center = map.current.getCenter();
        onViewportChange({ lat: center.lat, lng: center.lng });
      });

      const resizeObserver = new ResizeObserver(() => {
        map.current?.resize();
      });
      
      resizeObserver.observe(host.current);

      return () => {
        resizeObserver.disconnect();
        if (userMarker.current) {
          userMarker.current.remove();
          userMarker.current = null;
        }
        if (map.current) {
          map.current.remove();
          map.current = null;
        }
      };
    }, []);

    const positionUserMarker = (loc: { lat: number; lng: number }) => {
      if (!map.current) return;
      if (userMarker.current) {
        userMarker.current.setLngLat([loc.lng, loc.lat]);
      } else {
        const el = document.createElement("div");
        el.className = "user-loc-marker";
        el.innerHTML = '<span class="user-loc-pulse"></span><span class="user-loc-dot"></span>';
        userMarker.current = new Marker({ element: el, anchor: "center" })
          .setLngLat([loc.lng, loc.lat])
          .addTo(map.current);
      }
    };

    // Keep user position marker updated
    useEffect(() => {
      if (map.current && userLoc) {
        positionUserMarker(userLoc);
      }
    }, [userLoc]);

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
      if (!map.current) return;
      markers.current.forEach((marker) => marker.remove());
      markers.current = stations.map((station) => {
        const marker = document.createElement("button");
        marker.className = `mk ${selectedId === station.id ? "sel" : ""}`;
        marker.setAttribute("aria-label", station.name);
        marker.innerHTML = `<span class="mk-shadow"></span><span class="mk-body"><span class="mk-inner"><i class="dot" style="background:${colors[station.status ?? "unconfirmed"]}"></i></span></span>`;
        marker.onclick = () => onSelect(station);
        return new Marker({ element: marker, anchor: "bottom" }).setLngLat([station.lng, station.lat]).addTo(map.current!);
      });
    }, [stations, selectedId, onSelect]);

    return <div id="map" ref={host} style={{ width: "100%", height: "100%" }} />;
  }
);

MapView.displayName = "MapView";
