# Website UPUCC (Universitas Potensi Utama Computer Club)

Website organisasi dengan Node.js + Firebase. Terdiri dari **3 area**:

1. **Halaman publik** — langsung di **root project** (`index.php`, `informasi.php`, dst) supaya saat di-hosting, domain Anda otomatis membuka website publik ini (tidak perlu lagi masuk ke sub-folder `/index`).
2. **`/dashboard`** — CMS pengelola konten website (punya login sendiri).
3. **`/portal`** — Portal anggota untuk **absensi online** & **kas organisasi** (punya login sendiri, terpisah dari dashboard).

Ketiganya benar-benar terpisah sesi login-nya masing-masing (`admin_id` untuk dashboard, `member_id` untuk portal), jadi login di satu tempat tidak membuat Anda otomatis login di tempat lain.

---

## 1. Instalasi

### Kebutuhan
- PHP 8.0+ dengan ekstensi **PDO MySQL**
- MySQL / MariaDB
- Web server (Apache/Nginx) atau bisa dites dengan `php -S localhost:8000`

### Langkah instalasi
1. Extract seluruh isi ZIP ke **document root** hosting/web server Anda (misal `htdocs/` (XAMPP/Laragon), `public_html/` di cPanel, atau `/var/www/html/`). Karena halaman publik kini ada di root project, cukup upload seluruh isi folder `upucc/` langsung ke document root domain Anda.
2. Buat database baru lalu import `database/upucc.sql`:
   ```
   mysql -u root -p < database/upucc.sql
   ```
   atau import lewat phpMyAdmin (buat database kosong lalu import file `upucc.sql`).
3. Edit **`database.php`** (langsung di root project, bukan lagi di dalam folder `config/`), sesuaikan:
   ```php
   define('DB_HOST', 'localhost');
   define('DB_NAME', 'upucc_db');
   define('DB_USER', 'root');
   define('DB_PASS', '');
   ```
4. Pastikan folder `uploads/` (dan semua sub-foldernya) dapat ditulis oleh web server:
   ```
   chmod -R 775 uploads/
   ```
5. Akses website:
   - Publik: `http://localhost/` (atau `http://localhost/upucc/` jika diletakkan di sub-folder)
   - Dashboard CMS: `http://localhost/dashboard/login.php`
   - Portal Anggota: `http://localhost/login.php` (link "Login" di navbar publik)

> **Catatan hosting:** jika project diletakkan langsung di document root (bukan sub-folder), akses situs publik cukup lewat domain utama (`https://domainanda.com/`) karena `index.php` kini berada di root, bukan di dalam folder `/index` lagi.

---

## 2. Akun Default (Wajib Diganti Setelah Login Pertama)

### Login Dashboard CMS (`/dashboard/login.php`)
| Username | Password |
|---|---|
| `admin` | `admin123` |

### Login Portal Anggota (`/login.php` atau `/portal/login.php`)
Semua akun contoh di bawah memakai password yang sama: **`password123`**

| Username | Role | Divisi |
|---|---|---|
| `ketum` | Ketua Umum | - |
| `waketum` | Wakil Ketua Umum | - |
| `bendahara` | Bendahara | - |
| `sekretaris` | Sekretaris | - |
| `kadiv_prog` / `wakadiv_prog` | Kadiv/Wakadiv | Programming |
| `kadiv_net` / `wakadiv_net` | Kadiv/Wakadiv | Net Sect |
| `kadiv_know` / `wakadiv_know` | Kadiv/Wakadiv | Knowtech |
| `kadiv_multi` / `wakadiv_multi` | Kadiv/Wakadiv | Multimedia |
| `anggota1` | Anggota | Programming |

**Segera ubah semua password default** melalui menu **Anggota / Struktur** di **Dashboard CMS** (satu-satunya tempat pembuatan & pengelolaan akun anggota, lihat bagian 3 &amp; 4) atau menu **Profil** di Portal untuk mengubah nama/foto/password akun sendiri.

---

## 3. Struktur Hak Akses Portal Anggota

| Role | Absensi | Kotak Pesan (persetujuan) | Unduh Excel | Kas |
|---|---|---|---|---|
| Ketua Umum / Wakil Ketua Umum | **Tidak perlu absen sendiri.** Hanya memantau absensi **semua divisi** & mengelola input resmi (langsung disetujui) | Bisa menerima/menolak pengajuan **semua divisi** | Ya | **Hanya lihat** |
| Ketua Divisi / Wakil Ketua Divisi (4 divisi) | **Tidak perlu absen sendiri.** Hanya memantau & mengelola absensi **divisinya sendiri** (input langsung disetujui) | Bisa menerima/menolak pengajuan **divisinya sendiri saja** | Ya (divisinya sendiri) | **Hanya lihat** |
| Sekretaris | Bisa **memantau** (lihat saja, tanpa mengubah) absensi **semua divisi** | - | Ya (semua divisi) | Tidak ada akses |
| Bendahara | Absen **diri sendiri** (pengajuan menunggu persetujuan Ketum/Waketum) | Tidak ada | Tidak ada | **Full akses** (satu-satunya role yang bisa tambah/edit/hapus) |
| Anggota | Absen **diri sendiri saja**, sesuai divisinya (pengajuan menunggu persetujuan kadiv/wakadiv divisinya) | Tidak ada | Tidak ada | Tidak ada akses |

> **Pembuatan/pengelolaan akun anggota (registrasi) TIDAK ADA di Portal**, untuk role manapun (termasuk Ketua Umum & Wakil Ketua Umum). Menu tersebut kini **hanya** ada di **Dashboard CMS** → **Anggota / Struktur**, lihat bagian 4.

### Ketua Umum, Wakil Ketua Umum, Ketua Divisi & Wakil Ketua Divisi tidak absen sendiri
Keempat role ini **tidak lagi memiliki form absen untuk diri sendiri**. Menu Absensi mereka hanya berisi panel **pemantauan** anggota (dan pengelolaan resmi untuk kadiv/wakadiv/ketum/waketum) serta **Kotak Pesan** untuk menerima/menolak pengajuan absensi mandiri dari anggota.

### Unduh rekap absensi (Excel)
Pada menu **Absensi**, role **Ketua Umum, Wakil Ketua Umum, Ketua Divisi, Wakil Ketua Divisi, dan Sekretaris** memiliki tombol **"Unduh Excel"** untuk mengunduh rekap absensi (tanggal yang sedang dipilih, atau satu bulan berjalan) dalam bentuk file `.xls` yang bisa langsung dibuka di Microsoft Excel / Google Sheets. Kadiv/Wakadiv hanya bisa mengunduh data divisinya sendiri, sedangkan Ketum/Waketum/Sekretaris bisa memilih divisi mana saja (atau semua divisi).

### Alur persetujuan absensi ("Kotak Pesan")
Saat **anggota** atau **bendahara** melakukan absen mandiri lewat menu Absensi, data tersebut **tidak langsung tercatat resmi** — statusnya `menunggu` dan muncul di menu **Kotak Pesan** milik:
- **kadiv/wakadiv divisi terkait**, jika anggota tersebut punya divisi (Programming, Net Sect, Knowtech, Multimedia); atau
- **Ketua Umum/Wakil Ketua Umum**, jika anggota tidak terikat divisi (misalnya bendahara).

Kadiv/wakadiv/ketum/waketum lalu bisa **Terima** (status jadi `disetujui`, baru dihitung sebagai absensi resmi) atau **Tolak** (status jadi `ditolak`, boleh disertai catatan; anggota bisa mengajukan ulang). Input resmi oleh ketum/waketum/kadiv/wakadiv lewat tabel monitoring divisi otomatis berstatus `disetujui` karena mereka sendiri yang berwenang menyetujui.

> Jika database Anda sudah pernah dibuat dari `upucc.sql` versi lama (belum ada kolom persetujuan), jalankan `database/upgrade_absensi_approval.sql` sekali lewat phpMyAdmin sebelum menggunakan fitur ini.

---

## 4. Ringkasan Menu

### Halaman Publik (root project)
- **Beranda** (`index.php`) — slider gambar (geser kanan/kiri) + ringkasan info & divisi.
- **Informasi** — info umum UPUCC + submenu 4 divisi (Programming, Net Sect, Knowtech, Multimedia) lengkap dengan logo masing-masing.
- **Prestasi** — daftar prestasi seluruh divisi, bisa difilter per divisi. Klik salah satu kartu prestasi untuk membuka detail lengkapnya (gambar penuh, divisi, tanggal, dan deskripsi lengkap) dalam sebuah popup.
- **Struktur Organisasi** — Ketua Umum, Wakil Ketua Umum, Bendahara, Sekretaris, serta Ketua/Wakil Ketua tiap 4 divisi.
- **Sejarah** — sejarah umum UPUCC + sejarah tiap divisi (accordion).
- **Acara** — feed foto+deskripsi gaya Instagram, mendukung banyak foto per postingan.
- **Pendaftaran** — form pendaftaran anggota baru, otomatis tampil/tersembunyi sesuai pengaturan buka/tutup dari Dashboard.
- **Login** — menuju Portal Anggota (absensi & kas), **terpisah dari login Dashboard**.

### Dashboard CMS (`/dashboard`)
Mengelola seluruh konten di atas: Slider, Informasi Umum, Data Divisi (logo+deskripsi), Prestasi, Sejarah, Acara (multi-foto), dan menu **Anggota / Struktur** — **satu-satunya tempat untuk mendaftarkan/membuat akun anggota baru** (username, password, foto, role, divisi), sekaligus sumber data untuk halaman publik **Struktur Organisasi**. Menu ini **tidak bisa diakses dari Portal**, oleh role apa pun.

### Portal Anggota (`/portal`)
- **Beranda** — ringkasan status absensi hari ini (atau info pemantauan untuk pimpinan) & saldo kas (jika berhak).
- **Absensi** — sesuai hak akses di tabel atas, termasuk tombol Unduh Excel bila berhak.
- **Kotak Pesan** — khusus Ketum/Waketum/Kadiv/Wakadiv, untuk menerima/menolak pengajuan absensi.
- **Kas Organisasi** — sesuai hak akses di tabel atas.
- **Profil** — ubah nama, foto, password akun sendiri (tidak bisa membuat akun baru).

---

## 5. Struktur Folder

```
upucc/
├── database.php                # konfigurasi koneksi PDO (di root, bukan di dalam folder)
├── includes/                   # helper & auth (dashboard & portal terpisah)
├── database/upucc.sql          # skema + data awal (skrip SQL, bukan koneksi)
├── uploads/                    # folder upload gambar (slider, divisi, prestasi, acara, anggota)
├── partials/                   # header & footer HALAMAN PUBLIK
├── css/style.css                # CSS HALAMAN PUBLIK
├── index.php, informasi.php,   # HALAMAN PUBLIK -- langsung di root supaya
│   struktur.php, dst.          #   terbaca sebagai halaman utama saat di-hosting
├── dashboard/                  # CMS (login sendiri: admin_users)
└── portal/                     # PORTAL ANGGOTA (login sendiri: members)
```

## 6. Perbaikan &amp; Penambahan Terbaru
- **Struktur folder disesuaikan untuk hosting**: file koneksi database (`database.php`) dipindahkan ke root project (sebelumnya di `config/database.php`), dan seluruh halaman publik (sebelumnya di folder `/index`) dipindahkan langsung ke root project, supaya saat di-upload ke hosting, domain langsung membuka halaman publik tanpa perlu mengarah ke sub-folder.
- **Ketua Umum, Wakil Ketua Umum, Ketua Divisi & Wakil Ketua Divisi tidak perlu absen sendiri** — menu Absensi mereka sekarang murni untuk memantau & menerima/menolak absensi anggota.
- **Unduh Excel** ditambahkan pada menu Absensi untuk Ketum, Waketum, Kadiv, Wakadiv, dan Sekretaris.
- **Sekretaris** kini bisa memantau (lihat saja) absensi seluruh divisi dan mengunduh rekapnya dalam bentuk Excel.
- **Alur persetujuan absensi ("Kotak Pesan")** untuk anggota/bendahara — lihat bagian 3.
- **Hak akses Kas** dipindahkan penuh ke **Bendahara**; Kadiv/Wakadiv &amp; Ketum/Waketum kini hanya bisa melihat Kas.
- **Pembuatan akun anggota (registrasi) kini HANYA lewat Dashboard CMS.** Menu "Kelola Anggota" di Portal (yang sebelumnya bisa diakses Ketum/Waketum/Sekretaris) sudah dihapus total — Ketum, Waketum, siapa pun tidak lagi bisa membuat/mengubah akun lewat Portal. Satu-satunya tempat adalah menu **Anggota / Struktur** di Dashboard CMS.
- **Halaman publik Struktur Organisasi** kini ditampilkan sebagai **bagan/pohon organisasi** (garis penghubung antar-jabatan, foto & nama diambil langsung dari akun yang dibuat di Dashboard) menggantikan tampilan kartu berbaris sebelumnya.
- **Tampilan bagan Struktur Organisasi diperbarui** (`struktur.php` + `css/style.css`): setiap jabatan kini ditampilkan sebagai **foto bulat berbingkai dua warna + label nama gelap** (bukan lagi kotak kartu putih besar), dengan tata letak: KETUM di puncak, WAKETUM di bawahnya, lalu SEKRETARIS (kiri) dan BENDAHARA (kanan) sejajar dengan baris 4 Divisi (Programming, Net Sect, Knowtech, Multimedia) yang tersambung lewat garis tengah yang sama persis seperti bagan referensi organisasi. Tiap Divisi menampilkan Kadiv & Wakadiv berdampingan beserta daftar Anggotanya. Posisi geser (scroll) horizontal bagan otomatis ditengahkan saat halaman dibuka supaya KETUM/WAKETUM langsung terlihat di layar HP.
- **Registrasi/pembuatan akun anggota tetap 100% hanya lewat Dashboard CMS** (menu Anggota / Struktur) — dikonfirmasi ulang: tidak ada jalur pembuatan akun di Portal (baik untuk Ketum, Waketum, maupun role lain) maupun di halaman publik; `pendaftaran.php`, `dashboard/pendaftaran.php`, dan `portal/anggota.php` sengaja hanya berupa halaman pengalihan (redirect) dengan pesan penjelasan.
- **Detail Prestasi** — klik kartu prestasi di halaman publik untuk membuka popup berisi seluruh informasi (gambar, judul, divisi, tanggal, deskripsi lengkap).

## 7. Catatan Keamanan
- Semua password disimpan ter-enkripsi menggunakan `password_hash()` (bcrypt).
- Seluruh query database menggunakan **PDO Prepared Statement** untuk mencegah SQL Injection.
- Validasi upload file (ekstensi & ukuran maksimal 5MB) diterapkan pada semua form upload gambar.
- Segera ganti seluruh password default sebelum website digunakan secara nyata (produksi).
- Untuk produksi, disarankan mengaktifkan HTTPS dan mengatur `session.cookie_secure` di php.ini.
