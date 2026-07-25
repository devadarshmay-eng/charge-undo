# ChargeUndo

ChargeUndo is a community-driven, real-time crowdsourced EV charging status registry and map application designed specifically for electric vehicle owners and travelers in Kerala, India.

---

## The Problem: Kerala's EV Charging Pain Points

While electric vehicle adoption in Kerala is growing exponentially, EV drivers face critical infrastructure challenges on the road:
- **Unreliable Status Reporting:** Network status feeds from various charging providers (KSEB, ChargeMOD, Zeon, etc.) are frequently out-of-sync with the physical state of the chargers. A charger marked "online" in a provider's app may be blocked by internal system errors, power cuts, or physical access issues.
- **KSEB Downtime & Grid Fluctuations:** Public KSEB (Kerala State Electricity Board) chargers are critical for highway travel, but suffer from grid downtime, transformer repairs, or lack of on-site service support.
- **Connector Mismatches:** Incorrect listings of charger types (e.g., CCS2 vs. Type 2 or CHAdeMO) lead to drivers arriving at high-speed ports only to find they cannot physically plug in their vehicle.
- **Rural and Highway Coverage Gaps:** Major routes like NH 66, MC Road, and high-range bypasses through Idukki and Wayanad have sparse charger density, where a single broken plug can leave a driver stranded.

---

## How it Works: Crowd Verification, Quorums, and Trust Scores

To solve status unreliability without depending on official operator APIs, ChargeUndo uses a decentralized, secure crowd verification loop:
1. **Real-time Report Submissions:** Drivers check in at physical charging spots. If they find an issue (e.g., the charger is broken, occupied, or missing), they submit a status preset report.
2. **Turnstile Security & Device Matching:** Submissions require a secure Cloudflare Turnstile token validation and attach a persistent `x-device-id` header generated on the client. This prevents automated spam and script attacks.
3. **Quorum Verification System:**
   - A new user report marks a station status as `unconfirmed`.
   - Other users visiting the station click **Confirm Report** or **Dispute / Flag**.
   - Multiple matching confirmations lock the status as verified (e.g., `available`, `busy`, or `broken`).
   - Conflicting disputes trigger a `disputed` state, prompting other drivers to verify the correct status.
4. **Trust-Score Adjustments:** Device submissions are tracked. Users with historically accurate reports (submitting reports that achieve quorum) gain a higher trust score, increasing the weight of their confirmations, whereas accounts repeatedly flagged for fraudulent disputes have their reports deprecated.

---

## Deliberately Out of Scope (and Why)

To keep the platform lightweight, fast, and secure, the following features are explicitly out of scope:
- **No Blockchain / Tokenomics:** We do not use web3 tokens or blockchain ledgers. Traditional web databases are faster, consume negligible energy, do not require gas fees, and keep the user experience simple.
- **No AI / LLMs:** There is no AI model running behind verification. Deciding if a charger works is a binary physical truth best checked by a human driver, not guessed by a language model.
- **No Station-Owner Notification Without Consent:** We do not automatically alert station owners when their charger is reported broken. This avoids spamming business owners with false flags and protects community-driven data.
- **No Phone Verification:** Accounts are identified seamlessly using device headers instead of SMS OTP checks. This eliminates friction for travelers in low-network regions who cannot receive text messages, and keeps the project free of third-party SMS gateway fees.

---

## Data Sources & Precision Note

- **Source Material:** Initial station listings were compiled from open datasets, crowd directories, and public utility maps.
- **Honest Precision Warning:** **29 town-level accuracy stations** in the dataset reflect estimated town-center coordinates rather than precise GPS coordinates. These stations are visually indicated on the map so users can help pin their exact locations by submitting coordinate updates on-site.

---

## Setup & Run Instructions

### Prerequisites
- Node.js (v18+)
- PostgreSQL Database

### Installation
1. Clone the repository and install dependencies:
   ```bash
   npm install
   ```
2. Set up the environment variables (see below).
3. Run migrations to initialize the database:
   ```bash
   npm run db:generate
   ```
4. Seed the database with initial Kerala charging stations:
   ```bash
   npm run db:seed
   ```
5. Launch the development server:
   ```bash
   npm run dev
   ```

---

## Environment Variables Needed

Create a `.env` file in the root directory and add the following keys:
```env
# Database Configuration
DATABASE_URL="postgresql://user:password@localhost:5432/chargeundo"

# Public ImageKit Configuration (Unsigned Client-Side Upload)
NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY="your_imagekit_public_key"
NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT="https://ik.imagekit.io/your_endpoint_id/"
```

---

## Target Audience Note

In this version, **the public live map itself is the core value** for all visitors, including government planning bodies and station operators. Rather than viewing a secondary admin dashboard, government agencies and station owners use the live map to observe real-time community uptime metrics, view crowd-reported breakdowns, and identify under-served density corridors across Kerala.
