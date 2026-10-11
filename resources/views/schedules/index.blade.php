@extends('layouts.app')

@section('title', 'Production Control Room & Gantt Scheduling')

@section('content')
<div class="flex-1 flex flex-col px-4 lg:px-6 py-5 max-w-[1600px] mx-auto w-full gap-5">

    <!-- KPI Operations Strip (Industrial Telemetry Strip) -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
        <!-- Metric 1: Scheduled Orders -->
        <div class="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 flex items-center justify-between shadow-xs">
            <div>
                <span class="text-[11px] font-mono uppercase text-slate-400 font-semibold tracking-wider block">Active Orders</span>
                <div class="flex items-baseline gap-2 mt-1">
                    <span class="text-2xl font-mono font-extrabold text-white tracking-tight" id="stat-orders">0</span>
                    <span class="text-xs text-slate-400 font-medium">batches</span>
                </div>
            </div>
            <div class="w-10 h-10 rounded-lg bg-slate-800 border border-slate-700/60 flex items-center justify-center text-cyan-400 text-sm">
                <i class="fa-solid fa-boxes-stacked"></i>
            </div>
        </div>

        <!-- Metric 2: Target QTY Allocation -->
        <div class="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 flex items-center justify-between shadow-xs">
            <div>
                <span class="text-[11px] font-mono uppercase text-slate-400 font-semibold tracking-wider block">Total Target Qty</span>
                <div class="flex items-baseline gap-2 mt-1">
                    <span class="text-2xl font-mono font-extrabold text-white tracking-tight" id="stat-target">0</span>
                    <span class="text-xs text-slate-400 font-medium">pcs</span>
                </div>
            </div>
            <div class="w-10 h-10 rounded-lg bg-slate-800 border border-slate-700/60 flex items-center justify-center text-blue-400 text-sm">
                <i class="fa-solid fa-bullseye"></i>
            </div>
        </div>

        <!-- Metric 3: Actual Realized Output -->
        <div class="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between shadow-xs">
            <div class="flex items-center justify-between">
                <span class="text-[11px] font-mono uppercase text-slate-400 font-semibold tracking-wider">Actual Needle Output</span>
                <span class="text-xs font-mono font-bold text-emerald-400" id="stat-percent">0%</span>
            </div>
            <div class="mt-1 flex items-baseline gap-2">
                <span class="text-2xl font-mono font-extrabold text-emerald-400 tracking-tight" id="stat-actual">0</span>
                <span class="text-xs text-slate-400 font-medium">pcs</span>
            </div>
            <div class="w-full bg-slate-800 rounded-full h-1.5 mt-2 overflow-hidden">
                <div id="stat-progress-bar" class="bg-emerald-500 h-1.5 rounded-full transition-all duration-500" style="width: 0%"></div>
            </div>
        </div>

        <!-- Metric 4: Cascade / Auto-Balancing Health -->
        <div class="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 flex items-center justify-between shadow-xs">
            <div>
                <span class="text-[11px] font-mono uppercase text-slate-400 font-semibold tracking-wider block">Cascade Health</span>
                <div class="flex items-center gap-2 mt-1">
                    <span class="text-sm font-bold font-mono text-slate-200" id="stat-cascade-summary">Synchronized</span>
                </div>
                <span class="text-[10px] text-slate-400 mt-0.5 block" id="stat-cascade-detail">No domino delays detected</span>
            </div>
            <div class="w-10 h-10 rounded-lg bg-slate-800 border border-slate-700/60 flex items-center justify-center text-amber-400 text-sm">
                <i class="fa-solid fa-timeline"></i>
            </div>
        </div>
    </div>

    <!-- Production Control Toolbar -->
    <div class="bg-slate-900 border border-slate-800 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 shadow-xs">
        
        <!-- Left: Line Selector Filter Tabs -->
        <div class="flex items-center gap-1.5 overflow-x-auto">
            <span class="text-[11px] font-mono uppercase text-slate-500 font-bold px-2">Line:</span>
            <button type="button" data-line="all" class="filter-line-btn px-3 py-1.5 rounded-lg text-xs font-mono font-bold bg-cyan-500 text-slate-950 transition-all cursor-pointer">
                ALL LINES
            </button>
            <button type="button" data-line="LINE-01" class="filter-line-btn px-3 py-1.5 rounded-lg text-xs font-mono font-bold bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700 transition-all cursor-pointer">
                LINE-01 (Kemeja)
            </button>
            <button type="button" data-line="LINE-02" class="filter-line-btn px-3 py-1.5 rounded-lg text-xs font-mono font-bold bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700 transition-all cursor-pointer">
                LINE-02 (Jacket)
            </button>
            <button type="button" data-line="LINE-03" class="filter-line-btn px-3 py-1.5 rounded-lg text-xs font-mono font-bold bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700 transition-all cursor-pointer">
                LINE-03 (Chino)
            </button>
        </div>

        <!-- Center: Date Scrubber Indicator -->
        <div class="hidden lg:flex items-center gap-2 font-mono text-xs text-slate-400 bg-slate-950/80 px-3 py-1 rounded-lg border border-slate-800">
            <i class="fa-solid fa-calendar-days text-cyan-400"></i>
            <span>Timeline Window: <strong class="text-slate-200">01 Mar 2026 - 14 Mar 2026</strong> (14 Days)</span>
        </div>

        <!-- Right: View Modes -->
        <div class="flex items-center gap-2">
            <div class="flex bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs font-mono">
                <button type="button" id="toggle-view-gantt" class="flex items-center gap-1.5 px-3 py-1 rounded-md bg-slate-800 text-cyan-400 font-bold border border-slate-700 shadow-xs cursor-pointer">
                    <i class="fa-solid fa-bars-progress text-xs"></i>
                    <span>Gantt Matrix</span>
                </button>
                <button type="button" id="toggle-view-table" class="flex items-center gap-1.5 px-3 py-1 rounded-md text-slate-400 hover:text-white font-semibold transition-colors cursor-pointer">
                    <i class="fa-solid fa-table text-xs"></i>
                    <span>Tabular Data</span>
                </button>
            </div>
        </div>

    </div>

    <!-- ===================================================================== -->
    <!-- VIEW 1: INTERACTIVE GANTT TIMELINE MATRIX                             -->
    <!-- ===================================================================== -->
    <div id="view-gantt" class="flex-1 flex flex-col bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xs">
        
        <!-- Gantt Instructions & Legend Bar -->
        <div class="px-4 py-2.5 bg-slate-950/70 border-b border-slate-800 flex flex-wrap items-center justify-between text-xs text-slate-400 gap-2 font-mono">
            <div class="flex items-center gap-3">
                <span class="text-slate-500 uppercase font-bold text-[10px]">Legend:</span>
                <span class="flex items-center gap-1.5 text-[11px] text-slate-300">
                    <span class="w-2.5 h-2.5 rounded-sm bg-cyan-500"></span> On-Track Schedule
                </span>
                <span class="flex items-center gap-1.5 text-[11px] text-amber-400">
                    <span class="w-2.5 h-2.5 rounded-sm bg-amber-500 animate-pulse"></span> Auto-Shifted (+Delayed)
                </span>
                <span class="flex items-center gap-1.5 text-[11px] text-emerald-400">
                    <span class="w-2.5 h-2.5 rounded-sm bg-emerald-500"></span> Completed
                </span>
            </div>
            <div class="text-[11px] text-slate-400 flex items-center gap-1.5">
                <i class="fa-solid fa-hand-pointer text-cyan-400 text-xs"></i>
                <span>Klik kartu order untuk membuka Drawer Input Aktual & Balancing Harian.</span>
            </div>
        </div>

        <!-- Gantt Matrix Scrollable Viewport -->
        <div class="overflow-x-auto">
            <div class="min-w-[1100px]">
                
                <!-- Dynamic Gantt Calendar Header (Rendered by JS) -->
                <div id="gantt-header-row" class="gantt-grid-header bg-slate-950/90 border-b border-slate-800 text-[11px] font-mono select-none">
                    <!-- Populated by JavaScript -->
                </div>

                <!-- Gantt Line Rows Container -->
                <div id="gantt-body-container" class="divide-y divide-slate-800/80">
                    <!-- Populated by JavaScript -->
                </div>

            </div>
        </div>

        <!-- Gantt Footer Status -->
        <div class="p-3 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between text-xs font-mono text-slate-500">
            <span>Algoritma Penjadwalan: $\lfloor Q / N \rfloor$ per hari, sisa modulo $(Q \pmod N)$ ditempatkan pada tanggal finish.</span>
            <span class="text-slate-400">Sewing Line Synchronization: <strong class="text-emerald-400">Connected</strong></span>
        </div>

    </div>

    <!-- ===================================================================== -->
    <!-- VIEW 2: HIGH-DENSITY TABULAR DATA                                     -->
    <!-- ===================================================================== -->
    <div id="view-table" class="hidden flex-1 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xs">
        <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse text-xs">
                <thead>
                    <tr class="bg-slate-950 border-b border-slate-800 font-mono text-[11px] uppercase tracking-wider text-slate-400">
                        <th class="py-3 px-4">Line ID</th>
                        <th class="py-3 px-4">PO & Buyer</th>
                        <th class="py-3 px-4">Style Specification</th>
                        <th class="py-3 px-4">Date Window</th>
                        <th class="py-3 px-4 text-right">Target (pcs)</th>
                        <th class="py-3 px-4 text-right">Actual (pcs)</th>
                        <th class="py-3 px-4">Daily Target Allocation</th>
                        <th class="py-3 px-4">Status</th>
                        <th class="py-3 px-4 text-center">Action</th>
                    </tr>
                </thead>
                <tbody id="tabular-body" class="divide-y divide-slate-800/80 font-mono">
                    <!-- Populated by JavaScript -->
                </tbody>
            </table>
        </div>
    </div>

</div>

<!-- ========================================================================= -->
<!-- SLIDE-OVER DRAWER: TECHNICAL INSPECTOR & AUTO-BALANCING COCKPIT           -->
<!-- ========================================================================= -->
<div id="slide-over-backdrop" class="fixed inset-0 z-50 hidden bg-slate-950/80 backdrop-blur-xs transition-opacity duration-300">
    <div class="fixed inset-y-0 right-0 max-w-2xl w-full bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col animate-drawer-in">
        
        <!-- Drawer Header -->
        <div class="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
            <div class="flex items-center gap-3">
                <div class="w-9 h-9 rounded-lg bg-cyan-950 text-cyan-400 border border-cyan-800/80 flex items-center justify-center font-bold text-sm">
                    <i class="fa-solid fa-sliders"></i>
                </div>
                <div>
                    <div class="flex items-center gap-2">
                        <span id="drawer-order-no" class="font-mono font-bold text-white text-base">PO-2026-001</span>
                        <span id="drawer-line-badge" class="px-2 py-0.5 rounded font-mono text-[11px] font-bold bg-slate-800 text-cyan-400 border border-slate-700">LINE-01</span>
                    </div>
                    <span id="drawer-buyer-style" class="text-xs text-slate-400">Uniqlo Japan &bull; Dry-EX Polo Shirt</span>
                </div>
            </div>
            
            <button type="button" onclick="window.scheduleApp.closeSlideOver()" class="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer">
                <i class="fa-solid fa-xmark text-base"></i>
            </button>
        </div>

        <!-- Drawer Content Body (Scrollable) -->
        <div class="flex-1 overflow-y-auto p-6 space-y-6">

            <!-- Target Allocation & Math Formula Box -->
            <div class="bg-slate-950/90 border border-slate-800 rounded-xl p-4 space-y-3 font-mono">
                <div class="flex items-center justify-between text-xs pb-2 border-b border-slate-800/80">
                    <span class="text-slate-400 font-bold uppercase text-[10px]">Formula Matematika Target:</span>
                    <span class="text-cyan-400 font-semibold" id="drawer-formula-desc">Base: 333 pcs/hari | Remainder: +1 pcs</span>
                </div>
                <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div>
                        <span class="text-[10px] text-slate-500 uppercase block">Total Target</span>
                        <strong class="text-white text-sm" id="drawer-total-target">1,000 pcs</strong>
                    </div>
                    <div>
                        <span class="text-[10px] text-slate-500 uppercase block">Actual Output</span>
                        <strong class="text-emerald-400 text-sm" id="drawer-total-actual">300 pcs</strong>
                    </div>
                    <div>
                        <span class="text-[10px] text-slate-500 uppercase block">Start Date</span>
                        <strong class="text-slate-300 text-xs" id="drawer-start-date">2026-03-01</strong>
                    </div>
                    <div>
                        <span class="text-[10px] text-slate-500 uppercase block">Finish Date</span>
                        <strong class="text-slate-300 text-xs" id="drawer-finish-date">2026-03-03</strong>
                    </div>
                </div>
            </div>

            <!-- Cascade Warning / Domino Alert Banner -->
            <div id="drawer-cascade-box" class="p-4 rounded-xl border border-amber-800/60 bg-amber-950/30 flex items-start gap-3 text-xs text-amber-200">
                <i class="fa-solid fa-circle-nodes text-amber-400 text-base mt-0.5"></i>
                <div class="space-y-1">
                    <strong class="font-bold text-amber-300 block text-xs">Mekanisme Dynamic Balancing & Cascade Rescheduling</strong>
                    <p class="text-amber-200/90 text-[11px] leading-relaxed">
                        Input aktual output harian di bawah target akan menghasilkan defisit. Defisit dialihkan ke hari berikutnya atau menambah hari schedule (+1d). Penambahan hari secara otomatis memundurkan seluruh order berikutnya pada sewing line ini (*cascade domino effect*).
                    </p>
                </div>
            </div>

            <!-- Daily Target Breakdown & Actual Input Matrix -->
            <div class="space-y-2.5">
                <div class="flex items-center justify-between">
                    <h4 class="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
                        Rincian Alokasi Harian & Input Aktual
                    </h4>
                    <span class="text-[10px] font-mono text-slate-400">Poin 2 & 3 Spesifikasi Readme</span>
                </div>

                <div class="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-xs">
                    <table class="w-full text-left border-collapse text-xs font-mono">
                        <thead>
                            <tr class="bg-slate-900 border-b border-slate-800 text-[10px] uppercase tracking-wider text-slate-400">
                                <th class="py-2.5 px-3">Hari</th>
                                <th class="py-2.5 px-3">Tanggal</th>
                                <th class="py-2.5 px-3">Target Output</th>
                                <th class="py-2.5 px-3">Aktual Output</th>
                                <th class="py-2.5 px-3">Deviasi</th>
                                <th class="py-2.5 px-3 text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody id="drawer-daily-tbody" class="divide-y divide-slate-800/80">
                            <!-- Populated dynamically by JS -->
                        </tbody>
                    </table>
                </div>
            </div>

        </div>

        <!-- Drawer Footer -->
        <div class="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
            <span class="text-[11px] font-mono text-slate-500">Tekan [ESC] untuk menutup panel.</span>
            <button type="button" onclick="window.scheduleApp.closeSlideOver()" class="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono text-xs font-bold transition-colors cursor-pointer">
                Selesai
            </button>
        </div>

    </div>
</div>

<!-- ========================================================================= -->
<!-- MODAL: ALOKASI SCHEDULE BARU (HIGH-PRECISION FORM)                        -->
<!-- ========================================================================= -->
<div id="modal-create" class="fixed inset-0 z-50 hidden items-center justify-center bg-slate-950/80 backdrop-blur-xs p-4 overflow-y-auto">
    <div class="bg-slate-900 rounded-2xl max-w-xl w-full border border-slate-800 shadow-2xl overflow-hidden animate-drawer-in">
        
        <!-- Header -->
        <div class="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
            <div class="flex items-center gap-3">
                <div class="w-9 h-9 rounded-lg bg-cyan-950 text-cyan-400 border border-cyan-800/80 flex items-center justify-center font-bold text-sm">
                    <i class="fa-solid fa-calendar-plus"></i>
                </div>
                <div>
                    <h3 class="font-bold text-white text-sm">Alokasi Schedule Produksi Baru</h3>
                    <p class="text-xs text-slate-400">Atur penempatan order pada sewing line dan hitung pembagian target</p>
                </div>
            </div>
            <button type="button" onclick="window.scheduleApp.closeCreateModal()" class="text-slate-400 hover:text-white p-2 rounded-lg cursor-pointer">
                <i class="fa-solid fa-xmark text-base"></i>
            </button>
        </div>

        <!-- Form Body -->
        <form id="form-create-schedule" onsubmit="window.scheduleApp.submitCreateSchedule(event)">
            <div class="p-6 space-y-4">
                
                <div>
                    <label class="block text-xs font-mono font-bold text-slate-300 uppercase tracking-wider mb-1.5">Sewing Line Target</label>
                    <select id="create-line-code" required class="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs font-mono font-semibold text-slate-200 focus:border-cyan-500 focus:outline-none">
                        <option value="LINE-01">LINE-01 &bull; Sewing Line 01 (Kemeja & Polo) [Kapasitas: 400 pcs/hari]</option>
                        <option value="LINE-02">LINE-02 &bull; Sewing Line 02 (Outerwear & Jacket) [Kapasitas: 300 pcs/hari]</option>
                        <option value="LINE-03">LINE-03 &bull; Sewing Line 03 (Pants & Chino) [Kapasitas: 500 pcs/hari]</option>
                    </select>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono">
                    <div>
                        <label class="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">No. Order / PO</label>
                        <input type="text" id="create-order-no" required placeholder="PO-2026-004" value="PO-2026-004"
                            class="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs font-semibold text-slate-200 focus:border-cyan-500 focus:outline-none" />
                    </div>
                    <div>
                        <label class="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">Buyer / Brand</label>
                        <input type="text" id="create-buyer" required placeholder="H&M Global" value="H&M Global"
                            class="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs font-semibold text-slate-200 focus:border-cyan-500 focus:outline-none" />
                    </div>
                </div>

                <div>
                    <label class="block text-[11px] font-mono font-bold text-slate-300 uppercase tracking-wider mb-1">Style / Model Garmen</label>
                    <input type="text" id="create-style" required placeholder="Tailored Linen Blazer" value="Tailored Linen Blazer"
                        class="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs font-semibold text-slate-200 focus:border-cyan-500 focus:outline-none" />
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono">
                    <div>
                        <label class="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">Start Sewing</label>
                        <input type="date" id="create-start-date" required
                            class="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs font-bold text-slate-200 focus:border-cyan-500 focus:outline-none" />
                    </div>
                    <div>
                        <label class="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">Finish Sewing</label>
                        <input type="date" id="create-finish-date" required
                            class="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs font-bold text-slate-200 focus:border-cyan-500 focus:outline-none" />
                    </div>
                    <div>
                        <label class="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">Total Target Qty</label>
                        <input type="number" id="create-target-qty" min="1" required placeholder="1000"
                            class="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs font-bold text-slate-200 focus:border-cyan-500 focus:outline-none" />
                    </div>
                </div>

                <!-- Live Mathematical Preview Box -->
                <div class="p-3.5 bg-slate-950 border border-slate-800 rounded-xl font-mono text-xs">
                    <div class="flex items-center gap-2 mb-2 text-cyan-400 font-bold uppercase text-[10px]">
                        <i class="fa-solid fa-calculator"></i>
                        <span>Live Distribution Preview (Sisa di Hari Akhir)</span>
                    </div>
                    <div id="create-calc-preview">
                        <!-- Populated by JS -->
                    </div>
                </div>

            </div>

            <div class="px-6 py-4 bg-slate-950 border-t border-slate-800 flex items-center justify-end gap-3 font-mono">
                <button type="button" onclick="window.scheduleApp.closeCreateModal()" class="px-4 py-2 text-slate-400 hover:text-white text-xs font-semibold rounded-xl cursor-pointer">
                    Batal
                </button>
                <button type="submit" id="btn-submit-create" class="inline-flex items-center gap-2 px-5 py-2.5 bg-cyan-500 hover:bg-cyan-400 active:bg-cyan-600 text-slate-950 text-xs font-extrabold rounded-xl shadow-xs transition-all cursor-pointer">
                    <i class="fa-solid fa-check"></i>
                    <span>Terapkan Schedule</span>
                </button>
            </div>
        </form>

    </div>
</div>
@endsection
