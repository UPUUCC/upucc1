<?php
/**
 * Pendaftaran anggota baru secara mandiri (self-service) sudah ditiadakan.
 * Menu "Pendaftaran" juga sudah dihapus dari navbar halaman Beranda.
 * File ini sengaja tetap ada (supaya link/bookmark lama tidak error 404)
 * dan langsung mengarahkan ke halaman Login, yang akan menampilkan pesan
 * "Silahkan buat akun terlebih dahulu" lewat pilihan menu "Pendaftaran"
 * di sana.
 */
require_once __DIR__ . '/database.php';
require_once __DIR__ . '/includes/functions.php';
header('Location: login.php?daftar=1');
exit;
