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
        const fullText = data.isi ? data.isi.replace(/\n/g, '<br>') : '';
        const author = data.author || 'Admin UPUCC';

        blogDetailContainer.innerHTML = `
            <div class="mb-4">
                <a href="/blog.html" class="btn btn-outline-secondary btn-sm mb-3">
                    <i class="bi bi-arrow-left"></i> Kembali ke Blog
                </a>
                <span class="badge bg-primary mb-2 px-3 py-2 rounded-pill d-inline-block">${data.kategori}</span>
                <h1 class="fw-bold mb-3" style="color: #1e293b;">${data.judul}</h1>
                <div class="d-flex align-items-center text-muted mb-4 gap-3">
                    <span><i class="bi bi-person-circle me-1"></i> ${author}</span>
                    <span><i class="bi bi-calendar3 me-1"></i> ${date}</span>
                </div>
            </div>
            
            <img src="${data.gambar}" class="img-fluid rounded-4 mb-5 shadow-sm w-100" style="max-height: 400px; object-fit: cover; background-color: #f8f9fa;" alt="${data.judul}">
            
            <div class="blog-content" style="font-size: 1.1rem; line-height: 1.8; color: #334155;">
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
