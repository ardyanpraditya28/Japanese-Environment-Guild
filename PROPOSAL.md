# Proposal Pembuatan Platform Gamifikasi: "Japan Guild"
**Divisi Jepang - SPBA**

---

## 1. Latar Belakang
Divisi Jepang dalam SPBA membutuhkan sebuah wadah interaktif untuk meningkatkan motivasi, partisipasi aktif, dan rasa kebersamaan antar anggota. Sistem yang ada saat ini mungkin terasa monoton, sehingga dibutuhkan pendekatan inovatif agar anggota lebih semangat dalam mengikuti kegiatan, belajar, serta berkontribusi bagi divisi. Pendekatan **Gamifikasi (Gamification)** yang mengadaptasi sistem *Hunter Guild* (Guild Petualang) ala anime/game dinilai sangat cocok untuk menciptakan suasana belajar dan berkompetisi yang menyenangkan.

## 2. Tujuan Pengembangan
- **Meningkatkan Keterlibatan Anggota:** Mengubah tugas dan partisipasi kegiatan menjadi "Quest" yang memberikan penghargaan instan.
- **Mendorong Pembelajaran Aktif:** Menyediakan wadah belajar (Academy) dengan kuis berhadiah poin.
- **Kompetisi Sehat:** Memacu semangat anggota untuk berkontribusi melalui sistem Peringkat (Leaderboard) musiman.
- **Apresiasi dan Reward:** Menghargai setiap kontribusi anggota dengan menukarkan poin (Gold) dengan reward nyata atau digital.

## 3. Fitur Utama (Key Features)

### A. Fitur untuk Anggota (Hunter)
1. **Hunter Card (Profil):**
   - Menampilkan identitas, progres *Rank* (F hingga SSS), dan koleksi *Badge Achievement*.
   - Riwayat aktivitas (Activity Logs) yang mencatat perolehan XP, Gold, dan GCP.
   - Galeri karya anggota.
2. **Quest Board:**
   - Papan misi tempat anggota dapat melihat dan mengerjakan misi harian, kuis, atau event khusus.
   - Fitur setor bukti (upload foto/link) setelah menyelesaikan misi.
3. **Academy:**
   - Wadah untuk membaca modul materi edukasi seputar bahasa dan budaya Jepang.
   - Dilengkapi sistem kuis yang memberikan bonus poin jika berhasil dijawab.
4. **Leaderboard & Hall of Fame:**
   - Menampilkan peringkat *Hunter* berdasarkan *Guild Contribution Points* (GCP) pada season yang sedang berjalan.
   - *Hall of Fame* untuk mengabadikan juara dari season-season yang sudah berakhir.
5. **Shop (Gold Sink):**
   - Toko tempat anggota menukarkan "Gold" yang dikumpulkan dari Quest.
   - Menyediakan item digital (Border Profile, Tema) hingga *merchandise* fisik.

### B. Fitur untuk Staff/Admin (Guild Master)
1. **Sistem Verifikasi Quest:** Admin dapat mereview bukti tugas dari anggota dan memberikan *Approve* (Penyetujuan) atau *Reject* (Penolakan) disertai pesan feedback.
2. **Manajemen Season:** Fitur *End Season* untuk menutup season secara otomatis, merekap data pemenang, dan me-reset poin untuk season berikutnya.
3. **Kelola Toko & Anggota:** Menambah/mengedit *item shop*, melihat stok, serta manajemen data anggota Guild.

## 4. Mekanisme Poin
Sistem menggunakan 3 mata uang utama untuk menyeimbangkan ekosistem:
- **XP (Experience Points):** Digunakan murni untuk menaikkan level (Rank F ke SSS). Tidak bisa dihabiskan.
- **GCP (Guild Contribution Points):** Penentu urutan pada sistem peringkat (Leaderboard) musiman. Direset setiap pergantian season.
- **Gold:** Mata uang yang bisa ditukar (dibelanjakan) di dalam *Shop* untuk mendapatkan hadiah.

## 5. Teknologi yang Digunakan (Tech Stack)
- **Frontend:** Nuxt 3 (Vue.js) - Memberikan performa tinggi dan pengalaman pengguna (UX) yang halus dan modern.
- **Styling:** Tailwind CSS - Desain responsif, bernuansa tema *Dark Mode* modern, *glassmorphism*, dan gaming.
- **Backend & Database:** Node.js (Nuxt API routes) dengan integrasi database untuk menyimpan riwayat poin, quest, dan profil secara *real-time*.

## 6. Kesimpulan
Platform **Japan Guild** ini bukan sekadar website manajemen anggota biasa, melainkan sebuah ekosistem interaktif yang disajikan secara menarik melalui konsep gamifikasi. Dengan website ini, diharapkan divisi Jepang SPBA dapat menjadi divisi yang paling aktif, antusias, dan solid.
