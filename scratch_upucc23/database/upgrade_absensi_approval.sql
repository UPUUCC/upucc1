-- =====================================================================
-- UPGRADE SCRIPT - Jalankan ini HANYA jika database upucc_db Anda
-- sudah pernah dibuat dari versi upucc.sql yang LAMA (belum ada kolom
-- persetujuan absensi). Jika Anda baru pertama kali install / import
-- ulang upucc.sql yang baru, SCRIPT INI TIDAK PERLU DIJALANKAN.
--
-- Cara pakai: buka phpMyAdmin > pilih database upucc_db > tab SQL >
-- tempel isi file ini > Go / Jalankan.
-- =====================================================================
USE upucc_db;

ALTER TABLE absensi
  ADD COLUMN approval_status ENUM('menunggu','disetujui','ditolak') NOT NULL DEFAULT 'disetujui' AFTER input_by,
  ADD COLUMN approved_by INT DEFAULT NULL AFTER approval_status,
  ADD COLUMN approved_at TIMESTAMP NULL DEFAULT NULL AFTER approved_by,
  ADD COLUMN catatan_approval VARCHAR(255) DEFAULT NULL AFTER approved_at;

ALTER TABLE absensi
  ADD CONSTRAINT fk_absensi_approved_by FOREIGN KEY (approved_by) REFERENCES members(id) ON DELETE SET NULL;

-- Tandai seluruh data absensi lama yang sudah ada sebagai "disetujui"
-- supaya tidak tiba-tiba muncul di Kotak Pesan.
UPDATE absensi SET approval_status = 'disetujui' WHERE approval_status IS NULL;
