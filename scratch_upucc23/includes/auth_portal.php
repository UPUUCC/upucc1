<?php
/**
 * Auth khusus PORTAL ANGGOTA (absensi online & kas).
 * Session key: member_id / member_role / member_divisi_id / member_nama
 * -- session ini TERPISAH TOTAL dari session dashboard (admin_id) dan
 * dari akun pengunjung index. Prefix session key berbeda supaya tidak bentrok.
 */
if (session_status() === PHP_SESSION_NONE) session_start();

function portal_login_required() {
    if (empty($_SESSION['member_id'])) {
        redirect(BASE_URL . '/portal/login.php');
    }
}

function portal_is_logged_in() {
    return !empty($_SESSION['member_id']);
}

function portal_role() {
    return $_SESSION['member_role'] ?? null;
}

function portal_divisi_id() {
    return $_SESSION['member_divisi_id'] ?? null;
}

/**
 * ==================================================================
 *  ATURAN HAK AKSES PORTAL (per role)
 * ==================================================================
 * ketum / waketum : akses penuh ke seluruh data portal (absensi semua
 *                    divisi, kelola anggota) KECUALI uang kas yang
 *                    hanya bisa DILIHAT (tidak bisa tambah/ubah/hapus).
 *                    Absensi yang mereka input langsung berstatus
 *                    "disetujui" (tidak perlu persetujuan).
 *
 * kadiv / wakadiv : hanya bisa mengedit & memantau absensi ANGGOTA
 *                    DI DIVISI MEREKA SENDIRI, termasuk menerima
 *                    (menyetujui) atau menolak pengajuan absensi
 *                    mandiri dari anggota divisinya lewat "Kotak
 *                    Pesan". Uang kas: hanya bisa DILIHAT. Tidak ada
 *                    akses kelola anggota.
 *
 * sekretaris      : tidak menangani absensi (kecuali memantau &
 *                    mengunduh rekap Excel seluruh divisi, lihat
 *                    portal_can_monitor_absensi/portal_can_export_absensi)
 *                    maupun kas.
 *
 * bendahara       : melakukan absensi seperti anggota biasa
 *                    (pengajuannya perlu disetujui ketum/waketum
 *                    karena tidak berada di satu divisi tertentu),
 *                    dan memiliki akses PENUH (tambah/ubah/hapus)
 *                    ke data Kas Organisasi.
 *
 * anggota         : hanya bisa melakukan absensi untuk dirinya
 *                    sendiri, sesuai divisinya. Setiap pengajuan
 *                    absensi masuk ke "Kotak Pesan" kadiv/wakadiv
 *                    divisinya masing-masing dan baru tercatat resmi
 *                    setelah disetujui.
 *
 * CATATAN ABSENSI PIMPINAN (ketum/waketum/kadiv/wakadiv):
 * Role-role ini TIDAK perlu melakukan absensi untuk diri sendiri.
 * Tugas mereka di menu Absensi hanya memantau (melihat) serta
 * menerima/menolak pengajuan absensi anggota lewat "Kotak Pesan".
 * Mereka, beserta sekretaris, juga bisa mengunduh rekap absensi
 * dalam bentuk Excel.
 */

function portal_is_pengurus_inti() {
    return in_array(portal_role(), ['ketum', 'waketum']);
}

/**
 * Role yang TIDAK perlu melakukan absensi untuk dirinya sendiri --
 * ketua umum, wakil ketua umum, ketua divisi, dan wakil ketua divisi.
 * Mereka hanya memantau serta menerima/menolak absensi anggota lain.
 */
function portal_is_absen_exempt() {
    return portal_is_pengurus_inti() || in_array(portal_role(), ['kadiv', 'wakadiv']);
}

/**
 * Bisa mengunduh rekap absensi dalam bentuk Excel -- ketum, waketum,
 * kadiv, wakadiv, dan sekretaris.
 */
function portal_can_export_absensi() {
    return portal_is_pengurus_inti() || in_array(portal_role(), ['kadiv', 'wakadiv', 'sekretaris']);
}

/** Bisa memantau (melihat) monitor absensi seluruh/divisi tanpa mengedit -- termasuk sekretaris */
function portal_can_monitor_absensi() {
    return portal_is_pengurus_inti() || in_array(portal_role(), ['kadiv', 'wakadiv', 'sekretaris']);
}

/**
 * Kelola data anggota (registrasi / pembuatan akun baru, ubah, hapus)
 * SENGAJA TIDAK ADA di Portal untuk role manapun -- termasuk Ketua
 * Umum & Wakil Ketua Umum. Pembuatan/pengelolaan akun anggota HANYA
 * bisa dilakukan lewat menu "Anggota / Struktur" di Dashboard CMS
 * (lihat dashboard/anggota.php). Fungsi ini selalu false dan dibiarkan
 * ada supaya kode lama yang memanggilnya tidak error.
 */
function portal_can_manage_members() {
    return false;
}

/** Bisa melihat absensi divisi tertentu (tabel monitoring divisi) */
function portal_can_view_absensi($divisi_id) {
    if (portal_is_pengurus_inti()) return true; // semua divisi
    if (in_array(portal_role(), ['kadiv', 'wakadiv'])) {
        return (int)$divisi_id === (int)portal_divisi_id();
    }
    return (int)$divisi_id === (int)portal_divisi_id();
}

/** Bisa menambah / mengubah absensi ANGGOTA LAIN di suatu divisi (input resmi langsung disetujui) */
function portal_can_edit_absensi_others($divisi_id) {
    if (portal_is_pengurus_inti()) return true;
    if (in_array(portal_role(), ['kadiv', 'wakadiv'])) {
        return (int)$divisi_id === (int)portal_divisi_id();
    }
    return false; // sekretaris, bendahara & anggota tidak bisa mengubah absensi orang lain
}

/** Bisa menyetujui/menolak pengajuan absensi mandiri (Kotak Pesan) untuk suatu divisi */
function portal_can_approve_absensi($divisi_id) {
    return portal_can_edit_absensi_others($divisi_id);
}

/**
 * Jika true, absensi mandiri (self_absen) milik role ini langsung
 * berstatus "disetujui" tanpa perlu masuk Kotak Pesan -- karena role
 * ini memang berwenang mengedit/menyetujui absensi divisinya sendiri.
 */
function portal_self_absen_auto_approve() {
    if (portal_is_pengurus_inti()) return true;
    if (in_array(portal_role(), ['kadiv', 'wakadiv'])) return true;
    return false; // sekretaris, bendahara, anggota -> perlu persetujuan
}

/** Bisa melihat menu Kas (lihat saja, kecuali bendahara yang full akses) */
function portal_can_view_kas() {
    return in_array(portal_role(), ['ketum', 'waketum', 'bendahara', 'kadiv', 'wakadiv']);
}

/** Bisa tambah/ubah/hapus data Kas -- HANYA bendahara */
function portal_can_edit_kas() {
    return portal_role() === 'bendahara';
}

/** Wajib role tertentu, jika tidak -> tolak akses */
function portal_require($allowedFn) {
    if (!$allowedFn()) {
        http_response_code(403);
        die('<div style="font-family:sans-serif;padding:40px;text-align:center;">
              <h2>403 - Akses Ditolak</h2>
              <p>Anda tidak memiliki hak akses ke halaman ini.</p>
              <a href="' . BASE_URL . '/portal/dashboard.php">Kembali ke Dashboard Portal</a>
            </div>');
    }
}
