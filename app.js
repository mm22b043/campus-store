(() => {
  "use strict";
  /* =====================================================
     Campus Stores · ShiftFlow — app.js
     Equipment Condition Tracking Architecture
     Statuses: Good | Damaged | Needs Maintenance | Under Repair
     ===================================================== */

  const STORAGE_KEY = "campus-stores.shiftflow.v2";
  const root = document.getElementById("campus-stores");
  const q = (sel) => root.querySelector(sel);

  /* =====================================================
     STATIC ASSETS & SCENARIO DATA
     ===================================================== */

  const initialAssets = [
    { id: "PR-04", type: "HDMI projector",       model: "BenQ MH550",    bin: "A2",       category: "Projection",    condition: "Good" },
    { id: "PR-06", type: "HDMI projector",       model: "Epson EB-X49",  bin: "Workshop", category: "Projection",    condition: "Under Repair" },
    { id: "SP-02", type: "Portable speaker",     model: "JBL Eon One",   bin: "B1",       category: "Audio",         condition: "Good" },
    { id: "SP-05", type: "Portable speaker",     model: "Bose S1",       bin: "B2",       category: "Audio",         condition: "Good" },
    { id: "AD-12", type: "USB-C \u2192 HDMI adapter", model: "Belkin AVC002", bin: "C4", category: "Connectivity",  condition: "Good" },
    { id: "AD-15", type: "USB-C \u2192 HDMI adapter", model: "Anker A8312",   bin: "C4", category: "Connectivity",  condition: "Good" },
    { id: "MI-09", type: "Wireless microphone",  model: "Shure BLX",     bin: "B3",       category: "Audio",         condition: "Good" },
    { id: "CA-03", type: "Digital camera",       model: "Sony A6400",    bin: "D2",       category: "Photography",   condition: "Good" },
  ];

  const requests = [
    {
      id: "RQ-214",
      club: "Film Society",
      event: "Courtyard screening",
      owner: "Isha Rao",
      due: "Fri 8 pm",
      items: ["HDMI projector", "Portable speaker", "USB-C \u2192 HDMI adapter"],
      note: "Playback is from a USB-C-only laptop. The host will collect at 4 pm.",
    },
    {
      id: "RQ-209",
      club: "Debate Union",
      event: "Finals rehearsal",
      owner: "Tara Shah",
      due: "Sat 10 am",
      items: ["Wireless microphone"],
      note: "Rehearsal runs into the evening.",
    },
    {
      id: "RQ-217",
      club: "Photo Circle",
      event: "Street portrait walk",
      owner: "Dev Menon",
      due: "Sat noon",
      items: ["Digital camera"],
      note: "Collection on Saturday morning.",
    },
  ];

  const people = ["Isha Rao", "Kabir Sen", "Leela Das", "Tara Shah", "Dev Menon"];

  const shifts = [
    {
      time: "Friday \u00b7 3:45 pm",
      title: "Pickup at the counter",
      text: "Kabir is here for the Film Society screening. The film starts at four. Can he leave with everything he needs?",
      next: "Move to return time",
    },
    {
      time: "Friday \u00b7 7:30 pm",
      title: "The kit comes back in pieces",
      text: "Kabir has brought back the projector and speaker. \u201cLeela still has the adapter. She\u2019ll drop it off tomorrow at nine.\u201d Take the return and hand over to the morning shift.",
      next: "Move to next morning",
    },
    {
      time: "Saturday \u00b7 9:00 am",
      title: "Morning shift",
      text: "You\u2019ve just taken over. Leela walks in with an adapter. Work out what was outstanding from the screening and close the loan for the right item.",
      next: null,
    },
  ];

  const dueOptions = ["Fri 8 pm", "Sat 9 am", "Sat 10 am", "Sat noon"];
  const phaseOverdueCutoffs = { "Fri 8 pm": 1 };

  const seedMessages = [
    { phase: 0, ts: "Fri 3:45 pm", author: "System",      text: "Shift started. Tara Shah (Debate Union) has MI-09 on slip L-401, due Sat 10 am." },
    { phase: 0, ts: "Fri 3:50 pm", author: "Isha Rao",    text: "Film Society has three items on request RQ-214. Kabir will collect at 4 pm." },
    { phase: 1, ts: "Fri 7:30 pm", author: "System",      text: "Kabir Sen returned projector and speaker. Adapter AD-12 still with Leela Das." },
    { phase: 1, ts: "Fri 7:35 pm", author: "Isha Rao",    text: "Handover note: MI-09 overnight kept by Tara \u2013 mic is locked in rehearsal room. AD-12 to come Saturday." },
    { phase: 2, ts: "Sat 9:00 am", author: "System",      text: "Morning shift started. CA-03 not yet collected by Photo Circle (Dev Menon, RQ-217)." },
  ];

  /* Condition status definitions */
  const VALID_CONDITIONS = ["Good", "Damaged", "Needs Maintenance", "Under Repair"];

  /* Navigation pages */
  const pages = [
    ["Dashboard",      "layout-dashboard"],
    ["Equipment",      "package"],
    ["Reservations",   "calendar"],
    ["Checkouts",      "arrow-right-circle"],
    ["Returns",        "rotate-ccw"],
    ["Activity",       "activity"],
    ["Shift Handover", "messages-square"],
  ];

  /* =====================================================
     STATE INITIALIZATION
     ===================================================== */

  const initialConditions = () => ({
    "PR-04": "Good",
    "PR-06": "Under Repair",
    "SP-02": "Good",
    "SP-05": "Good",
    "AD-12": "Good",
    "AD-15": "Good",
    "MI-09": "Good",
    "CA-03": "Good",
  });

  const initialConditionHistory = () => ([
    {
      assetId: "PR-06",
      prevCondition: "Good",
      newCondition: "Under Repair",
      timestamp: "Fri 10:00 am",
      reason: "Lamp warning indicator flashing; moved to workshop for diagnostics",
    }
  ]);

  const original = () => ({
    version: 2,
    tab: "Dashboard",
    phase: 0,
    selected: "",           // selected asset ID in equipment view
    filter: "All",          // availability filter tab: All | Available | On Loan | Inactive
    condFilter: "All",      // condition filter: All | Good | Damaged | Needs Maintenance | Under Repair
    search: "",             // equipment search
    equipmentConditions: initialConditions(),
    conditionHistory: initialConditionHistory(),
    loans: [
      { num: 401, req: "RQ-209", asset: "MI-09", who: "Tara Shah", due: "Sat 10 am", back: false },
    ],
    notes: [],               // { phase, text }
    editing: false,
    onlyOpen: true,          // returns filter
    notice: "ShiftFlow Initialized \u00b7 Operational records loaded.",
    activityLog: [],         // { ts, type, text }
    checkoutDraft: null,     // { step, who, note, assets, due, req }
    confirmingReturn: null,  // { num, condition, reason }
    editingCondition: null,  // assetId being edited directly
    confirmRestart: false,
  });

  let s = original();

  /* =====================================================
     DYNAMIC ASSETS & HEALTH CHECKS
     ===================================================== */

  const getCondition = (assetId) => s.equipmentConditions[assetId] || "Good";

  const isConditionBlocked = (assetId) => {
    const c = getCondition(assetId);
    return c === "Damaged" || c === "Under Repair";
  };

  const getAsset = (id) => {
    const base = initialAssets.find((a) => a.id === id);
    if (!base) return null;
    const cond = getCondition(id);
    return {
      ...base,
      condition: cond,
      repair: isConditionBlocked(id),
    };
  };

  const getAssets = () => initialAssets.map((a) => getAsset(a.id));
  const getReq = (id) => requests.find((r) => r.id === id);
  const activeLoan = (id) => s.loans.find((l) => l.asset === id && !l.back);

  const esc = (x) =>
    String(x).replace(/[&<>"']/g, (c) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
    })[c]);

  const icon = (id, cls = "") =>
    `<svg aria-hidden="true" class="store-icon${cls ? " " + cls : ""}"><use href="#icon-${esc(id)}"></use></svg>`;

  const badge = (text, variant = "neutral") =>
    `<span class="badge badge-${esc(variant)}">${esc(text)}</span>`;

  const conditionBadge = (cond) => {
    switch (cond) {
      case "Good":
        return `<span class="badge badge-success"><span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:#10B981;margin-right:4px;"></span>Good</span>`;
      case "Needs Maintenance":
        return `<span class="badge badge-warn"><span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:#F59E0B;margin-right:4px;"></span>Needs Maint</span>`;
      case "Damaged":
        return `<span class="badge badge-danger"><span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:#EF4444;margin-right:4px;"></span>Damaged</span>`;
      case "Under Repair":
        return `<span class="badge badge-danger" style="background:#FEE2E2;color:#991B1B;"><span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:#991B1B;margin-right:4px;"></span>Under Repair</span>`;
      default:
        return badge(cond, "neutral");
    }
  };

  const btn = (label, action, val = "", cls = "") =>
    `<button type="button" data-action="${esc(action)}" data-val="${esc(val)}" class="${esc(cls)}">${esc(label)}</button>`;

  const opts = (list) =>
    list.map(([v, t]) => `<option value="${esc(v)}">${esc(t)}</option>`).join("");

  const isOverdue = (loan) => {
    if (loan.back) return false;
    const cutoff = phaseOverdueCutoffs[loan.due];
    return cutoff !== undefined && s.phase >= cutoff + 1;
  };

  const assetStatus = (asset) => {
    if (isConditionBlocked(asset.id)) {
      return { label: asset.condition === "Under Repair" ? "Under Repair" : "Damaged", variant: "danger" };
    }
    const loan = activeLoan(asset.id);
    if (loan) {
      if (isOverdue(loan)) return { label: "Overdue", variant: "danger" };
      return { label: "On Loan", variant: "warn" };
    }
    return { label: "Available", variant: "success" };
  };

  const phaseTs = (phase) => shifts[phase] ? shifts[phase].time : "?";

  const nextNum = () =>
    s.loans.length ? Math.max(...s.loans.map((l) => l.num)) + 1 : 402;

  /* =====================================================
     CONDITION STATE MANAGER
     ===================================================== */

  function setEquipmentCondition(assetId, newCondition, reason = "Routine counter update") {
    if (!VALID_CONDITIONS.includes(newCondition)) return;
    const prevCondition = getCondition(assetId);
    if (prevCondition === newCondition) return;

    s.equipmentConditions[assetId] = newCondition;
    const record = {
      assetId,
      prevCondition,
      newCondition,
      timestamp: phaseTs(s.phase),
      reason: reason || "Condition revised by operator",
    };
    s.conditionHistory.unshift(record);

    // Audit log
    s.activityLog.push({
      ts: phaseTs(s.phase),
      type: newCondition === "Good" ? "return" : "note",
      text: `Condition update on ${assetId}: changed from ${prevCondition} to ${newCondition}. Reason: ${record.reason}`,
    });

    if (newCondition === "Damaged" || newCondition === "Under Repair") {
      showToast(`${assetId} flagged as ${newCondition} — locked from checkout`, "warning");
    } else {
      showToast(`${assetId} condition updated to ${newCondition}`, "success");
    }
  }

  /* =====================================================
     TOAST NOTIFICATIONS
     ===================================================== */

  const toastContainer = document.getElementById("toast-container");
  const toastIcons = {
    success: "check-circle",
    error:   "alert-triangle",
    warning: "alert-triangle",
    info:    "clock",
  };

  function showToast(message, type = "info") {
    if (!toastContainer) return;
    const el = document.createElement("div");
    el.className = `toast toast-${type}`;
    el.innerHTML =
      icon(toastIcons[type] || "clock") +
      `<span class="toast-body">${esc(message)}</span>` +
      `<button class="toast-close" aria-label="Dismiss">&times;</button>`;
    toastContainer.appendChild(el);

    const dismiss = () => {
      el.style.opacity = "0";
      el.style.transform = "translateX(40px)";
      setTimeout(() => el.remove(), 250);
    };
    el.querySelector(".toast-close").addEventListener("click", dismiss);
    setTimeout(dismiss, 4200);

    while (toastContainer.children.length > 3) {
      toastContainer.firstChild.remove();
    }
  }

  /* =====================================================
     ACTIVITY LOG MANAGER
     ===================================================== */

  function seedActivityLog() {
    s.activityLog = [];
    for (const m of seedMessages) {
      if (m.phase <= s.phase) {
        s.activityLog.push({ ts: m.ts, type: "system", text: `[${m.author}] ${m.text}` });
      }
    }
    for (const l of s.loans) {
      const a = getAsset(l.asset);
      s.activityLog.push({
        ts: phaseTs(0),
        type: "checkout",
        text: `Issued ${a ? a.type : l.asset} (${l.asset}) to ${l.who} · slip L-${l.num}`,
      });
    }
  }

  function logCheckout(loan) {
    const a = getAsset(loan.asset);
    s.activityLog.push({
      ts: phaseTs(s.phase),
      type: "checkout",
      text: `Issued ${a ? a.type : loan.asset} (${loan.asset}) to ${loan.who} · slip L-${loan.num}`,
    });
  }

  function logReturn(loan) {
    const a = getAsset(loan.asset);
    s.activityLog.push({
      ts: phaseTs(s.phase),
      type: "return",
      text: `${loan.who} returned ${a ? a.type : loan.asset} (${loan.asset}) · slip L-${loan.num} closed`,
    });
  }

  function logNote(text) {
    s.activityLog.push({ ts: phaseTs(s.phase), type: "note", text });
  }

  /* =====================================================
     1. SECTION: DASHBOARD
     ===================================================== */

  function renderDashboard() {
    const currentAssets = getAssets();
    const totalEq   = currentAssets.length;
    const onLoan    = currentAssets.filter((a) => !isConditionBlocked(a.id) && activeLoan(a.id)).length;
    const available = currentAssets.filter((a) => !isConditionBlocked(a.id) && !activeLoan(a.id)).length;
    const pending   = s.loans.filter((l) => !l.back).length;
    const overdue   = s.loans.filter((l) => !l.back && isOverdue(l)).length;
    const bookings  = requests.length;

    const metricCard = (label, value, iconId, cls = "") =>
      `<div class="metric-card ${cls}">` +
        `<div class="metric-header">` +
          `<span class="metric-label">${esc(label)}</span>` +
          `<span class="metric-icon-wrap">${icon(iconId)}</span>` +
        `</div>` +
        `<div class="metric-value">${esc(String(value))}</div>` +
      `</div>`;

    let html = `
      <div class="dashboard-welcome">
        <div class="welcome-text">
          <h3>Operations Command Center</h3>
          <p>Real-time inventory distribution, active checkout tracking, and equipment condition surveillance.</p>
        </div>
        <div class="welcome-badges">
          <span class="badge badge-info">${icon("clock")} ${esc(shifts[s.phase].time)}</span>
          <span class="badge badge-success">${icon("sparkles")} Shift Online</span>
        </div>
      </div>
    `;

    html += `<div class="metrics-grid">` +
      metricCard("Total Equipment", totalEq, "package") +
      metricCard("Available Now", available, "check-circle", "metric-teal") +
      metricCard("On Loan", onLoan, "arrow-right-circle", onLoan > 0 ? "metric-warn" : "") +
      metricCard("Pending Returns", pending, "rotate-ccw", pending > 0 ? "metric-warn" : "") +
      metricCard("Overdue Slips", overdue, "alert-triangle", overdue > 0 ? "metric-danger" : "") +
      metricCard("Club Bookings", bookings, "calendar") +
    `</div>`;

    /* Equipment Availability Bars */
    html += `
      <div class="sectionhead">
        <div>
          <h2>Real-Time Availability &amp; Condition Spectrum</h2>
          <small>Current state, location, and operational condition of all 8 serialized assets</small>
        </div>
        <button type="button" data-action="tab" data-val="Equipment" class="btn-sm btn-secondary">Open Equipment Directory →</button>
      </div>
    `;

    html += `<div class="avail-list">`;
    for (const a of currentAssets) {
      const st = assetStatus(a);
      const isBlocked = isConditionBlocked(a.id);
      const barClass =
        st.label === "Available" ? "bar-available" :
        st.label === "Overdue"   ? "bar-overdue" :
        isBlocked ? "bar-repair" : "bar-loan";
      const loan = activeLoan(a.id);
      const sub  = loan
        ? `${loan.who} · Due ${loan.due}`
        : (isBlocked ? `${a.condition} — locked from checkout` : `Storage Bin ${a.bin}`);
      html +=
        `<div class="avail-row">` +
          `<span class="asset-id">${esc(a.id)}</span>` +
          `<div>` +
            `<div style="font-size:13px;font-weight:600;color:var(--cs-deep-black);display:flex;align-items:center;gap:8px;">` +
              `<span>${esc(a.type)}</span>` +
              `<span style="font-weight:400;color:var(--cs-slate);font-size:12px">${esc(a.model)}</span>` +
              conditionBadge(a.condition) +
            `</div>` +
            `<div class="avail-bar-wrap">` +
              `<div class="avail-bar ${barClass}" style="width:100%"></div>` +
            `</div>` +
            `<div style="font-size:11px;color:var(--cs-slate);margin-top:4px">${esc(sub)}</div>` +
          `</div>` +
          `<div>${badge(st.label, st.variant)}</div>` +
        `</div>`;
    }
    html += `</div>`;

    /* Product Insight */
    const typeCounts = {};
    for (const r of requests) {
      for (const item of r.items) {
        typeCounts[item] = (typeCounts[item] || 0) + 1;
      }
    }
    const topTypes = Object.entries(typeCounts).sort((a, b) => b[1] - a[1]);
    const maxCount = topTypes[0]?.[1] || 1;

    html += `
      <div class="insight-card">
        <h3>${icon("sparkles")} Empirical Shift Intelligence <small style="color:var(--cs-slate);font-weight:400">· Computed from active requests</small></h3>
        <div style="margin-bottom:12px;font-size:13px;color:var(--cs-slate)">Most frequently booked equipment types across approved club schedules:</div>
    `;
    for (const [type, count] of topTypes) {
      html += `<div class="insight-row">` +
        `<span style="min-width:180px;font-size:13px;font-weight:500">${esc(type)}</span>` +
        `<div class="insight-bar"><div class="insight-bar-fill" style="width:${Math.round(count/maxCount*100)}%"></div></div>` +
        `<span class="insight-count">${count} req</span>` +
      `</div>`;
    }
    html += `
      <div style="margin-top:14px;padding-top:10px;border-top:1px solid rgba(67,217,197,0.25);font-size:12px;color:var(--cs-slate)">
        ${icon("clock")} <b>Operational Note:</b> MI-09 (Wireless Microphone) is reserved overnight by Debate Union and remains secured in their rehearsal locker.
      </div>
    </div>`;

    return html;
  }

  /* =====================================================
     2. SECTION: EQUIPMENT DIRECTORY
     ===================================================== */

  function renderEquipment() {
    const filter = s.filter || "All";
    const condFilter = s.condFilter || "All";
    const search = (s.search || "").toLowerCase().trim();

    const currentAssets = getAssets();

    const visible = currentAssets.filter((a) => {
      const st = assetStatus(a);
      // Status filter
      if (filter === "Available" && st.label !== "Available") return false;
      if (filter === "On Loan"   && st.label !== "On Loan" && st.label !== "Overdue") return false;
      if (filter === "In Repair" && !isConditionBlocked(a.id)) return false;

      // Condition filter
      if (condFilter !== "All" && a.condition !== condFilter) return false;

      // Search
      if (search) {
        const loan = activeLoan(a.id);
        const hay = [a.id, a.type, a.model, a.category, a.condition, loan?.who || ""].join(" ").toLowerCase();
        if (!hay.includes(search)) return false;
      }
      return true;
    });

    let html = `
      <div class="sectionhead">
        <div>
          <h2>Equipment Register</h2>
          <small>Physical assets inventory, condition health, and real-time counter status</small>
        </div>
        <button type="button" data-action="tab" data-val="Checkouts" class="btn-primary">${icon("arrow-right-circle")} New Checkout Slip</button>
      </div>
    `;

    html += `
      <div class="toolbar">
        <div class="search-wrap">
          ${icon("search")}
          <input class="search-input" type="search" placeholder="Search by Asset ID, type, model, condition, borrower..." value="${esc(s.search || "")}">
        </div>
        <div class="filter-tabs">
          ${["All", "Available", "On Loan", "In Repair"].map((f) =>
            `<button type="button" data-action="eq-filter" data-val="${esc(f)}" aria-pressed="${filter === f}">${esc(f)}</button>`
          ).join("")}
        </div>
      </div>

      <!-- Condition Filter Bar -->
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:18px;flex-wrap:wrap;background:#F9FAFB;padding:8px 14px;border-radius:10px;border:1px solid var(--cs-border);">
        <span style="font-size:11px;font-weight:700;text-transform:uppercase;color:var(--cs-slate);letter-spacing:0.06em;">Filter By Condition:</span>
        <div style="display:flex;gap:6px;flex-wrap:wrap;">
          ${["All", "Good", "Needs Maintenance", "Damaged", "Under Repair"].map((c) =>
            `<button type="button" data-action="cond-filter" data-val="${esc(c)}" class="btn-sm" style="${condFilter === c ? "background:var(--cs-deep-black);color:#fff;border-color:var(--cs-deep-black);" : "background:#fff;"}">${esc(c)}</button>`
          ).join("")}
        </div>
      </div>
    `;

    if (visible.length === 0) {
      html += `<div style="text-align:center;padding:48px 20px;color:var(--cs-slate);">${icon("search")} No equipment matches the selected search and filter criteria.</div>`;
      return html;
    }

    html += `<div class="equipment-list">`;
    for (const a of visible) {
      const st = assetStatus(a);
      const loan = activeLoan(a.id);
      const isSelected = s.selected === a.id;
      const isBlocked = isConditionBlocked(a.id);

      html += `
        <div class="equipment-row ${isSelected ? "eq-selected" : ""} ${isBlocked ? "eq-repair" : ""}"
             data-action="select-asset" data-val="${esc(a.id)}" role="button" tabindex="0">
          <span class="asset-id">${esc(a.id)}</span>
          <div>
            <div class="eq-name">${esc(a.type)}</div>
            <div class="eq-model">${esc(a.model)} · Bin ${esc(a.bin)} ${loan ? ` · Current Borrower: <b>${esc(loan.who)}</b>` : ""}</div>
          </div>
          <div style="display:flex;align-items:center;gap:8px;">
            ${conditionBadge(a.condition)}
            ${badge(a.category, "info")}
            ${badge(st.label, st.variant)}
          </div>
        </div>
      `;

      if (isSelected) {
        const isEditingThis = s.editingCondition === a.id;
        const historyForAsset = s.conditionHistory.filter((h) => h.assetId === a.id);

        html += `
          <div class="eq-detail">
            <div class="eq-detail-grid">
              <div class="eq-detail-item"><span class="di-label">Asset ID</span><span>${esc(a.id)}</span></div>
              <div class="eq-detail-item"><span class="di-label">Classification</span><span>${esc(a.type)}</span></div>
              <div class="eq-detail-item"><span class="di-label">Model Spec</span><span>${esc(a.model)}</span></div>
              <div class="eq-detail-item"><span class="di-label">Category</span><span>${esc(a.category)}</span></div>
              <div class="eq-detail-item"><span class="di-label">Storage Bin</span><span>${esc(a.bin)}</span></div>
              <div class="eq-detail-item">
                <span class="di-label">Condition Status</span>
                <div>${conditionBadge(a.condition)}</div>
              </div>
              ${loan ? `<div class="eq-detail-item"><span class="di-label">Borrower</span><span>${esc(loan.who)}</span></div>` : ""}
              ${loan ? `<div class="eq-detail-item"><span class="di-label">Due Back</span><span>${esc(loan.due)}</span></div>` : ""}
              ${loan ? `<div class="eq-detail-item"><span class="di-label">Slip Number</span><span>L-${loan.num}</span></div>` : ""}
            </div>

            <!-- Condition Update Form / Controls -->
            <div style="margin-top:18px;padding-top:16px;border-top:1px solid var(--cs-border);">
              ${isEditingThis ? `
                <form data-update-condition-form="${esc(a.id)}" style="background:#fff;padding:16px;border-radius:10px;border:1px solid var(--cs-border);">
                  <div style="font-weight:700;font-size:13px;margin-bottom:10px;color:var(--cs-deep-black);">Update Equipment Condition: ${esc(a.id)} (${esc(a.type)})</div>
                  <div class="form-grid" style="margin:0 0 12px 0;">
                    <div class="form-group">
                      <label class="form-label">New Condition Status</label>
                      <select name="newCondition" required>
                        ${VALID_CONDITIONS.map((c) => `<option value="${esc(c)}" ${c === a.condition ? "selected" : ""}>${esc(c)}</option>`).join("")}
                      </select>
                    </div>
                    <div class="form-group">
                      <label class="form-label">Reason / Assessment Notes</label>
                      <input type="text" name="reason" placeholder="e.g. Scratched lens, cable frayed, routine check" required>
                    </div>
                  </div>
                  <div style="display:flex;gap:8px;">
                    <button type="submit" class="btn-primary btn-sm">Save Condition Update</button>
                    <button type="button" data-action="cancel-edit-condition" class="btn-secondary btn-sm">Cancel</button>
                  </div>
                </form>
              ` : `
                <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;">
                  <div style="display:flex;gap:10px;">
                    <button type="button" data-action="begin-edit-condition" data-val="${esc(a.id)}" class="btn-secondary btn-sm">
                      ${icon("refresh-cw")} Update Condition Status
                    </button>
                    ${!isBlocked && !activeLoan(a.id) ? btn("Check Out This Unit →", "goto-checkout-asset", a.id, "btn-primary btn-sm") : ""}
                    ${btn("Close Panel", "select-asset", "", "btn-secondary btn-sm")}
                  </div>
                  ${isBlocked ? `<span style="font-size:12px;color:#EF4444;font-weight:600;">⚠️ Equipment locked from checkout due to condition: ${esc(a.condition)}</span>` : ""}
                </div>
              `}
            </div>

            <!-- Condition History Log for this Asset -->
            <div style="margin-top:16px;padding-top:14px;border-top:1px dashed var(--cs-border);">
              <div style="font-size:11px;font-weight:700;text-transform:uppercase;color:var(--cs-slate);letter-spacing:0.06em;margin-bottom:8px;">
                Condition Inspection History (${historyForAsset.length})
              </div>
              ${historyForAsset.length === 0 ? `
                <div style="font-size:12px;color:var(--cs-slate);">No past condition modification events recorded.</div>
              ` : `
                <div style="display:grid;gap:6px;">
                  ${historyForAsset.map((h) => `
                    <div style="background:#fff;border:1px solid var(--cs-border);border-radius:8px;padding:8px 12px;font-size:12px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:6px;">
                      <div>
                        <b>${esc(h.prevCondition)}</b> &rarr; <b>${esc(h.newCondition)}</b>
                        <span style="color:var(--cs-slate);margin-left:8px;">Reason: "${esc(h.reason)}"</span>
                      </div>
                      <span style="font-size:11px;color:var(--cs-slate);">${esc(h.timestamp)}</span>
                    </div>
                  `).join("")}
                </div>
              `}
            </div>
          </div>
        `;
      }
    }
    html += `</div>`;
    return html;
  }

  /* =====================================================
     3. SECTION: RESERVATIONS
     ===================================================== */

  function renderReservations() {
    let html = `
      <div class="sectionhead">
        <div>
          <h2>Club Reservations</h2>
          <small>Approved event requests from the Student Activities Office</small>
        </div>
        <button type="button" data-action="tab" data-val="Checkouts" class="btn-primary">${icon("arrow-right-circle")} Issue Kit for Request</button>
      </div>
    `;

    html += `<div style="display:grid;gap:14px;">`;
    for (const r of requests) {
      const loansForReq = s.loans.filter((l) => l.req === r.id);
      const allIssued = r.items.every((item) =>
        loansForReq.some((l) => { const a = getAsset(l.asset); return a && a.type === item; })
      );

      html += `
        <div style="background:var(--cs-white);border:1px solid var(--cs-border);border-radius:14px;padding:20px;box-shadow:var(--cs-shadow-sm);">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:10px;">
            <div>
              <div style="display:flex;align-items:center;gap:10px;margin-bottom:6px;">
                <span class="req-id">${esc(r.id)}</span>
                <span style="font-family:var(--font-heading);font-weight:700;font-size:16px;">${esc(r.club)}</span>
                <span style="color:var(--cs-slate);font-size:13px;">· ${esc(r.event)}</span>
              </div>
              <div style="font-size:13px;color:var(--cs-slate);">Scheduled Host: <b>${esc(r.owner)}</b> &nbsp;|&nbsp; Target Due Date: <b>${esc(r.due)}</b></div>
            </div>
            <div>
              ${badge(allIssued ? "Fully Issued" : "Pending Pickup", allIssued ? "success" : "warn")}
            </div>
          </div>
          <div style="margin-top:14px;padding:12px 14px;background:#F9FAFB;border-radius:10px;border:1px solid var(--cs-border);font-size:13px;color:#374151;">
            <b>Operational Dispatch Note:</b> ${esc(r.note)}
          </div>
          <div style="margin-top:14px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;">
            <div style="display:flex;gap:6px;flex-wrap:wrap;">
              ${r.items.map((i) => badge(i, "neutral")).join("")}
            </div>
            ${!allIssued ? btn("Dispatch Gear at Counter →", "start-checkout-req", r.id, "btn-sm btn-primary") : ""}
          </div>
        </div>
      `;
    }
    html += `</div>`;
    return html;
  }

  /* =====================================================
     4. SECTION: CHECKOUTS
     ===================================================== */

  function renderCheckouts() {
    const draft = s.checkoutDraft || { step: 1, who: "", note: "", assets: [], due: "Fri 8 pm", req: "walk-in" };
    const step  = draft.step || 1;

    const stepLabels = ["Borrower Identity", "Equipment Allocation", "Schedule & Slip", "Verification"];
    let html = `
      <div class="sectionhead">
        <div>
          <h2>Equipment Checkout Flow</h2>
          <small>Structured multi-item issue workflow with condition and availability safeguards</small>
        </div>
      </div>
    `;

    html += `<div class="checkout-steps">`;
    for (let i = 0; i < stepLabels.length; i++) {
      const cls = i + 1 < step ? "step-done" : i + 1 === step ? "step-active" : "";
      html += `
        <div class="checkout-step ${cls}">
          <div class="step-num">${i + 1 < step ? "✓" : i + 1}</div>
          <span>${esc(stepLabels[i])}</span>
        </div>
      `;
      if (i < stepLabels.length - 1) html += `<div class="step-sep"></div>`;
    }
    html += `</div>`;

    html += `<div class="checkout-panel">`;

    if (step === 1) {
      html += `
        <h3>Step 1: Identify Borrower</h3>
        <form data-checkout-step="1">
          <div class="form-grid form-1col">
            <div class="form-group">
              <label class="form-label" for="co-who">Student / Club Officer</label>
              <select id="co-who" name="who" required>
                <option value="">— Select registered individual —</option>
                ${opts(people.map((p) => [p, p]))}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label" for="co-note">Operational Note (Optional)</label>
              <input id="co-note" name="note" type="text" maxlength="200" placeholder="e.g. Collecting full screening package for Film Society">
            </div>
          </div>
          <div class="checkout-nav">
            <span></span>
            <button type="submit" class="btn-primary">Proceed to Inventory Selection →</button>
          </div>
        </form>
      `;
    } else if (step === 2) {
      const currentAssets = getAssets();
      const availableAssets = currentAssets.filter((a) => !isConditionBlocked(a.id) && !activeLoan(a.id));
      const unavailableAssets = currentAssets.filter((a) => isConditionBlocked(a.id) || activeLoan(a.id));

      html += `
        <h3>Step 2: Select Units for Checkout</h3>
        <p style="font-size:13px;color:var(--cs-slate);margin-bottom:16px;">Damaged and Under-Repair items are strictly locked out of selection.</p>
        <form data-checkout-step="2">
          <div class="checkout-asset-list">
      `;

      for (const a of availableAssets) {
        const checked = draft.assets.includes(a.id);
        html += `
          <label class="checkout-asset-row ${checked ? "coa-selected" : ""}">
            <input type="checkbox" name="assets" value="${esc(a.id)}" ${checked ? "checked" : ""}>
            <span class="asset-id">${esc(a.id)}</span>
            <div style="flex:1">
              <div style="font-weight:600;font-size:13px">${esc(a.type)}</div>
              <div style="font-size:12px;color:var(--cs-slate)">${esc(a.model)} · Bin ${esc(a.bin)}</div>
            </div>
            ${conditionBadge(a.condition)}
            ${badge(a.category, "info")}
          </label>
        `;
      }

      for (const a of unavailableAssets) {
        const loan = activeLoan(a.id);
        const isBlocked = isConditionBlocked(a.id);
        let reason = "Unavailable";
        if (isBlocked) {
          reason = `Locked: Condition is ${a.condition}`;
        } else if (loan) {
          reason = `Checked out to ${loan.who}`;
        }

        html += `
          <div class="checkout-asset-row coa-disabled">
            <input type="checkbox" disabled>
            <span class="asset-id">${esc(a.id)}</span>
            <div style="flex:1">
              <div style="font-weight:600;font-size:13px">${esc(a.type)}</div>
              <div style="font-size:12px;color:var(--cs-slate)">${esc(reason)}</div>
            </div>
            ${conditionBadge(a.condition)}
            ${badge(isBlocked ? "Locked" : "On Loan", "danger")}
          </div>
        `;
      }

      html += `
          </div>
          <div class="checkout-nav">
            ${btn("← Back to Step 1", "checkout-back", "", "btn-secondary")}
            <button type="submit" class="btn-primary">Proceed to Return Schedule →</button>
          </div>
        </form>
      `;
    } else if (step === 3) {
      html += `
        <h3>Step 3: Define Return Schedule &amp; Link Request</h3>
        <form data-checkout-step="3">
          <div class="form-grid">
            <div class="form-group">
              <label class="form-label" for="co-due">Expected Return Time</label>
              <select id="co-due" name="due">
                ${opts(dueOptions.map((d) => [d, d]))}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label" for="co-req">Linked Club Request</label>
              <select id="co-req" name="req">
                <option value="walk-in">Walk-in Direct Issuance (No Form)</option>
                ${opts(requests.map((r) => [r.id, `${r.id} · ${r.club}`]))}
              </select>
            </div>
          </div>
          <div class="checkout-nav">
            ${btn("← Back to Items", "checkout-back", "", "btn-secondary")}
            <button type="submit" class="btn-primary">Review &amp; Confirm →</button>
          </div>
        </form>
      `;
    } else if (step === 4) {
      const selectedAssets = (draft.assets || []).map(getAsset).filter(Boolean);
      const reqObj = draft.req && draft.req !== "walk-in" ? getReq(draft.req) : null;

      html += `
        <div class="checkout-summary">
          <h3 style="margin-bottom:12px;display:flex;align-items:center;gap:8px;">
            ${icon("check-circle")} Ready to Issue Equipment
          </h3>
          <div class="summary-line"><span class="sl-label">Borrower</span><span>${esc(draft.who)}</span></div>
          <div class="summary-line">
            <span class="sl-label">Units (${selectedAssets.length})</span>
            <div>
              ${selectedAssets.map((a) =>
                `<div style="margin-bottom:4px;display:flex;align-items:center;gap:8px;">
                   ${badge(a.id, "neutral")} <b>${esc(a.type)}</b>
                   <span style="color:var(--cs-slate);font-size:12px">${esc(a.model)}</span>
                   ${conditionBadge(a.condition)}
                 </div>`
              ).join("")}
            </div>
          </div>
          <div class="summary-line"><span class="sl-label">Due Back</span><span>${esc(draft.due)}</span></div>
          <div class="summary-line"><span class="sl-label">Request</span><span>${reqObj ? `${esc(reqObj.id)} · ${esc(reqObj.club)}` : "Walk-in"}</span></div>
          ${draft.note ? `<div class="summary-line"><span class="sl-label">Desk Note</span><span>${esc(draft.note)}</span></div>` : ""}
        </div>
        <div class="checkout-nav">
          ${btn("← Back", "checkout-back", "", "btn-secondary")}
          <button type="button" data-action="checkout-confirm" class="btn-primary">${icon("check-circle")} Confirm &amp; Print Slips</button>
        </div>
      `;
    }

    html += `</div>`;
    return html;
  }

  /* =====================================================
     5. SECTION: RETURNS & PARTIAL RETURNS (WITH CONDITION INSPECTION)
     ===================================================== */

  function renderReturns() {
    const onlyOpen = s.onlyOpen;
    const visible = s.loans.filter((l) => (onlyOpen ? !l.back : true));

    const groups = {};
    for (const l of visible) {
      const key = (l.req || "walk-in") + "|" + l.who;
      if (!groups[key]) groups[key] = { req: l.req, who: l.who, loans: [] };
      groups[key].loans.push(l);
    }

    let html = `
      <div class="sectionhead">
        <div>
          <h2>Return Desk &amp; Reconciliation</h2>
          <small>Handle individual item returns, inspect condition on check-in, and update inventory stock</small>
        </div>
        <div style="display:flex;gap:8px">
          <button type="button" data-action="scope" data-val="0" class="${onlyOpen ? "btn-primary btn-sm" : "btn-secondary btn-sm"}">Active Slips Only</button>
          <button type="button" data-action="scope" data-val="1" class="${!onlyOpen ? "btn-primary btn-sm" : "btn-secondary btn-sm"}">All Historical Slips</button>
        </div>
      </div>
    `;

    if (Object.keys(groups).length === 0) {
      html += `<div style="text-align:center;padding:48px 20px;color:var(--cs-slate);">${icon("check-circle")} No ${onlyOpen ? "outstanding " : ""}loan slips found. All items accounted for.</div>`;
      return html;
    }

    for (const [, grp] of Object.entries(groups)) {
      const reqObj = grp.req ? getReq(grp.req) : null;
      const allBack    = grp.loans.every((l) => l.back);
      const anyBack    = grp.loans.some((l) => l.back);
      const anyOverdue = grp.loans.some((l) => isOverdue(l));

      let statusLabel, statusVariant;
      if (allBack)         { statusLabel = "All Returned";       statusVariant = "success"; }
      else if (anyOverdue) { statusLabel = "Overdue Items";      statusVariant = "danger"; }
      else if (anyBack)    { statusLabel = "Partially Returned"; statusVariant = "warn"; }
      else                 { statusLabel = "Active Loan";        statusVariant = "warn"; }

      html += `
        <div class="loan-group">
          <div class="loan-group-head">
            <div class="loan-group-head-info">
              <span class="req-id">${esc(grp.req || "Walk-in")}</span>
              ${reqObj ? `<span style="font-weight:600;font-size:14px">${esc(reqObj.club)} &mdash; ${esc(reqObj.event)}</span>` : ""}
              <span style="font-size:13px;color:var(--cs-slate);">${icon("user")} ${esc(grp.who)}</span>
            </div>
            ${badge(statusLabel, statusVariant)}
          </div>
      `;

      for (const l of grp.loans) {
        const a = getAsset(l.asset);
        const overdueFlag = isOverdue(l);
        const isConfirming = s.confirmingReturn && s.confirmingReturn.num === l.num;

        html += `
          <div class="loan-slip-row" style="flex-wrap:wrap;">
            <span class="slip-num">L-${l.num}</span>
            <div style="flex:1;min-width:200px;">
              <div style="font-weight:600;font-size:13px;color:var(--cs-deep-black);display:flex;align-items:center;gap:8px;">
                <span>${a ? esc(a.type) : esc(l.asset)}</span>
                <span style="font-weight:400;color:var(--cs-slate);font-size:12px;">(${a ? esc(a.model) : ""})</span>
                ${a ? conditionBadge(a.condition) : ""}
              </div>
              <div style="font-size:12px;color:var(--cs-slate)">Due: ${esc(l.due)} ${overdueFlag ? " &nbsp;" + badge("Overdue", "danger") : ""}</div>
            </div>
            <div>
        `;

        if (l.back) {
          html += badge("Returned to Shelf", "success");
        } else if (isConfirming) {
          const currentCond = a ? a.condition : "Good";
          html += `
            <form data-return-checkin-form="${l.num}" style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;background:#F3F4F6;padding:8px 12px;border-radius:10px;border:1px solid var(--cs-border);">
              <span style="font-size:12px;font-weight:600;color:var(--cs-deep-black);">Inspect Condition:</span>
              <select name="returnCondition" style="padding:4px 8px;font-size:12px;height:32px;width:auto;">
                ${VALID_CONDITIONS.map((c) => `<option value="${esc(c)}" ${c === currentCond ? "selected" : ""}>${esc(c)}</option>`).join("")}
              </select>
              <input type="text" name="returnReason" placeholder="Inspection notes (optional)" style="padding:4px 8px;font-size:12px;height:32px;width:160px;">
              <button type="submit" class="btn-sm btn-success">Confirm Return</button>
              <button type="button" data-action="return-cancel" class="btn-sm btn-secondary">Cancel</button>
            </form>
          `;
        } else {
          html += `<button type="button" data-action="return-begin" data-val="${l.num}" class="btn-sm btn-secondary">Record Return &amp; Inspect</button>`;
        }

        html += `</div></div>`;
      }
      html += `</div>`;
    }

    return html;
  }

  /* =====================================================
     6. SECTION: ACTIVITY TIMELINE
     ===================================================== */

  function renderActivity() {
    const aiIcon = { checkout: "arrow-right-circle", return: "check-circle", note: "book-open", system: "clock", overdue: "alert-triangle" };
    const aiCls  = { checkout: "ai-checkout", return: "ai-return", note: "ai-note", system: "ai-system", overdue: "ai-overdue" };

    const allActivity = [];
    for (const m of seedMessages) {
      if (m.phase <= s.phase) {
        allActivity.push({ ts: m.ts, type: "system", text: `[${m.author}] ${m.text}` });
      }
    }
    for (const e of s.activityLog) {
      allActivity.push(e);
    }
    for (const n of s.notes) {
      allActivity.push({ ts: phaseTs(n.phase), type: "note", text: `Handover Memo: ${n.text}` });
    }

    let html = `
      <div class="sectionhead">
        <div>
          <h2>Operational Activity Stream</h2>
          <small>Immutable chronological log of all desk actions, checkouts, returns, and condition changes</small>
        </div>
      </div>
    `;

    html += `<div class="activity-timeline">`;
    for (const e of allActivity) {
      const type = e.type || "system";
      html += `
        <div class="activity-entry">
          <div class="activity-icon ${aiCls[type] || "ai-system"}">
            ${icon(aiIcon[type] || "clock")}
          </div>
          <div class="activity-body">
            <div class="activity-ts">${esc(e.ts || "")}</div>
            <div class="activity-text">${esc(e.text)}</div>
          </div>
        </div>
      `;
    }
    html += `</div>`;
    return html;
  }

  /* =====================================================
     7. SECTION: SHIFT HANDOVER (SIGNATURE FEATURE)
     ===================================================== */

  function renderHandover() {
    const outstanding = s.loans.filter((l) => !l.back);
    const overdue     = outstanding.filter((l) => isOverdue(l));
    const currentAssets = getAssets();
    const damagedOrRepair = currentAssets.filter((a) => isConditionBlocked(a.id));

    let html = `
      <div class="sectionhead">
        <div>
          <h2>Shift Handover Console</h2>
          <small>Automated operational roll-up, equipment condition alerts, and outgoing operator handover dossier</small>
        </div>
      </div>
    `;

    html += `<div class="handover-layout">`;

    /* Left Column: Handover Form & Notes */
    html += `
      <div>
        <div style="background:var(--cs-white);border:1px solid var(--cs-border);border-radius:16px;padding:24px;box-shadow:var(--cs-shadow-sm);margin-bottom:24px;">
          <h3 style="font-size:16px;margin-bottom:12px;">Add Counter Handover Note</h3>
          <p style="color:var(--cs-slate);font-size:13px;margin-bottom:16px;">Record physical inspections, equipment conditions, or keys held at the counter for the incoming operator.</p>
          <form data-note>
            <div class="form-group" style="margin-bottom:14px;">
              <textarea name="note" rows="3" maxlength="400" placeholder="Type instructions or condition alerts for the next shift..."></textarea>
            </div>
            <button type="submit" class="btn-primary">Save to Shift Record</button>
          </form>
        </div>

        <div style="background:var(--cs-white);border:1px solid var(--cs-border);border-radius:16px;padding:24px;box-shadow:var(--cs-shadow-sm);">
          <h3 style="font-size:16px;margin-bottom:16px;">Operator Memos Logged This Shift</h3>
          ${s.notes.length === 0 ? `<p style="color:var(--cs-slate);font-size:13px;">No qualitative notes filed yet during this shift.</p>` : ""}
          <div style="display:grid;gap:10px;">
            ${s.notes.map((n) => `
              <div style="padding:12px 14px;border-radius:10px;background:#F9FAFB;border:1px solid var(--cs-border);font-size:13px;">
                <div style="font-size:11px;color:var(--cs-slate);margin-bottom:4px;">Logged at ${phaseTs(n.phase)}</div>
                <div style="color:var(--cs-deep-black);">"${esc(n.text)}"</div>
              </div>
            `).join("")}
          </div>
        </div>
      </div>
    `;

    /* Right Column: Automated Rollup Panel */
    html += `
      <div class="handover-panel">
        <h3>${icon("book-open")} Next-Shift Briefing Dossier</h3>

        <!-- Damaged or Under Repair Equipment -->
        ${damagedOrRepair.length > 0 ? `
          <div>
            <div class="hw-section-title">Equipment Condition Alerts</div>
            <div style="display:grid;gap:6px;">
              ${damagedOrRepair.map((a) =>
                `<div class="hw-item hw-overdue">${icon("alert-triangle")} <div><b>${esc(a.id)}: ${esc(a.type)}</b><br>Condition: <b style="color:#EF4444;">${esc(a.condition)}</b> (Locked from checkout)</div></div>`
              ).join("")}
            </div>
          </div>
        ` : ""}

        ${overdue.length > 0 ? `
          <div>
            <div class="hw-section-title">Critical Overdue Items</div>
            <div style="display:grid;gap:6px;">
              ${overdue.map((l) => {
                const a = getAsset(l.asset);
                return `<div class="hw-item hw-overdue">${icon("alert-triangle")} <div><b>${esc(a ? a.type : l.asset)}</b> (${esc(l.asset)})<br>With ${esc(l.who)} · was due ${esc(l.due)}</div></div>`;
              }).join("")}
            </div>
          </div>
        ` : ""}

        <div>
          <div class="hw-section-title">Awaiting Return (Out On Loan)</div>
          ${outstanding.filter((l) => !isOverdue(l)).length === 0 ? `<div style="font-size:12px;color:var(--cs-slate);">No other equipment is currently out.</div>` : ""}
          <div style="display:grid;gap:6px;">
            ${outstanding.filter((l) => !isOverdue(l)).map((l) => {
              const a = getAsset(l.asset);
              return `<div class="hw-item hw-outstanding">${icon("clock")} <div><b>${esc(a ? a.type : l.asset)}</b> (${esc(l.asset)})<br>With ${esc(l.who)} · due ${esc(l.due)}</div></div>`;
            }).join("")}
          </div>
        </div>

        <div>
          <div class="hw-section-title">Incoming Operator Action Items</div>
          <div style="display:grid;gap:6px;">
            ${outstanding.map((l) => {
              const a = getAsset(l.asset);
              return `<div class="hw-item hw-action">${icon("arrow-right-circle")} <div>Collect <b>${esc(a ? a.type : l.asset)}</b> from ${esc(l.who)}</div></div>`;
            }).join("")}
            ${requests.filter((r) => !s.loans.some((l) => l.req === r.id)).map((r) =>
              `<div class="hw-item hw-action">${icon("calendar")} <div>Pending reservation: <b>${esc(r.club)}</b> (${esc(r.id)})</div></div>`
            ).join("")}
            ${damagedOrRepair.map((a) =>
              `<div class="hw-item hw-action">${icon("refresh-cw")} <div>Service ticket needed: <b>${esc(a.id)}</b> (${esc(a.condition)})</div></div>`
            ).join("")}
          </div>
        </div>
      </div>
    `;

    html += `</div>`;
    return html;
  }

  /* =====================================================
     ROUTER & SCREEN DISPATCH
     ===================================================== */

  const screens = {
    "Dashboard":      renderDashboard,
    "Equipment":      renderEquipment,
    "Reservations":   renderReservations,
    "Checkouts":      renderCheckouts,
    "Returns":        renderReturns,
    "Activity":       renderActivity,
    "Shift Handover": renderHandover,
  };

  /* =====================================================
     PAINT & RENDER
     ===================================================== */

  function paint() {
    const phase = shifts[s.phase];
    q("[data-clock]").textContent = phase.time;
    q("[data-shift-title]").textContent = phase.title;
    q("[data-shift]").textContent = phase.text;

    const advance = q('[data-action="advance"]');
    if (advance) {
      advance.hidden = !phase.next;
      const btnText = advance.querySelector(".btn-text");
      if (btnText) btnText.textContent = phase.next || "";
    }

    q("[data-nav]").innerHTML = pages
      .map(([name, iconId]) =>
        `<button type="button" data-action="tab" data-val="${esc(name)}" aria-pressed="${s.tab === name}">` +
          icon(iconId) +
          `<span>${esc(name)}</span>` +
        `</button>`
      )
      .join("");

    const renderer = screens[s.tab] || renderDashboard;
    q("[data-page]").innerHTML = renderer();
    q("[data-status]").textContent = s.notice;

    const restartWrap = q("[data-restart-wrap]");
    if (restartWrap) {
      if (s.confirmRestart) {
        restartWrap.innerHTML = `
          <div style="display:flex;align-items:center;gap:6px;">
            <span style="color:#F87171;font-size:11px;">Reset entire shift?</span>
            <button type="button" data-action="restart-confirm" class="btn-sm btn-danger">Confirm Reset</button>
            <button type="button" data-action="restart-cancel" class="btn-sm btn-secondary">Cancel</button>
          </div>
        `;
      } else {
        restartWrap.innerHTML = `
          <button type="button" data-action="restart" class="btn-restart">
            ${icon("rotate-ccw")}
            <span>Restart sample shift</span>
          </button>
        `;
      }
    }
  }

  function commit(msg) {
    if (msg) s.notice = msg;
    paint();
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
    } catch {
      // storage quota or incognito fallback
    }
  }

  /* =====================================================
     EVENT DISPATCHER
     ===================================================== */

  root.addEventListener("click", (e) => {
    const b = e.target.closest("[data-action]");
    if (!b) return;
    const v = b.dataset.val;

    switch (b.dataset.action) {
      case "restart":
        s.confirmRestart = true;
        break;

      case "restart-cancel":
        s.confirmRestart = false;
        break;

      case "restart-confirm":
        s = original();
        seedActivityLog();
        showToast("Shift reset to pristine sample state.", "info");
        break;

      case "advance":
        if (s.phase < 2) {
          s.phase++;
          s.confirmingReturn = null;
          s.notice = `Shift advanced to ${shifts[s.phase].time}.`;
          showToast(`Clock moved to ${shifts[s.phase].time}`, "info");
        }
        break;

      case "tab":
        s.tab = v;
        s.selected = "";
        s.checkoutDraft = null;
        s.confirmingReturn = null;
        s.editingCondition = null;
        s.confirmRestart = false;
        break;

      case "eq-filter":
        s.filter = v;
        break;

      case "cond-filter":
        s.condFilter = v;
        break;

      case "select-asset":
        s.selected = s.selected === v ? "" : v;
        s.editingCondition = null;
        break;

      case "begin-edit-condition":
        s.editingCondition = v;
        break;

      case "cancel-edit-condition":
        s.editingCondition = null;
        break;

      case "goto-checkout-asset": {
        const a = getAsset(v);
        if (a && isConditionBlocked(a.id)) {
          showToast(`Cannot check out: ${a.id} is marked as ${a.condition}`, "error");
          return;
        }
        s.tab = "Checkouts";
        s.checkoutDraft = { step: 1, who: "", note: "", assets: [v], due: "Fri 8 pm", req: "walk-in" };
        break;
      }

      case "start-checkout-req": {
        const r = getReq(v);
        const matchingAssets = r
          ? getAssets().filter((a) => r.items.includes(a.type) && !isConditionBlocked(a.id) && !activeLoan(a.id)).map((a) => a.id)
          : [];
        s.tab = "Checkouts";
        s.checkoutDraft = { step: 1, who: r ? r.owner : "", note: r ? r.note : "", assets: matchingAssets, due: r ? r.due : "Fri 8 pm", req: v };
        break;
      }

      case "checkout-back": {
        const d = s.checkoutDraft || {};
        d.step = Math.max(1, (d.step || 1) - 1);
        s.checkoutDraft = d;
        break;
      }

      case "checkout-confirm": {
        const d = s.checkoutDraft;
        if (!d || !d.who || !d.assets || d.assets.length === 0) {
          showToast("Validation Error: Missing borrower or gear.", "error");
          return;
        }

        // Validate: no items out on loan
        const activeBlocked = d.assets.filter((id) => activeLoan(id));
        if (activeBlocked.length > 0) {
          showToast(`Blocked: ${activeBlocked.join(", ")} is already out.`, "error");
          return;
        }

        // Validate: no items damaged or under repair
        const conditionBlocked = d.assets.filter((id) => isConditionBlocked(id));
        if (conditionBlocked.length > 0) {
          showToast(`Checkout Rejected: ${conditionBlocked.map(id => `${id} (${getCondition(id)})`).join(", ")} cannot be checked out.`, "error");
          return;
        }

        const slipNums = [];
        for (const id of d.assets) {
          const num = nextNum();
          s.loans.push({ num, req: d.req === "walk-in" ? "" : d.req, asset: id, who: d.who, due: d.due, back: false });
          logCheckout({ num, asset: id, who: d.who, req: d.req, due: d.due });
          slipNums.push(`L-${num}`);
        }
        s.checkoutDraft = null;
        s.tab = "Returns";
        const slipList = slipNums.join(", ");
        showToast(`Slips ${slipList} successfully issued to ${d.who}`, "success");
        commit(`Checkout complete. ${slipList} issued to ${d.who}.`);
        return;
      }

      case "return-begin":
        s.confirmingReturn = { num: Number(v) };
        break;

      case "return-cancel":
        s.confirmingReturn = null;
        break;

      case "scope":
        s.onlyOpen = v === "0";
        break;

      default:
        return;
    }
    commit();
  });

  root.addEventListener("input", (e) => {
    if (e.target.matches(".search-input")) {
      s.search = e.target.value;
      commit();
    }
  });

  root.addEventListener("submit", (e) => {
    e.preventDefault();
    const f = e.target;
    const form = new FormData(f);

    /* Handover Note Form */
    if (f.matches("[data-note]")) {
      const text = String(form.get("note") || "").trim();
      if (!text) return;
      s.notes.push({ phase: s.phase, text });
      logNote(text);
      showToast("Handover memo logged to audit trail.", "success");
      commit("Handover note saved.");
      return;
    }

    /* Condition Update from Details View */
    if (f.matches("[data-update-condition-form]")) {
      const assetId = f.dataset.updateConditionForm;
      const newCond = String(form.get("newCondition") || "").trim();
      const reason  = String(form.get("reason") || "").trim();
      setEquipmentCondition(assetId, newCond, reason);
      s.editingCondition = null;
      commit(`Condition of ${assetId} updated to ${newCond}.`);
      return;
    }

    /* Return Check-in with Condition Inspection Form */
    if (f.matches("[data-return-checkin-form]")) {
      const slipNum = Number(f.dataset.returnCheckinForm);
      const l = s.loans.find((l) => l.num === slipNum);
      if (!l || l.back) return;

      const returnCondition = String(form.get("returnCondition") || "Good").trim();
      const returnReason    = String(form.get("returnReason") || "Check-in at counter").trim();

      // Update condition on return
      setEquipmentCondition(l.asset, returnCondition, returnReason);

      // Close loan slip
      l.back = true;
      logReturn(l);
      s.confirmingReturn = null;

      const a = getAsset(l.asset);
      showToast(`${a ? a.type : l.asset} returned · Condition: ${returnCondition} · Slip L-${l.num} closed`, "success");
      commit(`${l.asset} returned to counter. Slip L-${l.num} closed.`);
      return;
    }

    /* Multi-step Checkout Form */
    const step = f.dataset.checkoutStep;
    if (step) {
      const d = s.checkoutDraft || { step: 1, who: "", note: "", assets: [], due: "Fri 8 pm", req: "walk-in" };

      if (step === "1") {
        const who = String(form.get("who") || "").trim();
        if (!who) { showToast("Select a registered borrower.", "warning"); return; }
        d.who = who;
        d.note = String(form.get("note") || "").trim();
        d.step = 2;
      } else if (step === "2") {
        const checked = form.getAll("assets");
        if (checked.length === 0) { showToast("Select at least one physical unit.", "warning"); return; }

        // Filter out any accidentally checked blocked items
        const safeItems = checked.filter((id) => !isConditionBlocked(id));
        if (safeItems.length !== checked.length) {
          showToast("Some selected items are damaged or under repair and cannot be checked out.", "error");
        }
        if (safeItems.length === 0) {
          showToast("No valid, undamaged equipment selected.", "error");
          return;
        }

        d.assets = safeItems;
        d.step = 3;
      } else if (step === "3") {
        d.due = String(form.get("due") || "Fri 8 pm");
        d.req = String(form.get("req") || "walk-in");
        d.step = 4;
      }

      s.checkoutDraft = d;
      commit();
    }
  });

  /* =====================================================
     FUTURISTIC PARTICLE BACKGROUND ENGINE
     ===================================================== */

  function initAmbientParticles() {
    const canvas = document.getElementById("ambient-particles");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let width, height;
    let particles = [];

    const resize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", resize);
    resize();

    const count = Math.min(35, Math.floor(width / 35));
    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.45,
        vy: (Math.random() - 0.5) * 0.45,
        radius: Math.random() * 1.8 + 0.8,
        color: Math.random() > 0.5 ? "rgba(100, 139, 255, 0.4)" : "rgba(67, 217, 197, 0.35)",
      });
    }

    function animate() {
      ctx.clearRect(0, 0, width, height);

      // Draw faint connections
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 130) {
            ctx.strokeStyle = `rgba(100, 139, 255, ${0.12 * (1 - dist / 130)})`;
            ctx.lineWidth = 0.6;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }

      // Draw particles
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
      }

      requestAnimationFrame(animate);
    }
    animate();
  }

  /* =====================================================
     BOOTSTRAP & PERSISTENCE
     ===================================================== */

  function restore(d) {
    if (!d || d.version !== 2 || !screens[d.tab]) return;
    s = {
      ...original(),
      ...d,
      equipmentConditions: d.equipmentConditions ? { ...d.equipmentConditions } : initialConditions(),
      conditionHistory: Array.isArray(d.conditionHistory) ? d.conditionHistory.map((h) => ({ ...h })) : initialConditionHistory(),
      loans: Array.isArray(d.loans) ? d.loans.map((l) => ({ ...l })) : original().loans,
      notes: Array.isArray(d.notes) ? d.notes.map((n) => ({ ...n })) : [],
      activityLog: Array.isArray(d.activityLog) ? d.activityLog.map((e) => ({ ...e })) : [],
      confirmingReturn: null,
      editingCondition: null,
      confirmRestart: false,
    };
  }

  seedActivityLog();
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (saved) restore(saved);
  } catch {
    // Keep initialized state
  }

  paint();
  initAmbientParticles();

})();
