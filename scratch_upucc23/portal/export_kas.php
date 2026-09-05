<?php
/**
 * Unduh rekap Kas Organisasi dalam format Excel (.xls).
 * Bisa diakses oleh siapa saja yang berhak MELIHAT menu Kas -- yaitu:
 * ketum, waketum, bendahara, kadiv, wakadiv (lihat portal_can_view_kas()
 * di includes/auth_portal.php). Hak edit tetap hanya milik bendahara,
 * ini murni fitur unduh (read-only), jadi tidak mengubah aturan akses lain.
 */
require_once __DIR__ . '/../database.php';
require_once __DIR__ . '/../includes/functions.php';
require_once __DIR__ . '/../includes/auth_portal.php';
portal_login_required();
$pdo = getDB();

portal_require('portal_can_view_kas');

$dari = $_GET['dari'] ?? '';
$sampai = $_GET['sampai'] ?? '';
if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $dari)) $dari = null;
if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $sampai)) $sampai = null;

$params = [];
$sql = "SELECT tanggal, keterangan, jenis, jumlah FROM kas WHERE 1=1";
if ($dari) { $sql .= " AND tanggal >= ?"; $params[] = $dari; }
if ($sampai) { $sql .= " AND tanggal <= ?"; $params[] = $sampai; }
$sql .= " ORDER BY tanggal ASC, id ASC";

$stmt = $pdo->prepare($sql);
$stmt->execute($params);
$rows = $stmt->fetchAll();

$totalMasuk = 0;
$totalKeluar = 0;
foreach ($rows as $r) {
    if ($r['jenis'] === 'masuk') $totalMasuk += (float) $r['jumlah'];
    else $totalKeluar += (float) $r['jumlah'];
}
$saldo = $totalMasuk - $totalKeluar;

$periodeLabel = ($dari || $sampai)
    ? (($dari ? tgl_indo($dari) : 'Awal') . ' s/d ' . ($sampai ? tgl_indo($sampai) : 'Sekarang'))
    : 'Seluruh Periode';

$filename = 'Kas_UPUCC_' . ($dari ?: 'semua') . '_sd_' . ($sampai ?: 'semua') . '.xls';

header('Content-Type: application/vnd.ms-excel; charset=UTF-8');
header('Content-Disposition: attachment; filename="' . $filename . '"');
header('Cache-Control: max-age=0');
header('Pragma: public');

// BOM supaya karakter Indonesia tampil dengan benar saat dibuka di Excel
echo "\xEF\xBB\xBF";
?>
<table border="1">
  <tr><td colspan="4" style="font-size:14px;"><b>Laporan Kas Organisasi UPUCC</b></td></tr>
  <tr><td colspan="4">Periode: <?= e($periodeLabel) ?></td></tr>
  <tr><td colspan="4">Diunduh oleh: <?= e($_SESSION['member_nama'] ?? '-') ?> (<?= e(label_role(portal_role())) ?>) pada <?= date('d-m-Y H:i') ?></td></tr>
  <tr><td colspan="4"></td></tr>
  <tr style="background:#dbe5f1;font-weight:bold;">
    <td>Tanggal</td>
    <td>Keterangan</td>
    <td>Jenis</td>
    <td>Jumlah (Rp)</td>
  </tr>
  <?php foreach ($rows as $r): ?>
  <tr>
    <td><?= e($r['tanggal']) ?></td>
    <td><?= e($r['keterangan']) ?></td>
    <td><?= $r['jenis'] === 'masuk' ? 'Pemasukan' : 'Pengeluaran' ?></td>
    <td style="mso-number-format:'#,##0';"><?= number_format((float) $r['jumlah'], 0, ',', '.') ?></td>
  </tr>
  <?php endforeach; ?>
  <?php if (!$rows): ?>
  <tr><td colspan="4">Tidak ada data kas pada periode ini.</td></tr>
  <?php endif; ?>
  <tr><td colspan="4"></td></tr>
  <tr style="font-weight:bold;"><td colspan="3">Total Pemasukan</td><td><?= number_format($totalMasuk, 0, ',', '.') ?></td></tr>
  <tr style="font-weight:bold;"><td colspan="3">Total Pengeluaran</td><td><?= number_format($totalKeluar, 0, ',', '.') ?></td></tr>
  <tr style="font-weight:bold;"><td colspan="3">Saldo Kas</td><td><?= number_format($saldo, 0, ',', '.') ?></td></tr>
</table>
