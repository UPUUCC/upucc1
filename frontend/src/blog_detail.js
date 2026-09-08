import { db } from "./firebase.js";
import { doc, getDoc } from "firebase/firestore";

const blogDetailContainer = document.getElementById('blogDetailContainer');

async function loadBlogDetail() {
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');

    if (!id) {
        blogDetailContainer.innerHTML = `
            <div class="alert alert-danger text-center">
                Artikel tidak ditemukan. <a href="/blog.html">Kembali ke Blog</a>
            </div>
        `;
        return;
    }

    try {
        const docRef = doc(db, "blogs", id);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
            blogDetailContainer.innerHTML = `
                <div class="alert alert-warning text-center">
                    Artikel tidak ada atau telah dihapus. <a href="/blog.html">Kembali ke Blog</a>
                </div>
            `;
            return;
        }

        const data = docSnap.data();
        
        // Hide if not published
        if (data.status === 'pending') {
            blogDetailContainer.innerHTML = `
                <div class="alert alert-warning text-center">
                    Artikel ini masih menunggu persetujuan admin. <a href="/blog.html">Kembali ke Blog</a>
                </div>
            `;
            return;
        }

        const date = data.createdAt ? data.createdAt.toDate().toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'}) : '-';
        
        // Fungsi untuk mendeteksi link dan membuatnya bisa diklik
        const linkify = (text) => {
            const urlRegex = /(https?:\/\/[^\s]+)|(www\.[^\s]+)/ig;
            return text.replace(urlRegex, function(url) {
                let href = url.startsWith('http') ? url : 'https://' + url;
                return `<a href="${href}" target="_blank" class="text-primary fw-medium" style="text-decoration: underline;">${url}</a>`;
            });
        };

        // Mempercantik paragraf dan spasi
        let isi = data.isi || '';
        // Bungkus setiap blok teks yang dipisah enter ganda menjadi paragraf
        const fullText = isi.split(/\n\s*\n/).map(p => 
            `<p style="margin-bottom: 1.2rem;">${linkify(p).replace(/\n/g, '<br>')}</p>`
        ).join('');
        
        const author = data.author || 'Admin UPUCC';

        blogDetailContainer.innerHTML = `
            <div class="mb-4">
                <div class="mb-4">
                    <a href="/blog.html" class="btn btn-outline-secondary btn-sm">
                        <i class="bi bi-arrow-left"></i> Kembali ke Blog
                    </a>
                </div>
                <div class="mb-2">
                    <span class="badge bg-primary px-3 py-2 rounded-pill shadow-sm">${data.kategori}</span>
                </div>
                <h1 class="fw-bold mb-3" style="color: #0f172a; font-size: 2.2rem; line-height: 1.3;">${data.judul}</h1>
                <div class="d-flex align-items-center text-secondary mb-4 gap-3 fw-medium">
                    <span><i class="bi bi-person-circle me-1 text-primary"></i> ${author}</span>
                    <span><i class="bi bi-calendar3 me-1 text-primary"></i> ${date}</span>
                </div>
            </div>
            
            <div class="rounded-4 overflow-hidden mb-5 shadow-sm bg-light">
                <img src="${data.gambar}" class="img-fluid w-100" style="max-height: 450px; object-fit: cover;" alt="${data.judul}">
            </div>
            
            <div class="blog-content" style="font-size: 1.15rem; text-align: justify; line-height: 1.7; color: #334155; letter-spacing: 0.2px;">
                ${fullText}
            </div>
        `;
        
        // Update Title
        document.title = `${data.judul} - UPU-CC Tech Blog`;

    } catch (error) {
        console.error("Error fetching blog detail: ", error);
        blogDetailContainer.innerHTML = `
            <div class="alert alert-danger text-center">
                Gagal memuat artikel. Silakan coba lagi.
            </div>
        `;
    }
}

document.addEventListener('DOMContentLoaded', loadBlogDetail);

