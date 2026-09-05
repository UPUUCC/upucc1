<?php
$pageTitle = 'Prestasi';
$activeMenu = 'prestasi';
require_once __DIR__ . '/partials/header.php';

$divisions = $pdo->query("SELECT * FROM divisions ORDER BY id ASC")->fetchAll();
$filter = $_GET['divisi'] ?? '';
if ($filter !== '' && ctype_digit($filter)) {
    $stmt = $pdo->prepare("SELECT p.*, d.nama AS divisi_nama FROM prestasi p LEFT JOIN divisions d ON d.id=p.divisi_id WHERE p.divisi_id = ? ORDER BY p.tanggal DESC, p.id DESC");
    $stmt->execute([$filter]);
} else {
    $stmt = $pdo->query("SELECT p.*, d.nama AS divisi_nama FROM prestasi p LEFT JOIN divisions d ON d.id=p.divisi_id ORDER BY p.tanggal DESC, p.id DESC");
}
$prestasiList = $stmt->fetchAll();
?>
<div class="container my-5">
  <h2 class="section-title">Prestasi Seluruh Divisi</h2>
  <p class="text-muted">Klik salah satu prestasi untuk melihat informasi lengkapnya.</p>

  <div class="mb-4">
    <a href="prestasi.php" class="btn btn-sm <?= $filter===''?'btn-primary':'btn-outline-primary' ?>">Semua</a>
    <?php foreach ($divisions as $d): ?>
      <a href="prestasi.php?divisi=<?= $d['id'] ?>" class="btn btn-sm <?= (string)$filter===(string)$d['id']?'btn-primary':'btn-outline-primary' ?>"><?= e($d['nama']) ?></a>
    <?php endforeach; ?>
  </div>

  <div class="row g-4">
    <?php if (!$prestasiList): ?>
      <p class="text-muted">Belum ada data prestasi.</p>
    <?php endif; ?>
    <?php foreach ($prestasiList as $p): ?>
    <div class="col-md-4">
      <div class="card prestasi-card h-100" role="button" data-bs-toggle="modal" data-bs-target="#prestasiModal<?= $p['id'] ?>">
        <img src="<?= $p['gambar'] ? 'uploads/prestasi/'.e($p['gambar']) : 'https://via.placeholder.com/400x180?text=Prestasi+UPUCC' ?>" class="card-img-top" alt="<?= e($p['judul']) ?>">
        <div class="card-body">
          <span class="badge bg-secondary mb-2"><?= e($p['divisi_nama'] ?? 'Umum') ?></span>
          <h5 class="card-title"><?= e($p['judul']) ?></h5>
          <p class="card-text small text-muted"><?= tgl_indo($p['tanggal']) ?></p>
          <p class="card-text prestasi-excerpt"><?= nl2br(e(mb_strimwidth($p['deskripsi'] ?? '', 0, 120, '...'))) ?></p>
          <span class="btn btn-sm btn-outline-primary mt-2"><i class="bi bi-zoom-in"></i> Lihat Detail</span>
        </div>
      </div>
    </div>

    <!-- Modal detail prestasi -->
    <div class="modal fade" id="prestasiModal<?= $p['id'] ?>" tabindex="-1" aria-hidden="true">
      <div class="modal-dialog modal-dialog-centered modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title"><?= e($p['judul']) ?></h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Tutup"></button>
          </div>
          <div class="modal-body">
            <img src="<?= $p['gambar'] ? 'uploads/prestasi/'.e($p['gambar']) : 'https://via.placeholder.com/800x400?text=Prestasi+UPUCC' ?>" class="img-fluid rounded mb-3" alt="<?= e($p['judul']) ?>">
            <div class="mb-2">
              <span class="badge bg-secondary"><?= e($p['divisi_nama'] ?? 'Umum') ?></span>
              <span class="badge bg-light text-dark border"><i class="bi bi-calendar3"></i> <?= tgl_indo($p['tanggal']) ?></span>
            </div>
            <p style="white-space:pre-line;"><?= nl2br(e($p['deskripsi'])) ?: '<span class="text-muted">Belum ada deskripsi.</span>' ?></p>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Tutup</button>
          </div>
        </div>
      </div>
    </div>
    <?php endforeach; ?>
  </div>
</div>
<?php require_once __DIR__ . '/partials/footer.php'; ?>
