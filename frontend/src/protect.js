// protect.js
// Script untuk menonaktifkan klik kanan dan shortcut developer
// namun tetap mengizinkan seleksi dan copy teks (Ctrl+C).

document.addEventListener('DOMContentLoaded', () => {
    // 1. Nonaktifkan klik kanan (Context Menu)
    document.addEventListener('contextmenu', function (e) {
        e.preventDefault();
    });

    // 2. Nonaktifkan shortcut developer (F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U)
    document.addEventListener('keydown', function (e) {
        // F12
        if (e.key === 'F12') {
            e.preventDefault();
        }
        // Ctrl + Shift + I / J / C
        if (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'i' || e.key === 'J' || e.key === 'j' || e.key === 'C' || e.key === 'c')) {
            e.preventDefault();
        }
        // Ctrl + U (View Source)
        if (e.ctrlKey && (e.key === 'U' || e.key === 'u')) {
            e.preventDefault();
        }
    });

    // 3. Mencegah drag-and-drop gambar (agar gambar tidak bisa langsung di-save dengan di-drag)
    document.addEventListener('dragstart', function(e) {
        if (e.target.tagName.toLowerCase() === 'img') {
            e.preventDefault();
        }
    });
});
