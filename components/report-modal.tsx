"use client";
import { useState } from "react";
import type { StationStatus } from "./station-types";
type Props = { open: boolean; stationName?: string; onClose: () => void };
const options: [StationStatus, string][] = [["broken", "Out of service"], ["occupied", "All chargers busy"], ["missing", "Station missing"], ["other", "Something else"]];
export function ReportModal({ open, stationName, onClose }: Props) {
  const [reason, setReason] = useState<StationStatus>("broken"); if (!open) return null;
  return <div id="report-overlay" className="open" onMouseDown={(event) => { if (event.currentTarget === event.target) onClose(); }}><div id="report-modal" className="srf"><button className="modal-x" onClick={onClose}>×</button><h2>Report an issue</h2><p>{stationName}</p><div className="report-reasons">{options.map(([key, label]) => <button className={`rep-reason ${reason === key ? "on" : ""}`} onClick={() => setReason(key)} key={key}>{label}</button>)}</div><textarea placeholder="Add a note (optional)" maxLength={80} /><div className="hp" aria-hidden="true"><input name="website_confirmation" tabIndex={-1} autoComplete="off" /></div><button className="btn btn-pri" onClick={onClose}>Submit report</button></div></div>;
}
