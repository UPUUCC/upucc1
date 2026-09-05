<?php
/**
 * Menu "Kelola Anggota" (registrasi / pembuatan akun anggota baru) sudah
 * TIDAK ADA lagi di Portal Anggota, untuk role apa pun -- termasuk Ketua
 * Umum dan Wakil Ketua Umum. Pembuatan, pengubahan, dan penghapusan akun
 * anggota (username, password, foto, role, divisi) kini HANYA bisa
 * dilakukan lewat menu "Anggota / Struktur" di Dashboard CMS
 * (lihat /dashboard/anggota.php).
 *
 * File ini sengaja tetap ada (supaya link/bookmark lama ke portal/anggota.php
 * tidak error 404) dan langsung mengarahkan kembali ke Beranda Portal
 * dengan pesan penjelasan.
 */
require_once __DIR__ . '/../database.php';
require_once __DIR__ . '/../includes/functions.php';
require_once __DIR__ . '/../includes/auth_portal.php';
portal_login_required();

set_flash('danger', 'Menu Kelola Anggota sudah tidak ada di Portal. Pembuatan/pengelolaan akun anggota kini hanya bisa dilakukan lewat menu "Anggota / Struktur" di Dashboard CMS.');
redirect('dashboard.php');
