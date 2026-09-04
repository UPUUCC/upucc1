const fs = require('fs');
const path = require('path');

const baseDir = __dirname;
const frontendDir = path.join(baseDir, 'frontend');

// Common Headers & Footers HTML
const publicHeader = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>UPUCC - Universitas Potensi Utama Computer Club</title>
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
  <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.css" rel="stylesheet">
</head>
<body>
<nav class="navbar navbar-expand-lg navbar-dark sticky-top upucc-navbar">
  <div class="container">
    <a class="navbar-brand fw-bold" href="/">
      <i class="bi bi-cpu"></i> UPUCC
    </a>
    <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#mainNav">
      <span class="navbar-toggler-icon"></span>
    </button>
    <div class="collapse navbar-collapse" id="mainNav">
      <ul class="navbar-nav ms-auto">
        <li class="nav-item"><a class="nav-link" href="/">Beranda</a></li>
        <li class="nav-item dropdown">
          <a class="nav-link dropdown-toggle" href="#" data-bs-toggle="dropdown">Informasi</a>
          <ul class="dropdown-menu">
            <li><a class="dropdown-item" href="/informasi.html">Informasi UPUCC</a></li>
          </ul>
        </li>
        <li class="nav-item"><a class="nav-link" href="/prestasi.html">Prestasi</a></li>
        <li class="nav-item"><a class="nav-link" href="/struktur.html">Struktur Organisasi</a></li>
        <li class="nav-item"><a class="nav-link" href="/sejarah.html">Sejarah</a></li>
        <li class="nav-item"><a class="nav-link" href="/acara.html">Acara</a></li>
        <li class="nav-item"><a class="nav-link btn btn-sm btn-outline-light ms-lg-2 px-3" href="/login.html"><i class="bi bi-box-arrow-in-right"></i> Login</a></li>
      </ul>
    </div>
  </div>
</nav>
`;

const publicFooter = `
<footer class="upucc-footer text-light mt-5 py-4">
  <div class="container text-center">
    <p class="mb-1 fw-bold"><i class="bi bi-cpu"></i> UPUCC - Universitas Potensi Utama Computer Club</p>
    <p class="mb-1 small">Programming &bull; Net Sect &bull; Knowtech &bull; Multimedia</p>
    <p class="mb-0 small text-muted">&copy; UPUCC. All rights reserved.</p>
  </div>
</footer>
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
<script type="module" src="/src/main.js"></script>
</body>
</html>
`;

const dashboardHeader = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Dashboard Admin - UPUCC</title>
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
  <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.css" rel="stylesheet">
</head>
<body>
<div class="d-flex">
  <!-- Sidebar -->
  <div class="bg-dark text-white p-3 vh-100 position-fixed" style="width: 250px; overflow-y:auto;">
    <h4 class="mb-4">Admin UPUCC</h4>
    <ul class="nav flex-column">
      <li class="nav-item"><a class="nav-link text-white" href="/dashboard/index.html">Dashboard</a></li>
      <li class="nav-item"><a class="nav-link text-white" href="/dashboard/slider.html">Slider</a></li>
      <li class="nav-item"><a class="nav-link text-white" href="/dashboard/informasi.html">Informasi UPUCC</a></li>
      <li class="nav-item"><a class="nav-link text-white" href="/dashboard/divisi.html">Divisi</a></li>
      <li class="nav-item"><a class="nav-link text-white" href="/dashboard/prestasi.html">Prestasi</a></li>
      <li class="nav-item"><a class="nav-link text-white" href="/dashboard/struktur.html">Struktur</a></li>
      <li class="nav-item"><a class="nav-link text-white" href="/dashboard/sejarah.html">Sejarah</a></li>
      <li class="nav-item"><a class="nav-link text-white" href="/dashboard/acara.html">Acara</a></li>
      <li class="nav-item"><a class="nav-link text-white" href="/dashboard/anggota.html">Anggota</a></li>
      <li class="nav-item"><a class="nav-link text-white" href="/dashboard/pendaftaran.html">Pendaftaran</a></li>
      <li class="nav-item mt-4"><a class="nav-link text-danger" href="/dashboard/logout.html">Logout</a></li>
    </ul>
  </div>
  <!-- Main Content -->
  <div class="flex-grow-1 bg-light" style="margin-left: 250px; min-height: 100vh;">
    <div class="container-fluid p-4">
`;

const dashboardFooter = `
    </div>
  </div>
</div>
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>
`;

const portalHeader = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Portal Member - UPUCC</title>
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
  <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.css" rel="stylesheet">
</head>
<body class="bg-light">
<nav class="navbar navbar-expand-lg navbar-dark bg-primary sticky-top">
  <div class="container">
    <a class="navbar-brand" href="/portal/dashboard.html">Portal UPUCC</a>
    <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#portalNav">
      <span class="navbar-toggler-icon"></span>
    </button>
    <div class="collapse navbar-collapse" id="portalNav">
      <ul class="navbar-nav ms-auto">
        <li class="nav-item"><a class="nav-link" href="/portal/dashboard.html">Dashboard</a></li>
        <li class="nav-item"><a class="nav-link" href="/portal/absensi.html">Absensi</a></li>
        <li class="nav-item"><a class="nav-link" href="/portal/kas.html">Uang Kas</a></li>
        <li class="nav-item"><a class="nav-link" href="/portal/profil.html">Profil</a></li>
        <li class="nav-item"><a class="nav-link text-warning" href="/portal/logout.html">Logout</a></li>
      </ul>
    </div>
  </div>
</nav>
<div class="container mt-4">
`;

const portalFooter = `
</div>
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>
`;


function convertFile(filePath) {
  if (filePath.endsWith('database.php') || filePath.endsWith('functions.php') || filePath.includes('partials') || filePath.includes('includes') || filePath.endsWith('index.php')) {
    // skip these
    return;
  }

  let content = fs.readFileSync(filePath, 'utf-8');

  // Strip all PHP logic blocks: <?php ... ?>
  content = content.replace(/<\?php[\s\S]*?\?>/g, '');

  // Strip shorthand echoes: <?= ... ?>
  content = content.replace(/<\?=\s*(.*?)\s*\?>/g, (match, p1) => {
    return `<!-- Dynamic: ${p1} -->`;
  });

  // Determine section
  let header = publicHeader;
  let footer = publicFooter;
  let relPath = path.relative(baseDir, filePath);
  let outDir = frontendDir;

  if (relPath.startsWith('dashboard')) {
    header = dashboardHeader;
    footer = dashboardFooter;
    outDir = path.join(frontendDir, 'dashboard');
  } else if (relPath.startsWith('portal')) {
    header = portalHeader;
    footer = portalFooter;
    outDir = path.join(frontendDir, 'portal');
  }

  // Inject header & footer if they were in the original file
  // Often they are included via <?php include 'partials/header.php'; ?> which we just stripped.
  // We'll just wrap the content with our HTML headers.
  
  // Clean up excessive newlines
  content = content.replace(/\n\s*\n\s*\n/g, '\n\n');

  let finalContent = header + '\n' + content.trim() + '\n' + footer;

  // Create dir if not exists
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  let fileName = path.basename(filePath, '.php') + '.html';
  if (fileName === 'index.html' && relPath === 'index.php') {
    // Already did index.html in frontend manually. Skip root index.php
    return;
  }
  let outPath = path.join(outDir, fileName);
  fs.writeFileSync(outPath, finalContent);
  
  // Delete the original PHP file
  fs.unlinkSync(filePath);
  console.log('Converted:', filePath, '->', outPath);
}

function walkDir(dir) {
  let files = fs.readdirSync(dir);
  for (let file of files) {
    let fullPath = path.join(dir, file);
    if (fullPath.includes('node_modules') || fullPath.includes('frontend') || fullPath.includes('backend') || fullPath.includes('.git')) {
      continue;
    }
    if (fs.statSync(fullPath).isDirectory()) {
      walkDir(fullPath);
    } else if (fullPath.endsWith('.php')) {
      convertFile(fullPath);
    }
  }
}

walkDir(baseDir);

// Delete leftover PHP specific directories and files
['includes', 'partials', 'dashboard/partials', 'portal/partials', 'database.php', 'index.php'].forEach(f => {
  let p = path.join(baseDir, f);
  if (fs.existsSync(p)) {
    if (fs.statSync(p).isDirectory()) {
      fs.rmSync(p, { recursive: true, force: true });
    } else {
      fs.unlinkSync(p);
    }
  }
});
console.log('Cleanup completed.');
