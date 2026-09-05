<?php
$pageTitle = 'Slider Beranda';
$activeMenu = 'slider';
require_once __DIR__ . '/partials/header.php';

$uploadDir = __DIR__ . '/../uploads/slider';

// TAMBAH
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action']) && $_POST['action'] === 'add') {
    try {
        $file = upload_gambar('gambar', $uploadDir, 'slider');
        if (!$file) throw new Exception('Gambar wajib diupload.');
        $stmt = $pdo->prepare("INSERT INTO sliders (gambar, judul, deskripsi, urutan) VALUES (?,?,?,?)");
        $stmt->execute([$file, trim($_POST['judul']), trim($_POST['deskripsi']), (int)$_POST['urutan']]);
        set_flash('success', 'Slider berhasil ditambahkan.');
    } catch (Exception $e) {
        set_flash('danger', $e->getMessage());
    }
    redirect('slider.php');
}

// EDIT
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action']) && $_POST['action'] === 'edit') {
    try {
        $id = (int)$_POST['id'];
        $stmt = $pdo->prepare("SELECT * FROM sliders WHERE id=?");
        $stmt->execute([$id]);
        $old = $stmt->fetch();
        if (!$old) throw new Exception('Data tidak ditemukan.');

        $file = upload_gambar('gambar', $uploadDir, 'slider');
        if ($file) {
            hapus_gambar($uploadDir, $old['gambar']);
        } else {
            $file = $old['gambar'];
        }
        $stmt = $pdo->prepare("UPDATE sliders SET gambar=?, judul=?, deskripsi=?, urutan=? WHERE id=?");
        $stmt->execute([$file, trim($_POST['judul']), trim($_POST['deskripsi']), (int)$_POST['urutan'], $id]);
        set_flash('success', 'Slider berhasil diperbarui.');
    } catch (Exception $e) {
        set_flash('danger', $e->getMessage());
    }
    redirect('slider.php');
}

// HAPUS
if (isset($_GET['hapus'])) {
    $id = (int)$_GET['hapus'];
    $stmt = $pdo->prepare("SELECT * FROM sliders WHERE id=?");
    $stmt->execute([$id]);
    $old = $stmt->fetch();
    if ($old) {
        hapus_gambar($uploadDir, $old['gambar']);
        $pdo->prepare("DELETE FROM sliders WHERE id=?")->execute([$id]);
        set_flash('success', 'Slider berhasil dihapus.');
    }
    redirect('slider.php');
}

$sliders = $pdo->query("SELECT * FROM sliders ORDER BY urutan ASC, id ASC")->fetchAll();
?>

<div class="card border-0 shadow-sm p-4 mb-4">
  <h5>Tambah Slider Baru</h5>
  <form method="POST" enctype="multipart/form-data" class="row g-3">
    <input type="hidden" name="action" value="add">
    <div class="col-md-4">
      <label class="form-label">Gambar *</label>
      <input type="file" name="gambar" class="form-control" required accept="image/*">
    </div>
    <div class="col-md-3">
      <label class="form-label">Judul</label>
      <input type="text" name="judul" class="form-control">
    </div>
    <div class="col-md-3">
      <label class="form-label">Deskripsi Singkat</label>
      <input type="text" name="deskripsi" class="form-control">
    </div>
    <div class="col-md-2">
      <label class="form-label">Urutan</label>
      <input type="number" name="urutan" class="form-control" value="0">
    </div>
    <div class="col-12">
      <button class="btn btn-primary"><i class="bi bi-plus"></i> Tambah Slider</button>
    </div>
  </form>
</div>

<div class="row g-3">
  <?php foreach ($sliders as $s): ?>
  <div class="col-md-4">
    <div class="card border-0 shadow-sm">
      <img src="../uploads/slider/<?= e($s['gambar']) ?>" class="card-img-top" style="height:160px;object-fit:cover;">
      <div class="card-body">
        <h6><?= e($s['judul'] ?: '(tanpa judul)') ?></h6>
        <p class="small text-muted"><?= e($s['deskripsi']) ?></p>
        <button class="btn btn-sm btn-outline-primary" data-bs-toggle="modal" data-bs-target="#edit<?= $s['id'] ?>"><i class="bi bi-pencil"></i> Edit</button>
        <a href="?hapus=<?= $s['id'] ?>" class="btn btn-sm btn-outline-danger" onclick="return confirm('Hapus slider ini?')"><i class="bi bi-trash"></i> Hapus</a>
      </div>
    </div>
  </div>

  <div class="modal fade" id="edit<?= $s['id'] ?>">
    <div class="modal-dialog">
      <div class="modal-content">
        <form method="POST" enctype="multipart/form-data">
          <input type="hidden" name="action" value="edit">
          <input type="hidden" name="id" value="<?= $s['id'] ?>">
          <div class="modal-header"><h5 class="modal-title">Edit Slider</h5><button type="button" class="btn-close" data-bs-dismiss="modal"></button></div>
          <div class="modal-body">
            <div class="mb-3"><label class="form-label">Ganti Gambar (kosongkan jika tidak ganti)</label><input type="file" name="gambar" class="form-control" accept="image/*"></div>
            <div class="mb-3"><label class="form-label">Judul</label><input type="text" name="judul" class="form-control" value="<?= e($s['judul']) ?>"></div>
            <div class="mb-3"><label class="form-label">Deskripsi</label><input type="text" name="deskripsi" class="form-control" value="<?= e($s['deskripsi']) ?>"></div>
            <div class="mb-3"><label class="form-label">Urutan</label><input type="number" name="urutan" class="form-control" value="<?= $s['urutan'] ?>"></div>
          </div>
          <div class="modal-footer"><button class="btn btn-primary">Simpan</button></div>
        </form>
      </div>
    </div>
  </div>
  <?php endforeach; ?>
</div>

<?php require_once __DIR__ . '/partials/footer.php'; ?>
