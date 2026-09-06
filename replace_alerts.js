const fs = require('fs');
const path = require('path');

function replaceFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;
    
    // Check if Swal is needed
    if (!content.includes('alert(') && !content.includes('confirm(')) return;
    
    // Add import
    if (!content.includes('import Swal')) {
        content = 'import Swal from "sweetalert2";\n' + content;
    }
    
    // Replace alert('xxx') or alert(xxx) with Swal.fire(xxx)
    content = content.replace(/alert\((['"`].+?['"`])\);?/g, "Swal.fire({icon: 'info', title: 'Perhatian', text: $1})");
    content = content.replace(/alert\((.+?)\);?/g, "Swal.fire({icon: 'info', title: 'Perhatian', text: $1})");
    
    // Replace confirm
    content = content.replace(/if\s*\(\s*confirm\((['"`].+?['"`])\)\s*\)\s*\{/g, 
        "const confirmResult = await Swal.fire({title: $1, icon: 'warning', showCancelButton: true, confirmButtonText: 'Ya', cancelButtonText: 'Batal'});\n            if (confirmResult.isConfirmed) {");

    if (content !== original) {
        fs.writeFileSync(filePath, content);
        console.log('Updated:', filePath);
    }
}

const dir = 'frontend/src';
fs.readdirSync(dir).forEach(f => {
    if (f.endsWith('.js')) replaceFile(path.join(dir, f));
});
const dashDir = 'frontend/src/dashboard';
fs.readdirSync(dashDir).forEach(f => {
    if (f.endsWith('.js')) replaceFile(path.join(dashDir, f));
});
