// ============================================================
//  Multi-Chart Editable Gantt — with Phase Management
// ============================================================

let nextId = 1000;
const uid = () => "id-" + (nextId++);

// ── Color helpers ──────────────────────────────────────────
function hexToRgba(hex, a) {
  const r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16);
  return `rgba(${r},${g},${b},${a})`;
}
function phaseCSS(p) {
  const c = p.color;
  const isDark = document.documentElement.getAttribute("data-theme") === "dark";
  return { bar: isDark ? hexToRgba(c,.18) : hexToRgba(c,.15), border: isDark ? hexToRgba(c,.4) : hexToRgba(c,.35), text: c, solid: c };
}

// ── Default Zego template ──────────────────────────────────
function zegoTemplate() {
  return {
    phases: [
      { id:"sales", name:"Sales", color:"#3b82f6" },
      { id:"contract", name:"Contracting", color:"#8b5cf6" },
      { id:"rm", name:"RM Implementation", color:"#10b981" },
      { id:"zego", name:"Zego Process", color:"#f59e0b" },
      { id:"milestone", name:"Milestone", color:"#ef4444" }
    ],
    tasks: [
      { id:uid(), label:"Phase 1: Sales Qualification", phase:"sales", isHeader:true },
      { id:uid(), label:"Discovery Calls", phase:"sales", type:"sales", start:1, end:10, badge:"Days 1–10",
        description:"Initial discovery calls with prospect.", details:['"Hidden Labor" questions','"Risk & Friction" questions','"Financial Strategy" questions'] },
      { id:uid(), label:"Notate CRM & Qualify", phase:"sales", type:"sales", start:5, end:14, badge:"Days 5–14",
        description:"Document payment needs and workflows in CRM." },
      { id:uid(), label:"Phase 2: Contracting", phase:"contract", isHeader:true },
      { id:uid(), label:"Execute DocuSign Agreement", phase:"contract", type:"contract", start:12, end:20, badge:"Days 12–20",
        description:"Send RM agreement via DocuSign with Partner Document." },
      { id:uid(), label:"Complete Partner Document", phase:"contract", type:"contract", start:14, end:22, badge:"Days 14–22",
        description:"Finalize the RM/Zego Product Pricing Agreement." },
      { id:uid(), label:"Phase 3: Implementation", phase:"rm", isHeader:true },
      { id:uid(), label:"1. RM Account Review", phase:"rm", type:"rm", start:1, end:3, badge:"Day 1",
        description:"Review account and assign to implementation lead." },
      { id:uid(), label:"2. Data Import & Lead Letter", phase:"rm", type:"rm", start:3, end:12, badge:"Varies",
        description:"Import data and send Partner Letter Template to Zego." },
      { id:uid(), label:"Zego Process", phase:"zego", isHeader:true },
      { id:uid(), label:"2.1 Zego Sales Contracting", phase:"zego", type:"zego", start:12, end:40, badge:"<29 Days",
        description:"Zego sales engage with client, collect contracts.",
        details:["W9","Principal Owners DL","Business Utility Bill","Property List & Rent Rolls","Bank Account Info","Voided Check"] },
      { id:uid(), label:"2.2 Zego KYC", phase:"zego", type:"zego", start:20, end:34, badge:"<14 Days",
        description:"KYC process on Principal Owners." },
      { id:uid(), label:"2.3 Zego Due Diligence", phase:"zego", type:"zego", start:25, end:46, badge:"<21 Days",
        description:"Business background check." },
      { id:uid(), label:"2.4 Zego Approved", phase:"zego", type:"milestone", start:46, end:46, isMilestone:true, milestoneType:"zego", badge:"Day 45–60",
        description:"Zego approval milestone." },
      { id:uid(), label:"2.5 Zego Onboarding", phase:"zego", type:"zego", start:46, end:60, badge:"<21 Days",
        description:"Configure, train, and go live.",
        details:["Configure Client Account","Schedule Config Call","Provide Training Docs","Complete RM Database Config"] },
      { id:uid(), label:"Milestones", phase:"milestone", isHeader:true },
      { id:uid(), label:"3. RM Go-Live", phase:"rm", type:"milestone", start:60, end:60, isMilestone:true, milestoneType:"rm", badge:"Day 60",
        description:"RM and Zego fully integrated and active." },
      { id:uid(), label:"4. Implementation Complete", phase:"rm", type:"milestone", start:90, end:90, isMilestone:true, milestoneType:"rm", badge:"Day 90",
        description:"Full implementation complete." }
    ]
  };
}

function blankTemplate() { return { phases:[], tasks:[] }; }

// ── State ──────────────────────────────────────────────────
let charts = [
  { id:"chart-1", name:"Zego Integration", subtitle:"90-Day Implementation Timeline", totalDays:92, ...zegoTemplate() }
];
let activeChartId = "chart-1";
let currentFilter = "all";

function C() { return charts.find(c => c.id === activeChartId); }

// ── Render Orchestrator ────────────────────────────────────
function renderAll() {
  renderChartTabs();
  renderHeader();
  renderLegend();
  renderFilters();
  renderPills();
  renderGantt();
}

// ── Chart Tabs ─────────────────────────────────────────────
function renderChartTabs() {
  const container = document.getElementById("chartTabs");
  container.innerHTML = "";
  charts.forEach(c => {
    const tab = document.createElement("button");
    tab.className = "chart-tab" + (c.id === activeChartId ? " active" : "");
    const nameSpan = document.createElement("span");
    nameSpan.textContent = c.name;
    tab.appendChild(nameSpan);
    tab.addEventListener("click", (e) => {
      if (e.target.closest(".tab-close")) return;
      activeChartId = c.id;
      currentFilter = "all";
      renderAll();
    });
    // Close button (if more than 1 chart)
    if (charts.length > 1) {
      const close = document.createElement("span");
      close.className = "tab-close";
      close.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
      close.addEventListener("click", (e) => {
        e.stopPropagation();
        if (!confirm("Delete chart \"" + c.name + "\"?")) return;
        charts = charts.filter(ch => ch.id !== c.id);
        if (activeChartId === c.id) activeChartId = charts[0].id;
        currentFilter = "all";
        renderAll();
      });
      tab.appendChild(close);
    }
    container.appendChild(tab);
  });
}

// ── Header ─────────────────────────────────────────────────
function renderHeader() {
  const c = C();
  document.getElementById("chartTitle").textContent = c.name;
  document.getElementById("chartSubtitle").textContent = c.subtitle || "";
}

// ── Legend ──────────────────────────────────────────────────
function renderLegend() {
  const container = document.getElementById("legendContainer");
  container.innerHTML = "";
  C().phases.forEach(p => {
    const item = document.createElement("span");
    item.className = "legend-item";
    item.innerHTML = `<span class="dot" style="background:${p.color}"></span>${p.name}`;
    container.appendChild(item);
  });
}

// ── Filters ────────────────────────────────────────────────
function renderFilters() {
  const container = document.getElementById("phaseFilters");
  container.innerHTML = "";
  const allBtn = document.createElement("button");
  allBtn.className = "filter-btn" + (currentFilter === "all" ? " active" : "");
  allBtn.textContent = "All";
  allBtn.addEventListener("click", () => { currentFilter = "all"; renderFilters(); renderGantt(); });
  container.appendChild(allBtn);
  C().phases.forEach(p => {
    const btn = document.createElement("button");
    btn.className = "filter-btn" + (currentFilter === p.id ? " active" : "");
    btn.textContent = p.name;
    btn.addEventListener("click", () => { currentFilter = p.id; renderFilters(); renderGantt(); });
    container.appendChild(btn);
  });
}

// ── Pills ──────────────────────────────────────────────────
function renderPills() {
  const c = C();
  document.getElementById("summaryPills").innerHTML =
    `<span class="pill">Total: ${c.totalDays} days</span>`;
}

// ── Gantt ──────────────────────────────────────────────────
function getDayWidth() { return parseInt(getComputedStyle(document.documentElement).getPropertyValue('--gantt-day-w')) || 12; }

function getPhase(phaseId) { return C().phases.find(p => p.id === phaseId); }
function getPhaseColor(task) {
  const pid = task.type === "milestone" ? (task.milestoneType || task.phase) : task.phase;
  const p = getPhase(pid);
  return p ? p.color : "#6b7280";
}

function renderGantt() {
  const c = C();
  const container = document.getElementById("ganttChart");
  const dayW = getDayWidth();
  const totalDays = c.totalDays || 92;
  container.innerHTML = "";

  // Header
  const header = document.createElement("div"); header.className = "gantt-header";
  const hl = document.createElement("div"); hl.className = "gantt-header-label"; hl.textContent = "Task"; header.appendChild(hl);
  const ht = document.createElement("div"); ht.className = "gantt-header-timeline";
  const wc = document.createElement("div"); wc.className = "gantt-week-header"; wc.style.display = "flex"; wc.style.flexDirection = "column";
  const wr = document.createElement("div"); wr.style.display = "flex";
  const dr = document.createElement("div"); dr.className = "gantt-day-labels";
  for (let d = 1; d <= totalDays; d++) {
    if ((d-1) % 7 === 0) { const w = document.createElement("div"); w.className = "gantt-week-label"; w.style.width = (Math.min(7, totalDays - d + 1) * dayW) + "px"; w.textContent = "W" + Math.ceil(d/7); wr.appendChild(w); }
    const dl = document.createElement("div"); dl.className = "gantt-day-label" + ((d-1)%7===0 ? " week-start" : ""); dl.style.width = dayW + "px"; if (d % 5 === 0) dl.textContent = d; dr.appendChild(dl);
  }
  wc.appendChild(wr); wc.appendChild(dr); ht.appendChild(wc); header.appendChild(ht); container.appendChild(header);

  // Body
  const body = document.createElement("div"); body.className = "gantt-body";
  const filtered = c.tasks.filter(t => currentFilter === "all" || t.phase === currentFilter || (t.type === "milestone" && currentFilter === "milestone"));

  filtered.forEach((task, i) => {
    const row = document.createElement("div");
    row.className = "gantt-row" + (task.isHeader ? " phase-header" : "");
    row.style.animationDelay = (i * 15) + "ms";

    const labelCell = document.createElement("div"); labelCell.className = "gantt-row-label";
    if (!task.isHeader) {
      const dot = document.createElement("span"); dot.className = "dot"; dot.style.background = getPhaseColor(task); labelCell.appendChild(dot);
    }
    const lt = document.createElement("span"); lt.className = "label-text"; lt.textContent = task.label; lt.title = task.label; labelCell.appendChild(lt);
    if (task.badge && !task.isHeader) {
      const badge = document.createElement("span"); badge.className = "label-badge";
      const col = getPhaseColor(task);
      badge.style.background = hexToRgba(col, 0.12); badge.style.color = col; badge.textContent = task.badge; labelCell.appendChild(badge);
    }
    if (!task.isHeader) {
      const eb = document.createElement("button"); eb.className = "row-edit-btn"; eb.title = "Edit";
      eb.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>';
      eb.addEventListener("click", (e) => { e.stopPropagation(); openTaskModal(task.id); }); labelCell.appendChild(eb);
    }
    row.appendChild(labelCell);

    const tc = document.createElement("div"); tc.className = "gantt-row-timeline";
    for (let d = 1; d <= totalDays; d++) { if ((d-1)%7===0) { const gl = document.createElement("div"); gl.className = "gantt-gridline week-line"; gl.style.left = ((d-1)*dayW)+"px"; tc.appendChild(gl); } }

    if (!task.isHeader && task.start != null) {
      if (task.isMilestone) {
        const dm = document.createElement("div"); dm.className = "gantt-milestone"; dm.style.background = getPhaseColor(task);
        dm.style.left = ((task.start-1)*dayW + dayW/2)+"px"; dm.dataset.taskId = task.id;
        dm.addEventListener("click", () => showDetails(task));
        dm.addEventListener("dblclick", (e) => { e.stopPropagation(); openTaskModal(task.id); });
        makeMilestoneDraggable(dm, task, totalDays); tc.appendChild(dm);
      } else {
        const bar = document.createElement("div"); bar.className = "gantt-bar";
        const col = getPhaseColor(task);
        bar.style.background = hexToRgba(col, 0.15); bar.style.border = "1.5px solid " + hexToRgba(col, 0.35); bar.style.color = col;
        bar.style.left = ((task.start-1)*dayW)+"px"; bar.style.width = ((task.end - task.start + 1)*dayW)+"px";
        bar.style.animationDelay = (i*25+60)+"ms"; bar.dataset.taskId = task.id;
        const hL = document.createElement("div"); hL.className = "bar-handle bar-handle-left";
        const hR = document.createElement("div"); hR.className = "bar-handle bar-handle-right";
        bar.appendChild(hL); bar.appendChild(hR);
        bar.addEventListener("click", (e) => { if (!e.target.classList.contains("bar-handle")) { selectTask(task.id); showDetails(task); } });
        bar.addEventListener("dblclick", (e) => { e.stopPropagation(); openTaskModal(task.id); });
        makeBarDraggable(bar, task, totalDays);
        makeBarResizable(hL, task, "left", totalDays); makeBarResizable(hR, task, "right", totalDays);
        tc.appendChild(bar);
      }
    }
    row.appendChild(tc); body.appendChild(row);
  });
  container.appendChild(body);
}

// ── Selection & Details ────────────────────────────────────
function selectTask(id) {
  document.querySelectorAll(".gantt-bar.selected").forEach(b => b.classList.remove("selected"));
  const bar = document.querySelector(`.gantt-bar[data-task-id="${id}"]`);
  if (bar) bar.classList.add("selected");
}

function showDetails(task) {
  const panel = document.getElementById("detailsContent");
  const col = getPhaseColor(task);
  const p = getPhase(task.phase);
  let html = `<div class="details-title"><span class="dot" style="width:12px;height:12px;background:${col}"></span>${task.label}</div><div class="details-meta">`;
  if (task.start != null && task.end != null && task.start !== task.end) html += `<div class="details-meta-item"><strong>Duration:</strong> Day ${task.start} → ${task.end} (${task.end-task.start+1} days)</div>`;
  else if (task.start != null) html += `<div class="details-meta-item"><strong>Target:</strong> Day ${task.start}</div>`;
  if (p) html += `<div class="details-meta-item"><strong>Phase:</strong> ${p.name}</div>`;
  html += `</div><div class="details-description">${task.description||''}`;
  if (task.details?.length) html += `<ul>${task.details.map(d=>`<li>${d}</li>`).join("")}</ul>`;
  html += `</div>`;
  panel.innerHTML = html;
}

// ── Drag / Resize (unchanged logic) ───────────────────────
function makeBarDraggable(bar, task, totalDays) {
  let sx, os, oe, drag=false;
  const dw = () => getDayWidth();
  function down(e) { if(e.target.classList.contains("bar-handle"))return; e.preventDefault(); drag=true; sx=e.clientX||(e.touches&&e.touches[0].clientX); os=task.start; oe=task.end; bar.classList.add("dragging"); document.addEventListener("mousemove",move); document.addEventListener("mouseup",up); document.addEventListener("touchmove",move,{passive:false}); document.addEventListener("touchend",up); }
  function move(e) { if(!drag)return; e.preventDefault(); const cx=e.clientX||(e.touches&&e.touches[0].clientX); const dd=Math.round((cx-sx)/dw()); const dur=oe-os; let ns=os+dd,ne=ns+dur; if(ns<1){ns=1;ne=1+dur;} if(ne>totalDays){ne=totalDays;ns=totalDays-dur;} task.start=ns;task.end=ne; bar.style.left=((ns-1)*dw())+"px"; showDragTooltip(e,`Day ${ns} → ${ne}`); }
  function up() { drag=false; bar.classList.remove("dragging"); task.badge=genBadge(task.start,task.end); removeDragTooltip(); renderGantt(); showDetails(task); document.removeEventListener("mousemove",move); document.removeEventListener("mouseup",up); document.removeEventListener("touchmove",move); document.removeEventListener("touchend",up); }
  bar.addEventListener("mousedown",down); bar.addEventListener("touchstart",down,{passive:false});
}
function makeBarResizable(handle, task, side, totalDays) {
  let sx,os,oe,drag=false;
  const dw=()=>getDayWidth();
  function down(e){e.preventDefault();e.stopPropagation();drag=true;sx=e.clientX||(e.touches&&e.touches[0].clientX);os=task.start;oe=task.end;document.addEventListener("mousemove",move);document.addEventListener("mouseup",up);document.addEventListener("touchmove",move,{passive:false});document.addEventListener("touchend",up);}
  function move(e){if(!drag)return;e.preventDefault();const cx=e.clientX||(e.touches&&e.touches[0].clientX);const dd=Math.round((cx-sx)/dw());if(side==="left")task.start=Math.max(1,Math.min(os+dd,task.end-1));else task.end=Math.min(totalDays,Math.max(oe+dd,task.start+1));const b=handle.parentElement;b.style.left=((task.start-1)*dw())+"px";b.style.width=((task.end-task.start+1)*dw())+"px";showDragTooltip(e,`Day ${task.start} → ${task.end} (${task.end-task.start+1}d)`);}
  function up(){drag=false;task.badge=genBadge(task.start,task.end);removeDragTooltip();renderGantt();showDetails(task);document.removeEventListener("mousemove",move);document.removeEventListener("mouseup",up);document.removeEventListener("touchmove",move);document.removeEventListener("touchend",up);}
  handle.addEventListener("mousedown",down);handle.addEventListener("touchstart",down,{passive:false});
}
function makeMilestoneDraggable(el, task, totalDays) {
  let sx,os,drag=false;const dw=()=>getDayWidth();
  function down(e){e.preventDefault();drag=true;sx=e.clientX||(e.touches&&e.touches[0].clientX);os=task.start;document.addEventListener("mousemove",move);document.addEventListener("mouseup",up);}
  function move(e){if(!drag)return;const dd=Math.round((e.clientX-sx)/dw());let nd=Math.max(1,Math.min(totalDays,os+dd));task.start=nd;task.end=nd;el.style.left=((nd-1)*dw()+dw()/2)+"px";showDragTooltip(e,`Day ${nd}`);}
  function up(){drag=false;task.badge="Day "+task.start;removeDragTooltip();renderGantt();showDetails(task);document.removeEventListener("mousemove",move);document.removeEventListener("mouseup",up);}
  el.addEventListener("mousedown",down);
}
function showDragTooltip(e,text){let t=document.querySelector(".drag-tooltip");if(!t){t=document.createElement("div");t.className="drag-tooltip";document.body.appendChild(t);}t.textContent=text;const cx=e.clientX||(e.touches&&e.touches[0].clientX)||0;const cy=e.clientY||(e.touches&&e.touches[0].clientY)||0;t.style.left=(cx+14)+"px";t.style.top=(cy-28)+"px";}
function removeDragTooltip(){const t=document.querySelector(".drag-tooltip");if(t)t.remove();}
function genBadge(s,e){return s===e?"Day "+s:"Days "+s+"–"+e;}

// ── Task Modal ─────────────────────────────────────────────
let editingTaskId = null, isNewTask = false;
const taskOverlay = document.getElementById("taskModalOverlay");
const taskForm = document.getElementById("taskForm");

function populatePhaseSelects() {
  const c = C();
  ["editPhase","editType"].forEach(sid => {
    const sel = document.getElementById(sid);
    sel.innerHTML = "";
    c.phases.forEach(p => {
      const o = document.createElement("option"); o.value = p.id; o.textContent = p.name + (sid==="editType"?" Bar":""); sel.appendChild(o);
    });
    if (sid === "editType") {
      const mo = document.createElement("option"); mo.value = "milestone"; mo.textContent = "Milestone Diamond"; sel.appendChild(mo);
    }
  });
}

function openTaskModal(taskId) {
  const c = C(); const task = c.tasks.find(t=>t.id===taskId); if(!task) return;
  editingTaskId = taskId; isNewTask = false;
  populatePhaseSelects();
  document.getElementById("taskModalTitle").textContent = "Edit Task";
  document.getElementById("editLabel").value = task.label;
  document.getElementById("editPhase").value = task.phase;
  document.getElementById("editType").value = task.type || task.phase;
  document.getElementById("editStart").value = task.start || 1;
  document.getElementById("editEnd").value = task.end || 1;
  document.getElementById("editBadge").value = task.badge || "";
  document.getElementById("editDesc").value = task.description || "";
  document.getElementById("editDetails").value = (task.details||[]).join("\n");
  document.getElementById("deleteTaskBtn").style.display = "";
  taskOverlay.classList.add("open");
  document.getElementById("editLabel").focus();
}

function openNewTaskModal() {
  isNewTask = true; editingTaskId = null;
  populatePhaseSelects();
  document.getElementById("taskModalTitle").textContent = "Add New Task";
  document.getElementById("editLabel").value = "";
  document.getElementById("editPhase").value = C().phases[0]?.id || "";
  document.getElementById("editType").value = C().phases[0]?.id || "";
  document.getElementById("editStart").value = 1;
  document.getElementById("editEnd").value = 10;
  document.getElementById("editBadge").value = "";
  document.getElementById("editDesc").value = "";
  document.getElementById("editDetails").value = "";
  document.getElementById("deleteTaskBtn").style.display = "none";
  taskOverlay.classList.add("open");
  document.getElementById("editLabel").focus();
}

function closeTaskModal() { taskOverlay.classList.remove("open"); }

taskForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const c = C();
  const label = document.getElementById("editLabel").value.trim();
  const phase = document.getElementById("editPhase").value;
  const type = document.getElementById("editType").value;
  const start = parseInt(document.getElementById("editStart").value) || 1;
  const end = parseInt(document.getElementById("editEnd").value) || start;
  const badge = document.getElementById("editBadge").value.trim() || genBadge(start, type==="milestone"?start:Math.max(start,end));
  const desc = document.getElementById("editDesc").value.trim();
  const detailsRaw = document.getElementById("editDetails").value.trim();
  const details = detailsRaw ? detailsRaw.split("\n").filter(l=>l.trim()) : [];
  const isMilestone = type === "milestone";
  const finalEnd = isMilestone ? start : Math.max(start, end);

  if (isNewTask) {
    let idx = c.tasks.length;
    for (let i = c.tasks.length-1; i >= 0; i--) { if(c.tasks[i].phase===phase && !c.tasks[i].isHeader){idx=i+1;break;} }
    if (idx===c.tasks.length) { for(let i=0;i<c.tasks.length;i++){if(c.tasks[i].phase===phase&&c.tasks[i].isHeader){idx=i+1;break;}} }
    c.tasks.splice(idx, 0, { id:uid(), label, phase, type, start, end:finalEnd, badge, description:desc, details, isMilestone, milestoneType:isMilestone?phase:undefined });
  } else {
    const task = c.tasks.find(t=>t.id===editingTaskId); if(!task)return;
    Object.assign(task, { label, phase, type, start, end:finalEnd, badge, description:desc, details, isMilestone, milestoneType:isMilestone?phase:undefined });
  }
  closeTaskModal(); renderAll();
});

document.getElementById("deleteTaskBtn").addEventListener("click", () => {
  if(!editingTaskId) return;
  const c = C(); c.tasks = c.tasks.filter(t=>t.id!==editingTaskId);
  closeTaskModal(); document.getElementById("detailsContent").innerHTML='<p class="details-hint">Task deleted.</p>'; renderAll();
});

document.getElementById("taskModalClose").addEventListener("click", closeTaskModal);
document.getElementById("taskCancelBtn").addEventListener("click", closeTaskModal);
taskOverlay.addEventListener("click", (e) => { if(e.target===taskOverlay) closeTaskModal(); });

document.getElementById("addTaskBtn").addEventListener("click", openNewTaskModal);

// ── Phase Manager Modal ────────────────────────────────────
const phaseOverlay = document.getElementById("phaseModalOverlay");

function openPhaseManager() {
  renderPhaseList(); phaseOverlay.classList.add("open");
}
function closePhaseManager() { phaseOverlay.classList.remove("open"); renderAll(); }

function renderPhaseList() {
  const c = C(); const body = document.getElementById("phaseManagerBody"); body.innerHTML = "";
  c.phases.forEach(p => {
    const row = document.createElement("div"); row.className = "phase-row";
    // Color swatch + hidden color input
    const swatch = document.createElement("div"); swatch.className = "phase-swatch"; swatch.style.background = p.color;
    const colorInput = document.createElement("input"); colorInput.type = "color"; colorInput.value = p.color;
    colorInput.addEventListener("input", (e) => { p.color = e.target.value; swatch.style.background = p.color; });
    swatch.addEventListener("click", () => colorInput.click());
    row.appendChild(swatch); row.appendChild(colorInput);
    // Name (editable)
    const nameEl = document.createElement("input"); nameEl.className = "phase-name phase-input"; nameEl.value = p.name;
    nameEl.style.border = "none"; nameEl.style.background = "transparent"; nameEl.style.padding = "0";
    nameEl.addEventListener("change", () => { p.name = nameEl.value.trim() || p.name; });
    row.appendChild(nameEl);
    // Task count
    const count = document.createElement("span"); count.className = "phase-count";
    const taskCount = c.tasks.filter(t=>t.phase===p.id && !t.isHeader).length;
    count.textContent = taskCount + " task" + (taskCount!==1?"s":"");
    row.appendChild(count);
    // Delete
    const del = document.createElement("button"); del.className = "phase-del"; del.title = "Remove phase";
    del.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
    del.addEventListener("click", () => {
      if (taskCount > 0 && !confirm(`Phase "${p.name}" has ${taskCount} tasks. Delete phase and all its tasks?`)) return;
      c.tasks = c.tasks.filter(t => t.phase !== p.id);
      c.phases = c.phases.filter(ph => ph.id !== p.id);
      renderPhaseList();
    });
    row.appendChild(del);
    body.appendChild(row);
  });
}

document.getElementById("addPhaseBtn").addEventListener("click", () => {
  const nameInput = document.getElementById("newPhaseName");
  const colorInput = document.getElementById("newPhaseColor");
  const name = nameInput.value.trim(); if(!name) return;
  const c = C();
  const id = name.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/-+$/,"") + "-" + uid();
  c.phases.push({ id, name, color:colorInput.value });
  // Add a header row for the new phase
  c.tasks.push({ id:uid(), label:name, phase:id, isHeader:true });
  nameInput.value = "";
  renderPhaseList();
});

document.getElementById("managePhasesBtn").addEventListener("click", openPhaseManager);
document.getElementById("phaseModalClose").addEventListener("click", closePhaseManager);
document.getElementById("phaseModalDone").addEventListener("click", closePhaseManager);
phaseOverlay.addEventListener("click", (e) => { if(e.target===phaseOverlay) closePhaseManager(); });

// ── Chart Modal (New / Duplicate) ──────────────────────────
const chartOverlay = document.getElementById("chartModalOverlay");
const chartForm = document.getElementById("chartForm");
let duplicatingFrom = null;

document.getElementById("newChartBtn").addEventListener("click", () => {
  duplicatingFrom = null;
  document.getElementById("chartModalTitle").textContent = "New Chart";
  document.getElementById("chartNameInput").value = "";
  document.getElementById("chartSubInput").value = "";
  document.getElementById("chartDaysInput").value = 90;
  document.getElementById("chartTemplateSelect").value = "blank";
  document.getElementById("chartTemplateSelect").parentElement.style.display = "";
  chartOverlay.classList.add("open");
  document.getElementById("chartNameInput").focus();
});

document.getElementById("duplicateChartBtn").addEventListener("click", () => {
  const c = C();
  duplicatingFrom = c.id;
  document.getElementById("chartModalTitle").textContent = "Duplicate Chart";
  document.getElementById("chartNameInput").value = c.name + " (Copy)";
  document.getElementById("chartSubInput").value = c.subtitle || "";
  document.getElementById("chartDaysInput").value = c.totalDays;
  document.getElementById("chartTemplateSelect").parentElement.style.display = "none";
  chartOverlay.classList.add("open");
  document.getElementById("chartNameInput").focus();
});

function closeChartModal() { chartOverlay.classList.remove("open"); duplicatingFrom = null; }

chartForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const name = document.getElementById("chartNameInput").value.trim(); if(!name) return;
  const sub = document.getElementById("chartSubInput").value.trim();
  const days = parseInt(document.getElementById("chartDaysInput").value) || 90;
  const newId = "chart-" + uid();

  if (duplicatingFrom) {
    const src = charts.find(c=>c.id===duplicatingFrom);
    const clone = JSON.parse(JSON.stringify(src));
    clone.id = newId; clone.name = name; clone.subtitle = sub; clone.totalDays = days;
    // Reset task IDs
    clone.tasks.forEach(t => { t.id = uid(); });
    charts.push(clone);
  } else {
    const tmpl = document.getElementById("chartTemplateSelect").value;
    const data = tmpl === "zego" ? zegoTemplate() : blankTemplate();
    charts.push({ id:newId, name, subtitle:sub, totalDays:days+2, ...data });
  }

  activeChartId = newId; currentFilter = "all";
  closeChartModal(); renderAll();
});

document.getElementById("chartModalClose").addEventListener("click", closeChartModal);
document.getElementById("chartCancelBtn").addEventListener("click", closeChartModal);
chartOverlay.addEventListener("click", (e) => { if(e.target===chartOverlay) closeChartModal(); });

// Delete chart button
document.getElementById("deleteChartBtn").addEventListener("click", () => {
  if (charts.length <= 1) { alert("Cannot delete the only chart."); return; }
  if (!confirm("Delete chart \"" + C().name + "\"?")) return;
  charts = charts.filter(c => c.id !== activeChartId);
  activeChartId = charts[0].id; currentFilter = "all"; renderAll();
});

// ── Edit Title Inline ──────────────────────────────────────
document.getElementById("editTitleBtn").addEventListener("click", () => {
  const el = document.getElementById("chartTitle");
  el.contentEditable = "true"; el.focus();
  const range = document.createRange(); range.selectNodeContents(el); const sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(range);
});
document.getElementById("chartTitle").addEventListener("blur", () => {
  const el = document.getElementById("chartTitle"); el.contentEditable = "false";
  const c = C(); c.name = el.textContent.trim() || c.name; renderChartTabs();
});
document.getElementById("chartTitle").addEventListener("keydown", (e) => { if(e.key==="Enter"){e.preventDefault(); document.getElementById("chartTitle").blur();} });

// ── Escape key ─────────────────────────────────────────────
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") { closeTaskModal(); closePhaseManager(); closeChartModal(); }
});

// ── Theme Toggle ───────────────────────────────────────────
(function(){const t=document.querySelector("[data-theme-toggle]"),r=document.documentElement;let d=matchMedia("(prefers-color-scheme:dark)").matches?"dark":"light";r.setAttribute("data-theme",d);upd();t&&t.addEventListener("click",()=>{d=d==="dark"?"light":"dark";r.setAttribute("data-theme",d);upd();renderGantt();});function upd(){if(!t)return;t.innerHTML=d==="dark"?'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>':'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';}})();

// ── Init ───────────────────────────────────────────────────
renderAll();
