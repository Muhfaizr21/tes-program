<!DOCTYPE html>
<html lang="id" class="h-full bg-slate-900 text-slate-100 antialiased selection:bg-cyan-500 selection:text-white">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>@yield('title', 'MES Sewing Scheduler') - Production Operations Center</title>
    
    <!-- Google Fonts: Plus Jakarta Sans + JetBrains Mono -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    
    <!-- FontAwesome 6 Pro CDN -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
    
    @vite(['resources/css/app.css', 'resources/js/app.js'])
</head>
<body class="h-full bg-slate-950 text-slate-100 flex flex-col font-sans overflow-x-hidden">
    
    <!-- Top Production Operations Bar (Industrial Header) -->
    <header class="bg-slate-900 border-b border-slate-800/80 sticky top-0 z-40 select-none backdrop-blur-md bg-opacity-95">
        <div class="px-4 lg:px-6">
            <div class="flex items-center justify-between h-14">
                
                <!-- Brand & Plant Telemetry -->
                <div class="flex items-center gap-4">
                    <div class="flex items-center gap-2.5">
                        <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-slate-950 font-black shadow-xs shadow-cyan-500/20">
                            <i class="fa-solid fa-network-wired text-sm"></i>
                        </div>
                        <div>
                            <div class="flex items-center gap-2">
                                <span class="font-extrabold text-sm tracking-tight text-white uppercase">GARMENT MES</span>
                                <span class="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800/60 font-semibold">v2.6-PROD</span>
                            </div>
                            <span class="text-[11px] text-slate-400 font-medium">Sewing Operations & Cascade Scheduling</span>
                        </div>
                    </div>

                    <div class="hidden xl:flex items-center gap-4 pl-6 border-l border-slate-800 text-xs">
                        <div class="flex items-center gap-2">
                            <span class="text-slate-500 uppercase text-[10px] font-bold tracking-wider">Facility:</span>
                            <span class="font-semibold text-slate-300">Plant-02 Subang</span>
                        </div>
                        <div class="flex items-center gap-2">
                            <span class="text-slate-500 uppercase text-[10px] font-bold tracking-wider">Shift:</span>
                            <span class="px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-400 border border-emerald-800/60 font-mono text-[11px] font-bold flex items-center gap-1.5">
                                <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> SHIFT 1 [07:00-15:30]
                            </span>
                        </div>
                        <div class="flex items-center gap-2">
                            <span class="text-slate-500 uppercase text-[10px] font-bold tracking-wider">Lines:</span>
                            <span class="font-mono text-slate-200 font-semibold">3/3 Active</span>
                        </div>
                    </div>
                </div>

                <!-- Right Quick Operations & Clock -->
                <div class="flex items-center gap-3">
                    <!-- Live Technical Clock -->
                    <div class="hidden md:flex items-center gap-2 font-mono text-xs px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700/60 text-slate-300 tabular-data">
                        <i class="fa-regular fa-clock text-slate-400"></i>
                        <span id="mes-clock">2026-03-01 07:00:00 WIB</span>
                    </div>

                    <!-- Reset Demo Button -->
                    <button type="button" onclick="window.scheduleApp.resetData()" title="Muat Ulang Demo Matrix" class="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 text-xs font-semibold transition-colors cursor-pointer">
                        <i class="fa-solid fa-rotate text-xs"></i>
                    </button>

                    <!-- Add Schedule Action -->
                    <button type="button" onclick="window.scheduleApp.openCreateModal()" class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 active:bg-cyan-600 text-slate-950 font-bold text-xs shadow-sm shadow-cyan-500/20 transition-all cursor-pointer">
                        <i class="fa-solid fa-plus text-[11px]"></i>
                        <span>Alokasi Schedule</span>
                        <kbd class="hidden lg:inline-block px-1 py-0.2 rounded bg-cyan-600/30 text-[10px] font-mono border border-cyan-700/40">N</kbd>
                    </button>
                </div>

            </div>
        </div>
    </header>

    <!-- Main Content Work Area -->
    <main class="flex-1 flex flex-col">
        @yield('content')
    </main>

    <!-- Toast Notification Anchor -->
    <div id="toast-container" class="fixed bottom-6 right-6 z-50 flex flex-col gap-2.5 pointer-events-none max-w-md w-full"></div>

    <!-- Live Clock Script & Global Keybinds -->
    <script>
        function updateClock() {
            const now = new Date();
            const dateStr = now.toISOString().split('T')[0];
            const timeStr = now.toTimeString().split(' ')[0];
            const elem = document.getElementById('mes-clock');
            if (elem) elem.textContent = `${dateStr} ${timeStr} WIB`;
        }
        setInterval(updateClock, 1000);
        updateClock();

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;
            if (e.key === 'n' || e.key === 'N') {
                e.preventDefault();
                if (window.scheduleApp) window.scheduleApp.openCreateModal();
            }
            if (e.key === 'Escape') {
                if (window.scheduleApp) {
                    window.scheduleApp.closeCreateModal();
                    window.scheduleApp.closeSlideOver();
                }
            }
        });
    </script>
    @stack('scripts')
</body>
</html>
