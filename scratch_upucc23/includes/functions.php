<?php
/** Escape output HTML */
function e($str) {
    return htmlspecialchars($str ?? '', ENT_QUOTES, 'UTF-8');
}

/** Format tanggal Indonesia */
function tgl_indo($tanggal) {
    if (!$tanggal) return '-';
    $bulan = ['01'=>'Januari','02'=>'Februari','03'=>'Maret','04'=>'April','05'=>'Mei','06'=>'Juni',
              '07'=>'Juli','08'=>'Agustus','09'=>'September','10'=>'Oktober','11'=>'November','12'=>'Desember'];
    $t = date('d', strtotime($tanggal));
    $b = date('m', strtotime($tanggal));
    $y = date('Y', strtotime($tanggal));
    return $t . ' ' . $bulan[$b] . ' ' . $y;
}

/** Format Rupiah */
function rupiah($angka) {
    return 'Rp ' . number_format((float)$angka, 0, ',', '.');
}

/**
 * Upload gambar dengan validasi sederhana.
 * $field   : nama input file
 * $destDir : folder tujuan absolut (harus writable)
 * Return   : nama file baru (string) atau null jika tidak ada file diupload
 * Throws   : Exception jika file tidak valid
 */
function upload_gambar($field, $destDir, $prefix = 'img') {
    if (!isset($_FILES[$field]) || $_FILES[$field]['error'] === UPLOAD_ERR_NO_FILE) {
        return null;
    }
    if ($_FILES[$field]['error'] !== UPLOAD_ERR_OK) {
        throw new Exception('Terjadi kesalahan saat upload file.');
    }
    $allowed = ['jpg' => 'image/jpeg', 'jpeg' => 'image/jpeg', 'png' => 'image/png', 'webp' => 'image/webp', 'gif' => 'image/gif'];
    $ext = strtolower(pathinfo($_FILES[$field]['name'], PATHINFO_EXTENSION));
    if (!array_key_exists($ext, $allowed)) {
        throw new Exception('Format file tidak didukung. Gunakan JPG, PNG, WEBP, atau GIF.');
    }
    if ($_FILES[$field]['size'] > 20 * 1024 * 1024) {
        throw new Exception('Ukuran file maksimal 20MB.');
    }
    if (!is_dir($destDir)) {
        mkdir($destDir, 0775, true);
    }
    $newName = $prefix . '_' . date('YmdHis') . '_' . bin2hex(random_bytes(4)) . '.' . $ext;
    if (!move_uploaded_file($_FILES[$field]['tmp_name'], rtrim($destDir, '/') . '/' . $newName)) {
        throw new Exception('Gagal menyimpan file yang diupload.');
    }
    return $newName;
}

/** Hapus file gambar lama (aman jika tidak ada) */
function hapus_gambar($destDir, $filename) {
    if ($filename) {
        $path = rtrim($destDir, '/') . '/' . $filename;
        if (is_file($path)) @unlink($path);
    }
}

/** Redirect helper */
function redirect($url) {
    header('Location: ' . $url);
    exit;
}

/** Flash message sederhana via session */
function set_flash($type, $msg) {
    $_SESSION['flash'] = ['type' => $type, 'msg' => $msg];
}
function get_flash() {
    if (!empty($_SESSION['flash'])) {
        $f = $_SESSION['flash'];
        unset($_SESSION['flash']);
        return $f;
    }
    return null;
}
function render_flash() {
    $f = get_flash();
    if ($f) {
        $alertClass = $f['type'] === 'success' ? 'alert-success' : 'alert-danger';
        echo '<div class="alert ' . $alertClass . ' alert-dismissible fade show" role="alert">'
           . e($f['msg'])
           . '<button type="button" class="btn-close" data-bs-dismiss="alert"></button></div>';
    }
}

/** Label status persetujuan absensi menjadi teks Indonesia */
function label_approval($status) {
    $map = ['menunggu' => 'Menunggu Persetujuan', 'disetujui' => 'Disetujui', 'ditolak' => 'Ditolak'];
    return $map[$status] ?? $status;
}

/** Kelas badge Bootstrap untuk status persetujuan absensi */
function badge_approval($status) {
    $map = ['menunggu' => 'bg-warning text-dark', 'disetujui' => 'bg-success', 'ditolak' => 'bg-danger'];
    return $map[$status] ?? 'bg-secondary';
}

/** Label role portal menjadi teks Indonesia */
function label_role($role) {
    $map = [
        'ketum' => 'Ketua Umum', 'waketum' => 'Wakil Ketua Umum', 'bendahara' => 'Bendahara',
        'sekretaris' => 'Sekretaris', 'kadiv' => 'Ketua Divisi', 'wakadiv' => 'Wakil Ketua Divisi',
        'anggota' => 'Anggota',
    ];
    return $map[$role] ?? $role;
}
