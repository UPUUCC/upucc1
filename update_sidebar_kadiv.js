const fs = require('fs');
const path = require('path');

const dir = 'd:/upucc/upucc3/frontend/dashboard';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'));

const target1 = '<li class="nav-item"><a class="nav-link active" href="/dashboard/index.html"><i class="bi bi-speedometer2"></i> Dashboard</a></li>';
const replacement1 = target1 + '\n      <li class="nav-item"><a class="nav-link" href="/dashboard/kadiv_panel.html"><i class="bi bi-briefcase"></i> Panel Divisi</a></li>';

const target2 = '<li class="nav-item"><a class="nav-link" href="/dashboard/index.html"><i class="bi bi-speedometer2"></i> Dashboard</a></li>';
const replacement2 = target2 + '\n      <li class="nav-item"><a class="nav-link" href="/dashboard/kadiv_panel.html"><i class="bi bi-briefcase"></i> Panel Divisi</a></li>';


files.forEach(f => {
  if (f === 'kadiv_panel.html') return; // skip the one we just created
  const filePath = path.join(dir, f);
  let content = fs.readFileSync(filePath, 'utf8');
  
  if (!content.includes('href="/dashboard/kadiv_panel.html"')) {
      if (content.includes(target1)) {
          content = content.replace(target1, replacement1);
          fs.writeFileSync(filePath, content, 'utf8');
          console.log('Updated ' + f);
      } else if (content.includes(target2)) {
          content = content.replace(target2, replacement2);
          fs.writeFileSync(filePath, content, 'utf8');
          console.log('Updated ' + f);
      }
  }
});
