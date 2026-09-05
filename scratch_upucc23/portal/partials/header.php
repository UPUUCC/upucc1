<?php
require_once __DIR__ . '/../../database.php';
require_once __DIR__ . '/../../includes/functions.php';
require_once __DIR__ . '/../../includes/auth_portal.php';
portal_login_required();
$pdo = getDB();
$activeMenu = $activeMenu ?? '';

// Jumlah absensi yang menunggu persetujuan (untuk badge menu "Kotak Pesan")
$pendingApprovalCount = 0;
if (portal_is_pengurus_inti() || in_array(portal_role(), ['kadiv', 'wakadiv'])) {
    if (portal_is_pengurus_inti()) {
        $pendingApprovalCount = (int)$pdo->query("SELECT COUNT(*) c FROM absensi WHERE approval_status='menunggu'")->fetch()['c'];
    } else {
        $stmtPending = $pdo->prepare("SELECT COUNT(*) c FROM absensi WHERE approval_status='menunggu' AND divisi_id=?");
        $stmtPending->execute([portal_divisi_id()]);
        $pendingApprovalCount = (int)$stmtPending->fetch()['c'];
    }
}
?>
<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title><?= isset($pageTitle) ? e($pageTitle) . ' - Portal UPUCC' : 'Portal UPUCC' ?></title>
<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
<link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.css" rel="stylesheet">
<style>
body{background:#f1f4f8;}
.navbar-portal{background:linear-gradient(90deg,#0d2b4e,#1e6fd9);}
.navbar-portal .nav-link{color:#fff;font-weight:500;}
.navbar-portal .nav-link.active{color:#f2a900 !important;}
</style>
</head>
<body>
<nav class="navbar navbar-expand-lg navbar-portal">
  <div class="container">
    <a class="navbar-brand text-white fw-bold" href="dashboard.php"><i class="bi bi-person-badge"></i> Portal Anggota UPUCC</a>
    <button class="navbar-toggler" data-bs-toggle="collapse" data-bs-target="#pn"><span class="navbar-toggler-icon"></span></button>
    <div class="collapse navbar-collapse" id="pn">
      <ul class="navbar-nav ms-auto">
        <li class="nav-item"><a class="nav-link <?= $activeMenu==='dashboard'?'active':'' ?>" href="dashboard.php">Beranda</a></li>
        <li class="nav-item"><a class="nav-link <?= $activeMenu==='absensi'?'active':'' ?>" href="absensi.php">Absensi</a></li>
        <?php if (portal_is_pengurus_inti() || in_array(portal_role(), ['kadiv', 'wakadiv'])): ?>
        <li class="nav-item">
          <a class="nav-link <?= $activeMenu==='persetujuan'?'active':'' ?>" href="persetujuan_absensi.php">
            Kotak Pesan
            <?php if ($pendingApprovalCount > 0): ?><span class="badge rounded-pill bg-danger"><?= $pendingApprovalCount ?></span><?php endif; ?>
          </a>
        </li>
        <?php endif; ?>
        <?php if (portal_can_view_kas()): ?>
        <li class="nav-item"><a class="nav-link <?= $activeMenu==='kas'?'active':'' ?>" href="kas.php">Kas Organisasi</a></li>
        <?php endif; ?>
        <!-- Menu "Kelola Anggota" (registrasi/pembuatan akun) sengaja tidak ada di
             Portal untuk role manapun. Pembuatan akun anggota baru hanya lewat
             menu "Anggota / Struktur" di Dashboard CMS. -->
        <li class="nav-item"><a class="nav-link <?= $activeMenu==='profil'?'active':'' ?>" href="profil.php">Profil</a></li>
        <li class="nav-item"><a class="nav-link" href="../index.php" target="_blank"><i class="bi bi-box-arrow-up-right"></i> Lihat Website</a></li>
        <li class="nav-item"><a class="nav-link text-warning" href="logout.php"><i class="bi bi-box-arrow-left"></i> Logout</a></li>
      </ul>
    </div>
  </div>
</nav>
<div class="container my-4">
  <div class="d-flex justify-content-between align-items-center mb-3">
    <h4 class="mb-0"><?= isset($pageTitle) ? e($pageTitle) : '' ?></h4>
    <span class="badge bg-secondary"><?= e(label_role(portal_role())) ?> - <?= e($_SESSION['member_nama']) ?></span>
  </div>
  <?php render_flash(); ?>
