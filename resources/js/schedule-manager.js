/**
 * Sewing Line Production Scheduler & Dynamic Auto-Balancing Engine
 * Pure Modern JavaScript with full UI Lifecycle states (Before, During, After Process)
 */

class ScheduleApp {
    constructor() {
        // Initial Demo State
        this.lines = [
            { id: 1, code: 'LINE-01', name: 'Sewing Line 01 (Kemeja & Polo)', capacity: 400 },
            { id: 2, code: 'LINE-02', name: 'Sewing Line 02 (Outerwear & Jacket)', capacity: 300 },
            { id: 3, code: 'LINE-03', name: 'Sewing Line 03 (Pants & Chino)', capacity: 500 },
        ];

        this.orders = [
            { id: 1, order_no: 'PO-2026-001', buyer: 'Uniqlo Japan', style: 'Dry-EX Polo Shirt', qty: 1000 },
            { id: 2, order_no: 'PO-2026-002', buyer: 'H&M Global', style: 'Casual Cotton Flannel', qty: 850 },
            { id: 3, order_no: 'PO-2026-003', buyer: 'Zara Men', style: 'Slim Fit Chino Trousers', qty: 1200 },
            { id: 4, order_no: 'PO-2026-004', buyer: 'Marks & Spencer', style: 'Classic Oxford Shirt', qty: 900 },
        ];

        // Active Schedules
        this.schedules = [
            {
                id: 1,
                order_id: 1,
                line_id: 1,
                order_no: 'PO-2026-001',
                buyer: 'Uniqlo Japan',
                style: 'Dry-EX Polo Shirt',
                line_code: 'LINE-01',
                start_date: '2026-03-01',
                finish_date: '2026-03-03', // 3 Hari: 1, 2, 3 Maret
                total_target_qty: 1000,
                total_actual_qty: 300,
                status: 'running',
                shifted_days: 0,
                daily_outputs: [
                    { day_index: 1, date: '2026-03-01', target_qty: 333, actual_qty: 300, deficit: 33, is_closed: true },
                    { day_index: 2, date: '2026-03-02', target_qty: 333, actual_qty: null, deficit: 0, is_closed: false },
                    { day_index: 3, date: '2026-03-03', target_qty: 334, actual_qty: null, deficit: 0, is_closed: false }, // 333 + 1 sisa
                ]
            },
            {
                id: 2,
                order_id: 2,
                line_id: 1,
                order_no: 'PO-2026-002',
                buyer: 'H&M Global',
                style: 'Casual Cotton Flannel',
                line_code: 'LINE-01',
                start_date: '2026-03-04',
                finish_date: '2026-03-06', // 3 Hari: 4, 5, 6 Maret
                total_target_qty: 850,
                total_actual_qty: 0,
                status: 'scheduled',
                shifted_days: 0,
                daily_outputs: [
                    { day_index: 1, date: '2026-03-04', target_qty: 283, actual_qty: null, deficit: 0, is_closed: false },
                    { day_index: 2, date: '2026-03-05', target_qty: 283, actual_qty: null, deficit: 0, is_closed: false },
                    { day_index: 3, date: '2026-03-06', target_qty: 284, actual_qty: null, deficit: 0, is_closed: false }, // 283 + 1 sisa
                ]
            },
            {
                id: 3,
                order_id: 3,
                line_id: 3,
                order_no: 'PO-2026-003',
                buyer: 'Zara Men',
                style: 'Slim Fit Chino Trousers',
                line_code: 'LINE-03',
                start_date: '2026-03-01',
                finish_date: '2026-03-04', // 4 Hari: 1, 2, 3, 4 Maret
                total_target_qty: 1200,
                total_actual_qty: 600,
                status: 'running',
                shifted_days: 0,
                daily_outputs: [
                    { day_index: 1, date: '2026-03-01', target_qty: 300, actual_qty: 300, deficit: 0, is_closed: true },
                    { day_index: 2, date: '2026-03-02', target_qty: 300, actual_qty: 300, deficit: 0, is_closed: true },
                    { day_index: 3, date: '2026-03-03', target_qty: 300, actual_qty: null, deficit: 0, is_closed: false },
                    { day_index: 4, date: '2026-03-04', target_qty: 300, actual_qty: null, deficit: 0, is_closed: false },
                ]
            }
        ];

        this.selectedLine = 'all';
        this.activeView = 'timeline'; // 'timeline' or 'table'
        this.activeScheduleDetail = null;

        this.init();
    }

    init() {
        this.renderStats();
        this.renderScheduleTimeline();
        this.renderScheduleTable();
        this.setupEventListeners();
    }

    /* -------------------------------------------------------------
     * CORE CALCULATION ENGINE (Ketentuan Poin 2 & 3 Readme)
     * ------------------------------------------------------------- */

    /**
     * Hitung pembagian target harian dengan sisa bagi di hari terakhir
     */
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

    /**
     * Format tanggal Indonesia
     */
    formatDate(dateStr) {
        if (!dateStr) return '-';
        const d = new Date(dateStr);
        return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
    }

    /**
     * Hitung status badge
     */
    getStatusBadge(schedule) {
        if (schedule.shifted_days > 0) {
            return `<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                <i class="fa-solid fa-clock-rotate-left text-amber-500"></i> Mundur +${schedule.shifted_days} Hari
            </span>`;
        }
        if (schedule.status === 'completed') {
            return `<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <i class="fa-solid fa-check text-emerald-500"></i> Selesai
            </span>`;
        }
        if (schedule.status === 'running') {
            return `<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                <span class="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-pulse"></span> Sedang Berjalan
            </span>`;
        }
        return `<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            <i class="fa-regular fa-calendar text-slate-400"></i> Terjadwal
        </span>`;
    }

    /* -------------------------------------------------------------
     * UI RENDERING
     * ------------------------------------------------------------- */

    renderStats() {
        const totalLines = this.lines.length;
        const totalSchedules = this.schedules.length;
        
        let totalTarget = 0;
        let totalActual = 0;
        let delayedCount = 0;

        this.schedules.forEach(s => {
            totalTarget += s.total_target_qty;
            totalActual += s.total_actual_qty;
            if (s.shifted_days > 0) delayedCount++;
        });

        const percent = totalTarget > 0 ? Math.round((totalActual / totalTarget) * 100) : 0;

        document.getElementById('stat-lines').textContent = totalLines;
        document.getElementById('stat-orders').textContent = totalSchedules;
        document.getElementById('stat-target').textContent = totalTarget.toLocaleString('id-ID') + ' pcs';
        document.getElementById('stat-actual').textContent = totalActual.toLocaleString('id-ID') + ' pcs';
        document.getElementById('stat-percent').textContent = percent + '%';
        document.getElementById('stat-progress-bar').style.width = Math.min(percent, 100) + '%';
        
        const delayElem = document.getElementById('stat-delayed');
        if (delayElem) {
            delayElem.textContent = delayedCount > 0 ? `${delayedCount} Order Bergeser` : 'Semua On-Track';
            delayElem.className = delayedCount > 0 
                ? 'text-xs font-medium text-amber-600 flex items-center gap-1' 
                : 'text-xs font-medium text-emerald-600 flex items-center gap-1';
        }
    }

    renderScheduleTimeline() {
        const container = document.getElementById('timeline-container');
        if (!container) return;

        let filtered = this.schedules;
        if (this.selectedLine !== 'all') {
            filtered = filtered.filter(s => s.line_code === this.selectedLine);
        }

        if (filtered.length === 0) {
            container.innerHTML = `
                <div class="text-center py-12 bg-white rounded-2xl border border-slate-200">
                    <i class="fa-regular fa-folder-open text-3xl text-slate-300 mb-3"></i>
                    <p class="text-slate-500 font-medium">Tidak ada jadwal pada line ini.</p>
                </div>
            `;
            return;
        }

        // Group by line
        const lineGroups = {};
        this.lines.forEach(l => {
            if (this.selectedLine === 'all' || this.selectedLine === l.code) {
                lineGroups[l.code] = { line: l, schedules: [] };
            }
        });

        filtered.forEach(s => {
            if (lineGroups[s.line_code]) {
                lineGroups[s.line_code].schedules.push(s);
            }
        });

        let html = '';
        Object.values(lineGroups).forEach(group => {
            html += `
                <div class="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 mb-4 transition-all">
                    <!-- Line Header -->
                    <div class="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
                        <div class="flex items-center gap-3">
                            <span class="px-3 py-1 bg-slate-900 text-white text-xs font-bold rounded-lg tracking-wider">
                                ${group.line.code}
                            </span>
                            <h3 class="font-bold text-slate-800 text-sm md:text-base">${group.line.name}</h3>
                        </div>
                        <span class="text-xs text-slate-500 font-medium">
                            Kapasitas: <strong class="text-slate-700">${group.line.capacity} pcs/hari</strong>
                        </span>
                    </div>

                    <!-- Line Schedule Track Cards -->
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            `;

            if (group.schedules.length === 0) {
                html += `
                    <div class="col-span-full py-6 text-center text-slate-400 text-xs italic bg-slate-50 rounded-xl border border-dashed border-slate-200">
                        Line ini sedang idle / belum ada antrian jadwal.
                    </div>
                `;
            } else {
                group.schedules.forEach(s => {
                    const progress = s.total_target_qty > 0 ? Math.round((s.total_actual_qty / s.total_target_qty) * 100) : 0;
                    
                    html += `
                        <div class="relative bg-slate-50 hover:bg-white rounded-xl p-4 border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all duration-200 group flex flex-col justify-between">
                            <div>
                                <div class="flex items-start justify-between gap-2 mb-2">
                                    <div>
                                        <span class="text-xs font-bold text-indigo-600 block">${s.order_no}</span>
                                        <h4 class="font-bold text-slate-800 text-sm">${s.style}</h4>
                                        <p class="text-xs text-slate-500">Buyer: ${s.buyer}</p>
                                    </div>
                                    ${this.getStatusBadge(s)}
                                </div>

                                <!-- Date Range Box -->
                                <div class="my-3 py-2 px-3 bg-white rounded-lg border border-slate-200/80 flex items-center justify-between text-xs">
                                    <div class="flex items-center gap-1.5 text-slate-600">
                                        <i class="fa-regular fa-calendar-check text-indigo-500"></i>
                                        <span>${this.formatDate(s.start_date)}</span>
                                    </div>
                                    <i class="fa-solid fa-arrow-right text-slate-300 text-xs"></i>
                                    <div class="flex items-center gap-1.5 text-slate-600">
                                        <i class="fa-regular fa-flag text-rose-500"></i>
                                        <span class="font-semibold ${s.shifted_days > 0 ? 'text-amber-600 font-bold' : ''}">${this.formatDate(s.finish_date)}</span>
                                    </div>
                                </div>

                                <!-- Progress & Qty -->
                                <div class="space-y-1.5 my-2">
                                    <div class="flex justify-between text-xs font-semibold">
                                        <span class="text-slate-500">Realisasi: ${s.total_actual_qty} / ${s.total_target_qty} pcs</span>
                                        <span class="text-indigo-600 font-bold">${progress}%</span>
                                    </div>
                                    <div class="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                                        <div class="bg-indigo-600 h-2 rounded-full transition-all duration-500" style="width: ${progress}%"></div>
                                    </div>
                                </div>
                            </div>

                            <!-- Action Button -->
                            <div class="mt-4 pt-3 border-t border-slate-200/60 flex items-center justify-between">
                                <span class="text-[11px] text-slate-400">
                                    ${s.daily_outputs.length} Hari Alokasi
                                </span>
                                <button type="button" onclick="window.scheduleApp.openDetailModal(${s.id})" 
                                    class="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors cursor-pointer">
                                    <i class="fa-solid fa-sliders text-xs"></i>
                                    <span>Input & Balancing</span>
                                </button>
                            </div>
                        </div>
                    `;
                });
            }

            html += `
                    </div>
                </div>
            `;
        });

        container.innerHTML = html;
    }

    renderScheduleTable() {
        const tbody = document.getElementById('schedule-table-body');
        if (!tbody) return;

        let filtered = this.schedules;
        if (this.selectedLine !== 'all') {
            filtered = filtered.filter(s => s.line_code === this.selectedLine);
        }

        if (filtered.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="9" class="px-6 py-8 text-center text-slate-400 text-sm">
                        Tidak ada data schedule yang cocok.
                    </td>
                </tr>
            `;
            return;
        }

        let html = '';
        filtered.forEach((s, idx) => {
            const daysCount = s.daily_outputs.length;
            const baseTarget = Math.floor(s.total_target_qty / daysCount);
            const remainder = s.total_target_qty % daysCount;
            const progress = s.total_target_qty > 0 ? Math.round((s.total_actual_qty / s.total_target_qty) * 100) : 0;

            html += `
                <tr class="hover:bg-slate-50/80 transition-colors border-b border-slate-100">
                    <td class="px-6 py-4 font-semibold text-slate-500 text-xs">${idx + 1}</td>
                    <td class="px-6 py-4">
                        <span class="px-2.5 py-1 bg-slate-900 text-white rounded-md text-xs font-bold">
                            ${s.line_code}
                        </span>
                    </td>
                    <td class="px-6 py-4">
                        <span class="font-bold text-slate-900 text-sm block">${s.order_no}</span>
                        <span class="text-xs text-slate-500">${s.buyer} &bull; ${s.style}</span>
                    </td>
                    <td class="px-6 py-4 text-xs text-slate-600">
                        <div class="font-medium">${this.formatDate(s.start_date)} -</div>
                        <div class="font-bold ${s.shifted_days > 0 ? 'text-amber-600' : 'text-slate-800'}">${this.formatDate(s.finish_date)}</div>
                    </td>
                    <td class="px-6 py-4 text-xs font-semibold text-slate-800">
                        ${s.total_target_qty.toLocaleString('id-ID')} pcs
                    </td>
                    <td class="px-6 py-4 text-xs">
                        <div class="font-bold text-indigo-700">${s.total_actual_qty.toLocaleString('id-ID')} pcs</div>
                        <div class="text-[11px] text-slate-400">${progress}% tercapai</div>
                    </td>
                    <td class="px-6 py-4 text-xs text-slate-600">
                        <div>Rata-rata: <strong class="text-slate-800">${baseTarget} pcs</strong></div>
                        <div class="text-[11px] text-indigo-600 font-semibold">Akhir: ${baseTarget + remainder} pcs (+${remainder})</div>
                    </td>
                    <td class="px-6 py-4">
                        ${this.getStatusBadge(s)}
                    </td>
                    <td class="px-6 py-4 text-right">
                        <button type="button" onclick="window.scheduleApp.openDetailModal(${s.id})" 
                            class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 hover:text-indigo-800 text-xs font-semibold rounded-lg transition-colors cursor-pointer">
                            <i class="fa-solid fa-sliders text-xs"></i>
                            <span>Detail</span>
                        </button>
                    </td>
                </tr>
            `;
        });

        tbody.innerHTML = html;
    }

    /* -------------------------------------------------------------
     * ACTION LIFECYCLE: BEFORE, PROCESS, AFTER (Poin 5 Readme)
     * ------------------------------------------------------------- */

    /**
     * Tampilkan notifikasi Toast modern
     */
    showToast(message, type = 'success') {
        const container = document.getElementById('toast-container');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border text-sm font-medium transition-all duration-300 transform translate-y-4 opacity-0 animate-fade-in-up ${
            type === 'success' 
                ? 'bg-slate-900 text-white border-slate-800' 
                : type === 'warning'
                ? 'bg-amber-500 text-white border-amber-600'
                : 'bg-rose-600 text-white border-rose-700'
        }`;

        let icon = type === 'success' ? 'fa-circle-check text-emerald-400' : type === 'warning' ? 'fa-triangle-exclamation text-white' : 'fa-circle-exclamation text-white';

        toast.innerHTML = `
            <i class="fa-solid ${icon} text-base"></i>
            <span>${message}</span>
        `;

        container.appendChild(toast);

        setTimeout(() => {
            toast.classList.remove('translate-y-4', 'opacity-0');
        }, 10);

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(10px)';
            setTimeout(() => toast.remove(), 300);
        }, 4000);
    }

    /**
     * Buka Modal Buat Schedule
     */
    openCreateModal() {
        const modal = document.getElementById('modal-create');
        if (!modal) return;

        // Reset form
        document.getElementById('form-create-schedule').reset();
        
        // Default dates
        const today = new Date().toISOString().split('T')[0];
        const next3Days = new Date();
        next3Days.setDate(next3Days.getDate() + 2);
        const finishDefault = next3Days.toISOString().split('T')[0];

        document.getElementById('create-start-date').value = today;
        document.getElementById('create-finish-date').value = finishDefault;
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

    /**
     * Live Preview kalkulasi target saat membuat schedule
     */
    updateCreatePreview() {
        const start = document.getElementById('create-start-date').value;
        const finish = document.getElementById('create-finish-date').value;
        const totalQty = parseInt(document.getElementById('create-target-qty').value) || 0;

        const previewBox = document.getElementById('create-calc-preview');
        if (!start || !finish || totalQty <= 0) {
            previewBox.innerHTML = `<p class="text-xs text-slate-400 italic">Pilih tanggal dan jumlah target untuk melihat formula pembagian harian.</p>`;
            return;
        }

        const dist = this.calculateDailyDistribution(start, finish, totalQty);
        if (dist.totalDays <= 0) {
            previewBox.innerHTML = `<p class="text-xs text-rose-500 font-semibold">Tanggal finish tidak boleh lebih awal dari start!</p>`;
            return;
        }

        let breakdownHtml = dist.dailyList.map((d, i) => {
            const isLast = (i === dist.dailyList.length - 1);
            return `
                <div class="px-2.5 py-1.5 bg-white rounded-lg border border-slate-200 text-xs flex justify-between items-center ${isLast ? 'border-indigo-400 bg-indigo-50/50' : ''}">
                    <span class="text-slate-600 font-medium">Hari ke-${d.day_index} (${this.formatDate(d.date)})</span>
                    <span class="font-bold ${isLast ? 'text-indigo-600' : 'text-slate-800'}">${d.target_qty} pcs ${isLast && dist.remainder > 0 ? `(+${dist.remainder})` : ''}</span>
                </div>
            `;
        }).join('');

        previewBox.innerHTML = `
            <div class="space-y-2">
                <div class="flex items-center justify-between text-xs pb-2 border-b border-indigo-100">
                    <span class="text-indigo-900 font-semibold">Total Durasi: <strong>${dist.totalDays} Hari</strong></span>
                    <span class="text-indigo-900 font-semibold">Base: <strong>${dist.baseTarget} pcs/hari</strong></span>
                    <span class="text-indigo-900 font-semibold">Sisa Modulo: <strong class="text-indigo-600">+${dist.remainder} pcs (hari akhir)</strong></span>
                </div>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-1">
                    ${breakdownHtml}
                </div>
            </div>
        `;
    }

    /**
     * Submit Create Schedule dengan Lifecycle JS
     */
    async submitCreateSchedule(event) {
        event.preventDefault();
        
        const lineCode = document.getElementById('create-line-code').value;
        const orderNo = document.getElementById('create-order-no').value;
        const buyer = document.getElementById('create-buyer').value;
        const style = document.getElementById('create-style').value;
        const startDate = document.getElementById('create-start-date').value;
        const finishDate = document.getElementById('create-finish-date').value;
        const totalQty = parseInt(document.getElementById('create-target-qty').value);

        const btn = document.getElementById('btn-submit-create');
        const origText = btn.innerHTML;

        // 1. BEFORE PROCESS STATE
        btn.disabled = true;
        btn.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin"></i> Memproses Schedule...`;

        // 2. PROCESS (Simulate Async Network Delay)
        await new Promise(resolve => setTimeout(resolve, 500));

        const dist = this.calculateDailyDistribution(startDate, finishDate, totalQty);
        const targetLine = this.lines.find(l => l.code === lineCode);

        const newSchedule = {
            id: Date.now(),
            order_id: Date.now() + 1,
            line_id: targetLine ? targetLine.id : 1,
            order_no: orderNo,
            buyer: buyer,
            style: style,
            line_code: lineCode,
            start_date: startDate,
            finish_date: finishDate,
            total_target_qty: totalQty,
            total_actual_qty: 0,
            status: 'scheduled',
            shifted_days: 0,
            daily_outputs: dist.dailyList
        };

        this.schedules.push(newSchedule);

        // 3. AFTER PROCESS STATE
        btn.disabled = false;
        btn.innerHTML = origText;
        this.closeCreateModal();

        this.renderStats();
        this.renderScheduleTimeline();
        this.renderScheduleTable();

        this.showToast(`Schedule ${orderNo} berhasil dibuat untuk ${lineCode}!`, 'success');
    }

    /**
     * Buka Modal Detail & Dynamic Balancing
     */
    openDetailModal(scheduleId) {
        const schedule = this.schedules.find(s => s.id === scheduleId);
        if (!schedule) return;

        this.activeScheduleDetail = schedule;

        const modal = document.getElementById('modal-detail');
        if (!modal) return;

        document.getElementById('detail-order-no').textContent = schedule.order_no;
        document.getElementById('detail-style').textContent = schedule.style;
        document.getElementById('detail-buyer').textContent = schedule.buyer;
        document.getElementById('detail-line').textContent = schedule.line_code;
        document.getElementById('detail-target-total').textContent = schedule.total_target_qty.toLocaleString('id-ID') + ' pcs';
        document.getElementById('detail-actual-total').textContent = schedule.total_actual_qty.toLocaleString('id-ID') + ' pcs';
        document.getElementById('detail-start').textContent = this.formatDate(schedule.start_date);
        document.getElementById('detail-finish').textContent = this.formatDate(schedule.finish_date);

        this.renderDetailDailyTable(schedule);

        modal.classList.remove('hidden');
        modal.classList.add('flex');
    }

    closeDetailModal() {
        const modal = document.getElementById('modal-detail');
        if (modal) {
            modal.classList.add('hidden');
            modal.classList.remove('flex');
        }
        this.activeScheduleDetail = null;
    }

    renderDetailDailyTable(schedule) {
        const tbody = document.getElementById('detail-daily-tbody');
        if (!tbody) return;

        let html = '';
        schedule.daily_outputs.forEach((d, idx) => {
            const hasActual = d.actual_qty !== null && d.actual_qty !== undefined;
            const diff = hasActual ? (d.actual_qty - d.target_qty) : 0;
            const isDeficit = hasActual && diff < 0;

            html += `
                <tr class="border-b border-slate-100 hover:bg-slate-50/70 transition-colors">
                    <td class="py-3 px-4 text-xs font-semibold text-slate-500">Hari ke-${d.day_index}</td>
                    <td class="py-3 px-4 text-xs font-bold text-slate-800">${this.formatDate(d.date)}</td>
                    <td class="py-3 px-4 text-xs font-semibold text-slate-700">${d.target_qty} pcs</td>
                    <td class="py-3 px-4">
                        <div class="flex items-center gap-2">
                            <input type="number" min="0" 
                                id="actual-input-${idx}" 
                                value="${hasActual ? d.actual_qty : ''}" 
                                placeholder="Input pcs"
                                class="w-28 px-3 py-1.5 text-xs font-bold bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                            />
                            <button type="button" 
                                onclick="window.scheduleApp.processDailyBalancing(${schedule.id}, ${idx})"
                                id="btn-save-daily-${idx}"
                                class="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-lg text-xs font-semibold shadow-xs transition-all cursor-pointer">
                                Simpan
                            </button>
                        </div>
                    </td>
                    <td class="py-3 px-4 text-xs">
                        ${hasActual ? `
                            <span class="inline-flex items-center gap-1 font-bold ${isDeficit ? 'text-rose-600' : 'text-emerald-600'}">
                                <i class="fa-solid ${isDeficit ? 'fa-arrow-down' : 'fa-arrow-up'} text-[10px]"></i>
                                ${diff > 0 ? '+' : ''}${diff} pcs
                            </span>
                        ` : `<span class="text-slate-400 italic">Belum diinput</span>`}
                    </td>
                    <td class="py-3 px-4 text-xs">
                        ${hasActual ? `
                            <span class="px-2 py-0.5 rounded-full font-semibold text-[11px] ${isDeficit ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}">
                                ${isDeficit ? 'Auto-Balanced' : 'Tercapai'}
                            </span>
                        ` : `<span class="text-slate-400">-</span>`}
                    </td>
                </tr>
            `;
        });

        tbody.innerHTML = html;
    }

    /**
     * Proses Balancing Dinamis & Efek Domino Kemunduran (Poin 3 Readme)
     */
    async processDailyBalancing(scheduleId, dayIdx) {
        const schedule = this.schedules.find(s => s.id === scheduleId);
        if (!schedule) return;

        const inputElem = document.getElementById(`actual-input-${dayIdx}`);
        const saveBtn = document.getElementById(`btn-save-daily-${dayIdx}`);
        const actualVal = parseInt(inputElem.value);

        if (isNaN(actualVal) || actualVal < 0) {
            this.showToast('Masukkan nilai actual output yang valid (>= 0)!', 'error');
            return;
        }

        // 1. BEFORE PROCESS: Button loading state
        const origBtnText = saveBtn.innerHTML;
        saveBtn.disabled = true;
        saveBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i>`;
        inputElem.disabled = true;

        this.showToast('Menganalisis balancing & efek cascade...', 'warning');

        // 2. PROCESS (Async simulation)
        await new Promise(res => setTimeout(res, 600));

        const targetRecord = schedule.daily_outputs[dayIdx];
        targetRecord.actual_qty = actualVal;
        targetRecord.is_closed = true;

        const deficit = targetRecord.target_qty - actualVal;
        targetRecord.deficit = Math.max(0, deficit);

        // Hitung total aktual baru
        let newTotalActual = 0;
        schedule.daily_outputs.forEach(d => {
            if (d.actual_qty !== null) newTotalActual += d.actual_qty;
        });
        schedule.total_actual_qty = newTotalActual;

        let cascadeMessage = '';

        // Sesuai Ketentuan Poin 3:
        // "jika hasilnya actual output kurang dari target output per harinya untuk balance qty dilanjutkan atau menambah untuk target output hari berikutnya 
        // sehingga range tanggal schedule akan bertambah hari dan bertambahnya hari tersebut mempengaruhi kemunduran schedule setelahnya."
        if (deficit > 0) {
            // Skenario 1: Jika masih ada hari berikutnya, tambahkan defisit ke target berikutnya
            if (dayIdx + 1 < schedule.daily_outputs.length) {
                schedule.daily_outputs[dayIdx + 1].target_qty += deficit;
                cascadeMessage = `Defisit ${deficit} pcs dialihkan ke target hari ke-${dayIdx + 2}.`;
            } else {
                // Skenario 2: Jika sudah di hari terakhir, jadwalkan penambahan hari baru di akhir schedule!
                const lastDate = new Date(schedule.finish_date);
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

                // CASCADE RESCHEDULING KE JADWAL SETELAHNYA PADA LINE YANG SAMA
                const subsequentSchedules = this.schedules.filter(s => 
                    s.line_code === schedule.line_code && 
                    s.id !== schedule.id && 
                    new Date(s.start_date) <= new Date(extraDateStr)
                );

                if (subsequentSchedules.length > 0) {
                    subsequentSchedules.forEach(sub => {
                        const oldStart = new Date(sub.start_date);
                        const oldFinish = new Date(sub.finish_date);
                        
                        // Geser 1 hari
                        oldStart.setDate(oldStart.getDate() + 1);
                        oldFinish.setDate(oldFinish.getDate() + 1);

                        sub.start_date = oldStart.toISOString().split('T')[0];
                        sub.finish_date = oldFinish.toISOString().split('T')[0];
                        sub.shifted_days += 1;

                        // Geser tanggal daily outputs
                        sub.daily_outputs.forEach(d => {
                            const dDate = new Date(d.date);
                            dDate.setDate(dDate.getDate() + 1);
                            d.date = dDate.toISOString().split('T')[0];
                        });
                    });

                    cascadeMessage = `Defisit ${deficit} pcs menyebabkan jadwal bertambah 1 hari! Efek domino: ${subsequentSchedules.length} order berikutnya pada ${schedule.line_code} otomatis mundur.`;
                } else {
                    cascadeMessage = `Defisit ${deficit} pcs menyebabkan schedule bertambah 1 hari hingga ${this.formatDate(extraDateStr)}.`;
                }
            }
        } else {
            cascadeMessage = `Target hari ke-${dayIdx + 1} tercapai dengan sukses!`;
        }

        // 3. AFTER PROCESS: Restore UI & re-render
        saveBtn.disabled = false;
        saveBtn.innerHTML = origBtnText;
        inputElem.disabled = false;

        this.renderStats();
        this.renderScheduleTimeline();
        this.renderScheduleTable();
        this.renderDetailDailyTable(schedule);

        // Update modal header numbers
        document.getElementById('detail-actual-total').textContent = schedule.total_actual_qty.toLocaleString('id-ID') + ' pcs';
        document.getElementById('detail-finish').textContent = this.formatDate(schedule.finish_date);

        this.showToast(cascadeMessage, deficit > 0 ? 'warning' : 'success');
    }

    setupEventListeners() {
        // Line filter pills
        document.querySelectorAll('.filter-line-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.filter-line-btn').forEach(b => {
                    b.classList.remove('bg-indigo-600', 'text-white', 'shadow-xs');
                    b.classList.add('bg-white', 'text-slate-600', 'border-slate-200');
                });
                btn.classList.add('bg-indigo-600', 'text-white', 'shadow-xs');
                btn.classList.remove('bg-white', 'text-slate-600');

                this.selectedLine = btn.getAttribute('data-line');
                this.renderScheduleTimeline();
                this.renderScheduleTable();
            });
        });

        // View toggle (Timeline vs Table)
        const toggleTimeline = document.getElementById('toggle-view-timeline');
        const toggleTable = document.getElementById('toggle-view-table');
        const timelineView = document.getElementById('view-timeline');
        const tableView = document.getElementById('view-table');

        if (toggleTimeline && toggleTable) {
            toggleTimeline.addEventListener('click', () => {
                this.activeView = 'timeline';
                toggleTimeline.classList.add('bg-white', 'text-slate-900', 'shadow-xs');
                toggleTimeline.classList.remove('text-slate-500');
                toggleTable.classList.remove('bg-white', 'text-slate-900', 'shadow-xs');
                toggleTable.classList.add('text-slate-500');

                timelineView.classList.remove('hidden');
                tableView.classList.add('hidden');
            });

            toggleTable.addEventListener('click', () => {
                this.activeView = 'table';
                toggleTable.classList.add('bg-white', 'text-slate-900', 'shadow-xs');
                toggleTable.classList.remove('text-slate-500');
                toggleTimeline.classList.remove('bg-white', 'text-slate-900', 'shadow-xs');
                toggleTimeline.classList.add('text-slate-500');

                tableView.classList.remove('hidden');
                timelineView.classList.add('hidden');
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

// Instantiate and expose globally
document.addEventListener('DOMContentLoaded', () => {
    window.scheduleApp = new ScheduleApp();
});
