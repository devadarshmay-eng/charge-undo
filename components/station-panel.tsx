"use client";
import type { Station } from "./station-types";
type Props = { station: Station | null; open: boolean; onClose: () => void; onReport: () => void };
export function StationPanel({ station, open, onClose, onReport }: Props) {
  if (!station) return null;
  return <aside id="panel" className={open ? "open" : ""}><div id="panel-peek"><span /><button onClick={onClose}>×</button></div><div className="panel-cover" style={station.coverPhotoUrl ? { backgroundImage: `url(${station.coverPhotoUrl})` } : undefined}><div className="cover-shade" /><span className={`cover-st ${station.status ?? "unconfirmed"}`}>{station.status ?? "Unconfirmed"}</span><h2>{station.name}</h2><p>{station.address}</p></div><div className="panel-body"><div className="panel-meta"><span>{station.operator ?? "Independent"}</span>{station.connectorType && <span>{station.connectorType}</span>}{station.ratingAverage !== undefined && <span>★ {station.ratingAverage.toFixed(1)}</span>}</div><section><h3>Station details</h3>{station.hours && <p>Hours <b>{station.hours}</b></p>}{station.phone && <p>Phone <b>{station.phone}</b></p>}{station.website && <a href={station.website} target="_blank">Website</a>}</section><div className="panel-actions"><button className="btn btn-pri">⌁ Navigate</button><button className="btn" onClick={onReport}>⚑ Report an issue</button></div></div></aside>;
}
