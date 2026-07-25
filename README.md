# Case Study: ChargeUndo

### Crowdsourcing EV Reliability Across Kerala

---

## The Problem: Fragmented, Out-of-Sync EV Infrastructure
Kerala has seen an exponential rise in electric vehicle adoption. However, drivers navigating the state’s highways (like NH 66 and MC Road) and high-range terrains (Wayanad, Idukki) face a stressful reality: public charging status data is fragmented and unreliable. 

Official utility apps (like KSEB's charging portal or private network applications) are frequently out of sync with physical reality. A charger marked "online" on an official feed might suffer from unannounced KSEB grid downtime, transformer failures, or physical access closures. Compounding this, incorrect connector listings (e.g., mismatching CCS2 and Type 2 ports) and critical highway coverage gaps mean that a single out-of-service plug can leave a family stranded. 

## The Approach: Decentralized Crowd-Verified Status
ChargeUndo bypasses centralized, slow-to-update operator APIs. Instead, it places verification in the hands of the drivers themselves. 

The application establishes a decentralized trust network:
1. **Real-time Presets:** Drivers check in at physical charging hubs to submit simple status reports (available, busy, broken, or missing).
2. **Turnstile & Device Safeguards:** Every report is protected by Cloudflare Turnstile token validation and client-side device header matching, blocking scripted manipulation or bot spam.
3. **Quorum Consensus:** A single driver's flag flags the station as `unconfirmed`. It requires subsequent drivers to click **Confirm** or **Dispute** to establish a quorum.
4. **Weighted Trust Scores:** Reports are weighted dynamically based on a driver’s historical reporting accuracy, ensuring high-integrity consensus without gatekeeping.

The live map acts as a shared, transparent mirror of actual utility health, allowing both daily drivers and planning bodies to trace real-time community uptime metrics and identify high-need charging corridors.

## Considered Decisions (Deliberately Out of Scope)
A key part of building ChargeUndo was deciding what *not* to build. These choices were deliberate design decisions aimed at maximizing speed, usability, and data integrity:
- **No Blockchain or Tokenomics:** Incentivizing reports with web3 tokens or crypto assets introduces financial speculation, high transaction latencies, and unnecessary gas fees. A fast, relational server is cleaner, faster, and highly energy-efficient.
- **No AI Guesswork:** We do not employ language models or predictive AI to guess whether a charger is operational. Determining if a plug delivers current is a physical, binary truth that only a human driver on the ground can verify.
- **No Automatic Owner Alerts:** We do not automatically notify station operators when their chargers are flagged. This prevents bad-faith spamming of small business owners and ensures that ChargeUndo remains a dedicated community resource first.

## Data Sources & The Precision Caveat
ChargeUndo compiles its baseline directory from open-source maps, crowd directories, and public utility listings. 

However, complete transparency is central to the project: **29 town-level accuracy stations** in the initial dataset reflect estimated town-center coordinates rather than exact geographical coordinates. These stations are highlighted on the map with custom UI alerts, prompting drivers to physically pin their precise GPS locations when visiting.

---

### Developed by [Devadarsh Anoop](https://devadarsh.pages.dev)
