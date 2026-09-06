const fs = require('fs');
const dir = 'frontend';
fs.readdirSync(dir).forEach(file => {
    if(file.endsWith('.html')) {
        let path = dir + '/' + file;
        let content = fs.readFileSync(path, 'utf8');
        content = content.replace(
            /<p class="mb-0 small" style="color: #94a3b8;">&copy; <span id="footerYear"><\/span> UPU-CC\. All Rights Reserved\.<\/p>/g,
            '<p class="mb-0 small" style="color: #94a3b8;">&copy; <span id="footerYear"></span> UPU-CC - All Rights Reserved.</p>'
        );
        fs.writeFileSync(path, content);
        console.log('Updated copyright in', file);
    }
});
