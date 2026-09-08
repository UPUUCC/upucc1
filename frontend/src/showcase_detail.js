import { db } from "./firebase.js";
import { doc, getDoc } from "firebase/firestore";

const showcaseDetailContainer = document.getElementById('showcaseDetailContainer');

async function loadShowcaseDetail() {
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');

    if (!id) {
        showcaseDetailContainer.innerHTML = `
            <div class="alert alert-danger text-center">
                Karya tidak ditemukan. <a href="/showcase.html">Kembali ke Galeri</a>
            </div>
        `;
        return;
    }

    try {
        const docRef = doc(db, "showcase", id);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
            showcaseDetailContainer.innerHTML = `
                <div class="alert alert-warning text-center">
                    Karya tidak ada atau telah dihapus. <a href="/showcase.html">Kembali ke Galeri</a>
                </div>
            `;
            return;
        }

        const data = docSnap.data();
        const date = data.createdAt ? data.createdAt.toDate().toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'}) : '-';
        const fullDesc = data.deskripsi ? data.deskripsi.replace(/\n/g, '<br>') : '';
        const author = data.author || 'Anggota UPUCC';

        let mediaHTML = '';
        if (data.mediaUrl) {
            if (data.mediaUrl.match(/\.(jpeg|jpg|gif|png)$/i)) {
                mediaHTML = `<img src="${data.mediaUrl}" class="img-fluid rounded-4 shadow-sm w-100 mb-4" style="max-height: 500px; object-fit: contain; background-color: #0f172a;" alt="${data.judul}">`;
            } else if (data.mediaUrl.match(/\.(mp4|webm|ogg)$/i)) {
                mediaHTML = `
                    <video controls class="w-100 rounded-4 shadow-sm mb-4" style="max-height: 500px; background-color: #0f172a;">
                        <source src="${data.mediaUrl}" type="video/mp4">
                        Video format tidak didukung browser.
                    </video>`;
            } else {
                mediaHTML = `<img src="${data.mediaUrl}" class="img-fluid rounded-4 shadow-sm w-100 mb-4" style="max-height: 500px; object-fit: cover;" alt="${data.judul}">`;
            }
        }

        const repoHTML = data.repoUrl ? `
            <div class="mt-5 p-4 rounded-4" style="background: rgba(59, 130, 246, 0.1); border: 1px solid rgba(59, 130, 246, 0.2);">
                <h5 class="fw-bold mb-3 d-flex align-items-center"><i class="bi bi-github me-2"></i> Tautan Repositori / Demo</h5>
                <a href="${data.repoUrl}" target="_blank" class="btn btn-primary rounded-pill px-4">Buka Tautan <i class="bi bi-box-arrow-up-right ms-2"></i></a>
            </div>
        ` : '';

        showcaseDetailContainer.innerHTML = `
            <div class="mb-4">
                <a href="/showcase.html" class="btn btn-outline-light btn-sm mb-3">
                    <i class="bi bi-arrow-left"></i> Kembali ke Galeri
                </a>
                <span class="badge bg-primary mb-2 px-3 py-2 rounded-pill d-inline-block">${data.kategori}</span>
                <h1 class="fw-bold mb-3">${data.judul}</h1>
                <div class="d-flex align-items-center text-light opacity-75 mb-4 gap-3">
                    <span><i class="bi bi-person-circle me-1"></i> ${author}</span>
                    <span><i class="bi bi-calendar3 me-1"></i> ${date}</span>
                </div>
            </div>
            
            ${mediaHTML}
            
            <div class="showcase-content mt-4" style="font-size: 1.1rem; text-align: justify; line-height: 1.8; color: #cbd5e1;">
                <h4 class="fw-bold mb-3 text-white">Deskripsi Karya</h4>
                ${fullDesc}
            </div>

            ${repoHTML}
        `;
        
        document.title = `${data.judul} - UPU-CC Showcase`;

    } catch (error) {
        console.error("Error fetching showcase detail: ", error);
        showcaseDetailContainer.innerHTML = `
            <div class="alert alert-danger text-center">
                Gagal memuat detail karya. Silakan coba lagi.
            </div>
        `;
    }
}

document.addEventListener('DOMContentLoaded', loadShowcaseDetail);

