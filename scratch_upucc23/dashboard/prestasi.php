<?php
$pageTitle = 'Prestasi';
$activeMenu = 'prestasi';
require_once __DIR__ . '/partials/header.php';

$uploadDir = __DIR__ . '/../uploads/prestasi';
$divisions = $pdo->query("SELECT * FROM divisions ORDER BY id ASC")->fetchAll();

if ($_SERVER['REQUEST_METHOD'] === 'POST' && ($_POST['action'] ?? '') === 'add') {
    try {
        $file = upload_gambar('gambar', $uploadDir, 'prestasi');
        $divisiId = $_POST['divisi_id'] !== '' ? (int)$_POST['divisi_id'] : null;
        $stmt = $pdo->prepare("INSERT INTO prestasi (divisi_id, judul, deskripsi, gambar, tanggal) VALUES (?,?,?,?,?)");
        $stmt->execute([$divisiId, trim($_POST['judul']), trim($_POST['deskripsi']), $file, $_POST['tanggal'] ?: null]);
        set_flash('success', 'Prestasi berhasil ditambahkan.');
    } catch (Exception $e) {
        set_flash('danger', $e->getMessage());
    }
    redirect('prestasi.php');
}

if ($_SERVER['REQUEST_METHOD'] === 'POST' && ($_POST['action'] ?? '') === 'edit') {
    try {
        $id = (int)$_POST['id'];
        $stmt = $pdo->prepare("SELECT * FROM prestasi WHERE id=?");
        $stmt->execute([$id]);
        $old = $stmt->fetch();
        if (!$old) throw new Exception('Data tidak ditemukan.');
        $file = upload_gambar('gambar', $uploadDir, 'prestasi');
        if ($file) { hapus_gambar($uploadDir, $old['gambar']); } else { $file = $old['gambar']; }
        $divisiId = $_POST['divisi_id'] !== '' ? (int)$_POST['divisi_id'] : null;
        $stmt = $pdo->prepare("UPDATE prestasi SET divisi_id=?, judul=?, deskripsi=?, gambar=?, tanggal=? WHERE id=?");
        $stmt->execute([$divisiId, trim($_POST['judul']), trim($_POST['deskripsi']), $file, $_POST['tanggal'] ?: null, $id]);
        set_flash('success', 'Prestasi berhasil diperbarui.');
    } catch (Exception $e) {
        set_flash('danger', $e->getMessage());
    }
    redirect('prestasi.php');
}

if (isset($_GET['hapus'])) {
    $id = (int)$_GET['hapus'];
    $stmt = $pdo->prepare("SELECT * FROM prestasi WHERE id=?");
    $stmt->execute([$id]);
    $old = $stmt->fetch();
    if ($old) {
        hapus_gambar($uploadDir, $old['gambar']);
        $pdo->prepare("DELETE FROM prestasi WHERE id=?")->execute([$id]);
        set_flash('success', 'Prestasi berhasil dihapus.');
    }
    redirect('prestasi.php');
}

$list = $pdo->query("SELECT p.*, d.nama AS divisi_nama FROM prestasi p LEFT JOIN divisions d ON d.id=p.divisi_id ORDER BY p.tanggal DESC, p.id DESC")->fetchAll();
?>

<div class="card border-0 shadow-sm p-4 mb-4">
  <h5>Tambah Prestasi</h5>
  <form method="POST" enctype="multipart/form-data" class="row g-3">
    <input type="hidden" name="action" value="add">
    <div class="col-md-4">
      <label class="form-label">Judul *</label>
      <input type="text" name="judul" class="form-control" required>
    </div>
    <div class="col-md-3">
      <label class="form-label">Divisi (kosongkan jika prestasi umum)</label>
      <select name="divisi_id" class="form-select">
        <option value="">-- Umum / Seluruh Divisi --</option>
        <?php foreach ($divisions as $d): ?><option value="<?= $d['id'] ?>"><?= e($d['nama']) ?></option><?php endforeach; ?>
      </select>
    </div>
    <div class="col-md-2">
      <label class="form-label">Tanggal</label>
      <input type="date" name="tanggal" class="form-control">
    </div>
    <div class="col-md-3">
      <label class="form-label">Gambar</label>
      <input type="file" name="gambar" class="form-control" accept="image/*">
    </div>
    <div class="col-12">
      <label class="form-label">Deskripsi</label>
      <textarea name="deskripsi" class="form-control" rows="3"></textarea>
    </div>
    <div class="col-12"><button class="btn btn-primary"><i class="bi bi-plus"></i> Tambah</button></div>
  </form>
</div>

<div class="table-responsive">
<table class="table table-bordered bg-white align-middle">
<thead class="table-light"><tr><th>Gambar</th><th>Judul</th><th>Divisi</th><th>Tanggal</th><th>Aksi</th></tr></thead>
<tbody>
<?php foreach ($list as $p): ?>
<tr>
  <td><img src="<?= $p['gambar'] ? '../uploads/prestasi/'.e($p['gambar']) : 'https://via.placeholder.com/60' ?>" style="width:60px;height:60px;object-fit:cover;"></td>
  <td><?= e($p['judul']) ?></td>
  <td><?= e($p['divisi_nama'] ?? 'Umum') ?></td>
  <td><?= tgl_indo($p['tanggal']) ?></td>
  <td>
    <button class="btn btn-sm btn-outline-primary" data-bs-toggle="modal" data-bs-target="#edit<?= $p['id'] ?>"><i class="bi bi-pencil"></i></button>
    <a href="?hapus=<?= $p['id'] ?>" class="btn btn-sm btn-outline-danger" onclick="return confirm('Hapus prestasi ini?')"><i class="bi bi-trash"></i></a>
  </td>
</tr>
<div class="modal fade" id="edit<?= $p['id'] ?>">
  <div class="modal-dialog">
    <div class="modal-content">
      <form method="POST" enctype="multipart/form-data">
        <input type="hidden" name="action" value="edit">
        <input type="hidden" name="id" value="<?= $p['id'] ?>">
        <div class="modal-header"><h5 class="modal-title">Edit Prestasi</h5><button class="btn-close" data-bs-dismiss="modal"></button></div>
        <div class="modal-body">
          <div class="mb-2"><label class="form-label">Judul</label><input type="text" name="judul" class="form-control" value="<?= e($p['judul']) ?>" required></div>
          <div class="mb-2"><label class="form-label">Divisi</label>
            <select name="divisi_id" class="form-select">
              <option value="">-- Umum --</option>
              <?php foreach ($divisions as $d): ?><option value="<?= $d['id'] ?>" <?= $p['divisi_id']==$d['id']?'selected':'' ?>><?= e($d['nama']) ?></option><?php endforeach; ?>
            </select>
          </div>
          <div class="mb-2"><label class="form-label">Tanggal</label><input type="date" name="tanggal" class="form-control" value="<?= e($p['tanggal']) ?>"></div>
          <div class="mb-2"><label class="form-label">Gambar (kosongkan jika tidak ganti)</label><input type="file" name="gambar" class="form-control" accept="image/*"></div>
          <div class="mb-2"><label class="form-label">Deskripsi</label><textarea name="deskripsi" class="form-control" rows="3"><?= e($p['deskripsi']) ?></textarea></div>
        </div>
        <div class="modal-footer"><button class="btn btn-primary">Simpan</button></div>
      </form>
    </div>
  </div>
</div>
<?php endforeach; ?>
</tbody>
</table>
</div>
<?php require_once __DIR__ . '/partials/footer.php'; ?>
