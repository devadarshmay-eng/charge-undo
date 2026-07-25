"use client";
import type { Station } from "./station-types";
type Props = { station: Station | null; open: boolean; onClose: () => void; onReport: () => void; onNavigate: () => void };
export function StationPanel({ station, open, onClose, onReport, onNavigate }: Props) {
  if (!station) return null;

  const hasPhoto = station.coverPhotoUrl && station.coverPhotoUrl.trim() !== "" && station.coverPhotoUrl.trim().toLowerCase() !== "n/a";
  const hasHours = station.hours && station.hours.trim() !== "" && station.hours.trim().toLowerCase() !== "n/a";
  const hasPhone = station.phone && station.phone.trim() !== "" && station.phone.trim().toLowerCase() !== "n/a";
  const hasWebsite = station.website && station.website.trim() !== "" && station.website.trim().toLowerCase() !== "n/a";
  const hasRating = station.ratingAverage !== undefined && station.ratingAverage !== null && station.ratingAverage > 0;

  return <aside id="panel" className={open ? "open" : ""}><div id="panel-peek"><span /><button onClick={onClose}>×</button></div><div className="panel-cover" style={hasPhoto ? { backgroundImage: `url(${station.coverPhotoUrl})` } : undefined}><div className="cover-shade" />{!hasPhoto && <div className="generic-cover-icon">⚡</div>}<span className={`cover-st ${station.status ?? "unconfirmed"}`}>{station.status ?? "Unconfirmed"}</span><h2>{station.name}</h2><p>{station.address}</p></div><div className="panel-body"><div className="panel-meta"><span>{station.operator ?? "Independent"}</span>{station.connectorType && <span>{station.connectorType}</span>}{hasRating && <span>★ {station.ratingAverage!.toFixed(1)}</span>}</div>{(hasHours || hasPhone || hasWebsite) && <section><h3>Station details</h3>{hasHours && <p>Hours <b>{station.hours}</b></p>}{hasPhone && <p>Phone <b>{station.phone}</b></p>}{hasWebsite && <a href={station.website} target="_blank">Website</a>}</section>}<div className="panel-actions"><button className="btn btn-pri" onClick={onNavigate}>⌁ Navigate</button><button className="btn" onClick={onReport}>⚑ Report an issue</button></div></div></aside>;
}
