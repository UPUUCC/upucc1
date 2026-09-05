<?php
/**
 * Konfigurasi koneksi database (PDO) - UPUCC
 * Sesuaikan DB_HOST, DB_NAME, DB_USER, DB_PASS dengan server hosting Anda.
 */
define('DB_HOST', 'localhost');
define('DB_NAME', 'upucc_db');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_CHARSET', 'utf8mb4');

// Base URL folder tempat proyek ini diletakkan (tanpa trailing slash)
// Contoh jika diakses di http://localhost/upucc maka BASE_URL = '/upucc'
define('BASE_URL', '');

function getDB() {
    static $pdo = null;
    if ($pdo === null) {
        $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=" . DB_CHARSET;
        $options = [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
        ];
        try {
            $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
        } catch (PDOException $e) {
            die('Koneksi database gagal: ' . $e->getMessage());
        }
    }
    return $pdo;
}
