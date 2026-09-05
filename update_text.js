const fs = require('fs');
const path = require('path');

const dir = 'd:/upucc/upucc3/frontend';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'));

files.forEach(f => {
  const filePath = path.join(dir, f);
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;
  
  if (content.includes('UPUCC - Universitas Potensi Utama Computer Club')) {
    content = content.replace(/UPUCC - Universitas Potensi Utama Computer Club/g, 'UPU-CC - Universitas Potensi Utama Computer Club');
    changed = true;
  }
  
  if (content.includes('> UPUCC\n    </a>')) {
    content = content.replace(/> UPUCC\n    <\/a>/g, '> UPU-CC\n    </a>');
    changed = true;
  }
  if (content.includes('> UPUCC</a>')) {
    content = content.replace(/> UPUCC<\/a>/g, '> UPU-CC</a>');
    changed = true;
  }
  
  if (changed) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Updated UPU-CC text in ' + f);
  }
});
