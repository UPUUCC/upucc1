const fs = require('fs');
const dir = 'frontend';
const newFooter = `<footer class="upucc-footer text-light mt-5">
  <div class="container">
    <div class="row g-4 justify-content-between align-items-center mb-4">
      <div class="col-md-6 text-center text-md-start">
        <h5 class="mb-2 fw-bold d-flex align-items-center justify-content-center justify-content-md-start">
          <img src="/logo.jpg" alt="Logo UPU-CC" height="36" class="me-3 rounded-circle footer-logo"> 
          UPU-CC
        </h5>
        <p class="mb-1 small text-light opacity-75">Universitas Potensi Utama Computer Club</p>
        <p class="mb-0 small text-light opacity-50">Programming &bull; Net Sect &bull; Knowtech &bull; Multimedia</p>
      </div>
      <div class="col-md-6 text-center text-md-end">
        <div class="social-icons">
          <a href="https://www.instagram.com/upucc.official/" target="_blank" aria-label="Instagram"><i class="bi bi-instagram"></i></a>
          <a href="https://www.youtube.com/@UPUCC" target="_blank" aria-label="YouTube"><i class="bi bi-youtube"></i></a>
          <a href="#" aria-label="Github"><i class="bi bi-github"></i></a>
        </div>
      </div>
    </div>
    <div class="row pt-3" style="border-top: 1px solid rgba(255,255,255,0.1);">
      <div class="col-12 text-center">
        <p class="mb-0 small" style="color: #94a3b8;">&copy; <span id="footerYear"></span> UPU-CC. All Rights Reserved.</p>
      </div>
    </div>
  </div>
</footer>`;

fs.readdirSync(dir).forEach(file => {
    if(file.endsWith('.html')) {
        let path = dir + '/' + file;
        let content = fs.readFileSync(path, 'utf8');
        content = content.replace(/<footer class="upucc-footer[\s\S]*?<\/footer>/, newFooter);
        fs.writeFileSync(path, content);
        console.log('Updated', file);
    }
});
