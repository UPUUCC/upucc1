const fs = require('fs');
const dir = 'frontend/dashboard';
fs.readdirSync(dir).forEach(file => {
    if(file.endsWith('.html') && file !== 'saran.html') {
        let path = dir + '/' + file;
        let content = fs.readFileSync(path, 'utf8');
        // Add Kotak Saran menu if not exists
        if (!content.includes('dashboard/saran.html')) {
            content = content.replace(
                /<li class="nav-item mt-4"><a class="nav-link text-danger" href="\/dashboard\/logout\.html">/,
                '<li class="nav-item"><a class="nav-link" href="/dashboard/saran.html"><i class="bi bi-chat-left-heart"></i> Kotak Saran</a></li>\n      <li class="nav-item mt-4"><a class="nav-link text-danger" href="/dashboard/logout.html">'
            );
            fs.writeFileSync(path, content);
            console.log('Updated sidebar in', file);
        }
    }
});
