<?php
/**
 * Menu "Pendaftaran Anggota" sudah TIDAK digunakan lagi -- pendaftaran
 * anggota baru secara publik sudah ditiadakan (lihat login.php di halaman
 * publik, yang sekarang menampilkan pesan "Silahkan buat akun terlebih
 * dahulu" bagi calon anggota). File ini sengaja tidak lagi ditautkan dari
 * sidebar CMS; dibiarkan me-redirect supaya link/bookmark lama tidak error.
 * Akun anggota baru sekarang dibuat langsung oleh pengurus lewat menu
 * "Anggota / Struktur" di Dashboard CMS ini (tidak ada lagi di Portal).
 */
require_once __DIR__ . '/../database.php';
require_once __DIR__ . '/../includes/functions.php';
require_once __DIR__ . '/../includes/auth_dashboard.php';
admin_login_required();
set_flash('danger', 'Menu Pendaftaran Anggota sudah tidak digunakan. Akun anggota baru kini dibuat langsung lewat menu Anggota / Struktur di Dashboard ini.');
redirect('index.php');
