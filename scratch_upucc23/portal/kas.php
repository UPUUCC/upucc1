<?php
$pageTitle = 'Kas Organisasi';
$activeMenu = 'kas';
require_once __DIR__ . '/partials/header.php';
portal_require('portal_can_view_kas');

// TAMBAH
if ($_SERVER['REQUEST_METHOD'] === 'POST' && ($_POST['action'] ?? '') === 'add') {
    portal_require('portal_can_edit_kas');
    $stmt = $pdo->prepare("INSERT INTO kas (tanggal, keterangan, jenis, jumlah, input_by) VALUES (?,?,?,?,?)");
    $stmt->execute([$_POST['tanggal'], trim($_POST['keterangan']), $_POST['jenis'], (float)$_POST['jumlah'], $_SESSION['member_id']]);
    set_flash('success', 'Data kas berhasil ditambahkan.');
    redirect('kas.php');
}

// EDIT
if ($_SERVER['REQUEST_METHOD'] === 'POST' && ($_POST['action'] ?? '') === 'edit') {
    portal_require('portal_can_edit_kas');
    $id = (int)$_POST['id'];
    $stmt = $pdo->prepare("UPDATE kas SET tanggal=?, keterangan=?, jenis=?, jumlah=? WHERE id=?");
    $stmt->execute([$_POST['tanggal'], trim($_POST['keterangan']), $_POST['jenis'], (float)$_POST['jumlah'], $id]);
    set_flash('success', 'Data kas berhasil diperbarui.');
    redirect('kas.php');
}

// HAPUS
if (isset($_GET['hapus'])) {
    portal_require('portal_can_edit_kas');
    $pdo->prepare("DELETE FROM kas WHERE id=?")->execute([(int)$_GET['hapus']]);
    set_flash('success', 'Data kas berhasil dihapus.');
    redirect('kas.php');
}

$list = $pdo->query("SELECT * FROM kas ORDER BY tanggal DESC, id DESC")->fetchAll();
$masuk = $pdo->query("SELECT COALESCE(SUM(jumlah),0) t FROM kas WHERE jenis='masuk'")->fetch()['t'];
$keluar = $pdo->query("SELECT COALESCE(SUM(jumlah),0) t FROM kas WHERE jenis='keluar'")->fetch()['t'];
$saldo = $masuk - $keluar;
?>

<div class="row g-3 mb-4">
  <div class="col-md-4"><div class="card border-0 shadow-sm p-3 text-center"><p class="text-muted mb-1">Total Pemasukan</p><h4 class="text-success"><?= rupiah($masuk) ?></h4></div></div>
  <div class="col-md-4"><div class="card border-0 shadow-sm p-3 text-center"><p class="text-muted mb-1">Total Pengeluaran</p><h4 class="text-danger"><?= rupiah($keluar) ?></h4></div></div>
  <div class="col-md-4"><div class="card border-0 shadow-sm p-3 text-center"><p class="text-muted mb-1">Saldo Kas</p><h4 class="text-primary"><?= rupiah($saldo) ?></h4></div></div>
</div>

<div class="card border-0 shadow-sm p-3 mb-4">
  <h6 class="mb-2"><i class="bi bi-file-earmark-excel"></i> Unduh Rekap Kas (Excel)</h6>
  <form method="GET" action="export_kas.php" class="row g-2 align-items-end">
    <div class="col-auto">
      <label class="form-label small mb-1">Dari Tanggal</label>
      <input type="date" name="dari" class="form-control form-control-sm">
    </div>
    <div class="col-auto">
      <label class="form-label small mb-1">Sampai Tanggal</label>
      <input type="date" name="sampai" class="form-control form-control-sm">
    </div>
    <div class="col-auto">
      <button class="btn btn-outline-success btn-sm"><i class="bi bi-download"></i> Unduh Excel</button>
    </div>
    <div class="col-12"><p class="text-muted small mb-0">Kosongkan tanggal untuk mengunduh seluruh riwayat kas.</p></div>
  </form>
</div>

<?php if (!portal_can_edit_kas()): ?>
  <div class="alert alert-secondary"><i class="bi bi-eye"></i> Anda hanya memiliki akses <b>lihat saja</b> untuk data Kas. Penambahan/perubahan hanya dapat dilakukan oleh Bendahara.</div>
<?php else: ?>
<div class="card border-0 shadow-sm p-4 mb-4">
  <h5>Tambah Transaksi Kas</h5>
  <form method="POST" class="row g-3">
    <input type="hidden" name="action" value="add">
    <div class="col-md-3"><label class="form-label">Tanggal</label><input type="date" name="tanggal" class="form-control" required value="<?= date('Y-m-d') ?>"></div>
    <div class="col-md-3"><label class="form-label">Jenis</label>
      <select name="jenis" class="form-select" required>
        <option value="masuk">Pemasukan</option>
        <option value="keluar">Pengeluaran</option>
      </select>
    </div>
    <div class="col-md-3"><label class="form-label">Jumlah (Rp)</label><input type="number" step="0.01" name="jumlah" class="form-control" required></div>
    <div class="col-md-3"><label class="form-label">Keterangan</label><input type="text" name="keterangan" class="form-control" required></div>
    <div class="col-12"><button class="btn btn-primary"><i class="bi bi-plus"></i> Tambah</button></div>
  </form>
</div>
<?php endif; ?>

<div class="card border-0 shadow-sm p-4">
  <h5>Riwayat Transaksi</h5>
  <div class="table-responsive">
  <table class="table table-bordered align-middle">
    <thead class="table-light"><tr><th>Tanggal</th><th>Keterangan</th><th>Jenis</th><th>Jumlah</th><?php if (portal_can_edit_kas()): ?><th>Aksi</th><?php endif; ?></tr></thead>
    <tbody>
    <?php foreach ($list as $k): ?>
      <tr>
        <td><?= tgl_indo($k['tanggal']) ?></td>
        <td><?= e($k['keterangan']) ?></td>
        <td><?= $k['jenis']==='masuk' ? '<span class="badge bg-success">Masuk</span>' : '<span class="badge bg-danger">Keluar</span>' ?></td>
        <td><?= rupiah($k['jumlah']) ?></td>
        <?php if (portal_can_edit_kas()): ?>
        <td>
          <button class="btn btn-sm btn-outline-primary" data-bs-toggle="modal" data-bs-target="#editK<?= $k['id'] ?>"><i class="bi bi-pencil"></i></button>
          <a href="?hapus=<?= $k['id'] ?>" class="btn btn-sm btn-outline-danger" onclick="return confirm('Hapus data ini?')"><i class="bi bi-trash"></i></a>
        </td>
        <?php endif; ?>
      </tr>
      <?php if (portal_can_edit_kas()): ?>
      <div class="modal fade" id="editK<?= $k['id'] ?>">
        <div class="modal-dialog"><div class="modal-content">
          <form method="POST">
            <input type="hidden" name="action" value="edit"><input type="hidden" name="id" value="<?= $k['id'] ?>">
            <div class="modal-header"><h5 class="modal-title">Edit Transaksi</h5><button class="btn-close" data-bs-dismiss="modal"></button></div>
            <div class="modal-body">
              <div class="mb-2"><label class="form-label">Tanggal</label><input type="date" name="tanggal" class="form-control" value="<?= e($k['tanggal']) ?>" required></div>
              <div class="mb-2"><label class="form-label">Jenis</label>
                <select name="jenis" class="form-select">
                  <option value="masuk" <?= $k['jenis']==='masuk'?'selected':'' ?>>Pemasukan</option>
                  <option value="keluar" <?= $k['jenis']==='keluar'?'selected':'' ?>>Pengeluaran</option>
                </select>
              </div>
              <div class="mb-2"><label class="form-label">Jumlah</label><input type="number" step="0.01" name="jumlah" class="form-control" value="<?= e($k['jumlah']) ?>" required></div>
              <div class="mb-2"><label class="form-label">Keterangan</label><input type="text" name="keterangan" class="form-control" value="<?= e($k['keterangan']) ?>" required></div>
            </div>
            <div class="modal-footer"><button class="btn btn-primary">Simpan</button></div>
          </form>
        </div></div>
      </div>
      <?php endif; ?>
    <?php endforeach; ?>
    <?php if (!$list): ?><tr><td colspan="5" class="text-center text-muted">Belum ada transaksi.</td></tr><?php endif; ?>
    </tbody>
  </table>
  </div>
</div>

<?php require_once __DIR__ . '/partials/footer.php'; ?>
