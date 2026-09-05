const fs = require('fs');
const path = require('path');

const dir = 'd:/upucc/upucc3/frontend';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'));
const targetRegex = /<i class="bi bi-cpu"><\/i>/g;
const replacement = '<img src="/logo.jpg" alt="Logo UPU-CC" height="30" class="me-2 rounded-circle">';

files.forEach(f => {
  const filePath = path.join(dir, f);
  let content = fs.readFileSync(filePath, 'utf8');
  if (content.match(targetRegex)) {
    content = content.replace(targetRegex, replacement);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Updated logo in ' + f);
  }
});
