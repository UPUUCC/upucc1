<?php
$pageTitle = 'Absensi Online';
$activeMenu = 'absensi';
require_once __DIR__ . '/partials/header.php';

$divisions = $pdo->query("SELECT * FROM divisions ORDER BY id ASC")->fetchAll();
$today = date('Y-m-d');
$tanggal = $_GET['tanggal'] ?? $today;

$isPengurusInti = portal_is_pengurus_inti();          // ketum, waketum
$isDivisiEditor = in_array(portal_role(), ['kadiv', 'wakadiv']);
$isSekretaris   = portal_role() === 'sekretaris';
$isAbsenExempt  = portal_is_absen_exempt();            // ketum, waketum, kadiv, wakadiv -> tidak absen sendiri
$canMonitor     = portal_can_monitor_absensi();         // ketum, waketum, kadiv, wakadiv, sekretaris
$canExportExcel = portal_can_export_absensi();          // ketum, waketum, kadiv, wakadiv, sekretaris

// ==============================
// ABSEN DIRI SENDIRI (anggota, bendahara, sekretaris -- BUKAN ketum/waketum/kadiv/wakadiv)
// ==============================
if ($_SERVER['REQUEST_METHOD'] === 'POST' && ($_POST['action'] ?? '') === 'self_absen') {
    portal_require(function() { return !portal_is_absen_exempt(); });

    $cek = $pdo->prepare("SELECT approval_status FROM absensi WHERE member_id=? AND tanggal=?");
    $cek->execute([$_SESSION['member_id'], $today]);
    $existingStatus = $cek->fetchColumn();

    if ($existingStatus && $existingStatus !== 'ditolak') {
        set_flash('danger', 'Anda sudah melakukan absensi hari ini.');
        redirect('absensi.php');
    }

    $status = $_POST['status'];
    $ket = trim($_POST['keterangan'] ?? '');
    $autoApprove = portal_self_absen_auto_approve();
    $approvalStatus = $autoApprove ? 'disetujui' : 'menunggu';
    $approvedBy = $autoApprove ? $_SESSION['member_id'] : null;
    $approvedAt = $autoApprove ? date('Y-m-d H:i:s') : null;

    $stmt = $pdo->prepare("INSERT INTO absensi (member_id, divisi_id, tanggal, status, keterangan, input_by, approval_status, approved_by, approved_at, catatan_approval)
                            VALUES (?,?,?,?,?,?,?,?,?,NULL)
                            ON DUPLICATE KEY UPDATE status=VALUES(status), keterangan=VALUES(keterangan),
                                approval_status=VALUES(approval_status), approved_by=VALUES(approved_by),
                                approved_at=VALUES(approved_at), catatan_approval=NULL");
    $stmt->execute([$_SESSION['member_id'], portal_divisi_id(), $today, $status, $ket, $_SESSION['member_id'], $approvalStatus, $approvedBy, $approvedAt]);

    set_flash('success', $autoApprove
        ? 'Absensi Anda hari ini berhasil dicatat.'
        : 'Absensi Anda telah dikirim dan sedang menunggu persetujuan dari pengurus divisi Anda.');
    redirect('absensi.php');
}

// ==============================
// SIMPAN ABSENSI MASSAL (kadiv/wakadiv/ketum/waketum) - input resmi, otomatis disetujui
// ==============================
if ($_SERVER['REQUEST_METHOD'] === 'POST' && ($_POST['action'] ?? '') === 'save_bulk') {
    $divisiId = (int)$_POST['divisi_id'];
    $tglInput = $_POST['tanggal'];
    portal_require(function() use ($divisiId) { return portal_can_edit_absensi_others($divisiId); });

    if (!empty($_POST['status']) && is_array($_POST['status'])) {
        foreach ($_POST['status'] as $memberId => $status) {
            $ket = trim($_POST['keterangan'][$memberId] ?? '');
            $stmt = $pdo->prepare("INSERT INTO absensi (member_id, divisi_id, tanggal, status, keterangan, input_by, approval_status, approved_by, approved_at, catatan_approval)
                                    VALUES (?,?,?,?,?,?,'disetujui',?,NOW(),NULL)
                                    ON DUPLICATE KEY UPDATE status=VALUES(status), keterangan=VALUES(keterangan), divisi_id=VALUES(divisi_id),
                                        input_by=VALUES(input_by), approval_status='disetujui', approved_by=VALUES(approved_by), approved_at=NOW(), catatan_approval=NULL");
            $stmt->execute([(int)$memberId, $divisiId, $tglInput, $status, $ket, $_SESSION['member_id'], $_SESSION['member_id']]);
        }
    }
    set_flash('success', 'Absensi berhasil disimpan.');
    redirect('absensi.php?divisi=' . $divisiId . '&tanggal=' . $tglInput);
}

// ==============================
// DATA UNTUK WIDGET "ABSEN SAYA" (hanya untuk role yang tidak dikecualikan)
// ==============================
if (!$isAbsenExempt) {
    $stmtHariIni = $pdo->prepare("SELECT * FROM absensi WHERE member_id=? AND tanggal=?");
    $stmtHariIni->execute([$_SESSION['member_id'], $today]);
    $absenHariIni = $stmtHariIni->fetch();

    $riwayat = $pdo->prepare("SELECT * FROM absensi WHERE member_id=? ORDER BY tanggal DESC LIMIT 30");
    $riwayat->execute([$_SESSION['member_id']]);
    $riwayatList = $riwayat->fetchAll();
}
?>

<?php if ($isAbsenExempt): ?>
<div class="alert alert-info d-flex align-items-start gap-2 mb-4">
  <i class="bi bi-info-circle fs-5"></i>
  <div>
    Sebagai <b><?= e(label_role(portal_role())) ?></b>, Anda tidak perlu melakukan absensi untuk diri sendiri.
    Tugas Anda di halaman ini adalah <b>memantau</b> absensi anggota serta <b>menerima/menolak</b> pengajuan
    absensi mandiri lewat menu <a href="persetujuan_absensi.php">Kotak Pesan</a>.
  </div>
</div>
<?php else: ?>
<div class="card border-0 shadow-sm p-4 mb-4">
  <h5>Absen Saya Hari Ini (<?= tgl_indo($today) ?>)</h5>
  <?php if ($absenHariIni && $absenHariIni['approval_status'] !== 'ditolak'): ?>
    <p class="mb-1">Status kehadiran: <span class="badge bg-secondary text-uppercase"><?= e($absenHariIni['status']) ?></span></p>
    <p class="mb-0">Persetujuan: <span class="badge <?= badge_approval($absenHariIni['approval_status']) ?>"><?= e(label_approval($absenHariIni['approval_status'])) ?></span></p>
    <?php if ($absenHariIni['approval_status'] === 'menunggu'): ?>
      <p class="text-muted small mt-2 mb-0"><i class="bi bi-hourglass-split"></i> Pengajuan absensi Anda sedang menunggu diterima oleh pengurus divisi.</p>
    <?php else: ?>
      <p class="text-muted small mt-2 mb-0">Anda sudah melakukan absensi. Hubungi pengurus divisi jika ingin mengubah data.</p>
    <?php endif; ?>
  <?php else: ?>
    <?php if ($absenHariIni && $absenHariIni['approval_status'] === 'ditolak'): ?>
      <div class="alert alert-danger">
        <i class="bi bi-x-circle"></i> Pengajuan absensi Anda hari ini <b>ditolak</b> oleh pengurus divisi.
        <?php if ($absenHariIni['catatan_approval']): ?><br>Catatan: <?= e($absenHariIni['catatan_approval']) ?><?php endif; ?>
        <br>Silakan ajukan ulang di bawah ini jika diperlukan.
      </div>
    <?php endif; ?>
    <form method="POST" class="row g-3">
      <input type="hidden" name="action" value="self_absen">
      <div class="col-md-4">
        <label class="form-label">Status</label>
        <select name="status" class="form-select" required>
          <option value="hadir">Hadir</option>
          <option value="izin">Izin</option>
          <option value="sakit">Sakit</option>
        </select>
      </div>
      <div class="col-md-6">
        <label class="form-label">Keterangan (opsional)</label>
        <input type="text" name="keterangan" class="form-control">
      </div>
      <div class="col-md-2 d-flex align-items-end">
        <button class="btn btn-primary w-100"><i class="bi bi-check2"></i> Absen</button>
      </div>
      <?php if (!portal_self_absen_auto_approve()): ?>
        <div class="col-12"><p class="text-muted small mb-0"><i class="bi bi-info-circle"></i> Pengajuan absensi Anda akan masuk ke Kotak Pesan pengurus divisi dan tercatat resmi setelah disetujui.</p></div>
      <?php endif; ?>
    </form>
  <?php endif; ?>
</div>

<div class="card border-0 shadow-sm p-4 mb-4">
  <h5>Riwayat Absensi Saya</h5>
  <div class="table-responsive">
  <table class="table table-bordered align-middle">
    <thead class="table-light"><tr><th>Tanggal</th><th>Status</th><th>Keterangan</th><th>Persetujuan</th></tr></thead>
    <tbody>
    <?php foreach ($riwayatList as $r): ?>
      <tr>
        <td><?= tgl_indo($r['tanggal']) ?></td>
        <td><span class="badge bg-secondary text-uppercase"><?= e($r['status']) ?></span></td>
        <td><?= e($r['keterangan']) ?></td>
        <td>
          <span class="badge <?= badge_approval($r['approval_status']) ?>"><?= e(label_approval($r['approval_status'])) ?></span>
          <?php if ($r['approval_status'] === 'ditolak' && $r['catatan_approval']): ?>
            <div class="small text-muted">Catatan: <?= e($r['catatan_approval']) ?></div>
          <?php endif; ?>
        </td>
      </tr>
    <?php endforeach; ?>
    <?php if (!$riwayatList): ?><tr><td colspan="4" class="text-center text-muted">Belum ada riwayat.</td></tr><?php endif; ?>
    </tbody>
  </table>
  </div>
</div>
<?php endif; ?>

<?php if ($canMonitor): ?>
    <?php
    $isMultiDivisiView = $isPengurusInti || $isSekretaris; // bisa melihat & memilih semua divisi
    if ($isMultiDivisiView) {
        $divisiIdView = (int)($_GET['divisi'] ?? ($divisions[0]['id'] ?? 0));
    } else {
        $divisiIdView = (int)portal_divisi_id();
    }
    $canEditDivisiIni = portal_can_edit_absensi_others($divisiIdView);
    ?>
    <hr class="my-4">
    <h5 class="mb-3"><i class="bi bi-clipboard-data"></i> Monitor <?= $canEditDivisiIni ? '&amp; Kelola' : '' ?> Absensi Divisi</h5>

    <?php if ($isMultiDivisiView): ?>
    <ul class="nav nav-pills mb-3">
      <?php foreach ($divisions as $d): ?>
        <li class="nav-item">
          <a class="nav-link <?= $divisiIdView==$d['id']?'active':'' ?>" href="?divisi=<?= $d['id'] ?>&tanggal=<?= e($tanggal) ?>"><?= e($d['nama']) ?></a>
        </li>
      <?php endforeach; ?>
    </ul>
    <?php else: ?>
      <?php $namaDivisiSaya = array_values(array_filter($divisions, fn($d)=>$d['id']==$divisiIdView))[0]['nama'] ?? '-'; ?>
      <h6 class="mb-3">Divisi: <?= e($namaDivisiSaya) ?></h6>
    <?php endif; ?>

    <form method="GET" class="row g-2 mb-3 align-items-center">
      <?php if ($isMultiDivisiView): ?><input type="hidden" name="divisi" value="<?= $divisiIdView ?>"><?php endif; ?>
      <div class="col-auto">
        <input type="date" name="tanggal" class="form-control" value="<?= e($tanggal) ?>" onchange="this.form.submit()">
      </div>
      <?php if ($canExportExcel): ?>
      <div class="col-auto">
        <a class="btn btn-outline-success"
           href="export_absensi.php?divisi=<?= $divisiIdView ?>&dari=<?= e($tanggal) ?>&sampai=<?= e($tanggal) ?>">
          <i class="bi bi-file-earmark-excel"></i> Unduh Excel (tanggal ini)
        </a>
      </div>
      <div class="col-auto">
        <a class="btn btn-outline-success"
           href="export_absensi.php?divisi=<?= $divisiIdView ?>&dari=<?= date('Y-m-01', strtotime($tanggal)) ?>&sampai=<?= date('Y-m-t', strtotime($tanggal)) ?>">
          <i class="bi bi-file-earmark-excel"></i> Unduh Excel (1 bulan ini)
        </a>
      </div>
      <?php endif; ?>
    </form>

    <?php
    $stmtMembers = $pdo->prepare("SELECT * FROM members WHERE divisi_id = ? AND status='aktif' ORDER BY urutan ASC, nama ASC");
    $stmtMembers->execute([$divisiIdView]);
    $membersList = $stmtMembers->fetchAll();

    $stmtAbsenExisting = $pdo->prepare("SELECT member_id, status, keterangan, approval_status FROM absensi WHERE divisi_id=? AND tanggal=?");
    $stmtAbsenExisting->execute([$divisiIdView, $tanggal]);
    $existing = [];
    foreach ($stmtAbsenExisting->fetchAll() as $row) { $existing[$row['member_id']] = $row; }
    ?>

    <div class="card border-0 shadow-sm p-4">
      <h5>Absensi Tanggal <?= tgl_indo($tanggal) ?></h5>
      <?php if ($canEditDivisiIni): ?>
      <p class="text-muted small">Mengisi &amp; menyimpan di sini akan langsung tercatat resmi (otomatis disetujui). Pengajuan mandiri dari anggota ada di menu <a href="persetujuan_absensi.php">Kotak Pesan</a>.</p>
      <?php else: ?>
      <p class="text-muted small"><i class="bi bi-eye"></i> Anda hanya dapat memantau data absensi di sini (tidak dapat mengubah).</p>
      <?php endif; ?>
      <form method="POST">
        <input type="hidden" name="action" value="save_bulk">
        <input type="hidden" name="divisi_id" value="<?= $divisiIdView ?>">
        <input type="hidden" name="tanggal" value="<?= e($tanggal) ?>">
        <div class="table-responsive">
        <table class="table table-bordered align-middle">
          <thead class="table-light"><tr><th>Nama</th><th style="width:180px;">Status</th><th>Keterangan</th><th style="width:150px;">Persetujuan</th></tr></thead>
          <tbody>
          <?php foreach ($membersList as $m): $ex = $existing[$m['id']] ?? null; ?>
            <tr>
              <td><?= e($m['nama']) ?> <span class="text-muted small">(<?= e($m['jabatan_text'] ?: label_role($m['role'])) ?>)</span></td>
              <td>
                <?php if ($canEditDivisiIni): ?>
                <select name="status[<?= $m['id'] ?>]" class="form-select form-select-sm">
                  <?php foreach (['hadir','izin','sakit','alpa'] as $st): ?>
                    <option value="<?= $st ?>" <?= ($ex && $ex['status']===$st)?'selected':'' ?>><?= ucfirst($st) ?></option>
                  <?php endforeach; ?>
                </select>
                <?php else: ?>
                  <?php if ($ex): ?><span class="badge bg-secondary text-uppercase"><?= e($ex['status']) ?></span><?php else: ?><span class="text-muted small">-</span><?php endif; ?>
                <?php endif; ?>
              </td>
              <td>
                <?php if ($canEditDivisiIni): ?>
                <input type="text" name="keterangan[<?= $m['id'] ?>]" class="form-control form-control-sm" value="<?= e($ex['keterangan'] ?? '') ?>">
                <?php else: ?>
                  <?= e($ex['keterangan'] ?? '-') ?>
                <?php endif; ?>
              </td>
              <td><?php if ($ex): ?><span class="badge <?= badge_approval($ex['approval_status']) ?>"><?= e(label_approval($ex['approval_status'])) ?></span><?php else: ?><span class="text-muted small">Belum absen</span><?php endif; ?></td>
            </tr>
          <?php endforeach; ?>
          <?php if (!$membersList): ?><tr><td colspan="4" class="text-center text-muted">Belum ada anggota di divisi ini.</td></tr><?php endif; ?>
          </tbody>
        </table>
        </div>
        <?php if ($membersList && $canEditDivisiIni): ?><button class="btn btn-primary"><i class="bi bi-save"></i> Simpan Absensi</button><?php endif; ?>
      </form>
    </div>
<?php endif; ?>

<?php require_once __DIR__ . '/partials/footer.php'; ?>
