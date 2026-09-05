<?php
/**
 * Unduh rekap absensi dalam format Excel (.xls).
 * Bisa diakses oleh: ketum, waketum, kadiv, wakadiv, sekretaris.
 */
require_once __DIR__ . '/../database.php';
require_once __DIR__ . '/../includes/functions.php';
require_once __DIR__ . '/../includes/auth_portal.php';
portal_login_required();
$pdo = getDB();

portal_require(function () { return portal_can_export_absensi(); });

$role = portal_role();
$isMultiDivisi = portal_is_pengurus_inti() || $role === 'sekretaris';

$divisiParam = $_GET['divisi'] ?? 'all';
$dari = $_GET['dari'] ?? date('Y-m-01');
$sampai = $_GET['sampai'] ?? date('Y-m-d');

// Validasi format tanggal sederhana, jaga-jaga input tidak sesuai
if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $dari))   $dari = date('Y-m-01');
if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $sampai)) $sampai = date('Y-m-d');

// kadiv/wakadiv hanya boleh mengunduh data divisinya sendiri
if (in_array($role, ['kadiv', 'wakadiv'])) {
    $divisiId = portal_divisi_id();
} else {
    $divisiId = ($divisiParam === 'all') ? 'all' : (int) $divisiParam;
    if ($divisiId !== 'all' && !$isMultiDivisi && (int) $divisiId !== (int) portal_divisi_id()) {
        $divisiId = portal_divisi_id();
    }
}

$params = [$dari, $sampai];
$sql = "SELECT a.tanggal, m.nama, m.username, d.nama AS divisi_nama, a.status, a.keterangan, a.approval_status
        FROM absensi a
        JOIN members m ON m.id = a.member_id
        LEFT JOIN divisions d ON d.id = a.divisi_id
        WHERE a.tanggal BETWEEN ? AND ?";
if ($divisiId !== 'all' && $divisiId !== null && $divisiId !== '') {
    $sql .= " AND a.divisi_id = ?";
    $params[] = (int) $divisiId;
}
$sql .= " ORDER BY a.tanggal ASC, d.nama ASC, m.nama ASC";

$stmt = $pdo->prepare($sql);
$stmt->execute($params);
$rows = $stmt->fetchAll();

$divisiLabel = 'Semua Divisi';
if ($divisiId !== 'all' && $divisiId !== null && $divisiId !== '') {
    $stmtD = $pdo->prepare("SELECT nama FROM divisions WHERE id=?");
    $stmtD->execute([$divisiId]);
    $divisiLabel = $stmtD->fetchColumn() ?: ('Divisi #' . $divisiId);
}

$filenameSafe = preg_replace('/[^A-Za-z0-9_-]/', '_', $divisiLabel);
$filename = 'Absensi_' . $filenameSafe . '_' . $dari . '_sd_' . $sampai . '.xls';

header('Content-Type: application/vnd.ms-excel; charset=UTF-8');
header('Content-Disposition: attachment; filename="' . $filename . '"');
header('Cache-Control: max-age=0');
header('Pragma: public');

// BOM supaya karakter Indonesia tampil dengan benar saat dibuka di Excel
echo "\xEF\xBB\xBF";
?>
<table border="1">
  <tr><td colspan="7" style="font-size:14px;"><b>Laporan Absensi UPUCC - <?= e($divisiLabel) ?></b></td></tr>
  <tr><td colspan="7">Periode: <?= tgl_indo($dari) ?> s/d <?= tgl_indo($sampai) ?></td></tr>
  <tr><td colspan="7">Diunduh oleh: <?= e($_SESSION['member_nama'] ?? '-') ?> (<?= e(label_role($role)) ?>) pada <?= date('d-m-Y H:i') ?></td></tr>
  <tr><td colspan="7"></td></tr>
  <tr style="background:#dbe5f1;font-weight:bold;">
    <td>No</td>
    <td>Tanggal</td>
    <td>Nama</td>
    <td>Divisi</td>
    <td>Status</td>
    <td>Keterangan</td>
    <td>Persetujuan</td>
  </tr>
  <?php $no = 1; foreach ($rows as $r): ?>
  <tr>
    <td><?= $no++ ?></td>
    <td><?= e($r['tanggal']) ?></td>
    <td><?= e($r['nama']) ?></td>
    <td><?= e($r['divisi_nama'] ?? '-') ?></td>
    <td><?= e(ucfirst($r['status'])) ?></td>
    <td><?= e($r['keterangan']) ?></td>
    <td><?= e(label_approval($r['approval_status'])) ?></td>
  </tr>
  <?php endforeach; ?>
  <?php if (!$rows): ?>
  <tr><td colspan="7">Tidak ada data absensi pada periode ini.</td></tr>
  <?php endif; ?>
</table>
