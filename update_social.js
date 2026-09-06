const fs = require('fs');
const dir = 'frontend';
fs.readdirSync(dir).forEach(file => {
    if(file.endsWith('.html')) {
        let path = dir + '/' + file;
        let content = fs.readFileSync(path, 'utf8');
        content = content.replace(
            /<a href="#" aria-label="Instagram"><i class="bi bi-instagram"><\/i><\/a>\s*<a href="#" aria-label="YouTube"><i class="bi bi-youtube"><\/i><\/a>\s*<a href="#" aria-label="Github"><i class="bi bi-github"><\/i><\/a>/g,
            `<a href="https://www.instagram.com/upucc.official/" target="_blank" aria-label="Instagram"><i class="bi bi-instagram"></i></a>
          <a href="https://www.youtube.com/@upuccooficial" target="_blank" aria-label="YouTube"><i class="bi bi-youtube"></i></a>
          <a href="#" aria-label="Github"><i class="bi bi-github"></i></a>`
        );
        fs.writeFileSync(path, content);
        console.log('Updated', file);
    }
});
