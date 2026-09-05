<?php
$pageTitle = 'Kotak Pesan Absensi';
$activeMenu = 'persetujuan';
require_once __DIR__ . '/partials/header.php';

portal_require(function() {
    return portal_is_pengurus_inti() || in_array(portal_role(), ['kadiv', 'wakadiv']);
});

// ==============================
// TERIMA / TOLAK PENGAJUAN ABSENSI
// ==============================
if ($_SERVER['REQUEST_METHOD'] === 'POST' && in_array($_POST['action'] ?? '', ['approve', 'reject'])) {
    $id = (int)$_POST['id'];
    $stmt = $pdo->prepare("SELECT * FROM absensi WHERE id=?");
    $stmt->execute([$id]);
    $row = $stmt->fetch();

    if (!$row) {
        set_flash('danger', 'Data absensi tidak ditemukan.');
        redirect('persetujuan_absensi.php');
    }

    portal_require(function() use ($row) { return portal_can_approve_absensi($row['divisi_id']); });

    if ($row['approval_status'] !== 'menunggu') {
        set_flash('danger', 'Pengajuan ini sudah diproses sebelumnya.');
        redirect('persetujuan_absensi.php');
    }

    if ($_POST['action'] === 'approve') {
        $pdo->prepare("UPDATE absensi SET approval_status='disetujui', approved_by=?, approved_at=NOW(), catatan_approval=NULL WHERE id=?")
            ->execute([$_SESSION['member_id'], $id]);
        set_flash('success', 'Absensi berhasil diterima.');
    } else {
        $catatan = trim($_POST['catatan'] ?? '');
        $pdo->prepare("UPDATE absensi SET approval_status='ditolak', approved_by=?, approved_at=NOW(), catatan_approval=? WHERE id=?")
            ->execute([$_SESSION['member_id'], $catatan, $id]);
        set_flash('success', 'Absensi ditolak.');
    }
    redirect('persetujuan_absensi.php');
}

// ==============================
// DAFTAR PENGAJUAN YANG MENUNGGU
// ==============================
if (portal_is_pengurus_inti()) {
    $list = $pdo->query("SELECT a.*, m.nama, m.username, d.nama AS divisi_nama
                          FROM absensi a
                          JOIN members m ON m.id = a.member_id
                          LEFT JOIN divisions d ON d.id = a.divisi_id
                          WHERE a.approval_status = 'menunggu'
                          ORDER BY a.tanggal DESC, a.id DESC")->fetchAll();
} else {
    $stmt = $pdo->prepare("SELECT a.*, m.nama, m.username, d.nama AS divisi_nama
                            FROM absensi a
                            JOIN members m ON m.id = a.member_id
                            LEFT JOIN divisions d ON d.id = a.divisi_id
                            WHERE a.approval_status = 'menunggu' AND a.divisi_id = ?
                            ORDER BY a.tanggal DESC, a.id DESC");
    $stmt->execute([portal_divisi_id()]);
    $list = $stmt->fetchAll();
}

// Riwayat yang sudah diproses oleh siapapun yang bisa menyetujui pada scope ini (30 terbaru)
if (portal_is_pengurus_inti()) {
    $riwayat = $pdo->query("SELECT a.*, m.nama, d.nama AS divisi_nama
                             FROM absensi a
                             JOIN members m ON m.id = a.member_id
                             LEFT JOIN divisions d ON d.id = a.divisi_id
                             WHERE a.approval_status IN ('disetujui','ditolak') AND a.approved_by IS NOT NULL
                             ORDER BY a.approved_at DESC LIMIT 30")->fetchAll();
} else {
    $stmtR = $pdo->prepare("SELECT a.*, m.nama, d.nama AS divisi_nama
                             FROM absensi a
                             JOIN members m ON m.id = a.member_id
                             LEFT JOIN divisions d ON d.id = a.divisi_id
                             WHERE a.divisi_id = ? AND a.approval_status IN ('disetujui','ditolak') AND a.approved_by IS NOT NULL
                             ORDER BY a.approved_at DESC LIMIT 30");
    $stmtR->execute([portal_divisi_id()]);
    $riwayat = $stmtR->fetchAll();
}
?>

<p class="text-muted">Pengajuan absensi mandiri dari anggota <?= portal_is_pengurus_inti() ? 'seluruh divisi' : 'divisi Anda' ?> akan muncul di sini. Terima untuk mencatatnya secara resmi, atau tolak jika datanya tidak sesuai.</p>

<div class="card border-0 shadow-sm p-4 mb-4">
  <h5><i class="bi bi-inbox"></i> Menunggu Persetujuan (<?= count($list) ?>)</h5>
  <div class="table-responsive">
    <table class="table table-bordered align-middle">
      <thead class="table-light">
        <tr>
          <th>Nama</th>
          <?php if (portal_is_pengurus_inti()): ?><th>Divisi</th><?php endif; ?>
          <th>Tanggal</th>
          <th>Status</th>
          <th>Keterangan</th>
          <th style="width:220px;">Aksi</th>
        </tr>
      </thead>
      <tbody>
      <?php foreach ($list as $r): ?>
        <tr>
          <td><?= e($r['nama']) ?> <span class="text-muted small">(<?= e($r['username']) ?>)</span></td>
          <?php if (portal_is_pengurus_inti()): ?><td><?= e($r['divisi_nama'] ?? 'Tanpa Divisi') ?></td><?php endif; ?>
          <td><?= tgl_indo($r['tanggal']) ?></td>
          <td><span class="badge bg-secondary text-uppercase"><?= e($r['status']) ?></span></td>
          <td><?= e($r['keterangan']) ?: '-' ?></td>
          <td>
            <form method="POST" class="d-inline">
              <input type="hidden" name="action" value="approve">
              <input type="hidden" name="id" value="<?= $r['id'] ?>">
              <button class="btn btn-sm btn-success" onclick="return confirm('Terima absensi ini?')"><i class="bi bi-check2"></i> Terima</button>
            </form>
            <button class="btn btn-sm btn-outline-danger" data-bs-toggle="modal" data-bs-target="#tolak<?= $r['id'] ?>"><i class="bi bi-x"></i> Tolak</button>
          </td>
        </tr>
        <div class="modal fade" id="tolak<?= $r['id'] ?>">
          <div class="modal-dialog"><div class="modal-content">
            <form method="POST">
              <input type="hidden" name="action" value="reject">
              <input type="hidden" name="id" value="<?= $r['id'] ?>">
              <div class="modal-header"><h5 class="modal-title">Tolak Absensi <?= e($r['nama']) ?></h5><button class="btn-close" data-bs-dismiss="modal"></button></div>
              <div class="modal-body">
                <label class="form-label">Catatan (opsional, akan dilihat anggota)</label>
                <textarea name="catatan" class="form-control" rows="3" placeholder="Contoh: Silakan ajukan ulang dengan keterangan yang jelas."></textarea>
              </div>
              <div class="modal-footer"><button class="btn btn-danger">Tolak Absensi</button></div>
            </form>
          </div></div>
        </div>
      <?php endforeach; ?>
      <?php if (!$list): ?><tr><td colspan="<?= portal_is_pengurus_inti() ? 6 : 5 ?>" class="text-center text-muted">Tidak ada pengajuan yang menunggu.</td></tr><?php endif; ?>
      </tbody>
    </table>
  </div>
</div>

<div class="card border-0 shadow-sm p-4">
  <h5><i class="bi bi-clock-history"></i> Riwayat Persetujuan Terbaru</h5>
  <div class="table-responsive">
    <table class="table table-bordered align-middle">
      <thead class="table-light">
        <tr>
          <th>Nama</th>
          <?php if (portal_is_pengurus_inti()): ?><th>Divisi</th><?php endif; ?>
          <th>Tanggal</th>
          <th>Status</th>
          <th>Hasil</th>
          <th>Diproses</th>
        </tr>
      </thead>
      <tbody>
      <?php foreach ($riwayat as $r): ?>
        <tr>
          <td><?= e($r['nama']) ?></td>
          <?php if (portal_is_pengurus_inti()): ?><td><?= e($r['divisi_nama'] ?? 'Tanpa Divisi') ?></td><?php endif; ?>
          <td><?= tgl_indo($r['tanggal']) ?></td>
          <td><span class="badge bg-secondary text-uppercase"><?= e($r['status']) ?></span></td>
          <td><span class="badge <?= badge_approval($r['approval_status']) ?>"><?= e(label_approval($r['approval_status'])) ?></span></td>
          <td class="small text-muted"><?= $r['approved_at'] ? date('d-m-Y H:i', strtotime($r['approved_at'])) : '-' ?></td>
        </tr>
      <?php endforeach; ?>
      <?php if (!$riwayat): ?><tr><td colspan="<?= portal_is_pengurus_inti() ? 6 : 5 ?>" class="text-center text-muted">Belum ada riwayat.</td></tr><?php endif; ?>
      </tbody>
    </table>
  </div>
</div>

<?php require_once __DIR__ . '/partials/footer.php'; ?>
