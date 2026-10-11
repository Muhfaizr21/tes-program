@extends('layouts.app')

@section('title', 'Dashboard Penjadwalan Sewing Line')

@section('content')
<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">

    <!-- Hero Title & Subtitle -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
            <h1 class="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Penjadwalan Produksi Sewing Line
            </h1>
            <p class="text-sm text-slate-500 mt-1">
                Alokasi pesanan, formula pembagian target harian, dan dynamic balancing dengan cascade rescheduling.
            </p>
        </div>

        <div class="flex items-center gap-3">
            <!-- View Mode Switcher -->
            <div class="flex bg-slate-200/80 p-1 rounded-xl text-xs font-semibold">
                <button type="button" id="toggle-view-timeline" class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white text-slate-900 shadow-xs transition-all cursor-pointer">
                    <i class="fa-solid fa-chart-gantt"></i>
                    <span>Timeline Board</span>
                </button>
                <button type="button" id="toggle-view-table" class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-slate-600 hover:text-slate-900 transition-all cursor-pointer">
                    <i class="fa-solid fa-table-list"></i>
                    <span>Tabel Detail</span>
                </button>
            </div>

            <!-- Master Data Modal Button -->
            <button type="button" onclick="window.scheduleApp.openCreateModal()" class="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-sm font-semibold rounded-xl shadow-xs transition-all cursor-pointer">
                <i class="fa-solid fa-plus text-xs"></i>
                <span class="hidden sm:inline">Tambah</span> Schedule
            </button>
        </div>
    </div>

    <!-- 4 KPI Summary Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <!-- Card 1: Active Lines -->
        <div class="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
            <div class="flex items-center justify-between">
                <span class="text-xs font-bold uppercase tracking-wider text-slate-400">Sewing Line</span>
                <div class="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center text-sm font-bold">
                    <i class="fa-solid fa-industry"></i>
                </div>
            </div>
            <div class="mt-4">
                <div class="text-2xl font-black text-slate-900 tracking-tight" id="stat-lines">3</div>
                <p class="text-xs text-slate-500 mt-1 flex items-center gap-1">
                    <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <span>Semua line aktif beroperasi</span>
                </p>
            </div>
        </div>

        <!-- Card 2: Total Orders Scheduled -->
        <div class="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
            <div class="flex items-center justify-between">
                <span class="text-xs font-bold uppercase tracking-wider text-slate-400">Total Schedule</span>
                <div class="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center text-sm font-bold">
                    <i class="fa-solid fa-clipboard-list"></i>
                </div>
            </div>
            <div class="mt-4">
                <div class="text-2xl font-black text-slate-900 tracking-tight" id="stat-orders">3</div>
                <p class="text-xs text-slate-500 mt-1">Antrian produksi garmen</p>
            </div>
        </div>

        <!-- Card 3: Target Output vs Actual Output -->
        <div class="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
            <div class="flex items-center justify-between">
                <span class="text-xs font-bold uppercase tracking-wider text-slate-400">Realisasi Output</span>
                <div class="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center text-sm font-bold">
                    <i class="fa-solid fa-chart-pie"></i>
                </div>
            </div>
            <div class="mt-3">
                <div class="flex items-baseline justify-between">
                    <span class="text-xl font-black text-slate-900 tracking-tight" id="stat-actual">900 pcs</span>
                    <span class="text-xs font-bold text-indigo-600" id="stat-percent">29%</span>
                </div>
                <div class="w-full bg-slate-100 rounded-full h-2 mt-2 overflow-hidden">
                    <div id="stat-progress-bar" class="bg-gradient-to-r from-indigo-500 to-emerald-500 h-2 rounded-full transition-all duration-500" style="width: 29%"></div>
                </div>
                <p class="text-[11px] text-slate-400 mt-1.5">Dari total target: <strong class="text-slate-600" id="stat-target">3.050 pcs</strong></p>
            </div>
        </div>

        <!-- Card 4: Cascade Balancing Status -->
        <div class="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
            <div class="flex items-center justify-between">
                <span class="text-xs font-bold uppercase tracking-wider text-slate-400">Status Balancing</span>
                <div class="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center text-sm font-bold">
                    <i class="fa-solid fa-clock-rotate-left"></i>
                </div>
            </div>
            <div class="mt-4">
                <div class="text-base font-bold text-slate-900" id="stat-delayed">Semua On-Track</div>
                <p class="text-[11px] text-slate-500 mt-1">
                    Auto-shift aktif saat defisit
                </p>
            </div>
        </div>
    </div>

    <!-- Filter Line Bar -->
    <div class="bg-white rounded-2xl p-3 border border-slate-200/80 shadow-xs mb-6 flex flex-wrap items-center justify-between gap-3">
        <div class="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            <span class="text-xs font-bold text-slate-500 uppercase tracking-wider px-2">Filter Line:</span>
            <button type="button" data-line="all" class="filter-line-btn px-3 py-1.5 text-xs font-bold rounded-xl bg-indigo-600 text-white shadow-xs transition-all cursor-pointer">
                Semua Line
            </button>
            <button type="button" data-line="LINE-01" class="filter-line-btn px-3 py-1.5 text-xs font-bold rounded-xl bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 transition-all cursor-pointer">
                LINE-01 (Kemeja)
            </button>
            <button type="button" data-line="LINE-02" class="filter-line-btn px-3 py-1.5 text-xs font-bold rounded-xl bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 transition-all cursor-pointer">
                LINE-02 (Jacket)
            </button>
            <button type="button" data-line="LINE-03" class="filter-line-btn px-3 py-1.5 text-xs font-bold rounded-xl bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 transition-all cursor-pointer">
                LINE-03 (Pants)
            </button>
        </div>

        <div class="text-xs text-slate-500 font-medium px-2 flex items-center gap-2">
            <i class="fa-solid fa-circle-info text-indigo-500"></i>
            <span>Sisa bagi target output selalu ditempatkan pada tanggal akhir schedule.</span>
        </div>
    </div>

    <!-- VIEW 1: TIMELINE & GANTT BOARD -->
    <div id="view-timeline" class="transition-all">
        <div id="timeline-container">
            <!-- Dynamically populated by window.scheduleApp -->
        </div>
    </div>

    <!-- VIEW 2: DATA TABLE VIEW -->
    <div id="view-table" class="hidden transition-all">
        <div class="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div class="overflow-x-auto">
                <table class="w-full text-left border-collapse">
                    <thead>
                        <tr class="bg-slate-50/80 border-b border-slate-200 text-xs font-bold uppercase tracking-wider text-slate-500">
                            <th class="px-6 py-4">No</th>
                            <th class="px-6 py-4">Line</th>
                            <th class="px-6 py-4">Order & Buyer</th>
                            <th class="px-6 py-4">Range Tanggal</th>
                            <th class="px-6 py-4">Target Total</th>
                            <th class="px-6 py-4">Aktual Output</th>
                            <th class="px-6 py-4">Target / Hari</th>
                            <th class="px-6 py-4">Status</th>
                            <th class="px-6 py-4 text-right">Aksi</th>
                        </tr>
                    </thead>
                    <tbody id="schedule-table-body" class="divide-y divide-slate-100">
                        <!-- Dynamically populated by window.scheduleApp -->
                    </tbody>
                </table>
            </div>
        </div>
    </div>

</div>

<!-- ========================================================================= -->
<!-- MODAL 1: BUAT SCHEDULE BARU                                               -->
<!-- ========================================================================= -->
<div id="modal-create" class="fixed inset-0 z-50 hidden items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
    <div class="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-100 overflow-hidden animate-fade-in-up">
        
        <!-- Modal Header -->
        <div class="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div class="flex items-center gap-3">
                <div class="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold">
                    <i class="fa-solid fa-calendar-plus"></i>
                </div>
                <div>
                    <h3 class="font-bold text-slate-900 text-base">Buat Schedule Produksi Baru</h3>
                    <p class="text-xs text-slate-500">Alokasikan order ke sewing line dengan formula target harian</p>
                </div>
            </div>
            <button type="button" onclick="window.scheduleApp.closeCreateModal()" class="text-slate-400 hover:text-slate-600 p-2 rounded-lg cursor-pointer">
                <i class="fa-solid fa-xmark text-lg"></i>
            </button>
        </div>

        <!-- Form Body -->
        <form id="form-create-schedule" onsubmit="window.scheduleApp.submitCreateSchedule(event)">
            <div class="p-6 space-y-4">
                
                <!-- Sewing Line Selection -->
                <div>
                    <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Sewing Line Target</label>
                    <select id="create-line-code" required class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none">
                        <option value="LINE-01">LINE-01 - Sewing Line 01 (Kemeja & Polo) [Kapasitas: 400 pcs/hari]</option>
                        <option value="LINE-02">LINE-02 - Sewing Line 02 (Outerwear & Jacket) [Kapasitas: 300 pcs/hari]</option>
                        <option value="LINE-03">LINE-03 - Sewing Line 03 (Pants & Chino) [Kapasitas: 500 pcs/hari]</option>
                    </select>
                </div>

                <!-- Order Info Grid -->
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">No. Order / PO</label>
                        <input type="text" id="create-order-no" required placeholder="Contoh: PO-2026-005" value="PO-2026-005"
                            class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
                    </div>
                    <div>
                        <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Buyer</label>
                        <input type="text" id="create-buyer" required placeholder="Contoh: Uniqlo / H&M" value="Uniqlo"
                            class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
                    </div>
                </div>

                <div>
                    <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Style / Item Name</label>
                    <input type="text" id="create-style" required placeholder="Contoh: Premium Pique Polo Shirt" value="Premium Pique Polo Shirt"
                        class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
                </div>

                <!-- Dates & Qty Grid -->
                <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                        <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Start Sewing</label>
                        <input type="date" id="create-start-date" required
                            class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
                    </div>
                    <div>
                        <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Finish Sewing</label>
                        <input type="date" id="create-finish-date" required
                            class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
                    </div>
                    <div>
                        <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Total Qty Target</label>
                        <input type="number" id="create-target-qty" min="1" required placeholder="1000"
                            class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
                    </div>
                </div>

                <!-- Live Target Calculation Preview Box -->
                <div class="p-4 bg-indigo-50/60 rounded-xl border border-indigo-200/80">
                    <div class="flex items-center gap-2 mb-2 text-indigo-950 font-bold text-xs uppercase tracking-wider">
                        <i class="fa-solid fa-calculator text-indigo-600"></i>
                        <span>Live Calculation Preview (Sisa di Hari Terakhir)</span>
                    </div>
                    <div id="create-calc-preview">
                        <!-- Populated live by updateCreatePreview() -->
                    </div>
                </div>

            </div>

            <!-- Modal Footer -->
            <div class="px-6 py-4 bg-slate-50/80 border-t border-slate-100 flex items-center justify-end gap-3">
                <button type="button" onclick="window.scheduleApp.closeCreateModal()" class="px-4 py-2 text-slate-600 hover:text-slate-800 text-sm font-semibold rounded-xl cursor-pointer">
                    Batal
                </button>
                <button type="submit" id="btn-submit-create" class="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-sm font-bold rounded-xl shadow-xs transition-all cursor-pointer">
                    <i class="fa-solid fa-check text-xs"></i>
                    <span>Simpan Schedule</span>
                </button>
            </div>
        </form>

    </div>
</div>

<!-- ========================================================================= -->
<!-- MODAL 2: DETAIL SCHEDULE, INPUT AKTUAL, & DYNAMIC BALANCING              -->
<!-- ========================================================================= -->
<div id="modal-detail" class="fixed inset-0 z-50 hidden items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
    <div class="bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-slate-100 overflow-hidden animate-fade-in-up">
        
        <!-- Modal Header -->
        <div class="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white flex items-center justify-center font-bold shadow-xs">
                    <i class="fa-solid fa-sliders"></i>
                </div>
                <div>
                    <div class="flex items-center gap-2">
                        <span id="detail-order-no" class="font-extrabold text-slate-900 text-base">PO-xxxx</span>
                        <span id="detail-line" class="px-2 py-0.5 bg-slate-900 text-white text-xs font-bold rounded-md">LINE-01</span>
                    </div>
                    <p class="text-xs text-slate-500 mt-0.5">
                        <span id="detail-style" class="font-semibold text-slate-700">Style Name</span> &bull; Buyer: <span id="detail-buyer">Buyer</span>
                    </p>
                </div>
            </div>
            <button type="button" onclick="window.scheduleApp.closeDetailModal()" class="text-slate-400 hover:text-slate-600 p-2 rounded-lg cursor-pointer">
                <i class="fa-solid fa-xmark text-lg"></i>
            </button>
        </div>

        <!-- Schedule Overview Pill Cards -->
        <div class="px-6 pt-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div class="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                <span class="text-slate-400 font-semibold uppercase block text-[10px]">Total Target Qty</span>
                <strong class="text-slate-900 text-sm" id="detail-target-total">0 pcs</strong>
            </div>
            <div class="p-3 bg-indigo-50/50 rounded-xl border border-indigo-100 text-xs">
                <span class="text-indigo-500 font-semibold uppercase block text-[10px]">Total Aktual Output</span>
                <strong class="text-indigo-900 text-sm" id="detail-actual-total">0 pcs</strong>
            </div>
            <div class="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                <span class="text-slate-400 font-semibold uppercase block text-[10px]">Start Sewing</span>
                <strong class="text-slate-800 text-xs" id="detail-start">-</strong>
            </div>
            <div class="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                <span class="text-slate-400 font-semibold uppercase block text-[10px]">Finish Sewing</span>
                <strong class="text-slate-800 text-xs" id="detail-finish">-</strong>
            </div>
        </div>

        <!-- Rule Explanation Alert -->
        <div class="mx-6 mt-4 p-3.5 bg-amber-50/70 border border-amber-200/80 rounded-xl flex items-start gap-2.5 text-xs text-amber-900">
            <i class="fa-solid fa-lightbulb text-amber-500 text-sm mt-0.5"></i>
            <div>
                <strong>Aturan Auto-Balancing & Cascade Rescheduling:</strong>
                <p class="text-amber-800 mt-0.5 leading-relaxed">
                    Jika aktual output kurang dari target harian, selisih defisit dialihkan ke hari berikutnya. Apabila terjadi di akhir periode, range tanggal jadwal bertambah (+1 hari) dan jadwal order berikutnya pada line ini otomatis mundur (*cascade shift*).
                </p>
            </div>
        </div>

        <!-- Daily Targets & Actual Input Table -->
        <div class="p-6">
            <div class="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                <table class="w-full text-left border-collapse">
                    <thead>
                        <tr class="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                            <th class="py-3 px-4">Hari Ke</th>
                            <th class="py-3 px-4">Tanggal Produksi</th>
                            <th class="py-3 px-4">Target Output</th>
                            <th class="py-3 px-4">Input Aktual Output</th>
                            <th class="py-3 px-4">Deviasi (Defisit)</th>
                            <th class="py-3 px-4">Status</th>
                        </tr>
                    </thead>
                    <tbody id="detail-daily-tbody" class="divide-y divide-slate-100">
                        <!-- Populated dynamically by window.scheduleApp -->
                    </tbody>
                </table>
            </div>
        </div>

        <!-- Modal Footer -->
        <div class="px-6 py-4 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between">
            <span class="text-xs text-slate-400">Tekan "Simpan" pada baris tanggal untuk mengunci aktual output.</span>
            <button type="button" onclick="window.scheduleApp.closeDetailModal()" class="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl cursor-pointer">
                Tutup
            </button>
        </div>

    </div>
</div>
@endsection
