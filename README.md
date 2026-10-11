# tes-program: Sewing Line Production Scheduler & Auto-Balancing

## TEST PROGRAM 2026

Buat satu projek web app yang meliputi ketentuan sebagai berikut :

1. Projek bertema sebagai sebuah schedule dalam proses produksi yang digunakan untuk admin melakukan schedule produksi untuk beberapa sewing line di area produksi.
2. Schedule berisikan data order, line sewing, start sewing, finish sewing, qty total target, target output per hari (hasil bagi dari qty total target/range tanggal(start-finish))-> untuk sisa pembagian rata-rata target output per hari ditempatkan di akhir tanggal range schedule, dan data qty aktual output.
3. Proses balancing antara target output per hari dan aktual output, Dimana admin melakukan input aktual output jika hasilnya actual output kurang dari target output per harinya untuk balance qty dilanjutkan atau menambah untuk target output hari berikutnya sehingga range tanggal schedule akan bertambah hari dan bertambahnya hari tersebut mempengaruhi kemunduran schedule setelahnya.
4. Skema tabel :
- Tabel master line
- Tabel master order
- Tabel schedule
5. Pengerjaan menggunakan framework Laravel dengan database mysql, konsep dalam framework menggunakan model,service dalam query datanya, pembuatan halaman pengelolaan data schedule menggunakan konsep js untuk action prosesnya (respon saat proses dan setelah proses).

---

## 📚 Dokumentasi Teknis
- [arsitektur.md](arsitektur.md) — Arsitektur sistem, skema basis data (ERD), dan formulasi algoritma balancing & cascade rescheduling.
- [agent.md](agent.md) — Panduan teknis operasional untuk AI Developer Agent & standar implementasi fitur.