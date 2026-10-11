# AGENT GUIDELINES & IMPLEMENTATION PLAYBOOK

Dokumen ini adalah pedoman operasional dan standar eksekusi untuk AI Developer Agent (Antigravity, Claude, Codex, Cursor, dll.) serta tim engineer dalam mengimplementasikan, memelihara, dan mengembangkan sistem **Sewing Line Production Scheduling & Auto-Balancing System**.

---

## 1. Identitas & Visi Proyek

- **Nama Proyek**: Sewing Line Production Scheduler
- **Domain**: Industri Garmen / Tekstil (Manufaktur Sewing Line)
- **Teknologi Utama**:
  - **Backend**: Laravel (PHP 8.2+)
  - **Database**: MySQL (InnoDB Engine)
  - **Pola Desain**: Service-Oriented Layered Architecture (Controller -> Service -> Model)
  - **Frontend Interaction**: Modern Asynchronous JavaScript (Fetch API / Vanilla JS / Alpine.js)
  - **Styling**: Tailwind CSS atau CSS Modern yang bersih, responsif, dan rapi

---

## 2. Aturan Emas Arsitektur (Invariants & Non-Negotiables)

1. **Service Pattern Wajib**:
   - Dilarang menempatkan perhitungan matematika target harian, balancing, atau query cascade di dalam Controller maupun Blade View.
   - Semua logika tersebut wajib berada di dalam direktori `app/Services/` (misal: `ScheduleService`, `BalancingService`, `CascadeRescheduleService`).
2. **Kerapatan Transaksi Basis Data (`DB::transaction`)**:
   - Setiap operasi yang mengubah tanggal jadwal atau memicu cascade shift wajib diapit oleh `DB::transaction()`.
   - Gunakan `lockForUpdate()` saat membaca jadwal aktif pada sewing line yang bersangkutan untuk menghindari *race condition* / benturan komputasi.
3. **Formula Pembagian Target Sesuai Ketentuan**:
   - Target harian dihitung dari `floor(total_target / jumlah_hari)`.
   - **Sisa pembagian (modulo)** WAJIB ditambahkan ke **hari terakhir** range schedule.
4. **UX Asynchronous & Reaktif**:
   - Seluruh aksi input dan perubahan jadwal tidak boleh menyebabkan full-page reload.
   - Wajib memiliki 3 tahap state interaksi JS:
     - **Before**: Disable button, munculkan loading indicator / spinner.
     - **Process**: Kirim request asynchronous ke backend.
     - **After**: Tampilkan feedback (toast/notifikasi), perbarui DOM data secara dinamis, buka kunci button.

---

## 3. Struktur Direktori yang Ditargetkan

Pastikan struktur file mengikuti pola rapi berikut:

```text
app/
├── Http/
│   ├── Controllers/
│   │   ├── MasterLineController.php
│   │   ├── MasterOrderController.php
│   │   ├── ScheduleController.php
│   │   └── ScheduleBalancingController.php
│   └── Requests/
│       ├── StoreScheduleRequest.php
│       └── RecordActualOutputRequest.php
├── Models/
│   ├── MasterLine.php
│   ├── MasterOrder.php
│   ├── Schedule.php
│   ├── ScheduleDailyOutput.php
│   └── ScheduleShiftLog.php
└── Services/
    ├── ScheduleService.php         # Pembuatan, pembagian target, & kalkulasi dasar
    ├── BalancingService.php        # Input aktual, hitung defisit, & penambahan hari
    └── CascadeRescheduleService.php # Deteksi overlap & pergeseran jadwal order berikutnya

database/
├── migrations/
│   ├── xxxx_create_master_lines_table.php
│   ├── xxxx_create_master_orders_table.php
│   ├── xxxx_create_schedules_table.php
│   ├── xxxx_create_schedule_daily_outputs_table.php
│   └── xxxx_create_schedule_shift_logs_table.php
└── seeders/
    ├── DatabaseSeeder.php
    ├── MasterLineSeeder.php
    ├── MasterOrderSeeder.php
    └── ScheduleSeeder.php

resources/
├── js/
│   ├── app.js
│   ├── schedule-manager.js        # Controller logika frontend & Fetch API
│   └── schedule-ui-feedback.js    # Notifikasi, toast, dan loading states
└── views/
    ├── layouts/app.blade.php
    ├── master/
    │   ├── lines/index.blade.php
    │   └── orders/index.blade.php
    └── schedules/
        ├── index.blade.php        # Matrix visual jadwal & timeline
        ├── create.blade.php       # Form modal buat jadwal
        └── partials/
            ├── daily_table.blade.php
            └── input_actual_modal.blade.php
```

---

## 4. Rincian Logika Bisnis & Pseudocode

### 4.1 Logika Pembagian Target Awal (`ScheduleService`)
```php
public function generateDailyTargets(Schedule $schedule): array
{
    $start = Carbon::parse($schedule->start_date);
    $finish = Carbon::parse($schedule->finish_date);
    $totalDays = $start->diffInDays($finish) + 1; // inclusive
    
    $totalQty = $schedule->total_target_qty;
    $baseTarget = intdiv($totalQty, $totalDays);
    $remainder = $totalQty % $totalDays;

    $dailyOutputs = [];
    $currentDate = $start->copy();

    for ($dayIndex = 1; $dayIndex <= $totalDays; $dayIndex++) {
        $target = $baseTarget;
        // Sisa ditempatkan di hari terakhir
        if ($dayIndex === $totalDays) {
            $target += $remainder;
        }

        $dailyOutputs[] = [
            'schedule_id'     => $schedule->id,
            'production_date' => $currentDate->toDateString(),
            'day_index'       => $dayIndex,
            'target_qty'      => $target,
            'actual_qty'      => null,
            'deficit_balance' => 0,
            'is_closed'       => false,
        ];
        $currentDate->addDay();
    }

    return $dailyOutputs;
}
```

### 4.2 Logika Balancing & Kemunduran Jadwal (`BalancingService`)
```php
public function recordActualOutput(Schedule $schedule, string $date, int $actualQty): array
{
    return DB::transaction(function () use ($schedule, $date, $actualQty) {
        $daily = ScheduleDailyOutput::where('schedule_id', $schedule->id)
            ->where('production_date', $date)
            ->lockForUpdate()
            ->firstOrFail();

        $daily->actual_qty = $actualQty;
        $daily->is_closed = true;
        
        $deficit = $daily->target_qty - $actualQty;
        $daily->deficit_balance = max(0, $deficit);
        $daily->save();

        $totalProduced = $schedule->dailyOutputs()->sum('actual_qty');
        $schedule->total_actual_qty = $totalProduced;
        $schedule->save();

        $shiftedDays = 0;

        // Jika terdapat kekurangan target
        if ($deficit > 0) {
            // Algoritma: Tambahkan sisa target ke hari berikutnya
            // atau perpanjang hari jadwal jika kapasitas harian tidak mencukupi
            $shiftedDays = $this->rebalanceRemainingSchedule($schedule, $daily);
        }

        if ($shiftedDays > 0) {
            // Picu Cascade Reschedule untuk jadwal-jadwal berikutnya di line yang sama
            app(CascadeRescheduleService::class)->shiftSubsequentSchedules($schedule, $shiftedDays);
        }

        return [
            'daily' => $daily,
            'shifted_days' => $shiftedDays,
            'schedule' => $schedule->fresh(['dailyOutputs']),
        ];
    });
}
```

### 4.3 Logika Efek Domino (`CascadeRescheduleService`)
```php
public function shiftSubsequentSchedules(Schedule $currentSchedule, int $daysToShift): void
{
    $lineId = $currentSchedule->line_id;
    $newFinishDate = Carbon::parse($currentSchedule->finish_date);

    // Ambil semua jadwal pada line yang sama yang dimulai sebelum atau pada newFinishDate
    // atau yang memiliki sequence setelah jadwal saat ini
    $subsequentSchedules = Schedule::where('line_id', $lineId)
        ->where('id', '!=', $currentSchedule->id)
        ->where('start_date', '<=', $newFinishDate->toDateString())
        ->orderBy('start_date', 'asc')
        ->lockForUpdate()
        ->get();

    $previousFinish = $newFinishDate->copy();

    foreach ($subsequentSchedules as $subsequent) {
        $oldStart = Carbon::parse($subsequent->start_date);
        $oldFinish = Carbon::parse($subsequent->finish_date);
        $duration = $oldStart->diffInDays($oldFinish);

        // Jadwal berikutnya mulai sehari setelah jadwal sebelumnya selesai
        $newStart = $previousFinish->copy()->addDay();
        $newFinish = $newStart->copy()->addDays($duration);

        // Catat audit log pergeseran
        ScheduleShiftLog::create([
            'schedule_id'    => $subsequent->id,
            'old_start_date' => $oldStart->toDateString(),
            'new_start_date' => $newStart->toDateString(),
            'old_finish_date'=> $oldFinish->toDateString(),
            'new_finish_date'=> $newFinish->toDateString(),
            'shifted_days'   => $oldStart->diffInDays($newStart),
            'trigger_reason' => "Kemunduran akibat defisit jadwal order ID {$currentSchedule->order_id}",
        ]);

        $subsequent->start_date = $newStart->toDateString();
        $subsequent->finish_date = $newFinish->toDateString();
        $subsequent->save();

        // Update tanggal di schedule_daily_outputs milik jadwal yang bergeser
        $this->shiftDailyOutputDates($subsequent, $oldStart->diffInDays($newStart));

        $previousFinish = $newFinish->copy();
    }
}
```

---

## 5. Standar Response API (JSON Contract)

Setiap request AJAX/Fetch dari antarmuka JavaScript wajib menerima response berformat standar:

### Sukses:
```json
{
  "success": true,
  "message": "Actual output berhasil disimpan dan jadwal berhasil di-balance.",
  "data": {
    "schedule_id": 12,
    "line_code": "LINE-01",
    "updated_finish_date": "2026-03-08",
    "shifted_days": 1,
    "subsequent_affected_count": 2,
    "daily_summary": {
      "production_date": "2026-03-03",
      "target_qty": 350,
      "actual_qty": 200,
      "deficit": 150
    }
  }
}
```

### Gagal / Validasi:
```json
{
  "success": false,
  "message": "Input aktual output tidak valid.",
  "errors": {
    "actual_qty": ["Nilai actual output tidak boleh kurang dari 0."]
  }
}
```

---

## 6. Roadmap Pengerjaan untuk Agen (Execution Steps)

Saat menginstruksikan atau mengeksekusi pembuatan fitur, ikuti urutan berikut:

1. **Step 1: Database & Migrations**:
   - Buat file migrasi untuk `master_lines`, `master_orders`, `schedules`, `schedule_daily_outputs`, dan `schedule_shift_logs`.
   - Jalankan migrasi dan pastikan foreign keys terpasang sempurna.
2. **Step 2: Seeders**:
   - Isi dummy data realistis (3 Line sewing, 5 Order garmen dengan variasi QTY, dan 1 sample Schedule yang sudah terbit).
3. **Step 3: Service Layer**:
   - Buat unit test atau fungsi `ScheduleService` untuk menguji pembagian target + sisa modulo.
   - Buat `BalancingService` dan `CascadeRescheduleService` untuk menguji skenario defisit output dan pergeseran tanggal berantai.
4. **Step 4: Controllers & Routes**:
   - Hubungkan FormRequest dan Service ke Controller. Kembalikan response JSON yang konsisten.
5. **Step 5: Antarmuka Interaktif (UI & JS)**:
   - Bangun view dengan layout modern.
   - Buat modul JavaScript: modal input actual, indicator saat proses (loading button/spinner), dan toast notification setelah proses.
   - Buat tabel/Gantt timeline yang merefleksikan tanggal start-finish yang bergeser secara real-time.
6. **Step 6: Verifikasi & Edge Cases**:
   - Uji jika actual output = 0 (line mati total).
   - Uji jika actual output melampaui target (surplus).
   - Uji bila order berikutnya berada di line sewing yang berbeda (tidak boleh ikut tergeser).

---

## 7. Anti-Patterns & Hal yang Dilarang

- ❌ **Dilarang**: Menyimpan data tanggal tanpa relasi foreign key yang jelas.
- ❌ **Dilarang**: Membiarkan jadwal berikutnya bertabrakan (*overlapping*) pada line sewing yang sama setelah terjadi penambahan hari.
- ❌ **Dilarang**: Mengabaikan sisa pembagian rata-rata target (seluruh quantity total order harus terdistribusi 100% tanpa selisih pembulatan).
- ❌ **Dilarang**: Membuat form dengan synchronous submit yang menyebabkan layar berkedip/reload penuh.
- ❌ **Dilarang**: Menulis query mentah (*raw query*) tanpa sanitasi atau tanpa memanfaatkan keunggulan Eloquent Service.
