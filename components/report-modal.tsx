"use client";
import { useState, useEffect, useRef } from "react";
import type { Station, StationStatus } from "./station-types";

type Props = {
  open: boolean;
  mode: "report" | "add";
  station?: Station | null;
  userLoc?: { lat: number; lng: number };
  onClose: () => void;
  onSubmitSuccess: (data: any) => void;
};

const getDeviceId = () => {
  if (typeof window === "undefined") return "";
  let id = localStorage.getItem("device_id");
  if (!id) {
    id = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
    localStorage.setItem("device_id", id);
  }
  return id;
};

const reportOptions: [StationStatus, string][] = [
  ["broken", "Out of service"],
  ["occupied", "All chargers busy"],
  ["missing", "Station missing"],
  ["other", "Something else"]
];

export function ReportModal({ open, mode, station, userLoc, onClose, onSubmitSuccess }: Props) {
  const [reason, setReason] = useState<StationStatus>("broken");
  const [customText, setCustomText] = useState("");
  const [connectorType, setConnectorType] = useState("");
  
  // Photo states
  const [photoUrl, setPhotoUrl] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);
  
  // Add mode fields
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [phone, setPhone] = useState("");
  const [website, setWebsite] = useState("");
  const [hours, setHours] = useState("");
  const [operator, setOperator] = useState("");
  
  const [turnstileToken, setTurnstileToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const turnstileContainerRef = useRef<HTMLDivElement>(null);
  const turnstileWidgetIdRef = useRef<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setError(null);
      setTurnstileToken("");
      setPhotoUrl("");
      setSelectedFile(null);
      setUploadProgress(null);
      setUploading(false);
      if (mode === "add" && userLoc) {
        setLat(userLoc.lat.toString());
        setLng(userLoc.lng.toString());
      }
    }
  }, [open, mode, userLoc]);

  useEffect(() => {
    if (!open) return;

    // Load Turnstile script
    const scriptId = "turnstile-script";
    let script = document.getElementById(scriptId) as HTMLScriptElement;
    if (!script) {
      script = document.createElement("script");
      script.id = scriptId;
      script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }

    let timeoutId: any = null;
    let widgetId: string | null = null;

    const checkAndRender = () => {
      if ((window as any).turnstile && turnstileContainerRef.current) {
        try {
          if (turnstileWidgetIdRef.current) {
            try {
              (window as any).turnstile.remove(turnstileWidgetIdRef.current);
            } catch (err) {}
            turnstileWidgetIdRef.current = null;
          }

          widgetId = (window as any).turnstile.render(turnstileContainerRef.current, {
            sitekey: "1x00000000000000000000AA", // Cloudflare test key
            callback: (token: string) => {
              setTurnstileToken(token);
            },
            "error-callback": () => {
              setError("Turnstile verification failed. Please try again.");
            }
          });
          turnstileWidgetIdRef.current = widgetId;
        } catch (e) {
          console.error("Turnstile render error", e);
        }
      } else {
        timeoutId = setTimeout(checkAndRender, 100);
      }
    };

    checkAndRender();

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      if ((window as any).turnstile && widgetId) {
        try {
          (window as any).turnstile.remove(widgetId);
        } catch (e) {}
        if (turnstileWidgetIdRef.current === widgetId) {
          turnstileWidgetIdRef.current = null;
        }
      }
    };
  }, [open, mode]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setUploading(true);
    setUploadProgress(0);
    setError(null);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", "https://upload.imagekit.io/api/v1/files/upload");

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const percent = Math.round((event.loaded / event.total) * 100);
        setUploadProgress(percent);
      }
    };

    xhr.onload = () => {
      setUploading(false);
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const response = JSON.parse(xhr.responseText);
          setPhotoUrl(response.url || response.thumbnailUrl || "");
          setUploadProgress(null);
        } catch (err) {
          setError("Failed to parse image upload response.");
          setUploadProgress(null);
        }
      } else {
        setError("Photo upload failed. You can still submit the report without a photo.");
        setUploadProgress(null);
      }
    };

    xhr.onerror = () => {
      setUploading(false);
      setUploadProgress(null);
      setError("Network error during photo upload. You can still submit the report without a photo.");
    };

    const formData = new FormData();
    formData.append("file", file);
    formData.append("fileName", file.name);
    formData.append("publicKey", process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY || "");
    formData.append("uploadPreset", "default"); // Unsigned preset config
    
    xhr.send(formData);
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setPhotoUrl("");
    setUploadProgress(null);
    setUploading(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!turnstileToken) {
      setError("Please complete the Turnstile security challenge.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (mode === "report") {
        if (!station) throw new Error("No station selected for reporting.");
        const res = await fetch("/api/reports", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-device-id": getDeviceId()
          },
          body: JSON.stringify({
            stationId: station.id,
            statusPreset: reason,
            connectorType: connectorType || undefined,
            customText: customText || undefined,
            photoUrl: photoUrl || undefined,
            turnstileToken
          })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to submit report.");
        onSubmitSuccess({ type: "report", stationId: station.id, status: data.status, latestReportId: data.id });
      } else {
        // Add mode
        if (!name.trim()) throw new Error("Station name is required.");
        if (!address.trim()) throw new Error("Station address is required.");
        const parsedLat = parseFloat(lat);
        const parsedLng = parseFloat(lng);
        if (isNaN(parsedLat) || parsedLat < -90 || parsedLat > 90) throw new Error("Latitude must be a number between -90 and 90.");
        if (isNaN(parsedLng) || parsedLng < -180 || parsedLng > 180) throw new Error("Longitude must be a number between -180 and 180.");

        const res = await fetch("/api/stations", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-device-id": getDeviceId()
          },
          body: JSON.stringify({
            name,
            address,
            lat: parsedLat,
            lng: parsedLng,
            phone: phone || undefined,
            website: website || undefined,
            hours: hours || undefined,
            operator: operator || undefined,
            connectorType: connectorType || undefined,
            turnstileToken
          })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to add station.");
        onSubmitSuccess({
          type: "add",
          station: {
            id: data.id,
            source: "user-submitted",
            name,
            address,
            lat: parsedLat,
            lng: parsedLng,
            phone: phone || undefined,
            website: website || undefined,
            hours: hours || undefined,
            operator: operator || undefined,
            connectorType: connectorType || undefined,
            status: "unconfirmed"
          }
        });
      }
      onClose();
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="report-overlay" className="open" onMouseDown={(event) => { if (event.currentTarget === event.target) onClose(); }}>
      <div id="report-modal" className="srf" style={{ maxHeight: "90vh", overflowY: "auto" }}>
        <button className="modal-x" onClick={onClose} disabled={loading}>×</button>
        <h2>{mode === "report" ? "Report an issue" : "Add a missing station"}</h2>
        {mode === "report" && <p style={{ color: "var(--mut)", marginBottom: "12px" }}>{station?.name}</p>}

        {error && (
          <div style={{ color: "var(--red)", background: "rgba(255,92,92,0.1)", border: "1px solid rgba(255,92,92,0.2)", borderRadius: "8px", padding: "10px", marginBottom: "12px", fontSize: "12px" }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {mode === "report" ? (
            <>
              <div className="report-reasons" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", margin: "12px 0" }}>
                {reportOptions.map(([key, label]) => (
                  <button
                    type="button"
                    className={`rep-reason ${reason === key ? "on" : ""}`}
                    onClick={() => setReason(key)}
                    key={key}
                    style={{ padding: "8px", fontSize: "12px" }}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "12px" }}>
                <input
                  type="text"
                  placeholder="Connector Type (e.g. CCS2, Type 2) (optional)"
                  value={connectorType}
                  onChange={(e) => setConnectorType(e.target.value)}
                  style={{ width: "100%", padding: "8px", border: "1px solid var(--line)", borderRadius: "8px", background: "#0003", color: "var(--text)" }}
                />
                
                {/* Photo Drop UI */}
                <div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/jpeg,image/png"
                    style={{ display: "none" }}
                  />
                  {!selectedFile ? (
                    <div id="photo-drop" onClick={() => fileInputRef.current?.click()}>
                      <span style={{ fontSize: "16px" }}>📷</span>
                      <span>Add a photo of the issue</span>
                      <span style={{ fontSize: "10px", color: "var(--dim)" }}>JPG or PNG · up to 10 MB</span>
                    </div>
                  ) : (
                    <div id="photo-prev" className="show">
                      <span style={{ fontSize: "14px" }}>🖼️</span>
                      <b style={{ fontSize: "12px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {selectedFile.name} 
                        {uploadProgress !== null && ` (${uploadProgress}%)`}
                        {uploading && " (Uploading...)"}
                        {photoUrl && " (Ready)"}
                      </b>
                      <button type="button" onClick={handleRemoveFile}>Remove</button>
                    </div>
                  )}
                </div>

                <textarea
                  placeholder="Add a note (optional)"
                  maxLength={80}
                  value={customText}
                  onChange={(e) => setCustomText(e.target.value)}
                  style={{ width: "100%", minHeight: "60px", padding: "8px", border: "1px solid var(--line)", borderRadius: "8px", background: "#0003", color: "var(--text)" }}
                />
              </div>
            </>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", margin: "12px 0" }}>
              <input
                type="text"
                placeholder="Station Name (required)"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={{ width: "100%", padding: "8px", border: "1px solid var(--line)", borderRadius: "8px", background: "#0003", color: "var(--text)" }}
              />
              <input
                type="text"
                placeholder="Address (required)"
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                style={{ width: "100%", padding: "8px", border: "1px solid var(--line)", borderRadius: "8px", background: "#0003", color: "var(--text)" }}
              />
              <div style={{ display: "flex", gap: "8px" }}>
                <input
                  type="number"
                  step="any"
                  placeholder="Latitude (required)"
                  required
                  value={lat}
                  onChange={(e) => setLat(e.target.value)}
                  style={{ flex: 1, padding: "8px", border: "1px solid var(--line)", borderRadius: "8px", background: "#0003", color: "var(--text)" }}
                />
                <input
                  type="number"
                  step="any"
                  placeholder="Longitude (required)"
                  required
                  value={lng}
                  onChange={(e) => setLng(e.target.value)}
                  style={{ flex: 1, padding: "8px", border: "1px solid var(--line)", borderRadius: "8px", background: "#0003", color: "var(--text)" }}
                />
              </div>
              <input
                type="text"
                placeholder="Phone (optional)"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                style={{ width: "100%", padding: "8px", border: "1px solid var(--line)", borderRadius: "8px", background: "#0003", color: "var(--text)" }}
              />
              <input
                type="text"
                placeholder="Website URL (optional)"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                style={{ width: "100%", padding: "8px", border: "1px solid var(--line)", borderRadius: "8px", background: "#0003", color: "var(--text)" }}
              />
              <input
                type="text"
                placeholder="Hours (e.g. Open 24 hours) (optional)"
                value={hours}
                onChange={(e) => setHours(e.target.value)}
                style={{ width: "100%", padding: "8px", border: "1px solid var(--line)", borderRadius: "8px", background: "#0003", color: "var(--text)" }}
              />
              <input
                type="text"
                placeholder="Operator (optional)"
                value={operator}
                onChange={(e) => setOperator(e.target.value)}
                style={{ width: "100%", padding: "8px", border: "1px solid var(--line)", borderRadius: "8px", background: "#0003", color: "var(--text)" }}
              />
              <input
                type="text"
                placeholder="Connector Type (e.g. CCS2) (optional)"
                value={connectorType}
                onChange={(e) => setConnectorType(e.target.value)}
                style={{ width: "100%", padding: "8px", border: "1px solid var(--line)", borderRadius: "8px", background: "#0003", color: "var(--text)" }}
              />
            </div>
          )}

          <div style={{ display: "flex", justifyContent: "center", margin: "12px 0 16px" }}>
            <div ref={turnstileContainerRef} />
          </div>

          <button type="submit" className="btn btn-pri" style={{ width: "100%", justifyContent: "center" }} disabled={loading}>
            {loading ? "Submitting..." : mode === "report" ? "Submit report" : "Add station"}
          </button>
        </form>
      </div>
    </div>
  );
}
