"use client";
import { useState, useEffect, useRef } from "react";
import type { Station } from "./station-types";

type Props = {
  station: Station | null;
  open: boolean;
  onClose: () => void;
  onReport: () => void;
  onNavigate: () => void;
  onConfirmReport: (reportId: string, turnstileToken: string) => Promise<void>;
  onFlagReport: (reportId: string, turnstileToken: string) => Promise<void>;
  onRateStation: (stationId: string, score: number, turnstileToken: string) => Promise<void>;
};

export function StationPanel({
  station,
  open,
  onClose,
  onReport,
  onNavigate,
  onConfirmReport,
  onFlagReport,
  onRateStation
}: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [showTurnstile, setShowTurnstile] = useState(false);
  const [pendingAction, setPendingAction] = useState<{
    type: "rate" | "confirm" | "flag";
    score?: number;
  } | null>(null);

  const turnstileRef = useRef<HTMLDivElement>(null);
  const turnstileWidgetRef = useRef<any>(null);

  useEffect(() => {
    if (!open) {
      setShowTurnstile(false);
      setPendingAction(null);
      setError(null);
    }
  }, [open, station?.id]);

  useEffect(() => {
    if (!showTurnstile) return;

    // Load Turnstile script if not loaded
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

    const checkAndRender = () => {
      if ((window as any).turnstile && turnstileRef.current) {
        try {
          if (turnstileWidgetRef.current) {
            (window as any).turnstile.remove(turnstileWidgetRef.current);
          }
          turnstileWidgetRef.current = (window as any).turnstile.render(turnstileRef.current, {
            sitekey: "1x00000000000000000000AA", // Cloudflare test sitekey
            callback: async (token: string) => {
              if (!pendingAction || !station) return;
              setLoading(true);
              setError(null);
              setShowTurnstile(false);
              try {
                if (pendingAction.type === "rate" && pendingAction.score) {
                  await onRateStation(station.id, pendingAction.score, token);
                } else if (pendingAction.type === "confirm" && station.latestReportId) {
                  await onConfirmReport(station.latestReportId, token);
                } else if (pendingAction.type === "flag" && station.latestReportId) {
                  await onFlagReport(station.latestReportId, token);
                }
              } catch (err: any) {
                setError(err.message || "Action failed.");
              } finally {
                setLoading(false);
                setPendingAction(null);
              }
            },
            "error-callback": () => {
              setError("Turnstile verification failed. Please try again.");
              setShowTurnstile(false);
              setPendingAction(null);
            }
          });
        } catch (e) {
          console.error("Turnstile render error in panel", e);
        }
      } else {
        setTimeout(checkAndRender, 100);
      }
    };

    checkAndRender();

    return () => {
      if ((window as any).turnstile && turnstileWidgetRef.current) {
        try {
          (window as any).turnstile.remove(turnstileWidgetRef.current);
          turnstileWidgetRef.current = null;
        } catch (e) {}
      }
    };
  }, [showTurnstile, pendingAction, station?.id]);

  if (!station) return null;

  const hasPhoto = station.coverPhotoUrl && station.coverPhotoUrl.trim() !== "" && station.coverPhotoUrl.trim().toLowerCase() !== "n/a";
  const hasHours = station.hours && station.hours.trim() !== "" && station.hours.trim().toLowerCase() !== "n/a";
  const hasPhone = station.phone && station.phone.trim() !== "" && station.phone.trim().toLowerCase() !== "n/a";
  const hasWebsite = station.website && station.website.trim() !== "" && station.website.trim().toLowerCase() !== "n/a";
  const hasRating = station.ratingAverage !== undefined && station.ratingAverage !== null && station.ratingAverage > 0;

  const triggerAction = (type: "rate" | "confirm" | "flag", score?: number) => {
    setPendingAction({ type, score });
    setShowTurnstile(true);
  };

  return (
    <aside id="panel" className={open ? "open" : ""}>
      <div id="panel-peek">
        <span />
        <button onClick={onClose} disabled={loading}>×</button>
      </div>
      
      <div className="panel-cover" style={hasPhoto ? { backgroundImage: `url(${station.coverPhotoUrl})` } : undefined}>
        <div className="cover-shade" />
        {!hasPhoto && <div className="generic-cover-icon">⚡</div>}
        <span className={`cover-st ${station.status ?? "unconfirmed"}`}>
          {station.status ?? "Unconfirmed"}
        </span>
        <h2>{station.name}</h2>
        <p>{station.address}</p>
      </div>

      <div className="panel-body">
        {error && (
          <div style={{ color: "var(--red)", background: "rgba(255,92,92,0.1)", border: "1px solid rgba(255,92,92,0.2)", borderRadius: "8px", padding: "10px", marginBottom: "12px", fontSize: "12px" }}>
            {error}
          </div>
        )}

        {loading && (
          <div style={{ color: "var(--blue)", background: "rgba(182,163,255,0.1)", border: "1px solid rgba(182,163,255,0.2)", borderRadius: "8px", padding: "10px", marginBottom: "12px", fontSize: "12px", textAlign: "center" }}>
            Sending request...
          </div>
        )}

        <div className="panel-meta">
          <span>{station.operator ?? "Independent"}</span>
          {station.connectorType && <span>{station.connectorType}</span>}
          {hasRating && <span>★ {station.ratingAverage!.toFixed(1)}</span>}
        </div>

        {(hasHours || hasPhone || hasWebsite) && (
          <section>
            <h3>Station details</h3>
            {hasHours && <p>Hours <b>{station.hours}</b></p>}
            {hasPhone && <p>Phone <b>{station.phone}</b></p>}
            {hasWebsite && (
              <p>
                Website{" "}
                <b>
                  <a href={station.website} target="_blank" rel="noopener noreferrer" style={{ color: "var(--blue)" }}>
                    Visit Site
                  </a>
                </b>
              </p>
            )}
          </section>
        )}

        {/* Crowdsourced verification logic */}
        {(station.status === "unconfirmed" || station.status === "disputed") && station.latestReportId && (
          <section style={{ border: "1px solid var(--line)", borderRadius: "10px", padding: "12px", background: "rgba(255,255,255,0.01)" }}>
            <h4 style={{ margin: "0 0 6px 0", fontFamily: "Space Grotesk", fontSize: "13px" }}>
              Crowd Verification
            </h4>
            <p style={{ fontSize: "12px", color: "var(--mut)", margin: "0 0 10px 0" }}>
              This station has an unconfirmed status report. Please confirm if this is correct or flag it if it's incorrect.
            </p>
            <div style={{ display: "flex", gap: "8px" }}>
              <button className="btn btn-pri" style={{ flex: 1, padding: "8px", fontSize: "12px" }} onClick={() => triggerAction("confirm")} disabled={loading || showTurnstile}>
                Confirm Report
              </button>
              <button className="btn" style={{ flex: 1, padding: "8px", fontSize: "12px" }} onClick={() => triggerAction("flag")} disabled={loading || showTurnstile}>
                Dispute / Flag
              </button>
            </div>
          </section>
        )}

        {/* Interactive Star Rating */}
        <section style={{ borderTop: "1px solid var(--line)", paddingTop: "14px", marginTop: "14px" }}>
          <h4 style={{ margin: "0 0 6px 0", fontFamily: "Space Grotesk", fontSize: "13px" }}>
            Rate this station
          </h4>
          <div style={{ display: "flex", gap: "6px", fontSize: "22px", cursor: "pointer", color: "var(--amber)" }}>
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => triggerAction("rate", star)}
                disabled={loading || showTurnstile}
                style={{ background: "none", border: "none", color: "var(--amber)", fontSize: "22px", padding: "0 2px" }}
              >
                ★
              </button>
            ))}
          </div>
        </section>

        {/* Security Challenge overlay inside panel */}
        {showTurnstile && (
          <div style={{ marginTop: "14px", padding: "12px", border: "1px solid var(--line-2)", borderRadius: "10px", background: "rgba(255,255,255,0.02)" }}>
            <p style={{ fontSize: "11px", color: "var(--mut)", margin: "0 0 8px 0" }}>
              Please complete security verification to proceed:
            </p>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: "8px" }}>
              <div ref={turnstileRef} />
            </div>
            <button
              className="btn"
              style={{ width: "100%", padding: "6px", fontSize: "11px", justifyContent: "center" }}
              onClick={() => {
                setShowTurnstile(false);
                setPendingAction(null);
              }}
            >
              Cancel
            </button>
          </div>
        )}

        <div className="panel-actions" style={{ marginTop: "20px" }}>
          <button className="btn btn-pri" onClick={onNavigate} disabled={loading || showTurnstile}>
            ⌁ Navigate
          </button>
          <button className="btn" onClick={onReport} disabled={loading || showTurnstile}>
            ⚑ Report an issue
          </button>
        </div>
      </div>
    </aside>
  );
}
