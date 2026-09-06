const fs = require('fs');
const dir = 'frontend/dashboard';
fs.readdirSync(dir).forEach(file => {
    if(file.endsWith('.html') && file !== 'faq.html') {
        let path = dir + '/' + file;
        let content = fs.readFileSync(path, 'utf8');
        
        if(!content.includes('faq.html')) {
            content = content.replace(
                /<li class="nav-item"><a class="nav-link(.*?)href="\/dashboard\/saran\.html"><i class="bi bi-chat-left-heart"><\/i> Kotak Saran<\/a><\/li>/g,
                '<li class="nav-item"><a class="nav-link$1href="/dashboard/saran.html"><i class="bi bi-chat-left-heart"></i> Kotak Saran</a></li>\n      <li class="nav-item"><a class="nav-link" href="/dashboard/faq.html"><i class="bi bi-question-circle"></i> FAQ</a></li>'
            );
            fs.writeFileSync(path, content);
            console.log('Injected FAQ into sidebar of', file);
        }
    }
});
