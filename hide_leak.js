const fs = require('fs');
const path = require('path');

const dashboardDir = path.join(__dirname, 'frontend', 'dashboard');
const files = fs.readdirSync(dashboardDir);

const styleTag = `<style id="rbac-hide">.sidebar { opacity: 0; pointer-events: none; }</style>\n</head>`;

files.forEach(file => {
    if (file.endsWith('.html')) {
        const filePath = path.join(dashboardDir, file);
        let content = fs.readFileSync(filePath, 'utf8');
        
        // Remove existing if any
        content = content.replace(/<style id="rbac-hide">.*?<\/style>\s*<\/head>/s, '</head>');
        
        // Inject the style right before </head>
        content = content.replace('</head>', styleTag);
        
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Updated ${file}`);
    }
});
console.log('All HTML files updated successfully!');
