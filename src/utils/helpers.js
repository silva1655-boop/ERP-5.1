export const fmt = d => d ? new Date(d).toLocaleDateString("es-CL",{day:"2-digit",month:"2-digit",year:"numeric"}) : "—";
export const fmtDT = d => d ? new Date(d).toLocaleString("es-CL",{day:"2-digit",month:"2-digit",year:"numeric",hour:"2-digit",minute:"2-digit"}) : "—";
export const uid = () => Math.random().toString(36).slice(2,10);
export const nextOTCode = wos => `OT-${new Date().getFullYear()}-${String(wos.length+1).padStart(3,"0")}`;

export function downloadCSV(filename, rows) {
  if (!rows || rows.length === 0) return;
  const cols = Object.keys(rows[0]);
  const escape = v => { const s = String(v == null ? "" : v); return s.includes(",") || s.includes('"') || s.includes("\n") ? `"${s.replace(/"/g,'""')}"` : s; };
  const csv = [cols.join(","), ...rows.map(r => cols.map(c => escape(r[c])).join(","))].join("\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob(["﻿" + csv], {type:"text/csv;charset=utf-8"}));
  a.download = filename; a.click(); URL.revokeObjectURL(a.href);
}

export function printOT(ot, req, equipList, usersList) {
  const eq = equipList.find(e => e.id === ot.equipId) || equipList.find(e => e.id === req?.equipId);
  const mec = usersList.find(u => u.id === ot.assignedTo);
  const reqBy = usersList.find(u => u.id === req?.requestedBy);
  const esc = s => String(s || "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
  const SUBSIST = {electrico:"Eléctrico",hidraulico:"Hidráulico",mecanico:"Mecánico",neumatico:"Neumático"};
  const w = window.open("","_blank","width=900,height=700");
  w.document.write(`<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"/><title>OT ${esc(ot.code)}</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0;}
    body{font-family:Arial,sans-serif;font-size:12px;color:#1a1a1a;background:#fff;}
    .header{background:#002060;color:#fff;padding:20px 32px;display:flex;align-items:center;gap:20px;}
    .header-title{font-size:22px;font-weight:bold;letter-spacing:1px;}
    .header-sub{font-size:13px;opacity:0.8;margin-top:4px;}
    .body{padding:24px 32px;}
    h2{font-size:14px;font-weight:bold;color:#002060;border-bottom:2px solid #002060;padding-bottom:4px;margin:18px 0 10px;}
    table{width:100%;border-collapse:collapse;margin-bottom:12px;}
    th{background:#e8f2fb;color:#002060;font-size:11px;text-align:left;padding:6px 10px;border:1px solid #c0d8ee;}
    td{padding:6px 10px;border:1px solid #dde6f0;vertical-align:top;}
    .label{font-weight:bold;color:#555;width:38%;}
    .section{background:#f8fafd;border:1px solid #dde6f0;border-radius:6px;padding:12px 16px;margin-bottom:12px;}
    .badge-high{background:#fee2e2;color:#b91c1c;padding:2px 8px;border-radius:12px;font-weight:bold;font-size:11px;}
    .badge-med{background:#fef3c7;color:#92400e;padding:2px 8px;border-radius:12px;font-weight:bold;font-size:11px;}
    .badge-low{background:#d1fae5;color:#065f46;padding:2px 8px;border-radius:12px;font-weight:bold;font-size:11px;}
    .footer{margin-top:40px;display:grid;grid-template-columns:1fr 1fr;gap:60px;padding:0 20px;}
    .sig-line{border-top:1.5px solid #333;margin-top:48px;padding-top:6px;font-size:11px;text-align:center;color:#555;}
    @media print{body{margin:0;}button{display:none;}}
  </style></head><body>
  <div class="header">
    <div>
      <div class="header-title">NAVIMAG FERRIES</div>
      <div class="header-sub">Orden de Trabajo — Departamento de Mantenimiento</div>
    </div>
    <div style="margin-left:auto;text-align:right;">
      <div style="font-size:18px;font-weight:bold;">${esc(ot.code)}</div>
      <div style="font-size:11px;opacity:0.7;">${new Date(ot.createdAt).toLocaleDateString("es-CL")}</div>
    </div>
  </div>
  <div class="body">
    <h2>Detalles de la Orden de Trabajo</h2>
    <table>
      <tr><td class="label">Código OT</td><td><strong>${esc(ot.code)}</strong></td><td class="label">Tipo</td><td>${esc(ot.type)}</td></tr>
      <tr><td class="label">Equipo</td><td>${esc(eq?.code||"")} — ${esc(eq?.name||"")}</td><td class="label">Ubicación</td><td>${esc(eq?.location||"")}</td></tr>
      <tr><td class="label">Prioridad</td><td><span class="${ot.priority==="alta"?"badge-high":ot.priority==="media"?"badge-med":"badge-low"}">${esc(ot.priority?.toUpperCase())}</span></td><td class="label">Estado</td><td>${esc(ot.status)}</td></tr>
      <tr><td class="label">Fecha Creación</td><td>${new Date(ot.createdAt).toLocaleDateString("es-CL")}</td><td class="label">Fecha Programada</td><td>${ot.scheduledDate?new Date(ot.scheduledDate).toLocaleDateString("es-CL"):"—"}</td></tr>
      <tr><td class="label">Horas Estimadas</td><td>${esc(ot.estimatedHours)}h</td><td class="label">Horas Reales</td><td>${ot.actualHours!=null?esc(ot.actualHours)+"h":"—"}</td></tr>
    </table>
    <h2>Mecánico Responsable</h2>
    <div class="section">${esc(mec?.name||"Sin asignar")}</div>
    ${ot.description?`<h2>Descripción / Trabajos a Realizar</h2><div class="section" style="white-space:pre-line;">${esc(ot.description)}</div>`:""}
    ${ot.observations?`<h2>Observaciones</h2><div class="section" style="white-space:pre-line;">${esc(ot.observations)}</div>`:""}
    ${Array.isArray(ot.parts)&&ot.parts.length>0?`<h2>Repuestos / Partes</h2><div class="section">${ot.parts.map(p=>`<div>• ${esc(p)}</div>`).join("")}</div>`:""}
    ${req?`<h2>Solicitud de Origen</h2>
    <table>
      <tr><td class="label">Solicitante</td><td>${esc(reqBy?.name||"—")}</td><td class="label">Fecha Solicitud</td><td>${req.requestedAt?new Date(req.requestedAt).toLocaleDateString("es-CL"):"—"}</td></tr>
      ${req.subsistema?`<tr><td class="label">Subsistema</td><td>${esc(SUBSIST[req.subsistema]||req.subsistema)}</td><td class="label">Componente</td><td>${esc(req.componente||"—")}</td></tr>`:""}
      ${req.source==="checklist"?`<tr><td class="label">Origen</td><td colspan="3">Checklist Pre-operacional</td></tr>`:""}
    </table>`:""}
    <div class="footer">
      <div>${ot.mechanicSignature?`<img src="${ot.mechanicSignature}" style="max-height:60px;margin-bottom:4px;"/>`:`<div style="height:60px;"></div>`}<div class="sig-line">Mecánico Responsable — ${esc(mec?.name||"")}<br/><span style="font-size:10px;color:#999;">Nombre y Firma</span></div></div>
      <div><div style="height:60px;"></div><div class="sig-line">Supervisor<br/><span style="font-size:10px;color:#999;">Nombre y Firma</span></div></div>
    </div>
  </div>
  </body></html>`);
  w.document.close();
  w.focus();
  w.print();
}

export function printMonthlyReport(data, equipList, usersList, month) {
  const {wos, requests, checklists} = data;
  const ST_LOCAL = {
    pendiente:{label:"Pendiente"}, asignada:{label:"Asignada"}, en_proceso:{label:"En Proceso"},
    completada:{label:"Completada"}, cancelada:{label:"Cancelada"}, aprobada:{label:"Aprobada"},
    rechazada:{label:"Rechazada"}, revisado:{label:"Revisado"},
  };
  const allCL = checklists || [];
  const monthWOs = wos.filter(w => w.createdAt?.startsWith(month));
  const monthCompleted = monthWOs.filter(w => w.status === "completada");
  const monthPrev = monthWOs.filter(w => w.type === "preventivo");
  const monthCorr = monthWOs.filter(w => w.type === "correctivo");
  const monthHrs = monthCompleted.reduce((s, w) => s + (w.actualHours || 0), 0);
  const compRate = monthWOs.length > 0 ? ((monthCompleted.length / monthWOs.length) * 100).toFixed(1) : "N/D";
  const monthReqs = requests.filter(r => r.requestedAt?.startsWith(month));
  const monthCL = allCL.filter(c => c.createdAt?.startsWith(month));
  const monthLabel = new Date(month + "-01").toLocaleDateString("es-CL", {month:"long",year:"numeric"});
  const esc = s => String(s || "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
  const byEquip = equipList.map(e => {
    const ots = monthWOs.filter(w => w.equipId === e.id);
    const comp = ots.filter(w => w.status === "completada");
    const hrs = comp.reduce((s, w) => s + (w.actualHours || 0), 0);
    const cls = monthCL.filter(c => c.equipId === e.id);
    const disp = ots.length > 0 && hrs > 0 ? Math.max(0, 100 - (hrs / 730) * 100).toFixed(1) : "N/D";
    return { ...e, ots: ots.length, comp: comp.length, hrs, cls: cls.length, disp };
  }).filter(e => e.ots > 0 || e.cls > 0);
  const w = window.open("", "_blank", "width=900,height=700");
  w.document.write(`<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"/><title>Informe Mensual ${monthLabel}</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0;}
    body{font-family:Arial,sans-serif;font-size:12px;color:#1a1a1a;background:#fff;}
    .header{background:#002060;color:#fff;padding:20px 32px;display:flex;align-items:center;gap:20px;}
    .header-title{font-size:22px;font-weight:bold;letter-spacing:1px;}
    .header-sub{font-size:13px;opacity:0.8;margin-top:4px;}
    .body{padding:24px 32px;}
    h2{font-size:14px;font-weight:bold;color:#002060;border-bottom:2px solid #002060;padding-bottom:4px;margin:18px 0 10px;}
    .kpi-grid{display:grid;grid-template-columns:repeat(5,1fr);gap:12px;margin-bottom:18px;}
    .kpi{background:#e8f2fb;border:1px solid #c0d8ee;border-radius:8px;padding:12px;text-align:center;}
    .kpi-val{font-size:22px;font-weight:bold;color:#002060;}
    .kpi-lbl{font-size:10px;color:#555;margin-top:3px;}
    table{width:100%;border-collapse:collapse;margin-bottom:12px;}
    th{background:#e8f2fb;color:#002060;font-size:11px;text-align:left;padding:6px 10px;border:1px solid #c0d8ee;}
    td{padding:6px 10px;border:1px solid #dde6f0;vertical-align:top;font-size:11px;}
    .footer{margin-top:32px;font-size:10px;color:#999;border-top:1px solid #dde6f0;padding-top:12px;}
    @media print{body{margin:0;}button{display:none;}}
  </style></head><body>
  <div class="header">
    <div>
      <div class="header-title">NAVIMAG FERRIES</div>
      <div class="header-sub">Informe Mensual de Mantenimiento — ${esc(monthLabel)}</div>
    </div>
    <div style="margin-left:auto;text-align:right;font-size:11px;opacity:0.8;">Generado: ${new Date().toLocaleDateString("es-CL")}</div>
  </div>
  <div class="body">
    <h2>Resumen del Mes</h2>
    <div class="kpi-grid">
      <div class="kpi"><div class="kpi-val">${monthWOs.length}</div><div class="kpi-lbl">Total OT</div></div>
      <div class="kpi"><div class="kpi-val">${monthPrev.length}</div><div class="kpi-lbl">Preventivas</div></div>
      <div class="kpi"><div class="kpi-val">${monthCorr.length}</div><div class="kpi-lbl">Correctivas</div></div>
      <div class="kpi"><div class="kpi-val">${monthHrs.toFixed(1)}h</div><div class="kpi-lbl">Horas Totales</div></div>
      <div class="kpi"><div class="kpi-val">${compRate}%</div><div class="kpi-lbl">Tasa Completación</div></div>
    </div>
    <h2>OT por Equipo</h2>
    <table>
      <tr><th>Código</th><th>Equipo</th><th>Total OT</th><th>Completadas</th><th>Horas</th><th>Disp. Est.</th></tr>
      ${byEquip.filter(e=>e.ots>0).map(e=>`<tr><td><strong>${esc(e.code)}</strong></td><td>${esc(e.name)}</td><td>${e.ots}</td><td>${e.comp}</td><td>${e.hrs.toFixed(1)}h</td><td>${e.disp}${e.disp!=="N/D"?"%":""}</td></tr>`).join("")}
      ${byEquip.filter(e=>e.ots>0).length===0?`<tr><td colspan="6" style="text-align:center;color:#9ca3af;">Sin OT este mes</td></tr>`:""}
    </table>
    <h2>Solicitudes de Reparación</h2>
    <table>
      <tr><th>Estado</th><th>Cantidad</th></tr>
      ${["pendiente","aprobada","rechazada","completada"].map(s=>`<tr><td>${ST_LOCAL[s]?.label||s}</td><td>${monthReqs.filter(r=>r.status===s).length}</td></tr>`).join("")}
      <tr><td><strong>Total</strong></td><td><strong>${monthReqs.length}</strong></td></tr>
    </table>
    <h2>Checklists Pre-operacionales</h2>
    <table>
      <tr><th>Equipo</th><th>Checklists</th><th>Con Observaciones</th></tr>
      ${byEquip.filter(e=>e.cls>0).map(e=>{const issueCount=monthCL.filter(c=>c.equipId===e.id&&c.hasIssues).length;return`<tr><td>${esc(e.code)} — ${esc(e.name)}</td><td>${e.cls}</td><td>${issueCount}</td></tr>`;}).join("")}
      ${byEquip.filter(e=>e.cls>0).length===0?`<tr><td colspan="3" style="text-align:center;color:#9ca3af;">Sin checklists este mes</td></tr>`:""}
      <tr><td><strong>Total</strong></td><td><strong>${monthCL.length}</strong></td><td><strong>${monthCL.filter(c=>c.hasIssues).length}</strong></td></tr>
    </table>
    <div class="footer">Informe generado automáticamente por MANTEK ERP · Navimag Ferries · ${new Date().toLocaleString("es-CL")}</div>
  </div>
  </body></html>`);
  w.document.close();
  w.focus();
  w.print();
}
