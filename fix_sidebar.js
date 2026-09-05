const fs = require('fs');
const path = require('path');
const dir = path.join(__dirname, 'frontend/dashboard');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'));
files.forEach(f => {
  const fp = path.join(dir, f);
  let c = fs.readFileSync(fp, 'utf-8');
  c = c.replace(/<li class="nav-item"><a class="nav-link text-white" href="\/dashboard\/struktur\.html">Struktur<\/a><\/li>\s*/g, '');
  c = c.replace(/>Anggota<\/a><\/li>/g, '>Anggota & Struktur</a></li>');
  fs.writeFileSync(fp, c);
  console.log('Fixed ' + f);
});
