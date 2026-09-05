const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'frontend');
const htmlFiles = fs.readdirSync(dir).filter(f => f.endsWith('.html'));

const newFooter = `<footer class="upucc-footer text-light mt-5">
  <div class="container">
    <div class="row g-4 justify-content-between align-items-center">
      <div class="col-md-6 text-center text-md-start">
        <h5 class="mb-2 fw-bold d-flex align-items-center justify-content-center justify-content-md-start">
          <img src="/logo.jpg" alt="Logo UPU-CC" height="36" class="me-3 rounded-circle footer-logo"> 
          UPU-CC
        </h5>
        <p class="mb-1 small">Universitas Potensi Utama Computer Club</p>
        <p class="mb-0 small" style="color: #64748b;">Programming &bull; Net Sect &bull; Knowtech &bull; Multimedia</p>
      </div>
      <div class="col-md-6 text-center text-md-end">
        <div class="social-icons mb-3">
          <a href="#" aria-label="Instagram"><i class="bi bi-instagram"></i></a>
          <a href="#" aria-label="YouTube"><i class="bi bi-youtube"></i></a>
          <a href="#" aria-label="Github"><i class="bi bi-github"></i></a>
        </div>
        <p class="mb-0 small text-muted">&copy; <span id="footerYear">2026</span> UPUCC. All rights reserved.</p>
      </div>
    </div>
  </div>
</footer>`;

for (const file of htmlFiles) {
    const filePath = path.join(dir, file);
    let content = fs.readFileSync(filePath, 'utf-8');
    
    // Replace Footer
    content = content.replace(/<footer class="upucc-footer[\s\S]*?<\/footer>/, newFooter);
    
    // Add animate-on-load to common elements
    content = content.replace(/class="container my-5"/g, 'class="container my-5 animate-on-load delay-1"');
    content = content.replace(/class="container mt-5"/g, 'class="container mt-5 animate-on-load delay-1"');
    
    fs.writeFileSync(filePath, content);
    console.log('Updated:', file);
}
