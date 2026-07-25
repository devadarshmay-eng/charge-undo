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
  isFavorite: boolean;
  onToggleFavorite: () => void;
};

export function StationPanel({
  station,
  open,
  onClose,
  onReport,
  onNavigate,
  onConfirmReport,
  onFlagReport,
  onRateStation,
  isFavorite,
  onToggleFavorite
}: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showManualCopy, setShowManualCopy] = useState(false);

  const handleDirections = () => {
    if (!station) return;
    const isIOS = typeof navigator !== "undefined" && /iPhone|iPad|iPod/.test(navigator.userAgent);
    const url = isIOS
      ? `https://maps.apple.com/?daddr=${station.lat},${station.lng}`
      : `https://www.google.com/maps/dir/?api=1&destination=${station.lat},${station.lng}`;
    window.open(url, "_blank");
  };

  const handleShare = async () => {
    if (!station) return;
    const shareData = {
      title: `${station.name} - EV Charging Station`,
      text: `Check out ${station.name} charging station in ${station.address} via ChargeUndo!`,
      url: typeof window !== "undefined" ? `${window.location.origin}/?id=${station.id}` : ""
    };

    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (e) {
        console.log("Error sharing:", e);
      }
    } else if (typeof navigator !== "undefined" && navigator.clipboard && navigator.clipboard.writeText) {
      try {
        await navigator.clipboard.writeText(shareData.url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (e) {
        console.error("Clipboard copy failed:", e);
        setShowManualCopy(true);
      }
    } else {
      setShowManualCopy(true);
    }
  };
  
  const [showTurnstile, setShowTurnstile] = useState(false);
  const [pendingAction, setPendingAction] = useState<{
    type: "rate" | "confirm" | "flag";
    score?: number;
  } | null>(null);

  const turnstileRef = useRef<HTMLDivElement>(null);
  const turnstileWidgetRef = useRef<any>(null);

  // Mobile Bottom Sheet Gesture States
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [sheetState, setSheetState] = useState<"peek" | "full" | "closed">("closed");
  const startY = useRef(0);
  const currentY = useRef(0);

  useEffect(() => {
    if (open) {
      setSheetState("peek");
    } else {
      setSheetState("closed");
    }
    setShowTurnstile(false);
    setPendingAction(null);
    setError(null);
  }, [open, station?.id]);

  useEffect(() => {
    if (!showTurnstile) return;

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
      if ((window as any).turnstile && turnstileRef.current) {
        try {
          if (turnstileWidgetRef.current) {
            try {
              (window as any).turnstile.remove(turnstileWidgetRef.current);
            } catch (err) {}
            turnstileWidgetRef.current = null;
          }

          widgetId = (window as any).turnstile.render(turnstileRef.current, {
            sitekey: "1x00000000000000000000AA",
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
          turnstileWidgetRef.current = widgetId;
        } catch (e) {
          console.error("Turnstile render error in panel", e);
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
        if (turnstileWidgetRef.current === widgetId) {
          turnstileWidgetRef.current = null;
        }
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

  // Touch Gesture Handlers for Swipeable Sheet (Mobile-only)
  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    startY.current = e.touches[0].clientY;
    currentY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    currentY.current = e.touches[0].clientY;
    const deltaY = currentY.current - startY.current;
    
    // Elastic pull at the limits
    if (sheetState === "full" && deltaY < 0) {
      setDragY(deltaY * 0.2);
    } else {
      setDragY(deltaY);
    }
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);
    const deltaY = currentY.current - startY.current;
    setDragY(0);

    const threshold = 70;
    if (sheetState === "peek") {
      if (deltaY < -threshold) {
        setSheetState("full");
      } else if (deltaY > threshold) {
        setSheetState("closed");
        onClose();
      }
    } else if (sheetState === "full") {
      if (deltaY > threshold) {
        setSheetState("peek");
      }
    }
  };

  const getDynamicStyles = () => {
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      let translateY = "105%";
      if (open) {
        if (sheetState === "closed") {
          translateY = "105%";
        } else if (sheetState === "peek") {
          translateY = `calc(42vh + ${dragY}px)`;
        } else if (sheetState === "full") {
          translateY = `${dragY}px`;
        }
      }
      return {
        transform: `translateY(${translateY})`,
        transition: isDragging ? "none" : "transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
        height: "85vh",
        top: "auto",
        bottom: 0,
        borderTopLeftRadius: "24px",
        borderTopRightRadius: "24px",
        overflowY: (isDragging || sheetState === "peek") ? "hidden" : "auto" as any
      };
    }
    return {}; // Desktop CSS fallback
  };

  return (
    <aside id="panel" className={open ? "open" : ""} style={getDynamicStyles()}>
      {/* iOS/Android style Sheet Grab Handle bar */}
      <div 
        id="panel-peek"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{ cursor: "grab", touchAction: "none" }}
      >
        <span style={{ cursor: "grab" }} />
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

        {/* Floating Heart Button */}
        <button
          onClick={onToggleFavorite}
          style={{
            position: "absolute",
            top: "16px",
            left: "16px",
            background: "rgba(17, 19, 21, 0.65)",
            border: "1px solid rgba(255, 255, 255, 0.12)",
            borderRadius: "50%",
            width: "38px",
            height: "38px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: isFavorite ? "#FF5C5C" : "#ffffff",
            fontSize: "19px",
            zIndex: 10,
            cursor: "pointer",
            backdropFilter: "blur(4px)",
            transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)"
          }}
          aria-label={isFavorite ? "Remove from saved" : "Save station"}
        >
          {isFavorite ? "♥" : "♡"}
        </button>
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

        <div className="panel-actions" style={{ marginTop: "20px", display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <button className="btn btn-pri" style={{ flex: 1, minWidth: "120px" }} onClick={handleDirections} disabled={loading || showTurnstile}>
            ↗ Directions
          </button>
          
          {station.phone && (
            <a
              href={`tel:${station.phone}`}
              className="btn"
              style={{
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                flex: "1 0 auto",
                padding: "8px 12px"
              }}
            >
              📞 Call
            </a>
          )}

          <button
            className="btn"
            style={{
              borderColor: isFavorite ? "var(--lime)" : undefined,
              color: isFavorite ? "var(--lime)" : undefined,
              background: isFavorite ? "rgba(198, 255, 61, 0.08)" : undefined
            }}
            onClick={onToggleFavorite}
            disabled={loading || showTurnstile}
          >
            {isFavorite ? "♥ Favorited" : "♡ Favorite"}
          </button>

          <button className="btn" onClick={handleShare} disabled={loading || showTurnstile}>
            {copied ? "✓ Copied!" : "🔗 Share"}
          </button>
        </div>

        {showManualCopy && (
          <div style={{ marginTop: "12px", background: "var(--line)", padding: "10px", borderRadius: "8px" }}>
            <p style={{ margin: "0 0 6px 0", fontSize: "11px", color: "var(--dim)", textAlign: "left" }}>
              Sharing API unavailable. Copy this link manually:
            </p>
            <div style={{ display: "flex", gap: "6px" }}>
              <input
                type="text"
                readOnly
                value={typeof window !== "undefined" ? `${window.location.origin}/?id=${station?.id}` : ""}
                style={{
                  flex: 1,
                  background: "var(--bg)",
                  border: "1px solid var(--line-2)",
                  color: "var(--text)",
                  padding: "4px 8px",
                  fontSize: "11px",
                  borderRadius: "4px"
                }}
                onClick={(e) => (e.target as HTMLInputElement).select()}
              />
              <button
                className="btn"
                style={{ padding: "4px 8px", fontSize: "11px", height: "auto" }}
                onClick={() => setShowManualCopy(false)}
              >
                Close
              </button>
            </div>
          </div>
        )}

        <div className="panel-actions-sub" style={{ marginTop: "10px" }}>
          <button className="btn" style={{ width: "100%", justifyContent: "center" }} onClick={onReport} disabled={loading || showTurnstile}>
            ⚑ Report incorrect details / status
          </button>
        </div>
      </div>
    </aside>
  );
}
