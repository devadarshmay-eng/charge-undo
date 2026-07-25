"use client";
import Link from "next/link";

export default function About() {
  return (
    <div style={{ background: "#0c0d0e", color: "#f9fafb", minHeight: "100vh", fontFamily: "Inter, system-ui, sans-serif", overflowY: "auto" }}>
      {/* Google Fonts link for Bebas Neue */}
      <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Space+Grotesk:wght@500;600;700&display=swap" rel="stylesheet" />

      {/* Header */}
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 4%", borderBottom: "1px solid rgba(255,255,255,0.07)", background: "rgba(12, 13, 14, 0.9)", backdropFilter: "blur(12px)", position: "sticky", top: 0, zIndex: 100 }}>
        <Link href="/" style={{ textDecoration: "none" }}>
          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "28px", letterSpacing: "1px", display: "flex", alignItems: "center" }}>
            <span style={{ color: "#f9fafb" }}>EV</span>
            <span style={{ color: "#C6FF3D" }}>Undo</span>
          </div>
        </Link>
        <nav style={{ display: "flex", gap: "24px", alignItems: "center" }}>
          <Link href="/" style={{ color: "#9ca3af", textDecoration: "none", fontSize: "14px", fontWeight: 500 }}>Live Map</Link>
          <span style={{ color: "#C6FF3D", fontSize: "14px", fontWeight: 600 }}>About</span>
          <Link href="/" style={{
            background: "#C6FF3D",
            color: "#0c0d0e",
            padding: "8px 16px",
            borderRadius: "8px",
            textDecoration: "none",
            fontSize: "13px",
            fontWeight: 600,
            transition: "all 0.2s"
          }}>
            Launch App
          </Link>
        </nav>
      </header>

      {/* Hero Section */}
      <section style={{ padding: "80px 4% 60px", textAlign: "center", maxWidth: "900px", margin: "0 auto" }}>
        <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "min(48px, 9vw)", fontWeight: 700, lineHeight: 1.1, marginBottom: "20px" }}>
          Reliable EV Charging Across Kerala. <span style={{ color: "#C6FF3D" }}>Verified by the Crowd.</span>
        </h1>
        <p style={{ color: "#9ca3af", fontSize: "16px", lineHeight: 1.6, marginBottom: "32px", maxWidth: "700px", margin: "0 auto 32px" }}>
          No more broken chargers, dead batteries, or unexpected queues. EVUndo is Kerala's community-driven live mapping platform designed to keep your electric journey seamless from Kasaragod to Thiruvananthapuram.
        </p>
        <div style={{ display: "flex", gap: "16px", justifyContent: "center", flexWrap: "wrap" }}>
          <Link href="/" style={{
            background: "#C6FF3D",
            color: "#0c0d0e",
            padding: "12px 28px",
            borderRadius: "10px",
            textDecoration: "none",
            fontSize: "14px",
            fontWeight: 600,
            boxShadow: "0 4px 20px rgba(198, 255, 61, 0.2)"
          }}>
            Explore Live Map
          </Link>
          <Link href="/?add=true" style={{
            border: "1px solid rgba(255, 255, 255, 0.15)",
            background: "rgba(255,255,255,0.02)",
            color: "#f9fafb",
            padding: "12px 28px",
            borderRadius: "10px",
            textDecoration: "none",
            fontSize: "14px",
            fontWeight: 600
          }}>
            Add Missing Station
          </Link>
        </div>
      </section>

      {/* Outcome Section (Stats) */}
      <section style={{ padding: "60px 4%", background: "rgba(255,255,255,0.01)", borderTop: "1px solid rgba(255,255,255,0.03)", borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "30px", textAlign: "center" }}>
          <div>
            <div style={{ fontSize: "36px", fontWeight: 700, color: "#C6FF3D", fontFamily: "'Space Grotesk', sans-serif" }}>1,500+</div>
            <div style={{ color: "#9ca3af", marginTop: "6px", fontSize: "13px" }}>Crowd-Verified Stations</div>
          </div>
          <div>
            <div style={{ fontSize: "36px", fontWeight: 700, color: "#B6A3FF", fontFamily: "'Space Grotesk', sans-serif" }}>99.4%</div>
            <div style={{ color: "#9ca3af", marginTop: "6px", fontSize: "13px" }}>Report Accuracy Rate</div>
          </div>
          <div>
            <div style={{ fontSize: "36px", fontWeight: 700, color: "#C6FF3D", fontFamily: "'Space Grotesk', sans-serif" }}>10 Min</div>
            <div style={{ color: "#9ca3af", marginTop: "6px", fontSize: "13px" }}>Average Queue Validation</div>
          </div>
          <div>
            <div style={{ fontSize: "36px", fontWeight: 700, color: "#B6A3FF", fontFamily: "'Space Grotesk', sans-serif" }}>14 Districts</div>
            <div style={{ color: "#9ca3af", marginTop: "6px", fontSize: "13px" }}>Comprehensive Kerala Coverage</div>
          </div>
        </div>
      </section>

      {/* ServicesBand Section */}
      <section style={{ padding: "80px 4%", maxWidth: "1100px", margin: "0 auto" }}>
        <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "28px", fontWeight: 600, textAlign: "center", marginBottom: "40px" }}>
          Engineered for Kerala's EV Roads
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "24px" }}>
          <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", padding: "28px", borderRadius: "14px" }}>
            <div style={{ fontSize: "24px", marginBottom: "16px" }}>⚡</div>
            <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "18px", fontWeight: 600, marginBottom: "10px" }}>Real-time Crowd Status</h3>
            <p style={{ color: "#9ca3af", lineHeight: 1.5, fontSize: "13.5px" }}>
              Check if highway chargers are available, occupied, or broken in real-time. Make report flags that propagate instantly.
            </p>
          </div>
          <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", padding: "28px", borderRadius: "14px" }}>
            <div style={{ fontSize: "24px", marginBottom: "16px" }}>🗺️</div>
            <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "18px", fontWeight: 600, marginBottom: "10px" }}>Zero-Key Navigation Links</h3>
            <p style={{ color: "#9ca3af", lineHeight: 1.5, fontSize: "13.5px" }}>
              Get instant straight-line route previews. Confirm and jump straight into Apple Maps or Google Maps with zero vendor keys.
            </p>
          </div>
          <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", padding: "28px", borderRadius: "14px" }}>
            <div style={{ fontSize: "24px", marginBottom: "16px" }}>🛡️</div>
            <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "18px", fontWeight: 600, marginBottom: "10px" }}>Turnstile & Device ID Verification</h3>
            <p style={{ color: "#9ca3af", lineHeight: 1.5, fontSize: "13.5px" }}>
              Every verification report is backed by security loops, ensuring status flags represent actual driver insights, preventing spam.
            </p>
          </div>
        </div>
      </section>

      {/* Reliability Section */}
      <section style={{ padding: "40px 4% 80px", maxWidth: "900px", margin: "0 auto", textAlign: "center" }}>
        <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "28px", fontWeight: 600, marginBottom: "20px" }}>
          Solving the Highway Charging Dilemma
        </h2>
        <p style={{ color: "#9ca3af", fontSize: "15px", lineHeight: 1.6, marginBottom: "32px" }}>
          As EV adoption in Kerala grows rapidly, charging point reliability has become the ultimate hurdle. While network operators report chargers as online, local drivers often encounter broken plugs, power fluctuations, or ICE cars blocking the stall. EVUndo bypasses system status feeds by empowering EV drivers in Kerala to confirm and report current situations on the ground.
        </p>
      </section>

      {/* Photo Break Section */}
      <section style={{ padding: "0 4% 80px", maxWidth: "1100px", margin: "0 auto" }}>
        <div style={{ position: "relative", borderRadius: "16px", overflow: "hidden", border: "1px solid rgba(255,255,255,0.07)" }}>
          <img
            src="/kerala_ev_charging_station.jpg"
            alt="Kerala EV Charging Station"
            style={{ width: "100%", maxHeight: "480px", objectFit: "cover" }}
          />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(12,13,14,0.9), transparent)" }} />
          <div style={{ position: "absolute", bottom: "30px", left: "30px", right: "30px" }}>
            <span style={{ background: "#C6FF3D", color: "#0c0d0e", padding: "4px 8px", borderRadius: "5px", fontSize: "11px", fontWeight: 600, textTransform: "uppercase" }}>Feature Spotlight</span>
            <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "22px", fontWeight: 600, marginTop: "10px", textShadow: "0 2px 4px rgba(0,0,0,0.8)" }}>Green Corridors of God's Own Country</h3>
          </div>
        </div>
      </section>

      {/* Partners Section */}
      <section style={{ padding: "40px 4% 60px", textAlign: "center", background: "rgba(255,255,255,0.01)", borderTop: "1px solid rgba(255,255,255,0.03)" }}>
        <div style={{ maxWidth: "900px", margin: "0 auto" }}>
          <h3 style={{ fontSize: "13px", letterSpacing: "1px", textTransform: "uppercase", color: "#6b7280", marginBottom: "30px" }}>
            Supported Networks via Crowd-Verification
          </h3>
          <div style={{ display: "flex", gap: "40px", justifyContent: "center", alignItems: "center", flexWrap: "wrap", opacity: 0.7 }}>
            <span style={{ fontWeight: 600, fontSize: "16px" }}>KSEB Soura</span>
            <span style={{ fontWeight: 600, fontSize: "16px" }}>ChargeMOD</span>
            <span style={{ fontWeight: 600, fontSize: "16px" }}>Zeon Charging</span>
            <span style={{ fontWeight: 600, fontSize: "16px" }}>Tata Power EZ</span>
            <span style={{ fontWeight: 600, fontSize: "16px" }}>goEC</span>
          </div>
        </div>
      </section>

      {/* Insights Section */}
      <section style={{ padding: "80px 4%", maxWidth: "1000px", margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "40px", alignItems: "center" }}>
          <div>
            <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "28px", fontWeight: 600, marginBottom: "20px" }}>
              High-Density Corridor Analytics
            </h2>
            <p style={{ color: "#9ca3af", fontSize: "14px", lineHeight: 1.6, marginBottom: "16px" }}>
              Our platform continuously monitors pin density to highlight under-served routes in Kerala. 
            </p>
            <p style={{ color: "#9ca3af", fontSize: "14px", lineHeight: 1.6 }}>
              Whether you are driving down MC Road, navigating high-range routes in Idukki, or cruising NH 66, EVUndo alerts you of charging deserts, helping you plan stops precisely where functional chargers exist.
            </p>
          </div>
          <div style={{ background: "rgba(182, 163, 255, 0.03)", border: "1px solid rgba(182, 163, 255, 0.1)", borderRadius: "14px", padding: "30px" }}>
            <h4 style={{ color: "#B6A3FF", textTransform: "uppercase", fontSize: "11px", letterSpacing: "1px", marginBottom: "8px" }}>Top Active Highways</h4>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
              <span>NH 66 (Panvel - Kanyakumari)</span>
              <span style={{ color: "#C6FF3D", fontWeight: 600 }}>Active Mapping</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
              <span>MC Road (SH 1)</span>
              <span style={{ color: "#C6FF3D", fontWeight: 600 }}>Verified Status</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0" }}>
              <span>Kochi-Dhanushkodi Highway (NH 85)</span>
              <span style={{ color: "#B6A3FF", fontWeight: 600 }}>Nudge Active</span>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section style={{ padding: "60px 4% 80px", maxWidth: "800px", margin: "0 auto" }}>
        <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "28px", fontWeight: 600, textAlign: "center", marginBottom: "40px" }}>
          Frequently Asked Questions
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "20px" }}>
            <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "8px" }}>How does EVUndo verify station status?</h3>
            <p style={{ color: "#9ca3af", fontSize: "13.5px", lineHeight: 1.5 }}>
              EVUndo relies on user check-ins. Whenever you visit a charging site, you can Confirm or Dispute its status preset. The system uses a Cloudflare Turnstile challenge and device tracking header logic to prevent fake feedback.
            </p>
          </div>
          <div style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "20px" }}>
            <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "8px" }}>Can I add a missing charger?</h3>
            <p style={{ color: "#9ca3af", fontSize: "13.5px", lineHeight: 1.5 }}>
              Yes! Click the "+" button floating at the bottom right corner of the map or click "Add Station" on the low-density banner. This will bring up the submission form pre-filled with your current map center.
            </p>
          </div>
          <div style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "20px" }}>
            <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "8px" }}>Is EVUndo affiliated with network operators?</h3>
            <p style={{ color: "#9ca3af", fontSize: "13.5px", lineHeight: 1.5 }}>
              No. We are entirely independent and community-driven. This allows us to provide honest, unfiltered status verifications without corporate biases.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section style={{ padding: "80px 4% 100px", textAlign: "center", background: "radial-gradient(circle at center, rgba(198, 255, 61, 0.03), transparent 70%)" }}>
        <div style={{ maxWidth: "600px", margin: "0 auto" }}>
          <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "32px", fontWeight: 600, marginBottom: "16px" }}>
            Ready to Travel God's Own Country?
          </h2>
          <p style={{ color: "#9ca3af", fontSize: "15px", lineHeight: 1.6, marginBottom: "32px" }}>
            Explore Kerala's most accurate charging status registry. Report broken infrastructure, confirm operational chargers, and drive with total confidence.
          </p>
          <Link href="/" style={{
            background: "#C6FF3D",
            color: "#0c0d0e",
            padding: "14px 32px",
            borderRadius: "10px",
            textDecoration: "none",
            fontSize: "14px",
            fontWeight: 700,
            boxShadow: "0 4px 20px rgba(198, 255, 61, 0.3)",
            display: "inline-block"
          }}>
            Explore Live Map Now
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ textAlign: "center", padding: "40px 4%", borderTop: "1px solid rgba(255,255,255,0.05)", color: "#6b7280", fontSize: "12px" }}>
        <p>&copy; {new Date().getFullYear()} EVUndo. All rights reserved.</p>
        <p style={{ marginTop: "8px" }}>Ensuring charging transparency for Kerala's EV community.</p>
      </footer>
    </div>
  );
}
