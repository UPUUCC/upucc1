-- =====================================================================
-- DATABASE UPUCC (Universitas Potensi Utama Computer Club)
-- =====================================================================


-- ---------------------------------------------------------------------
-- Login DASHBOARD (CMS pengelola konten index) - terpisah dari portal
-- ---------------------------------------------------------------------
CREATE TABLE admin_users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  nama VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- Data Divisi (4 divisi tetap)
-- ---------------------------------------------------------------------
CREATE TABLE divisions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nama VARCHAR(50) NOT NULL,
  slug VARCHAR(50) UNIQUE NOT NULL,
  logo VARCHAR(255) DEFAULT NULL,
  deskripsi TEXT,
  sejarah TEXT
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- Anggota / Pengurus (dipakai untuk struktur organisasi di index
-- DAN untuk akun login PORTAL absensi & kas)
-- ---------------------------------------------------------------------
CREATE TABLE members (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  nama VARCHAR(100) NOT NULL,
  foto VARCHAR(255) DEFAULT NULL,
  role ENUM('ketum','waketum','bendahara','kadiv','wakadiv','sekretaris','anggota') NOT NULL DEFAULT 'anggota',
  divisi_id INT NULL,
  jabatan_text VARCHAR(100) DEFAULT NULL,
  tampil_struktur TINYINT(1) NOT NULL DEFAULT 1,
  urutan INT NOT NULL DEFAULT 0,
  status ENUM('aktif','nonaktif') NOT NULL DEFAULT 'aktif',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (divisi_id) REFERENCES divisions(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- Slider gambar halaman utama (bisa digeser kanan/kiri)
-- ---------------------------------------------------------------------
CREATE TABLE sliders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  gambar VARCHAR(255) NOT NULL,
  judul VARCHAR(150) DEFAULT NULL,
  deskripsi VARCHAR(255) DEFAULT NULL,
  urutan INT NOT NULL DEFAULT 0
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- Informasi umum UPUCC (halaman informasi)
-- ---------------------------------------------------------------------
CREATE TABLE informasi_umum (
  id INT PRIMARY KEY DEFAULT 1,
  konten TEXT
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- Prestasi (bisa milik divisi tertentu atau prestasi umum)
-- ---------------------------------------------------------------------
CREATE TABLE prestasi (
  id INT AUTO_INCREMENT PRIMARY KEY,
  divisi_id INT NULL,
  judul VARCHAR(150) NOT NULL,
  deskripsi TEXT,
  gambar VARCHAR(255) DEFAULT NULL,
  tanggal DATE DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (divisi_id) REFERENCES divisions(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- Sejarah (umum UPUCC / per divisi)
-- ---------------------------------------------------------------------
CREATE TABLE sejarah (
  id INT AUTO_INCREMENT PRIMARY KEY,
  divisi_id INT NULL,
  judul VARCHAR(150) DEFAULT NULL,
  konten TEXT,
  FOREIGN KEY (divisi_id) REFERENCES divisions(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- Acara (feed ala instagram: judul, deskripsi, banyak foto)
-- ---------------------------------------------------------------------
CREATE TABLE acara (
  id INT AUTO_INCREMENT PRIMARY KEY,
  judul VARCHAR(150) NOT NULL,
  deskripsi TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE acara_foto (
  id INT AUTO_INCREMENT PRIMARY KEY,
  acara_id INT NOT NULL,
  foto VARCHAR(255) NOT NULL,
  urutan INT DEFAULT 0,
  FOREIGN KEY (acara_id) REFERENCES acara(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- Pendaftaran anggota baru (dibuka/ditutup dari dashboard)
-- ---------------------------------------------------------------------
CREATE TABLE pendaftaran_setting (
  id INT PRIMARY KEY DEFAULT 1,
  is_open TINYINT(1) NOT NULL DEFAULT 0,
  judul VARCHAR(150) DEFAULT 'Pendaftaran Anggota Baru UPUCC',
  deskripsi TEXT,
  tanggal_mulai DATE DEFAULT NULL,
  tanggal_selesai DATE DEFAULT NULL
) ENGINE=InnoDB;

CREATE TABLE pendaftaran_anggota (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nama VARCHAR(100) NOT NULL,
  nim VARCHAR(30) DEFAULT NULL,
  email VARCHAR(100) DEFAULT NULL,
  no_hp VARCHAR(20) DEFAULT NULL,
  divisi_pilihan INT NULL,
  alasan TEXT,
  status ENUM('pending','diterima','ditolak') NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (divisi_pilihan) REFERENCES divisions(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- Absensi online anggota (per divisi)
-- ---------------------------------------------------------------------
CREATE TABLE absensi (
  id INT AUTO_INCREMENT PRIMARY KEY,
  member_id INT NOT NULL,
  divisi_id INT NULL,
  tanggal DATE NOT NULL,
  status ENUM('hadir','izin','sakit','alpa') NOT NULL DEFAULT 'hadir',
  keterangan VARCHAR(255) DEFAULT NULL,
  input_by INT DEFAULT NULL,
  -- Alur persetujuan absensi ("Kotak Pesan"):
  -- Absensi mandiri dari anggota/bendahara/sekretaris masuk sebagai 'menunggu'
  -- lalu disetujui/ditolak oleh kadiv/wakadiv (divisinya) atau ketum/waketum.
  -- Input langsung oleh ketum/waketum/kadiv/wakadiv otomatis 'disetujui'.
  approval_status ENUM('menunggu','disetujui','ditolak') NOT NULL DEFAULT 'disetujui',
  approved_by INT DEFAULT NULL,
  approved_at TIMESTAMP NULL DEFAULT NULL,
  catatan_approval VARCHAR(255) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE,
  FOREIGN KEY (divisi_id) REFERENCES divisions(id) ON DELETE SET NULL,
  FOREIGN KEY (approved_by) REFERENCES members(id) ON DELETE SET NULL,
  UNIQUE KEY uniq_absen (member_id, tanggal)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- Kas / uang cash organisasi (hanya sekretaris yang bisa tambah/edit)
-- ---------------------------------------------------------------------
CREATE TABLE kas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tanggal DATE NOT NULL,
  keterangan VARCHAR(255) NOT NULL,
  jenis ENUM('masuk','keluar') NOT NULL,
  jumlah DECIMAL(12,2) NOT NULL,
  input_by INT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- =====================================================================
-- SEED DATA
-- =====================================================================

-- Admin dashboard default (username: admin / password: admin123)
INSERT INTO admin_users (username, password, nama) VALUES
('admin', '$2y$10$2AnRIASu0.fFO8NJHIb7AesF9SzOpJGbGsfneYrx6kA6ePc.KU.RS', 'Administrator Website');

-- 4 Divisi
INSERT INTO divisions (nama, slug, deskripsi, sejarah) VALUES
('Programming', 'programming', 'Divisi yang fokus pada pengembangan software, web, dan aplikasi.', 'Sejarah singkat divisi Programming UPUCC.'),
('Net Sect', 'net-sect', 'Divisi yang fokus pada jaringan komputer, keamanan siber, dan infrastruktur IT.', 'Sejarah singkat divisi Net Sect UPUCC.'),
('Knowtech', 'knowtech', 'Divisi yang fokus pada riset, edukasi, dan pengetahuan teknologi terbaru.', 'Sejarah singkat divisi Knowtech UPUCC.'),
('Multimedia', 'multimedia', 'Divisi yang fokus pada desain grafis, editing video, dan dokumentasi.', 'Sejarah singkat divisi Multimedia UPUCC.');

-- Informasi umum
INSERT INTO informasi_umum (id, konten) VALUES
(1, 'UPUCC (Universitas Potensi Utama Computer Club) adalah organisasi mahasiswa di bidang teknologi informasi yang menaungi 4 divisi: Programming, Net Sect, Knowtech, dan Multimedia.');

-- Sejarah umum (divisi_id NULL = sejarah umum organisasi)
INSERT INTO sejarah (divisi_id, judul, konten) VALUES
(NULL, 'Sejarah UPUCC', 'Tuliskan sejarah berdirinya UPUCC di sini melalui menu Dashboard > Sejarah.');

-- Pengaturan pendaftaran (default: tertutup)
INSERT INTO pendaftaran_setting (id, is_open, judul, deskripsi) VALUES
(1, 0, 'Pendaftaran Anggota Baru UPUCC', 'Pendaftaran anggota baru saat ini belum dibuka. Silakan pantau informasi selanjutnya.');

-- Akun contoh PORTAL (absensi & kas) - password default semua: "password123"
-- Hash berikut adalah hasil password_hash('password123', PASSWORD_DEFAULT)
INSERT INTO members (username, password, nama, role, divisi_id, jabatan_text, urutan) VALUES
('ketum',      '$2y$10$z4TE31qPcrisJ9fIUqhjUu0dSkHh/evjANOcd58MIcidFjoXeW1i6', 'Nama Ketua Umum', 'ketum', NULL, 'Ketua Umum', 1),
('waketum',    '$2y$10$z4TE31qPcrisJ9fIUqhjUu0dSkHh/evjANOcd58MIcidFjoXeW1i6', 'Nama Wakil Ketua Umum', 'waketum', NULL, 'Wakil Ketua Umum', 2),
('bendahara',  '$2y$10$z4TE31qPcrisJ9fIUqhjUu0dSkHh/evjANOcd58MIcidFjoXeW1i6', 'Nama Bendahara', 'bendahara', NULL, 'Bendahara', 3),
('sekretaris', '$2y$10$z4TE31qPcrisJ9fIUqhjUu0dSkHh/evjANOcd58MIcidFjoXeW1i6', 'Nama Sekretaris', 'sekretaris', NULL, 'Sekretaris', 4),
('kadiv_prog', '$2y$10$z4TE31qPcrisJ9fIUqhjUu0dSkHh/evjANOcd58MIcidFjoXeW1i6', 'Kadiv Programming', 'kadiv', 1, 'Ketua Divisi Programming', 5),
('wakadiv_prog','$2y$10$z4TE31qPcrisJ9fIUqhjUu0dSkHh/evjANOcd58MIcidFjoXeW1i6', 'Wakadiv Programming', 'wakadiv', 1, 'Wakil Ketua Divisi Programming', 6),
('kadiv_net',  '$2y$10$z4TE31qPcrisJ9fIUqhjUu0dSkHh/evjANOcd58MIcidFjoXeW1i6', 'Kadiv Net Sect', 'kadiv', 2, 'Ketua Divisi Net Sect', 7),
('wakadiv_net','$2y$10$z4TE31qPcrisJ9fIUqhjUu0dSkHh/evjANOcd58MIcidFjoXeW1i6', 'Wakadiv Net Sect', 'wakadiv', 2, 'Wakil Ketua Divisi Net Sect', 8),
('kadiv_know', '$2y$10$z4TE31qPcrisJ9fIUqhjUu0dSkHh/evjANOcd58MIcidFjoXeW1i6', 'Kadiv Knowtech', 'kadiv', 3, 'Ketua Divisi Knowtech', 9),
('wakadiv_know','$2y$10$z4TE31qPcrisJ9fIUqhjUu0dSkHh/evjANOcd58MIcidFjoXeW1i6', 'Wakadiv Knowtech', 'wakadiv', 3, 'Wakil Ketua Divisi Knowtech', 10),
('kadiv_multi', '$2y$10$z4TE31qPcrisJ9fIUqhjUu0dSkHh/evjANOcd58MIcidFjoXeW1i6', 'Kadiv Multimedia', 'kadiv', 4, 'Ketua Divisi Multimedia', 11),
('wakadiv_multi','$2y$10$z4TE31qPcrisJ9fIUqhjUu0dSkHh/evjANOcd58MIcidFjoXeW1i6', 'Wakadiv Multimedia', 'wakadiv', 4, 'Wakil Ketua Divisi Multimedia', 12),
('anggota1',   '$2y$10$z4TE31qPcrisJ9fIUqhjUu0dSkHh/evjANOcd58MIcidFjoXeW1i6', 'Anggota Programming 1', 'anggota', 1, 'Anggota', 13);
