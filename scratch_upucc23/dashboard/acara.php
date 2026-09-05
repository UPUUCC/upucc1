<?php
$pageTitle = 'Acara';
$activeMenu = 'acara';
require_once __DIR__ . '/partials/header.php';

$uploadDir = __DIR__ . '/../uploads/acara';

// TAMBAH ACARA + MULTI FOTO
if ($_SERVER['REQUEST_METHOD'] === 'POST' && ($_POST['action'] ?? '') === 'add') {
    try {
        $judul = trim($_POST['judul']);
        $deskripsi = trim($_POST['deskripsi']);
        if ($judul === '') throw new Exception('Judul wajib diisi.');

        $pdo->beginTransaction();
        $stmt = $pdo->prepare("INSERT INTO acara (judul, deskripsi) VALUES (?,?)");
        $stmt->execute([$judul, $deskripsi]);
        $acaraId = $pdo->lastInsertId();

        if (!empty($_FILES['fotos']['name'][0])) {
            $count = count($_FILES['fotos']['name']);
            for ($i = 0; $i < $count; $i++) {
                if ($_FILES['fotos']['error'][$i] !== UPLOAD_ERR_OK) continue;
                $tmpFile = ['name'=>$_FILES['fotos']['name'][$i],'type'=>$_FILES['fotos']['type'][$i],'tmp_name'=>$_FILES['fotos']['tmp_name'][$i],'error'=>$_FILES['fotos']['error'][$i],'size'=>$_FILES['fotos']['size'][$i]];
                $_FILES['single_tmp'] = $tmpFile;
                $file = upload_gambar('single_tmp', $uploadDir, 'acara');
                if ($file) {
                    $pdo->prepare("INSERT INTO acara_foto (acara_id, foto, urutan) VALUES (?,?,?)")->execute([$acaraId, $file, $i]);
                }
            }
        }
        $pdo->commit();
        set_flash('success', 'Postingan acara berhasil ditambahkan.');
    } catch (Exception $e) {
        if ($pdo->inTransaction()) $pdo->rollBack();
        set_flash('danger', $e->getMessage());
    }
    redirect('acara.php');
}

// TAMBAH FOTO KE ACARA YANG SUDAH ADA
if ($_SERVER['REQUEST_METHOD'] === 'POST' && ($_POST['action'] ?? '') === 'add_foto') {
    try {
        $acaraId = (int)$_POST['acara_id'];
        if (!empty($_FILES['fotos']['name'][0])) {
            $count = count($_FILES['fotos']['name']);
            for ($i = 0; $i < $count; $i++) {
                if ($_FILES['fotos']['error'][$i] !== UPLOAD_ERR_OK) continue;
                $tmpFile = ['name'=>$_FILES['fotos']['name'][$i],'type'=>$_FILES['fotos']['type'][$i],'tmp_name'=>$_FILES['fotos']['tmp_name'][$i],'error'=>$_FILES['fotos']['error'][$i],'size'=>$_FILES['fotos']['size'][$i]];
                $_FILES['single_tmp'] = $tmpFile;
                $file = upload_gambar('single_tmp', $uploadDir, 'acara');
                if ($file) {
                    $pdo->prepare("INSERT INTO acara_foto (acara_id, foto) VALUES (?,?)")->execute([$acaraId, $file]);
                }
            }
        }
        set_flash('success', 'Foto berhasil ditambahkan.');
    } catch (Exception $e) {
        set_flash('danger', $e->getMessage());
    }
    redirect('acara.php');
}

// EDIT TEKS ACARA
if ($_SERVER['REQUEST_METHOD'] === 'POST' && ($_POST['action'] ?? '') === 'edit') {
    $id = (int)$_POST['id'];
    $pdo->prepare("UPDATE acara SET judul=?, deskripsi=? WHERE id=?")->execute([trim($_POST['judul']), trim($_POST['deskripsi']), $id]);
    set_flash('success', 'Postingan berhasil diperbarui.');
    redirect('acara.php');
}

// HAPUS SATU FOTO
if (isset($_GET['hapus_foto'])) {
    $fid = (int)$_GET['hapus_foto'];
    $stmt = $pdo->prepare("SELECT * FROM acara_foto WHERE id=?");
    $stmt->execute([$fid]);
    $f = $stmt->fetch();
    if ($f) {
        hapus_gambar($uploadDir, $f['foto']);
        $pdo->prepare("DELETE FROM acara_foto WHERE id=?")->execute([$fid]);
        set_flash('success', 'Foto dihapus.');
    }
    redirect('acara.php');
}

// HAPUS ACARA (beserta semua fotonya)
if (isset($_GET['hapus'])) {
    $id = (int)$_GET['hapus'];
    $stmt = $pdo->prepare("SELECT * FROM acara_foto WHERE acara_id=?");
    $stmt->execute([$id]);
    foreach ($stmt->fetchAll() as $f) hapus_gambar($uploadDir, $f['foto']);
    $pdo->prepare("DELETE FROM acara WHERE id=?")->execute([$id]);
    set_flash('success', 'Postingan acara berhasil dihapus.');
    redirect('acara.php');
}

$acaraList = $pdo->query("SELECT * FROM acara ORDER BY created_at DESC, id DESC")->fetchAll();
$stmtFoto = $pdo->prepare("SELECT * FROM acara_foto WHERE acara_id=? ORDER BY urutan ASC, id ASC");
?>

<div class="card border-0 shadow-sm p-4 mb-4">
  <h5>Tambah Postingan Acara Baru</h5>
  <form method="POST" enctype="multipart/form-data">
    <input type="hidden" name="action" value="add">
    <div class="mb-3"><label class="form-label">Judul *</label><input type="text" name="judul" class="form-control" required></div>
    <div class="mb-3"><label class="form-label">Deskripsi</label><textarea name="deskripsi" class="form-control" rows="3"></textarea></div>
    <div class="mb-3"><label class="form-label">Foto (bisa pilih beberapa sekaligus, seperti Instagram)</label>
      <input type="file" name="fotos[]" class="form-control" accept="image/*" multiple>
    </div>
    <button class="btn btn-primary"><i class="bi bi-plus"></i> Posting</button>
  </form>
</div>

<?php foreach ($acaraList as $a): $stmtFoto->execute([$a['id']]); $fotos = $stmtFoto->fetchAll(); ?>
<div class="card border-0 shadow-sm p-4 mb-3">
  <div class="d-flex justify-content-between">
    <h5><?= e($a['judul']) ?></h5>
    <div>
      <button class="btn btn-sm btn-outline-primary" data-bs-toggle="modal" data-bs-target="#editA<?= $a['id'] ?>"><i class="bi bi-pencil"></i> Edit Teks</button>
      <button class="btn btn-sm btn-outline-success" data-bs-toggle="modal" data-bs-target="#addFoto<?= $a['id'] ?>"><i class="bi bi-image"></i> Tambah Foto</button>
      <a href="?hapus=<?= $a['id'] ?>" class="btn btn-sm btn-outline-danger" onclick="return confirm('Hapus seluruh postingan ini beserta fotonya?')"><i class="bi bi-trash"></i> Hapus</a>
    </div>
  </div>
  <p class="text-muted small"><?= tgl_indo(date('Y-m-d', strtotime($a['created_at']))) ?></p>
  <p><?= nl2br(e($a['deskripsi'])) ?></p>
  <div class="d-flex flex-wrap gap-2">
    <?php foreach ($fotos as $f): ?>
    <div style="position:relative;">
      <img src="../uploads/acara/<?= e($f['foto']) ?>" style="width:100px;height:100px;object-fit:cover;border-radius:8px;">
      <a href="?hapus_foto=<?= $f['id'] ?>" onclick="return confirm('Hapus foto ini?')" class="btn btn-sm btn-danger" style="position:absolute;top:2px;right:2px;padding:0 6px;">&times;</a>
    </div>
    <?php endforeach; ?>
    <?php if (!$fotos): ?><p class="text-muted small">Belum ada foto.</p><?php endif; ?>
  </div>
</div>

<div class="modal fade" id="editA<?= $a['id'] ?>">
  <div class="modal-dialog"><div class="modal-content">
    <form method="POST">
      <input type="hidden" name="action" value="edit"><input type="hidden" name="id" value="<?= $a['id'] ?>">
      <div class="modal-header"><h5 class="modal-title">Edit Postingan</h5><button class="btn-close" data-bs-dismiss="modal"></button></div>
      <div class="modal-body">
        <div class="mb-2"><label class="form-label">Judul</label><input type="text" name="judul" class="form-control" value="<?= e($a['judul']) ?>" required></div>
        <div class="mb-2"><label class="form-label">Deskripsi</label><textarea name="deskripsi" class="form-control" rows="4"><?= e($a['deskripsi']) ?></textarea></div>
      </div>
      <div class="modal-footer"><button class="btn btn-primary">Simpan</button></div>
    </form>
  </div></div>
</div>

<div class="modal fade" id="addFoto<?= $a['id'] ?>">
  <div class="modal-dialog"><div class="modal-content">
    <form method="POST" enctype="multipart/form-data">
      <input type="hidden" name="action" value="add_foto"><input type="hidden" name="acara_id" value="<?= $a['id'] ?>">
      <div class="modal-header"><h5 class="modal-title">Tambah Foto</h5><button class="btn-close" data-bs-dismiss="modal"></button></div>
      <div class="modal-body">
        <input type="file" name="fotos[]" class="form-control" accept="image/*" multiple required>
      </div>
      <div class="modal-footer"><button class="btn btn-primary">Upload</button></div>
    </form>
  </div></div>
</div>
<?php endforeach; ?>

<?php require_once __DIR__ . '/partials/footer.php'; ?>
