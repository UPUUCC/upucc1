<?php
$pageTitle = 'Beranda Portal';
$activeMenu = 'dashboard';
require_once __DIR__ . '/partials/header.php';

$today = date('Y-m-d');
$stmtAbsenHariIni = $pdo->prepare("SELECT * FROM absensi WHERE member_id=? AND tanggal=?");
$stmtAbsenHariIni->execute([$_SESSION['member_id'], $today]);
$absenHariIni = $stmtAbsenHariIni->fetch();

$divisiNama = '-';
if (portal_divisi_id()) {
    $stmt = $pdo->prepare("SELECT nama FROM divisions WHERE id=?");
    $stmt->execute([portal_divisi_id()]);
    $divisiNama = $stmt->fetchColumn() ?: '-';
}

$isApprover = portal_is_pengurus_inti() || in_array(portal_role(), ['kadiv', 'wakadiv']);
$isAbsenExempt = portal_is_absen_exempt();
?>
<div class="row g-3">
  <div class="col-md-4">
    <div class="card border-0 shadow-sm p-4 text-center">
      <i class="bi bi-person-badge fs-1 text-primary"></i>
      <h5 class="mt-2"><?= e($_SESSION['member_nama']) ?></h5>
      <p class="mb-0 text-muted"><?= e(label_role(portal_role())) ?></p>
      <p class="mb-0 text-muted small">Divisi: <?= e($divisiNama) ?></p>
    </div>
  </div>
  <div class="col-md-4">
    <div class="card border-0 shadow-sm p-4 text-center">
      <?php if ($isAbsenExempt): ?>
        <i class="bi bi-clipboard-data fs-1 text-success"></i>
        <h5 class="mt-2">Pemantauan Absensi</h5>
        <span class="badge bg-info text-dark">Tidak perlu absen sendiri</span>
        <div class="mt-2"><a href="absensi.php" class="btn btn-sm btn-primary">Pantau Absensi</a></div>
      <?php else: ?>
        <i class="bi bi-calendar-check fs-1 text-success"></i>
        <h5 class="mt-2">Absensi Hari Ini</h5>
        <?php if ($absenHariIni && $absenHariIni['approval_status'] !== 'ditolak'): ?>
          <span class="badge bg-secondary text-uppercase"><?= e($absenHariIni['status']) ?></span>
          <div class="mt-1"><span class="badge <?= badge_approval($absenHariIni['approval_status']) ?>"><?= e(label_approval($absenHariIni['approval_status'])) ?></span></div>
        <?php else: ?>
          <span class="badge bg-secondary">Belum Absen</span>
          <div class="mt-2"><a href="absensi.php" class="btn btn-sm btn-primary">Absen Sekarang</a></div>
        <?php endif; ?>
      <?php endif; ?>
    </div>
  </div>
  <?php if ($isApprover): ?>
  <div class="col-md-4">
    <div class="card border-0 shadow-sm p-4 text-center">
      <i class="bi bi-inbox fs-1 text-danger"></i>
      <h5 class="mt-2">Kotak Pesan Absensi</h5>
      <?php if ($pendingApprovalCount > 0): ?>
        <span class="badge bg-danger"><?= $pendingApprovalCount ?> menunggu persetujuan</span>
      <?php else: ?>
        <span class="badge bg-success">Tidak ada pengajuan baru</span>
      <?php endif; ?>
      <div class="mt-2"><a href="persetujuan_absensi.php" class="btn btn-sm btn-outline-primary">Buka Kotak Pesan</a></div>
    </div>
  </div>
  <?php elseif (portal_can_view_kas()): ?>
  <div class="col-md-4">
    <?php
    $masuk = $pdo->query("SELECT COALESCE(SUM(jumlah),0) t FROM kas WHERE jenis='masuk'")->fetch()['t'];
    $keluar = $pdo->query("SELECT COALESCE(SUM(jumlah),0) t FROM kas WHERE jenis='keluar'")->fetch()['t'];
    $saldo = $masuk - $keluar;
    ?>
    <div class="card border-0 shadow-sm p-4 text-center">
      <i class="bi bi-cash-stack fs-1 text-warning"></i>
      <h5 class="mt-2">Saldo Kas</h5>
      <h4 class="text-primary"><?= rupiah($saldo) ?></h4>
      <a href="kas.php" class="btn btn-sm btn-outline-primary">Lihat Detail</a>
    </div>
  </div>
  <?php endif; ?>
</div>

<?php if ($isApprover && portal_can_view_kas()): ?>
<div class="row g-3 mt-1">
  <div class="col-md-4">
    <?php
    $masuk = $pdo->query("SELECT COALESCE(SUM(jumlah),0) t FROM kas WHERE jenis='masuk'")->fetch()['t'];
    $keluar = $pdo->query("SELECT COALESCE(SUM(jumlah),0) t FROM kas WHERE jenis='keluar'")->fetch()['t'];
    $saldo = $masuk - $keluar;
    ?>
    <div class="card border-0 shadow-sm p-4 text-center">
      <i class="bi bi-cash-stack fs-1 text-warning"></i>
      <h5 class="mt-2">Saldo Kas <span class="badge bg-secondary">Lihat saja</span></h5>
      <h4 class="text-primary"><?= rupiah($saldo) ?></h4>
      <a href="kas.php" class="btn btn-sm btn-outline-primary">Lihat Detail</a>
    </div>
  </div>
</div>
<?php endif; ?>

<div class="alert alert-info mt-4">
  <i class="bi bi-info-circle"></i> Hak akses Anda:
  <ul class="mb-0 mt-2">
    <?php if (portal_is_pengurus_inti()): ?>
      <li>Akses penuh ke seluruh data (kecuali menambah/mengubah Kas - hanya bisa <b>melihat</b> Kas).</li>
      <li><b>Tidak perlu melakukan absensi untuk diri sendiri</b> -- hanya memantau absensi dari <b>seluruh divisi</b>, serta menerima/menolak pengajuan absensi mandiri dari <b>Kotak Pesan</b> (semua divisi).</li>
      <li>Bisa mengunduh rekap absensi dalam bentuk <b>Excel</b> di menu Absensi.</li>
      <li>Bisa mengelola data anggota.</li>
    <?php elseif (in_array(portal_role(), ['kadiv','wakadiv'])): ?>
      <li><b>Tidak perlu melakukan absensi untuk diri sendiri</b> -- hanya memantau &amp; mengelola absensi anggota untuk <b>divisi Anda sendiri</b>.</li>
      <li>Menerima atau menolak pengajuan absensi mandiri anggota divisi Anda lewat menu <b>Kotak Pesan</b>.</li>
      <li>Bisa mengunduh rekap absensi divisi Anda dalam bentuk <b>Excel</b> di menu Absensi.</li>
      <li>Kas Organisasi: hanya bisa <b>melihat</b>, tidak bisa menambah/mengubah.</li>
    <?php elseif (portal_role() === 'sekretaris'): ?>
      <li>Fokus mengelola data <b>anggota</b> (tambah, ubah, hapus) di seluruh divisi.</li>
      <li>Bisa <b>memantau</b> absensi seluruh divisi dan mengunduh rekapnya dalam bentuk <b>Excel</b> di menu Absensi, tetapi tidak dapat mengubah data absensi maupun mengakses Kas.</li>
    <?php elseif (portal_role() === 'bendahara'): ?>
      <li>Melakukan absensi seperti anggota lain (pengajuan Anda menunggu persetujuan Ketua/Wakil Ketua Umum).</li>
      <li>Satu-satunya role dengan akses <b>penuh</b> (tambah/ubah/hapus) ke Kas Organisasi.</li>
    <?php else: ?>
      <li>Anda hanya dapat melakukan absensi untuk <b>diri sendiri</b>.</li>
      <li>Setiap pengajuan absensi akan masuk ke Kotak Pesan pengurus divisi Anda dan baru tercatat resmi setelah <b>disetujui</b>.</li>
    <?php endif; ?>
  </ul>
</div>

<?php require_once __DIR__ . '/partials/footer.php'; ?>
