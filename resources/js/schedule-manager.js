/**
 * Manufacturing Execution System (MES) - Sewing Line Production Scheduler
 * High-Precision Gantt Matrix & Cascade Dynamic Balancing Engine
 */

class ProductionScheduler {
    constructor() {
        this.timelineStart = new Date('2026-03-01T00:00:00');
        this.timelineDays = 14; // 14 Days window (1 Mar - 14 Mar 2026)

        this.lines = [
            { id: 1, code: 'LINE-01', name: 'Line 01 - Shirt & Polo', capacity: 400, operators: 38 },
            { id: 2, code: 'LINE-02', name: 'Line 02 - Outerwear & Jacket', capacity: 300, operators: 42 },
            { id: 3, code: 'LINE-03', name: 'Line 03 - Trousers & Chino', capacity: 500, operators: 35 },
        ];

        this.initialSchedules = [
            {
                id: 101,
                line_code: 'LINE-01',
                order_no: 'PO-2026-001',
                buyer: 'Uniqlo Japan',
                style: 'Dry-EX Pique Polo',
                start_date: '2026-03-01',
                finish_date: '2026-03-03', // 3 Hari: 1, 2, 3 Maret
                total_target_qty: 1000,
                total_actual_qty: 300,
                status: 'running',
                shifted_days: 0,
                daily_outputs: [
                    { day_index: 1, date: '2026-03-01', target_qty: 333, actual_qty: 300, deficit: 33, is_closed: true },
                    { day_index: 2, date: '2026-03-02', target_qty: 333, actual_qty: null, deficit: 0, is_closed: false },
                    { day_index: 3, date: '2026-03-03', target_qty: 334, actual_qty: null, deficit: 0, is_closed: false }, // Sisa +1
                ]
            },
            {
                id: 102,
                line_code: 'LINE-01',
                order_no: 'PO-2026-002',
                buyer: 'H&M Sweden',
                style: 'Casual Oxford Button-Down',
                start_date: '2026-03-04',
                finish_date: '2026-03-07', // 4 Hari: 4, 5, 6, 7 Maret
                total_target_qty: 1100,
                total_actual_qty: 0,
                status: 'scheduled',
                shifted_days: 0,
                daily_outputs: [
                    { day_index: 1, date: '2026-03-04', target_qty: 275, actual_qty: null, deficit: 0, is_closed: false },
                    { day_index: 2, date: '2026-03-05', target_qty: 275, actual_qty: null, deficit: 0, is_closed: false },
                    { day_index: 3, date: '2026-03-06', target_qty: 275, actual_qty: null, deficit: 0, is_closed: false },
                    { day_index: 4, date: '2026-03-07', target_qty: 275, actual_qty: null, deficit: 0, is_closed: false },
                ]
            },
            {
                id: 103,
                line_code: 'LINE-02',
                order_no: 'PO-2026-003',
                buyer: 'Zara Man',
                style: 'Technical Windbreaker',
                start_date: '2026-03-02',
                finish_date: '2026-03-05', // 4 Hari: 2, 3, 4, 5 Maret
                total_target_qty: 900,
                total_actual_qty: 450,
                status: 'running',
                shifted_days: 0,
                daily_outputs: [
                    { day_index: 1, date: '2026-03-02', target_qty: 225, actual_qty: 225, deficit: 0, is_closed: true },
                    { day_index: 2, date: '2026-03-03', target_qty: 225, actual_qty: 225, deficit: 0, is_closed: true },
                    { day_index: 3, date: '2026-03-04', target_qty: 225, actual_qty: null, deficit: 0, is_closed: false },
                    { day_index: 4, date: '2026-03-05', target_qty: 225, actual_qty: null, deficit: 0, is_closed: false },
                ]
            },
            {
                id: 104,
                line_code: 'LINE-03',
                order_no: 'PO-2026-004',
                buyer: 'Uniqlo Japan',
                style: 'Smart Ankle Chino Pants',
                start_date: '2026-03-01',
                finish_date: '2026-03-05', // 5 Hari: 1, 2, 3, 4, 5 Maret
                total_target_qty: 1600,
                total_actual_qty: 640,
                status: 'running',
                shifted_days: 0,
                daily_outputs: [
                    { day_index: 1, date: '2026-03-01', target_qty: 320, actual_qty: 320, deficit: 0, is_closed: true },
                    { day_index: 2, date: '2026-03-02', target_qty: 320, actual_qty: 320, deficit: 0, is_closed: true },
                    { day_index: 3, date: '2026-03-03', target_qty: 320, actual_qty: null, deficit: 0, is_closed: false },
                    { day_index: 4, date: '2026-03-04', target_qty: 320, actual_qty: null, deficit: 0, is_closed: false },
                    { day_index: 5, date: '2026-03-05', target_qty: 320, actual_qty: null, deficit: 0, is_closed: false },
                ]
            }
        ];

        this.schedules = JSON.parse(JSON.stringify(this.initialSchedules));
        this.selectedLine = 'all';
        this.activeView = 'gantt'; // 'gantt' or 'table'
        this.activeSchedule = null;

        this.init();
    }

    init() {
        this.renderTelemetry();
        this.renderGanttMatrix();
        this.renderTabularData();
        this.bindEvents();
    }

    resetData() {
        this.schedules = JSON.parse(JSON.stringify(this.initialSchedules));
        this.renderTelemetry();
        this.renderGanttMatrix();
        this.renderTabularData();
        this.showToast('Data simulasi berhasil di-reset ke status awal.', 'info');
    }

    /* -------------------------------------------------------------
     * CORE CALCULATION ENGINE (Ketentuan Poin 2 & 3 Readme)
     * ------------------------------------------------------------- */

    calculateDailyDistribution(startDateStr, finishDateStr, totalQty) {
        const start = new Date(startDateStr);
        const finish = new Date(finishDateStr);
        
        const diffTime = finish.getTime() - start.getTime();
        const totalDays = Math.round(diffTime / (1000 * 3600 * 24)) + 1;

        if (totalDays <= 0 || isNaN(totalDays) || totalQty <= 0) {
            return { totalDays: 0, baseTarget: 0, remainder: 0, dailyList: [] };
        }

        const baseTarget = Math.floor(totalQty / totalDays);
        const remainder = totalQty % totalDays;

        const dailyList = [];
        let curr = new Date(start);

        for (let i = 1; i <= totalDays; i++) {
            const dateStr = curr.toISOString().split('T')[0];
            const isLast = (i === totalDays);
            const target = isLast ? (baseTarget + remainder) : baseTarget;

            dailyList.push({
                day_index: i,
                date: dateStr,
                target_qty: target,
                actual_qty: null,
                deficit: 0,
                is_closed: false
            });

            curr.setDate(curr.getDate() + 1);
        }

        return { totalDays, baseTarget, remainder, dailyList };
    }

    dateToTimelineCol(dateStr) {
        const target = new Date(dateStr + 'T00:00:00');
        const diffDays = Math.round((target.getTime() - this.timelineStart.getTime()) / (1000 * 3600 * 24));
        return diffDays + 1; // 1-indexed relative to timeline
    }

    formatDate(dateStr) {
        if (!dateStr) return '-';
        const [y, m, d] = dateStr.split('-');
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
        return `${parseInt(d)} ${months[parseInt(m) - 1]}`;
    }

    /* -------------------------------------------------------------
     * RENDERING ENGINE: TELEMETRY & GANTT MATRIX
     * ------------------------------------------------------------- */

    renderTelemetry() {
        const totalOrders = this.schedules.length;
        let totalTarget = 0;
        let totalActual = 0;
        let shiftedCount = 0;

        this.schedules.forEach(s => {
            totalTarget += s.total_target_qty;
            totalActual += s.total_actual_qty;
            if (s.shifted_days > 0) shiftedCount++;
        });

        const percent = totalTarget > 0 ? Math.round((totalActual / totalTarget) * 100) : 0;

        document.getElementById('stat-orders').textContent = totalOrders;
        document.getElementById('stat-target').textContent = totalTarget.toLocaleString('id-ID');
        document.getElementById('stat-actual').textContent = totalActual.toLocaleString('id-ID');
        document.getElementById('stat-percent').textContent = percent + '%';
        document.getElementById('stat-progress-bar').style.width = percent + '%';

        const summaryElem = document.getElementById('stat-cascade-summary');
        const detailElem = document.getElementById('stat-cascade-detail');

        if (shiftedCount > 0) {
            summaryElem.textContent = `${shiftedCount} Order Tergeser`;
            summaryElem.className = 'text-sm font-bold font-mono text-amber-400';
            detailElem.textContent = 'Auto-balancing aktif & cascade shift terpasang';
        } else {
            summaryElem.textContent = 'Synchronized';
            summaryElem.className = 'text-sm font-bold font-mono text-emerald-400';
            detailElem.textContent = 'Semua antrian line normal tanpa tubrukan';
        }
    }

    renderGanttMatrix() {
        const headerRow = document.getElementById('gantt-header-row');
        const bodyContainer = document.getElementById('gantt-body-container');
        if (!headerRow || !bodyContainer) return;

        // 1. Generate 14-day Calendar Columns in Header
        let headerHtml = `
            <div class="p-3 bg-slate-950 font-bold uppercase tracking-wider text-slate-400 border-r border-slate-800 flex items-center justify-between">
                <span>Sewing Line Asset</span>
                <span class="text-[10px] text-slate-500">Cap/Day</span>
            </div>
        `;

        let currDate = new Date(this.timelineStart);
        const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

        for (let i = 1; i <= this.timelineDays; i++) {
            const dateNum = currDate.getDate().toString().padStart(2, '0');
            const dayName = dayNames[currDate.getDay()];
            const isWeekend = currDate.getDay() === 0 || currDate.getDay() === 6;

            headerHtml += `
                <div class="py-2 px-1 text-center border-r border-slate-800/80 flex flex-col justify-center items-center ${isWeekend ? 'bg-slate-900/60 text-slate-500' : 'bg-slate-950 text-slate-300'}">
                    <span class="text-[10px] uppercase font-semibold text-slate-500">${dayName}</span>
                    <span class="text-xs font-bold ${isWeekend ? 'text-slate-400' : 'text-cyan-400'}">${dateNum}</span>
                </div>
            `;
            currDate.setDate(currDate.getDate() + 1);
        }
        headerRow.innerHTML = headerHtml;

        // 2. Filter lines
        let activeLines = this.lines;
        if (this.selectedLine !== 'all') {
            activeLines = activeLines.filter(l => l.code === this.selectedLine);
        }

        let bodyHtml = '';

        activeLines.forEach(line => {
            const lineSchedules = this.schedules.filter(s => s.line_code === line.code);
            const lineLoad = lineSchedules.reduce((acc, curr) => acc + curr.total_target_qty, 0);

            bodyHtml += `
                <div class="gantt-row relative hover:bg-slate-900/30 transition-colors">
                    <!-- Left: Line Telemetry Info -->
                    <div class="p-3 bg-slate-950/80 border-r border-slate-800 flex flex-col justify-center">
                        <div class="flex items-center justify-between">
                            <span class="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-cyan-400 font-mono text-[11px] font-bold">
                                ${line.code}
                            </span>
                            <span class="text-[10px] font-mono text-slate-400">${line.capacity} pcs/d</span>
                        </div>
                        <h4 class="text-xs font-bold text-slate-200 mt-1 truncate">${line.name}</h4>
                        <div class="flex items-center justify-between text-[10px] text-slate-500 mt-1">
                            <span>${line.operators} Operators</span>
                            <span class="text-slate-400">${lineSchedules.length} Batches</span>
                        </div>
                    </div>

                    <!-- 14 Timeline Grid Column Background Cells -->
            `;

            for (let c = 1; c <= this.timelineDays; c++) {
                bodyHtml += `<div class="border-r border-slate-800/40 min-h-[96px] bg-grid-technical pointer-events-none"></div>`;
            }

            // Render Gantt Schedule Blocks overlaid on the row
            bodyHtml += `<div class="absolute inset-y-0 left-[240px] right-0 flex items-center px-1 pointer-events-none">`;

            lineSchedules.forEach(schedule => {
                const startCol = this.dateToTimelineCol(schedule.start_date);
                const finishCol = this.dateToTimelineCol(schedule.finish_date);
                const colSpan = (finishCol - startCol) + 1;

                if (startCol < 1 || startCol > this.timelineDays) return;

                const leftPercent = ((startCol - 1) / this.timelineDays) * 100;
                const widthPercent = (colSpan / this.timelineDays) * 100;
                const progress = schedule.total_target_qty > 0 ? Math.round((schedule.total_actual_qty / schedule.total_target_qty) * 100) : 0;
                const isShifted = schedule.shifted_days > 0;

                bodyHtml += `
                    <div onclick="window.scheduleApp.openSlideOver(${schedule.id})"
                        class="absolute pointer-events-auto cursor-pointer rounded-lg p-2.5 transition-all duration-200 group border flex flex-col justify-between shadow-lg ${
                            isShifted 
                                ? 'bg-amber-950/80 border-amber-500/80 hover:border-amber-400 shadow-amber-950/30' 
                                : 'bg-slate-800/90 border-slate-700 hover:border-cyan-400 shadow-slate-950/40'
                        }"
                        style="left: calc(${leftPercent}% + 4px); width: calc(${widthPercent}% - 8px); height: 76px;"
                    >
                        <div class="flex items-start justify-between gap-1">
                            <div class="truncate">
                                <span class="font-mono text-[10px] font-bold text-cyan-400 block">${schedule.order_no}</span>
                                <h5 class="text-xs font-bold text-white truncate">${schedule.style}</h5>
                                <span class="text-[10px] text-slate-400 truncate block">${schedule.buyer}</span>
                            </div>
                            
                            ${isShifted ? `
                                <span class="px-1.5 py-0.5 rounded bg-amber-500 text-slate-950 font-mono text-[9px] font-black shrink-0 flex items-center gap-1 animate-pulse">
                                    <i class="fa-solid fa-arrow-right"></i> +${schedule.shifted_days}d
                                </span>
                            ` : `
                                <span class="px-1.5 py-0.5 rounded bg-slate-900 font-mono text-[9px] font-semibold text-slate-300 border border-slate-700 shrink-0">
                                    ${progress}%
                                </span>
                            `}
                        </div>

                        <!-- Mini Progress Bar & Qty -->
                        <div class="space-y-1">
                            <div class="w-full bg-slate-950/80 rounded-full h-1 overflow-hidden">
                                <div class="${isShifted ? 'bg-amber-400' : 'bg-cyan-400'} h-1 rounded-full" style="width: ${progress}%"></div>
                            </div>
                            <div class="flex justify-between text-[9px] font-mono text-slate-400">
                                <span>${schedule.total_actual_qty}/${schedule.total_target_qty} pcs</span>
                                <span class="text-slate-300 font-semibold">${this.formatDate(schedule.start_date)} - ${this.formatDate(schedule.finish_date)}</span>
                            </div>
                        </div>
                    </div>
                `;
            });

            bodyHtml += `</div></div>`;
        });

        bodyContainer.innerHTML = bodyHtml;
    }

    renderTabularData() {
        const tbody = document.getElementById('tabular-body');
        if (!tbody) return;

        let filtered = this.schedules;
        if (this.selectedLine !== 'all') {
            filtered = filtered.filter(s => s.line_code === this.selectedLine);
        }

        let html = '';
        filtered.forEach(s => {
            const daysCount = s.daily_outputs.length;
            const baseTarget = Math.floor(s.total_target_qty / daysCount);
            const remainder = s.total_target_qty % daysCount;
            const progress = s.total_target_qty > 0 ? Math.round((s.total_actual_qty / s.total_target_qty) * 100) : 0;

            html += `
                <tr class="hover:bg-slate-800/40 transition-colors">
                    <td class="py-3 px-4">
                        <span class="px-2 py-0.5 rounded bg-slate-800 text-cyan-400 font-bold border border-slate-700">
                            ${s.line_code}
                        </span>
                    </td>
                    <td class="py-3 px-4">
                        <strong class="text-white block">${s.order_no}</strong>
                        <span class="text-slate-400 text-[11px]">${s.buyer}</span>
                    </td>
                    <td class="py-3 px-4 text-slate-200">${s.style}</td>
                    <td class="py-3 px-4">
                        <div class="text-slate-300">${s.start_date} s/d</div>
                        <div class="font-bold ${s.shifted_days > 0 ? 'text-amber-400' : 'text-slate-100'}">${s.finish_date}</div>
                    </td>
                    <td class="py-3 px-4 text-right font-bold text-white">${s.total_target_qty.toLocaleString('id-ID')}</td>
                    <td class="py-3 px-4 text-right font-bold text-emerald-400">
                        ${s.total_actual_qty.toLocaleString('id-ID')} 
                        <span class="text-[10px] text-slate-500 font-normal">(${progress}%)</span>
                    </td>
                    <td class="py-3 px-4 text-[11px] text-slate-400">
                        <div>Base: <strong class="text-slate-200">${baseTarget} pcs/hari</strong></div>
                        <div class="text-cyan-400">Final: ${baseTarget + remainder} pcs (+${remainder})</div>
                    </td>
                    <td class="py-3 px-4">
                        ${s.shifted_days > 0 
                            ? `<span class="px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800 text-[10px] font-bold">Mundur +${s.shifted_days}d</span>` 
                            : `<span class="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 text-[10px]">On-Track</span>`
                        }
                    </td>
                    <td class="py-3 px-4 text-center">
                        <button type="button" onclick="window.scheduleApp.openSlideOver(${s.id})"
                            class="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-400 text-xs font-bold border border-slate-700 transition-colors cursor-pointer">
                            Inspect
                        </button>
                    </td>
                </tr>
            `;
        });

        tbody.innerHTML = html;
    }

    /* -------------------------------------------------------------
     * SLIDE-OVER DRAWER & BALANCING ENGINE
     * ------------------------------------------------------------- */

    openSlideOver(scheduleId) {
        const schedule = this.schedules.find(s => s.id === scheduleId);
        if (!schedule) return;

        this.activeSchedule = schedule;
        const drawer = document.getElementById('slide-over-backdrop');
        if (!drawer) return;

        document.getElementById('drawer-order-no').textContent = schedule.order_no;
        document.getElementById('drawer-line-badge').textContent = schedule.line_code;
        document.getElementById('drawer-buyer-style').textContent = `${schedule.buyer} • ${schedule.style}`;
        
        document.getElementById('drawer-total-target').textContent = `${schedule.total_target_qty.toLocaleString('id-ID')} pcs`;
        document.getElementById('drawer-total-actual').textContent = `${schedule.total_actual_qty.toLocaleString('id-ID')} pcs`;
        document.getElementById('drawer-start-date').textContent = schedule.start_date;
        document.getElementById('drawer-finish-date').textContent = schedule.finish_date;

        const days = schedule.daily_outputs.length;
        const base = Math.floor(schedule.total_target_qty / days);
        const rem = schedule.total_target_qty % days;
        document.getElementById('drawer-formula-desc').textContent = `Base: ${base} pcs/hari | Sisa Modulo: +${rem} pcs (Hari ke-${days})`;

        this.renderDrawerDailyRows(schedule);

        drawer.classList.remove('hidden');
    }

    closeSlideOver() {
        const drawer = document.getElementById('slide-over-backdrop');
        if (drawer) drawer.classList.add('hidden');
        this.activeSchedule = null;
    }

    renderDrawerDailyRows(schedule) {
        const tbody = document.getElementById('drawer-daily-tbody');
        if (!tbody) return;

        let html = '';
        schedule.daily_outputs.forEach((d, idx) => {
            const hasActual = d.actual_qty !== null && d.actual_qty !== undefined;
            const diff = hasActual ? (d.actual_qty - d.target_qty) : 0;
            const isDeficit = hasActual && diff < 0;

            html += `
                <tr class="hover:bg-slate-900 transition-colors">
                    <td class="py-2.5 px-3 font-semibold text-slate-400">#${d.day_index}</td>
                    <td class="py-2.5 px-3 text-slate-200 font-bold">${d.date}</td>
                    <td class="py-2.5 px-3 text-slate-300 font-bold">${d.target_qty} pcs</td>
                    <td class="py-2.5 px-3">
                        <input type="number" min="0" id="drawer-input-${idx}" 
                            value="${hasActual ? d.actual_qty : ''}" 
                            placeholder="Input pcs"
                            class="w-24 px-2.5 py-1 text-xs font-mono font-bold bg-slate-950 border border-slate-700 rounded text-cyan-400 focus:border-cyan-500 focus:outline-none"
                        />
                    </td>
                    <td class="py-2.5 px-3">
                        ${hasActual ? `
                            <span class="font-bold font-mono ${isDeficit ? 'text-amber-400' : 'text-emerald-400'}">
                                ${diff > 0 ? '+' : ''}${diff} pcs
                            </span>
                        ` : `<span class="text-slate-600">-</span>`}
                    </td>
                    <td class="py-2.5 px-3 text-right">
                        <button type="button" id="btn-save-drawer-${idx}"
                            onclick="window.scheduleApp.commitDailyActual(${schedule.id}, ${idx})"
                            class="px-2.5 py-1 rounded bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold font-mono transition-all cursor-pointer">
                            Simpan
                        </button>
                    </td>
                </tr>
            `;
        });

        tbody.innerHTML = html;
    }

    /**
     * Commit Aktual Output & Trigger Dynamic Cascade Balancing (Poin 3 Readme)
     */
    async commitDailyActual(scheduleId, dayIdx) {
        const schedule = this.schedules.find(s => s.id === scheduleId);
        if (!schedule) return;

        const inputElem = document.getElementById(`drawer-input-${dayIdx}`);
        const saveBtn = document.getElementById(`btn-save-drawer-${dayIdx}`);
        const actualVal = parseInt(inputElem.value);

        if (isNaN(actualVal) || actualVal < 0) {
            this.showToast('Kuantitas actual output tidak valid!', 'error');
            return;
        }

        // 1. BEFORE PROCESS: Loading spinner & disable
        const origText = saveBtn.innerHTML;
        saveBtn.disabled = true;
        saveBtn.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin"></i>`;
        inputElem.disabled = true;

        this.showToast('Menghitung auto-balancing & cascade collision...', 'info');

        // 2. PROCESS (Simulate Async Network Delay)
        await new Promise(r => setTimeout(r, 450));

        const targetRecord = schedule.daily_outputs[dayIdx];
        targetRecord.actual_qty = actualVal;
        targetRecord.is_closed = true;

        const deficit = targetRecord.target_qty - actualVal;
        targetRecord.deficit = Math.max(0, deficit);

        // Update total actual
        let totalActual = 0;
        schedule.daily_outputs.forEach(d => {
            if (d.actual_qty !== null) totalActual += d.actual_qty;
        });
        schedule.total_actual_qty = totalActual;

        let cascadeSummary = '';

        // JIKA AKTUAL KURANG DARI TARGET: BALANCING & CASCADE EFFECT
        if (deficit > 0) {
            if (dayIdx + 1 < schedule.daily_outputs.length) {
                // Alihkan sisa ke target hari berikutnya
                schedule.daily_outputs[dayIdx + 1].target_qty += deficit;
                cascadeSummary = `Defisit ${deficit} pcs ditambahkan ke target hari berikutnya (#${dayIdx + 2}).`;
            } else {
                // Hari terakhir defisit -> tambah range schedule (+1 hari)
                const lastDate = new Date(schedule.finish_date + 'T00:00:00');
                lastDate.setDate(lastDate.getDate() + 1);
                const extraDateStr = lastDate.toISOString().split('T')[0];

                schedule.daily_outputs.push({
                    day_index: schedule.daily_outputs.length + 1,
                    date: extraDateStr,
                    target_qty: deficit,
                    actual_qty: null,
                    deficit: 0,
                    is_closed: false
                });

                schedule.finish_date = extraDateStr;
                schedule.shifted_days += 1;
                schedule.status = 'delayed';

                // CASCADE DOMINO EFFECT: Geser semua schedule setelahnya pada line yang sama
                const subsequent = this.schedules.filter(s => 
                    s.line_code === schedule.line_code &&
                    s.id !== schedule.id &&
                    new Date(s.start_date) <= new Date(extraDateStr)
                );

                if (subsequent.length > 0) {
                    subsequent.forEach(sub => {
                        const oldStart = new Date(sub.start_date + 'T00:00:00');
                        const oldFinish = new Date(sub.finish_date + 'T00:00:00');

                        oldStart.setDate(oldStart.getDate() + 1);
                        oldFinish.setDate(oldFinish.getDate() + 1);

                        sub.start_date = oldStart.toISOString().split('T')[0];
                        sub.finish_date = oldFinish.toISOString().split('T')[0];
                        sub.shifted_days += 1;

                        sub.daily_outputs.forEach(d => {
                            const dDate = new Date(d.date + 'T00:00:00');
                            dDate.setDate(dDate.getDate() + 1);
                            d.date = dDate.toISOString().split('T')[0];
                        });
                    });

                    cascadeSummary = `Defisit ${deficit} pcs memicu penambahan durasi (+1d)! Order ${subsequent.map(s => s.order_no).join(', ')} otomatis bergeser mundur.`;
                } else {
                    cascadeSummary = `Defisit ${deficit} pcs menyebabkan schedule bertambah 1 hari hingga ${extraDateStr}.`;
                }
            }
        } else {
            cascadeSummary = `Target hari ke-${dayIdx + 1} tercapai dengan output ${actualVal} pcs.`;
        }

        // 3. AFTER PROCESS: Restore button & update view
        saveBtn.disabled = false;
        saveBtn.innerHTML = origText;
        inputElem.disabled = false;

        this.renderTelemetry();
        this.renderGanttMatrix();
        this.renderTabularData();
        this.renderDrawerDailyRows(schedule);

        document.getElementById('drawer-total-actual').textContent = `${schedule.total_actual_qty.toLocaleString('id-ID')} pcs`;
        document.getElementById('drawer-finish-date').textContent = schedule.finish_date;

        this.showToast(cascadeSummary, deficit > 0 ? 'warning' : 'success');
    }

    /* -------------------------------------------------------------
     * CREATE SCHEDULE MODAL & EVENTS
     * ------------------------------------------------------------- */

    openCreateModal() {
        const modal = document.getElementById('modal-create');
        if (!modal) return;

        document.getElementById('create-start-date').value = '2026-03-08';
        document.getElementById('create-finish-date').value = '2026-03-11';
        document.getElementById('create-target-qty').value = 1000;

        this.updateCreatePreview();
        modal.classList.remove('hidden');
        modal.classList.add('flex');
    }

    closeCreateModal() {
        const modal = document.getElementById('modal-create');
        if (modal) {
            modal.classList.add('hidden');
            modal.classList.remove('flex');
        }
    }

    updateCreatePreview() {
        const start = document.getElementById('create-start-date').value;
        const finish = document.getElementById('create-finish-date').value;
        const qty = parseInt(document.getElementById('create-target-qty').value) || 0;
        const container = document.getElementById('create-calc-preview');
        if (!container) return;

        if (!start || !finish || qty <= 0) {
            container.innerHTML = `<span class="text-slate-500 italic">Lengkapi tanggal dan target QTY untuk melihat pembagian.</span>`;
            return;
        }

        const dist = this.calculateDailyDistribution(start, finish, qty);
        if (dist.totalDays <= 0) {
            container.innerHTML = `<span class="text-rose-400 font-bold">Tanggal finish tidak boleh lebih awal dari start!</span>`;
            return;
        }

        let pillsHtml = dist.dailyList.map(d => {
            const isLast = d.day_index === dist.totalDays;
            return `
                <div class="px-2 py-1 rounded bg-slate-900 border ${isLast ? 'border-cyan-500 text-cyan-300' : 'border-slate-800 text-slate-300'} flex justify-between">
                    <span>#${d.day_index} (${this.formatDate(d.date)})</span>
                    <strong class="font-mono">${d.target_qty} pcs ${isLast && dist.remainder > 0 ? `(+${dist.remainder})` : ''}</strong>
                </div>
            `;
        }).join('');

        container.innerHTML = `
            <div class="space-y-2">
                <div class="flex justify-between text-slate-400 pb-1 border-b border-slate-800">
                    <span>Durasi: <strong class="text-white">${dist.totalDays} Hari</strong></span>
                    <span>Base: <strong class="text-slate-200">${dist.baseTarget} pcs/hari</strong></span>
                    <span class="text-cyan-400 font-bold">Sisa Modulo: +${dist.remainder} pcs</span>
                </div>
                <div class="grid grid-cols-2 gap-1.5 max-h-32 overflow-y-auto">
                    ${pillsHtml}
                </div>
            </div>
        `;
    }

    async submitCreateSchedule(event) {
        event.preventDefault();

        const lineCode = document.getElementById('create-line-code').value;
        const orderNo = document.getElementById('create-order-no').value;
        const buyer = document.getElementById('create-buyer').value;
        const style = document.getElementById('create-style').value;
        const start = document.getElementById('create-start-date').value;
        const finish = document.getElementById('create-finish-date').value;
        const totalQty = parseInt(document.getElementById('create-target-qty').value);

        const btn = document.getElementById('btn-submit-create');
        const origText = btn.innerHTML;

        btn.disabled = true;
        btn.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin"></i> Menyimpan...`;

        await new Promise(r => setTimeout(r, 400));

        const dist = this.calculateDailyDistribution(start, finish, totalQty);

        const newSchedule = {
            id: Date.now(),
            line_code: lineCode,
            order_no: orderNo,
            buyer: buyer,
            style: style,
            start_date: start,
            finish_date: finish,
            total_target_qty: totalQty,
            total_actual_qty: 0,
            status: 'scheduled',
            shifted_days: 0,
            daily_outputs: dist.dailyList
        };

        this.schedules.push(newSchedule);

        btn.disabled = false;
        btn.innerHTML = origText;
        this.closeCreateModal();

        this.renderTelemetry();
        this.renderGanttMatrix();
        this.renderTabularData();

        this.showToast(`Schedule ${orderNo} berhasil dialokasikan pada ${lineCode}!`, 'success');
    }

    showToast(message, type = 'success') {
        const container = document.getElementById('toast-container');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl border text-xs font-mono font-semibold shadow-xl transition-all duration-300 transform translate-y-3 opacity-0 ${
            type === 'success' 
                ? 'bg-slate-900 border-cyan-500/80 text-cyan-300' 
                : type === 'warning'
                ? 'bg-amber-950 border-amber-500 text-amber-200'
                : 'bg-slate-900 border-slate-700 text-slate-200'
        }`;

        let icon = type === 'success' ? 'fa-circle-check text-cyan-400' : type === 'warning' ? 'fa-triangle-exclamation text-amber-400' : 'fa-circle-info text-blue-400';

        toast.innerHTML = `
            <i class="fa-solid ${icon} text-sm"></i>
            <span class="flex-1">${message}</span>
        `;

        container.appendChild(toast);

        setTimeout(() => {
            toast.classList.remove('translate-y-3', 'opacity-0');
        }, 10);

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(10px)';
            setTimeout(() => toast.remove(), 300);
        }, 4000);
    }

    bindEvents() {
        // Line filters
        document.querySelectorAll('.filter-line-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.filter-line-btn').forEach(b => {
                    b.classList.remove('bg-cyan-500', 'text-slate-950');
                    b.classList.add('bg-slate-800', 'text-slate-300');
                });
                btn.classList.add('bg-cyan-500', 'text-slate-950');
                btn.classList.remove('bg-slate-800', 'text-slate-300');

                this.selectedLine = btn.getAttribute('data-line');
                this.renderGanttMatrix();
                this.renderTabularData();
            });
        });

        // View toggle
        const toggleGantt = document.getElementById('toggle-view-gantt');
        const toggleTable = document.getElementById('toggle-view-table');
        const viewGantt = document.getElementById('view-gantt');
        const viewTable = document.getElementById('view-table');

        if (toggleGantt && toggleTable) {
            toggleGantt.addEventListener('click', () => {
                toggleGantt.classList.add('bg-slate-800', 'text-cyan-400', 'border-slate-700');
                toggleGantt.classList.remove('text-slate-400');
                toggleTable.classList.remove('bg-slate-800', 'text-cyan-400', 'border-slate-700');
                toggleTable.classList.add('text-slate-400');

                viewGantt.classList.remove('hidden');
                viewTable.classList.add('hidden');
            });

            toggleTable.addEventListener('click', () => {
                toggleTable.classList.add('bg-slate-800', 'text-cyan-400', 'border-slate-700');
                toggleTable.classList.remove('text-slate-400');
                toggleGantt.classList.remove('bg-slate-800', 'text-cyan-400', 'border-slate-700');
                toggleGantt.classList.add('text-slate-400');

                viewTable.classList.remove('hidden');
                viewGantt.classList.add('hidden');
            });
        }

        // Live calculation on modal create inputs
        ['create-start-date', 'create-finish-date', 'create-target-qty'].forEach(id => {
            const elem = document.getElementById(id);
            if (elem) {
                elem.addEventListener('input', () => this.updateCreatePreview());
                elem.addEventListener('change', () => this.updateCreatePreview());
            }
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.scheduleApp = new ProductionScheduler();
});
