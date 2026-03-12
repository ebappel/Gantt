// ============================================================
// Editable Gantt Chart — Zego Integration
// ============================================================

const TOTAL_DAYS = 92;
let currentFilter = "all";
let selectedTaskId = null;
let nextId = 100;

// === Task Data ===
let tasks = [
  { id: "sales-header", label: "Phase 1: Sales Qualification", phase: "sales", isHeader: true },
  {
    id: "discovery", label: "Discovery Calls", phase: "sales", type: "sales",
    start: 1, end: 10, badge: "Days 1–10",
    description: "Initial discovery calls with prospect. Sales reps identify current financial workflows.",
    details: [
      '"Hidden Labor" questions — uncover time wasted on manual tasks',
      '"Risk & Friction" questions — identify NSF/late payment headaches',
      '"Financial Strategy" questions — explore fee models (Incur vs. Pass-through)'
    ]
  },
  {
    id: "crm-notes", label: "Notate CRM & Qualify", phase: "sales", type: "sales",
    start: 5, end: 14, badge: "Days 5–14",
    description: "Document all specific payment needs and current workflows in CRM."
  },
  { id: "contract-header", label: "Phase 2: Contracting", phase: "contract", isHeader: true },
  {
    id: "docusign", label: "Execute DocuSign Agreement", phase: "contract", type: "contract",
    start: 12, end: 20, badge: "Days 12–20",
    description: "Send main Rent Manager agreement via DocuSign with the Partner Document (RM/Zego Product Pricing Agreement)."
  },
  {
    id: "partner-doc", label: "Complete Partner Document", phase: "contract", type: "contract",
    start: 14, end: 22, badge: "Days 14–22",
    description: "Finalize the RM/Zego Product Pricing Agreement. Notate that the client is interested in Payments via Zego."
  },
  { id: "impl-header", label: "Phase 3: Implementation", phase: "rm", isHeader: true },
  {
    id: "rm-review", label: "1. RM Account Review", phase: "rm", type: "rm",
    start: 1, end: 3, badge: "Day 1",
    description: "Implementation team reviews account and assigns to an implementation lead."
  },
  {
    id: "data-import", label: "2. Data Import & Lead Letter", phase: "rm", type: "rm",
    start: 3, end: 12, badge: "Varies",
    description: "Once data is imported, the lead letter is sent to Zego to kick off the Zego workflow."
  },
  { id: "zego-header", label: "Zego Process", phase: "zego", isHeader: true },
  {
    id: "zego-sales", label: "2.1 Zego Sales Contracting", phase: "zego", type: "zego",
    start: 12, end: 40, badge: "<29 Days",
    description: "Zego sales engage with client, collect contracts.",
    details: ["W9", "Principal Owners DL", "Principal HUB (Home Utility Bill)", "Business Utility Bill",
      "Management Contracts / Operating Agreement", "Property List & Rent Rolls",
      "Bank Account List / Chart of Account Info", "Voided Check for Operating Bank Account"]
  },
  {
    id: "zego-kyc", label: "2.2 Zego KYC", phase: "zego", type: "zego",
    start: 20, end: 34, badge: "<14 Days",
    description: "Know Your Customer process. 500+ units → Project Manager; <500 → general onboarding queue."
  },
  {
    id: "zego-dd", label: "2.3 Zego Due Diligence", phase: "zego", type: "zego",
    start: 25, end: 46, badge: "<21 Days",
    description: "Due Diligence process — business background check."
  },
  {
    id: "zego-approved", label: "2.4 Zego Approved", phase: "zego", type: "milestone",
    start: 46, end: 46, isMilestone: true, milestoneType: "zego", badge: "Day 45–60",
    description: "Zego approval milestone. New goal is 45–60 days."
  },
  {
    id: "zego-onboarding", label: "2.5 Zego Onboarding", phase: "zego", type: "zego",
    start: 46, end: 60, badge: "<21 Days",
    description: "Time from DD approved to Pending Live.",
    details: ["Configure Client Account & Integration", "Schedule Configuration Call with PMC",
      "Provide Training Link and Support Documentation", "Complete RM Database Configuration with PMC"]
  },
  { id: "milestone-header", label: "Milestones", phase: "milestone", isHeader: true },
  {
    id: "go-live", label: "3. RM Go-Live", phase: "rm", type: "milestone",
    start: 60, end: 60, isMilestone: true, milestoneType: "rm", badge: "Day 60",
    description: "Rent Manager environment and Zego processing are fully integrated and active."
  },
  {
    id: "impl-complete", label: "4. Implementation Complete", phase: "rm", type: "milestone",
    start: 90, end: 90, isMilestone: true, milestoneType: "rm", badge: "Day 90",
    description: "Full Rent Manager implementation complete."
  }
];

// === Helpers ===
function getDayWidth() {
  return parseInt(getComputedStyle(document.documentElement).getPropertyValue('--gantt-day-w')) || 12;
}

function getTask(id) { return tasks.find(t => t.id === id); }

function getFilteredTasks() {
  return tasks.filter(t => {
    if (currentFilter === "all") return true;
    if (currentFilter === "milestone") return t.type === "milestone" || t.phase === "milestone";
    return t.phase === currentFilter;
  });
}

function generateBadge(start, end) {
  if (start === end) return "Day " + start;
  return "Days " + start + "–" + end;
}

// === Render ===
function renderGantt() {
  const container = document.getElementById("ganttChart");
  const dayW = getDayWidth();
  container.innerHTML = "";

  // Header
  const header = document.createElement("div");
  header.className = "gantt-header";

  const headerLabel = document.createElement("div");
  headerLabel.className = "gantt-header-label";
  headerLabel.textContent = "Task";
  header.appendChild(headerLabel);

  const headerTimeline = document.createElement("div");
  headerTimeline.className = "gantt-header-timeline";

  const weekContainer = document.createElement("div");
  weekContainer.className = "gantt-week-header";
  weekContainer.style.display = "flex";
  weekContainer.style.flexDirection = "column";

  const weekRow = document.createElement("div");
  weekRow.style.display = "flex";
  const dayRow = document.createElement("div");
  dayRow.className = "gantt-day-labels";

  for (let d = 1; d <= TOTAL_DAYS; d++) {
    if ((d - 1) % 7 === 0) {
      const wLabel = document.createElement("div");
      wLabel.className = "gantt-week-label";
      const daysInWeek = Math.min(7, TOTAL_DAYS - d + 1);
      wLabel.style.width = (daysInWeek * dayW) + "px";
      wLabel.textContent = "W" + Math.ceil(d / 7);
      weekRow.appendChild(wLabel);
    }
    const dLabel = document.createElement("div");
    dLabel.className = "gantt-day-label" + ((d - 1) % 7 === 0 ? " week-start" : "");
    dLabel.style.width = dayW + "px";
    if (d % 5 === 0) dLabel.textContent = d;
    dayRow.appendChild(dLabel);
  }

  weekContainer.appendChild(weekRow);
  weekContainer.appendChild(dayRow);
  headerTimeline.appendChild(weekContainer);
  header.appendChild(headerTimeline);
  container.appendChild(header);

  // Body
  const body = document.createElement("div");
  body.className = "gantt-body";

  const filtered = getFilteredTasks();

  filtered.forEach((task, i) => {
    const row = document.createElement("div");
    row.className = "gantt-row" + (task.isHeader ? " phase-header" : "");
    row.style.animationDelay = (i * 20) + "ms";
    row.dataset.taskId = task.id;

    // Label
    const labelCell = document.createElement("div");
    labelCell.className = "gantt-row-label";

    if (!task.isHeader) {
      const colorDot = document.createElement("span");
      colorDot.className = "dot dot-" + (task.type === "milestone" ? (task.milestoneType || "milestone") : task.phase);
      labelCell.appendChild(colorDot);
    }

    const labelText = document.createElement("span");
    labelText.className = "label-text";
    labelText.textContent = task.label;
    labelText.title = task.label;
    labelCell.appendChild(labelText);

    if (task.badge && !task.isHeader) {
      const badge = document.createElement("span");
      badge.className = "label-badge";
      const bColor = task.type === "milestone" ? "milestone" : task.phase;
      badge.style.background = `var(--color-${bColor}-bg)`;
      badge.style.color = `var(--color-${bColor})`;
      badge.textContent = task.badge;
      labelCell.appendChild(badge);
    }

    // Edit button for non-header rows
    if (!task.isHeader) {
      const editBtn = document.createElement("button");
      editBtn.className = "row-edit-btn";
      editBtn.title = "Edit task";
      editBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>';
      editBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        openEditModal(task.id);
      });
      labelCell.appendChild(editBtn);
    }

    row.appendChild(labelCell);

    // Timeline cell
    const timelineCell = document.createElement("div");
    timelineCell.className = "gantt-row-timeline";

    // Grid lines
    for (let d = 1; d <= TOTAL_DAYS; d++) {
      if ((d - 1) % 7 === 0) {
        const gl = document.createElement("div");
        gl.className = "gantt-gridline week-line";
        gl.style.left = ((d - 1) * dayW) + "px";
        timelineCell.appendChild(gl);
      }
    }

    // Bar or milestone
    if (!task.isHeader && task.start !== undefined) {
      if (task.isMilestone) {
        const diamond = document.createElement("div");
        diamond.className = "gantt-milestone type-" + (task.milestoneType || task.type);
        diamond.style.left = ((task.start - 1) * dayW + dayW / 2) + "px";
        diamond.dataset.taskId = task.id;
        diamond.addEventListener("click", () => {
          selectTask(task.id);
          showDetails(task);
        });
        diamond.addEventListener("dblclick", (e) => {
          e.stopPropagation();
          openEditModal(task.id);
        });
        // Milestone drag
        makeMilestoneDraggable(diamond, task);
        timelineCell.appendChild(diamond);
      } else {
        const bar = document.createElement("div");
        bar.className = "gantt-bar type-" + task.type;
        bar.style.left = ((task.start - 1) * dayW) + "px";
        bar.style.width = ((task.end - task.start + 1) * dayW) + "px";
        bar.style.animationDelay = (i * 30 + 80) + "ms";
        bar.dataset.taskId = task.id;

        // Resize handles
        const handleL = document.createElement("div");
        handleL.className = "bar-handle bar-handle-left";
        const handleR = document.createElement("div");
        handleR.className = "bar-handle bar-handle-right";
        bar.appendChild(handleL);
        bar.appendChild(handleR);

        // Click to select
        bar.addEventListener("click", (e) => {
          if (e.target.classList.contains("bar-handle")) return;
          selectTask(task.id);
          showDetails(task);
        });

        // Double-click to edit
        bar.addEventListener("dblclick", (e) => {
          e.stopPropagation();
          openEditModal(task.id);
        });

        // Drag to move
        makeBarDraggable(bar, task);

        // Resize from handles
        makeBarResizable(handleL, task, "left");
        makeBarResizable(handleR, task, "right");

        timelineCell.appendChild(bar);
      }
    }

    // Target zone for milestone header
    if (task.id === "milestone-header") {
      const zone = document.createElement("div");
      zone.className = "target-zone";
      zone.style.left = (44 * dayW) + "px";
      zone.style.width = (16 * dayW) + "px";
      const zoneLabel = document.createElement("div");
      zoneLabel.className = "target-zone-label";
      zoneLabel.textContent = "ePay Target: Day 45–60";
      zone.appendChild(zoneLabel);
      timelineCell.appendChild(zone);
    }

    row.appendChild(timelineCell);
    body.appendChild(row);
  });

  container.appendChild(body);
}

// === Selection ===
function selectTask(id) {
  selectedTaskId = id;
  document.querySelectorAll(".gantt-bar.selected").forEach(b => b.classList.remove("selected"));
  const bar = document.querySelector(`.gantt-bar[data-task-id="${id}"]`);
  if (bar) bar.classList.add("selected");
}

// === Drag to Move Bar ===
function makeBarDraggable(bar, task) {
  let startX, origStart, origEnd, dragging = false;
  const dayW = () => getDayWidth();

  function onDown(e) {
    if (e.target.classList.contains("bar-handle")) return;
    e.preventDefault();
    dragging = true;
    startX = e.clientX || e.touches[0].clientX;
    origStart = task.start;
    origEnd = task.end;
    bar.classList.add("dragging");
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
    document.addEventListener("touchmove", onMove, { passive: false });
    document.addEventListener("touchend", onUp);
  }

  function onMove(e) {
    if (!dragging) return;
    e.preventDefault();
    const clientX = e.clientX || e.touches[0].clientX;
    const dx = clientX - startX;
    const dayDelta = Math.round(dx / dayW());
    const duration = origEnd - origStart;
    let newStart = origStart + dayDelta;
    let newEnd = newStart + duration;

    if (newStart < 1) { newStart = 1; newEnd = 1 + duration; }
    if (newEnd > TOTAL_DAYS) { newEnd = TOTAL_DAYS; newStart = TOTAL_DAYS - duration; }

    task.start = newStart;
    task.end = newEnd;

    bar.style.left = ((newStart - 1) * dayW()) + "px";
    showDragTooltip(e, `Day ${newStart} → ${newEnd}`);
  }

  function onUp() {
    dragging = false;
    bar.classList.remove("dragging");
    task.badge = generateBadge(task.start, task.end);
    removeDragTooltip();
    renderGantt();
    showDetails(task);
    document.removeEventListener("mousemove", onMove);
    document.removeEventListener("mouseup", onUp);
    document.removeEventListener("touchmove", onMove);
    document.removeEventListener("touchend", onUp);
  }

  bar.addEventListener("mousedown", onDown);
  bar.addEventListener("touchstart", onDown, { passive: false });
}

// === Drag to Resize Bar ===
function makeBarResizable(handle, task, side) {
  let startX, origStart, origEnd, dragging = false;
  const dayW = () => getDayWidth();

  function onDown(e) {
    e.preventDefault();
    e.stopPropagation();
    dragging = true;
    startX = e.clientX || e.touches[0].clientX;
    origStart = task.start;
    origEnd = task.end;
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
    document.addEventListener("touchmove", onMove, { passive: false });
    document.addEventListener("touchend", onUp);
  }

  function onMove(e) {
    if (!dragging) return;
    e.preventDefault();
    const clientX = e.clientX || e.touches[0].clientX;
    const dx = clientX - startX;
    const dayDelta = Math.round(dx / dayW());

    if (side === "left") {
      task.start = Math.max(1, Math.min(origStart + dayDelta, task.end - 1));
    } else {
      task.end = Math.min(TOTAL_DAYS, Math.max(origEnd + dayDelta, task.start + 1));
    }

    const bar = handle.parentElement;
    bar.style.left = ((task.start - 1) * dayW()) + "px";
    bar.style.width = ((task.end - task.start + 1) * dayW()) + "px";
    showDragTooltip(e, `Day ${task.start} → ${task.end} (${task.end - task.start + 1}d)`);
  }

  function onUp() {
    dragging = false;
    task.badge = generateBadge(task.start, task.end);
    removeDragTooltip();
    renderGantt();
    showDetails(task);
    document.removeEventListener("mousemove", onMove);
    document.removeEventListener("mouseup", onUp);
    document.removeEventListener("touchmove", onMove);
    document.removeEventListener("touchend", onUp);
  }

  handle.addEventListener("mousedown", onDown);
  handle.addEventListener("touchstart", onDown, { passive: false });
}

// === Milestone Drag ===
function makeMilestoneDraggable(el, task) {
  let startX, origStart, dragging = false;
  const dayW = () => getDayWidth();

  function onDown(e) {
    e.preventDefault();
    dragging = true;
    startX = e.clientX || e.touches[0].clientX;
    origStart = task.start;
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  }

  function onMove(e) {
    if (!dragging) return;
    const dx = e.clientX - startX;
    const dayDelta = Math.round(dx / dayW());
    let newDay = Math.max(1, Math.min(TOTAL_DAYS, origStart + dayDelta));
    task.start = newDay;
    task.end = newDay;
    el.style.left = ((newDay - 1) * dayW() + dayW() / 2) + "px";
    showDragTooltip(e, `Day ${newDay}`);
  }

  function onUp() {
    dragging = false;
    task.badge = "Day " + task.start;
    removeDragTooltip();
    renderGantt();
    showDetails(task);
    document.removeEventListener("mousemove", onMove);
    document.removeEventListener("mouseup", onUp);
  }

  el.addEventListener("mousedown", onDown);
}

// === Drag Tooltip ===
function showDragTooltip(e, text) {
  let tip = document.querySelector(".drag-tooltip");
  if (!tip) {
    tip = document.createElement("div");
    tip.className = "drag-tooltip";
    document.body.appendChild(tip);
  }
  tip.textContent = text;
  const cx = e.clientX || (e.touches && e.touches[0].clientX) || 0;
  const cy = e.clientY || (e.touches && e.touches[0].clientY) || 0;
  tip.style.left = (cx + 14) + "px";
  tip.style.top = (cy - 28) + "px";
}

function removeDragTooltip() {
  const tip = document.querySelector(".drag-tooltip");
  if (tip) tip.remove();
}

// === Details Panel ===
function showDetails(task) {
  const panel = document.getElementById("detailsContent");
  const phaseColor = task.type === "milestone" ? (task.milestoneType || "milestone") : task.phase;

  let html = `<div class="details-title">
    <span class="dot dot-${phaseColor}" style="width:12px;height:12px"></span>
    ${task.label}
  </div>`;

  html += `<div class="details-meta">`;
  if (task.start && task.end && task.start !== task.end) {
    html += `<div class="details-meta-item"><strong>Duration:</strong> Day ${task.start} → Day ${task.end} (${task.end - task.start + 1} days)</div>`;
  } else if (task.start) {
    html += `<div class="details-meta-item"><strong>Target:</strong> Day ${task.start}</div>`;
  }
  html += `<div class="details-meta-item"><strong>Phase:</strong> ${task.phase.charAt(0).toUpperCase() + task.phase.slice(1)}</div>`;
  const resp = task.type === "sales" || task.type === "contract" ? "RM Sales"
    : (task.type === "rm" || (task.type === "milestone" && task.milestoneType === "rm")) ? "RM Implementation"
    : task.phase === "zego" ? "Zego" : "";
  if (resp) html += `<div class="details-meta-item"><strong>Responsibility:</strong> ${resp}</div>`;
  html += `</div>`;

  html += `<div class="details-description">${task.description || ''}`;
  if (task.details && task.details.length) {
    html += `<ul>${task.details.map(d => `<li>${d}</li>`).join("")}</ul>`;
  }
  html += `</div>`;

  panel.innerHTML = html;
}

// === Modal ===
const overlay = document.getElementById("modalOverlay");
const form = document.getElementById("editForm");
let editingTaskId = null;
let isNewTask = false;

function openEditModal(taskId) {
  const task = getTask(taskId);
  if (!task) return;
  editingTaskId = taskId;
  isNewTask = false;

  document.getElementById("modalTitle").textContent = "Edit Task";
  document.getElementById("editLabel").value = task.label;
  document.getElementById("editPhase").value = task.phase;
  document.getElementById("editType").value = task.type || task.phase;
  document.getElementById("editStart").value = task.start || 1;
  document.getElementById("editEnd").value = task.end || 1;
  document.getElementById("editBadge").value = task.badge || "";
  document.getElementById("editDesc").value = task.description || "";
  document.getElementById("editDetails").value = (task.details || []).join("\n");
  document.getElementById("deleteTaskBtn").style.display = "";

  overlay.classList.add("open");
  document.getElementById("editLabel").focus();
}

function openNewTaskModal() {
  isNewTask = true;
  editingTaskId = null;

  document.getElementById("modalTitle").textContent = "Add New Task";
  document.getElementById("editLabel").value = "";
  document.getElementById("editPhase").value = "sales";
  document.getElementById("editType").value = "sales";
  document.getElementById("editStart").value = 1;
  document.getElementById("editEnd").value = 10;
  document.getElementById("editBadge").value = "";
  document.getElementById("editDesc").value = "";
  document.getElementById("editDetails").value = "";
  document.getElementById("deleteTaskBtn").style.display = "none";

  overlay.classList.add("open");
  document.getElementById("editLabel").focus();
}

function closeModal() {
  overlay.classList.remove("open");
  editingTaskId = null;
  isNewTask = false;
}

// Save
form.addEventListener("submit", (e) => {
  e.preventDefault();

  const label = document.getElementById("editLabel").value.trim();
  const phase = document.getElementById("editPhase").value;
  const type = document.getElementById("editType").value;
  const start = parseInt(document.getElementById("editStart").value) || 1;
  const end = parseInt(document.getElementById("editEnd").value) || start;
  const badge = document.getElementById("editBadge").value.trim() || generateBadge(start, end);
  const desc = document.getElementById("editDesc").value.trim();
  const detailsRaw = document.getElementById("editDetails").value.trim();
  const details = detailsRaw ? detailsRaw.split("\n").filter(l => l.trim()) : [];

  const isMilestone = type === "milestone";
  const finalEnd = isMilestone ? start : Math.max(start, end);

  if (isNewTask) {
    // Find insert position: after last task in the phase
    let insertIdx = tasks.length;
    for (let i = tasks.length - 1; i >= 0; i--) {
      if (tasks[i].phase === phase && !tasks[i].isHeader) {
        insertIdx = i + 1;
        break;
      }
    }
    // If no tasks in that phase, insert after the header
    if (insertIdx === tasks.length) {
      for (let i = 0; i < tasks.length; i++) {
        if (tasks[i].phase === phase && tasks[i].isHeader) {
          insertIdx = i + 1;
          break;
        }
      }
    }

    const newTask = {
      id: "task-" + (nextId++),
      label, phase, type,
      start, end: finalEnd,
      badge, description: desc, details,
      isMilestone,
      milestoneType: isMilestone ? phase : undefined
    };

    tasks.splice(insertIdx, 0, newTask);
  } else {
    const task = getTask(editingTaskId);
    if (!task) return;
    task.label = label;
    task.phase = phase;
    task.type = type;
    task.start = start;
    task.end = finalEnd;
    task.badge = badge;
    task.description = desc;
    task.details = details;
    task.isMilestone = isMilestone;
    if (isMilestone) task.milestoneType = phase;
  }

  closeModal();
  renderGantt();
});

// Delete
document.getElementById("deleteTaskBtn").addEventListener("click", () => {
  if (!editingTaskId) return;
  tasks = tasks.filter(t => t.id !== editingTaskId);
  closeModal();
  document.getElementById("detailsContent").innerHTML = '<p class="details-hint">Task deleted. Click on any bar for details.</p>';
  renderGantt();
});

// Close modal
document.getElementById("modalClose").addEventListener("click", closeModal);
document.getElementById("cancelBtn").addEventListener("click", closeModal);
overlay.addEventListener("click", (e) => { if (e.target === overlay) closeModal(); });
document.addEventListener("keydown", (e) => { if (e.key === "Escape" && overlay.classList.contains("open")) closeModal(); });

// Add task button
document.getElementById("addTaskBtn").addEventListener("click", openNewTaskModal);

// === Filters ===
document.querySelectorAll(".filter-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    currentFilter = btn.dataset.filter;
    renderGantt();
  });
});

// === Theme Toggle ===
(function () {
  const t = document.querySelector("[data-theme-toggle]");
  const r = document.documentElement;
  let d = matchMedia("(prefers-color-scheme:dark)").matches ? "dark" : "light";
  r.setAttribute("data-theme", d);
  updateIcon();

  t && t.addEventListener("click", () => {
    d = d === "dark" ? "light" : "dark";
    r.setAttribute("data-theme", d);
    t.setAttribute("aria-label", "Switch to " + (d === "dark" ? "light" : "dark") + " mode");
    updateIcon();
  });

  function updateIcon() {
    if (!t) return;
    t.innerHTML = d === "dark"
      ? '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>'
      : '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';
  }
})();

// === Init ===
renderGantt();
