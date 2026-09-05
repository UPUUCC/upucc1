<?php
$pageTitle = 'Data Divisi';
$activeMenu = 'divisi';
require_once __DIR__ . '/partials/header.php';

$uploadDir = __DIR__ . '/../uploads/divisi';

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action']) && $_POST['action'] === 'edit') {
    try {
        $id = (int)$_POST['id'];
        $stmt = $pdo->prepare("SELECT * FROM divisions WHERE id=?");
        $stmt->execute([$id]);
        $old = $stmt->fetch();
        if (!$old) throw new Exception('Divisi tidak ditemukan.');

        $file = upload_gambar('logo', $uploadDir, 'logo');
        if ($file) {
            hapus_gambar($uploadDir, $old['logo']);
        } else {
            $file = $old['logo'];
        }

        $stmt = $pdo->prepare("UPDATE divisions SET nama=?, logo=?, deskripsi=?, sejarah=? WHERE id=?");
        $stmt->execute([trim($_POST['nama']), $file, trim($_POST['deskripsi']), trim($_POST['sejarah']), $id]);
        set_flash('success', 'Data divisi berhasil diperbarui.');
    } catch (Exception $e) {
        set_flash('danger', $e->getMessage());
    }
    redirect('divisi.php');
}

$divisions = $pdo->query("SELECT * FROM divisions ORDER BY id ASC")->fetchAll();
?>
<p class="text-muted">4 divisi bersifat tetap (Programming, Net Sect, Knowtech, Multimedia). Anda dapat mengedit logo dan deskripsinya di sini.</p>

<div class="row g-3">
  <?php foreach ($divisions as $d): ?>
  <div class="col-md-6">
    <div class="card border-0 shadow-sm p-4">
      <div class="d-flex gap-3 align-items-center mb-3">
        <img src="<?= $d['logo'] ? '../uploads/divisi/'.e($d['logo']) : 'https://via.placeholder.com/70?text='.e(substr($d['nama'],0,1)) ?>" style="width:70px;height:70px;object-fit:contain;">
        <h5 class="mb-0"><?= e($d['nama']) ?></h5>
      </div>
      <form method="POST" enctype="multipart/form-data">
        <input type="hidden" name="action" value="edit">
        <input type="hidden" name="id" value="<?= $d['id'] ?>">
        <div class="mb-2">
          <label class="form-label small">Nama Divisi</label>
          <input type="text" name="nama" class="form-control" value="<?= e($d['nama']) ?>" required>
        </div>
        <div class="mb-2">
          <label class="form-label small">Logo Divisi</label>
          <input type="file" name="logo" class="form-control" accept="image/*">
        </div>
        <div class="mb-2">
          <label class="form-label small">Deskripsi / Informasi Divisi</label>
          <textarea name="deskripsi" class="form-control" rows="3"><?= e($d['deskripsi']) ?></textarea>
        </div>
        <div class="mb-2">
          <label class="form-label small">Sejarah Singkat Divisi</label>
          <textarea name="sejarah" class="form-control" rows="3"><?= e($d['sejarah']) ?></textarea>
        </div>
        <button class="btn btn-sm btn-primary"><i class="bi bi-save"></i> Simpan</button>
      </form>
    </div>
  </div>
  <?php endforeach; ?>
</div>
<?php require_once __DIR__ . '/partials/footer.php'; ?>
