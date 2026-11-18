# Campus Stores

> **Campus Stores** is a redesigned, premium SaaS-style operational dashboard for campus media equipment desks. It manages student club bookings, multi-item checkout, equipment condition tracking, partial returns, overdue equipment tracking, and thoughtful next-shift handovers. Built as an interactive product engineering exercise for the Virinchi Healthcare Product Engineer assessment.

---

## 🚀 Live Production & Localhost URLs

- **Live Vercel Production Deployment**:
  👉 **[https://campus-stores-main.vercel.app](https://campus-stores-main.vercel.app)**
- **Localhost Development Server**:
  👉 **[http://localhost:8000](http://localhost:8000)** (or `http://127.0.0.1:8000`)
- **Vercel Dashboard & Deployment Logs**:
  👉 [https://vercel.com/arjuns-team/campus-stores-main](https://vercel.com/arjuns-team/campus-stores-main)

To start or restart the local HTTP server at any time:
```sh
python3 -m http.server 8000 --bind 127.0.0.1
```

---

## 1. Product Overview

Campus Stores elevates a basic counter tracking slip into a production-grade operational desk experience. Designed around real-world counter dynamics, the application recognizes that shifts are chaotic, items come back piecemeal, and crucial context is routinely lost between shift handovers. 

Campus Stores introduces:
- A live **Smart Overview Dashboard** with visual availability metrics and empirical sample insights.
- An **Intelligent Equipment Register** featuring instant search, categorical filtering, equipment condition tracking, and asset detail drawers.
- A **Smart Multi-Step Checkout Flow** that supports multi-item checkout while preventing double-booking and invalid allocations.
- An **Equipment Condition Tracking System** that categorizes items as *Good*, *Needs Maintenance*, *Damaged*, or *Under Repair*, locking damaged/repair items from future checkouts and recording detailed condition change history.
- A resilient **Partial Return Management System** that allows partial equipment returns while preserving checkout records, borrower accountability, and open slips.
- A signature **Shift Handover Workspace** with an automated status roll-up (equipment condition alerts, overdue gear, still out, pending reservations, actionable next steps) and an operator handover log.
- A unified **Activity Timeline** providing end-to-end accountability across the entire operational lifecycle.

---

## 2. Main Features

### 🌟 Feature 1: Smart Overview Dashboard
- **Calculated Metric Cards**: 
  - *Total Equipment* (all inventory)
  - *Available Now* (not on loan and not in repair/damaged)
  - *On Loan* (active checkouts)
  - *Pending Returns* (total unreturned slips)
  - *Overdue* (unreturned slips past phase deadlines)
  - *Approved Requests* (registered club event reservations)
- **Visual Equipment Availability Overview**: Real-time status progress indicators across every asset (emerald for available, amber for on loan, rose for overdue, neutral for repair/damaged).
- **Product Insight**: Calculates actual item frequency across approved bookings and flags persistent operational anomalies (e.g., Debate Union's overnight microphone retention).

### 🔍 Feature 2: Intelligent Equipment Register
- Comprehensive registry showing Asset ID, type, model, bin location, condition, category, and real-time availability.
- **Search & Filter**: Instant search across ID, type, model, condition, and active borrower names, accompanied by fast status filter pills (*All*, *Available*, *On Loan*, *In Repair*) and condition filter pills (*All*, *Good*, *Needs Maintenance*, *Damaged*, *Under Repair*).
- **Detail View & Condition Update**: Expandable drawer revealing condition inspection history, assigned borrower, slip number, return due date, and direct condition editing with custom reason logging.

### 🛡️ Feature 3: Equipment Condition Tracking & Safety Guardrails
- **4 Standardized Condition Statuses**:
  - `Good` (Active and ready for issue)
  - `Needs Maintenance` (Functional but flagged for routine maintenance)
  - `Damaged` (Broken or impaired; locked from checkout)
  - `Under Repair` (Currently in workshop diagnostics; locked from checkout)
- **Check-in Condition Inspection**: During checkout returns, operators can inspect equipment condition, update its status, and record assessment notes.
- **Automated Checkout Lockout**: Any item marked as *Damaged* or *Under Repair* is immediately disabled from selection and rejected during checkout.

### ⚡ Feature 4: Smart Checkout Experience
- Structured 4-step wizard:
  1. **Select Borrower**: Choose student/club representative with optional notes.
  2. **Select Equipment**: Multi-item selection with disabled states for unavailable or damaged assets and instant condition badges.
  3. **Return Schedule & Request Linking**: Select due date/time and link to approved club forms.
  4. **Confirmation**: Complete pre-checkout review and multi-slip issuance with toast confirmation.
- **Strict Guardrails**: Prevents checking out equipment that is in repair, damaged, or already out on loan.

### 🔄 Feature 5: Partial Return Management (Critical Assignment Scenario)
- Loans are organized by Borrower and Linked Request.
- **Per-Item Return Slips**: Clubs can return select items (e.g., projector and speaker) while retaining others (e.g., adapter).
- Automatically marks returned items as available immediately, updates remaining items to a distinct "Partially Returned" state, and preserves the open loan on remaining items without prematurely completing the booking.
- Inline inspection dialog captures condition changes upon counter return.

### 🤝 Feature 6: Shift Handover (Signature Feature)
- Dedicated handover workspace automatically aggregating:
  - **Equipment Condition Alerts**: Highlights units marked Damaged or Under Repair.
  - **Overdue Items**: Highlighting items that missed return windows.
  - **Still Out**: Clear tracking of pending gear and borrowers.
  - **Incoming Operator Action Items**: Automatically synthesized checklist for the incoming operator.
- **Handover Log**: Lets current operators attach qualitative notes to the shift log.

### ⏱️ Feature 7: Activity Timeline
- Chronological, color-coded audit log capturing:
  - Equipment checkouts (teal)
  - Partial & full returns (emerald)
  - Condition status updates (lavender)
  - Operator handover notes (amber)
  - Desk messages & system events (slate)

### 🎨 Feature 8: Modern Design & User Experience
- Built on a modern SaaS aesthetic: Space Grotesk headings, Inter body, soft background, deep black header/sidebar, subtle glowing accents, and non-intrusive particle background.
- Responsive layout adapting from a desktop sidebar navigation to a touch-friendly mobile bar via container queries.
- Inline confirmations, non-blocking toast notifications (auto-dismissing after 4s), and zero fake loading spinners.

---

## 3. Product Engineering Decisions

### Decision 1: Per-Asset Slip Architecture vs. Monolithic Reservation Checkout
- **Problem**: In conventional systems, a reservation or booking is treated as a single entity. When Kabir returns only 2 of 3 items, updating the record either closes the entire booking prematurely or requires confusing status flags.
- **Solution**: Campus Stores maintains atomic loan slips (`L-401`, `L-402`, etc.) bound to individual asset IDs, grouped dynamically by request and borrower. This ensures partial returns alter only the individual slip's lifecycle while keeping the parent group accurately labeled as "Partially Returned".

### Decision 2: Automated Handover Rollup vs. Free-Text Logbooks
- **Problem**: Conventional handover relies on operators manually writing notes. Under shift-change time pressure, critical details (like an unreturned adapter or an overnight microphone) get overlooked.
- **Solution**: The Handover section automatically aggregates open slips, overdue gear, and uncollected reservations into an actionable checklist, using the text field only for subjective context.

### Decision 3: Zero-Dependency Architecture with Native Browser Capabilities
- **Problem**: Heavy frontend frameworks introduce bundle overhead, build tooling complexity, and potential breakage in isolated environments.
- **Solution**: Campus Stores is built purely with vanilla JavaScript (ES2020), modular CSS with custom properties and CSS container queries (`@container`), and native inline SVGs. It runs offline immediately upon opening `index.html`.

---

## 4. What Was Retained from the Original Application

1. **Candidate Brief**: Completely preserved within the interactive `<details>` header dropdown.
2. **Original Shift Progression**: Preserved the 3-phase narrative timeline (Friday 3:45 pm → Friday 7:30 pm → Saturday 9:00 am).
3. **Core Data Records**: Retained the 8 original assets, 3 student club requests, 5 students/club owners, and the starting pre-loan (Tara Shah's microphone `MI-09` on `L-401`).
4. **Standalone Portability & LocalStorage**: Retained local persistence, full offline support, and the safe "Restart sample shift" action.

---

## 5. What Was Improved & Why

| Area | Original Application | Campus Stores (v2) | Why it Matters |
|---|---|---|---|
| **Overview** | None; landed directly on request list | Dedicated KPI dashboard with availability bars & insights | Immediate situational awareness at the start of a shift |
| **Asset Register** | Basic list; limited status indicator | Search, category filters, condition filters, detail drawer | Rapid item lookup when borrowers arrive at the desk |
| **Condition Tracking** | Not tracked | 4 condition states, return inspection, condition history | Prevents dispatching damaged equipment to student clubs |
| **Checkout** | Single-item creation form | 4-step wizard supporting multi-item selection & lockout | Matches real desk operations while preventing bad checkouts |
| **Partial Returns** | Individual list of slips | Grouped by borrower with inline return inspection | Eliminates confusion about which club still owes gear |
| **Handover** | Free-text note input | Auto-generated shift status + condition alerts + action items | Prevents misplaced gear across shift handovers |
| **Auditability** | Static messages | Live, chronological Activity Timeline | Complete accountability of all shift events |

---

## 6. How the Partial-Return Workflow Works

```
[Friday 3:45 pm]
Kabir Sen collects Film Society Kit (RQ-214):
  ├── L-402: PR-04 (HDMI Projector)  ──> Status: OUT
  ├── L-403: SP-02 (Portable Speaker) ──> Status: OUT
  └── L-404: AD-12 (USB-C Adapter)   ──> Status: OUT
Group Status: OUTSTANDING

[Friday 7:30 pm]
Kabir returns Projector & Speaker; Leela retains Adapter:
  ├── L-402: PR-04  ──> [Record Return & Inspect] ──> Status: RETURNED (Condition: Good)
  ├── L-403: SP-02  ──> [Record Return & Inspect] ──> Status: RETURNED (Condition: Good)
  └── L-404: AD-12  ──> REMAINS OUT              ──> Status: OUT (Borrower: Kabir Sen / Leela Das)
Group Status: PARTIALLY RETURNED
Handover Summary: Automatically alerts next shift that AD-12 is outstanding!

[Saturday 9:00 am]
Leela Das returns Adapter:
  └── L-404: AD-12  ──> [Record Return & Inspect] ──> Status: RETURNED (Booking fully closed)
Group Status: ALL RETURNED
```

---

## 7. How to Run the Application

### Option A: Local HTTP Server (Recommended)
Run a lightweight local server from the repository root:
```sh
python3 -m http.server 8000 --bind 127.0.0.1
```
Then navigate to: **[http://localhost:8000](http://localhost:8000)**

### Option B: Direct Browser Opening
Open `index.html` directly in any modern web browser:
```sh
open index.html
```

---

## 8. Limitations & Possible Future Improvements

### Current Limitations
1. **Fictional Shift Stepper**: Shift progression is stepped via the sample scenario control (`phase 0 → 1 → 2`) rather than real system time.
2. **Local Storage Bound**: State is tied to browser `localStorage` on a single client device.
3. **Single Active Loan per Asset**: Assumes unique, serialized assets (bulk consumables like gaffer tape or AA batteries are not modeled).

### Future Improvements
- **Barcode / QR Scanner Integration**: Support quick asset check-in and check-out via camera or USB handheld scanner.
- **Multi-Operator Profiles**: Authentication allowing distinct operator logins with signed shift-end signoffs.
- **Automated Borrower SMS / Email Reminders**: Webhook triggers sending overdue return reminders directly to student clubs.
- **Damage Inspection Media**: Photo attachment capability during returns to document equipment wear and tear.

---

*Campus Stores media equipment desk work sample.*
