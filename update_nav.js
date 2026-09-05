const fs = require('fs');
const glob = require('glob'); // wait, glob might not be installed, let's use fs.readdirSync
const path = require('path');

const dir = 'd:/upucc/upucc3/frontend';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.html') && f !== 'pendaftaran.html');
const target = '<li class="nav-item"><a class="nav-link btn btn-sm btn-outline-light ms-lg-2 px-3" href="/login.html">';
const replacement = '<li class="nav-item"><a class="nav-link" href="/pendaftaran.html">Pendaftaran</a></li>\n        ' + target;

files.forEach(f => {
  const filePath = path.join(dir, f);
  let content = fs.readFileSync(filePath, 'utf8');
  if (content.includes(target) && !content.includes('href="/pendaftaran.html"')) {
    content = content.replace(target, replacement);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Updated ' + f);
  }
});
