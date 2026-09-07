import { db } from "./firebase.js";
import { collection, getDocs, query, orderBy } from "firebase/firestore";

const blogContainer = document.getElementById('blogContainer');

async function fetchBlogs() {
    try {
        const q = query(collection(db, "blogs"), orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);
        
        blogContainer.innerHTML = ''; // clear loading
        
        if (snapshot.empty) {
            blogContainer.innerHTML = '<div class="col-12 text-center text-muted py-5">Belum ada artikel.</div>';
            return;
        }

        let cardsHTML = '';
        let modalsHTML = '';

        snapshot.forEach(docSnap => {
            const data = docSnap.data();
            const id = docSnap.id;
            const date = data.createdAt ? data.createdAt.toDate().toLocaleDateString('id-ID', {day: 'numeric', month: 'short', year: 'numeric'}) : 'Baru saja';
            
            // Limit characters for summary
            const summary = data.isi.length > 100 ? data.isi.substring(0, 100) + '...' : data.isi;
            const fullText = data.isi.replace(/\n/g, '<br>');

            cardsHTML += `
                <div class="col-md-4 mb-4">
                    <div class="card blog-card h-100 shadow-sm border-0">
                        <span class="badge bg-primary position-absolute m-3 px-3 py-2 rounded-pill shadow-sm" style="z-index: 2;">${data.kategori}</span>
                        <img src="${data.gambar}" class="card-img-top" alt="${data.judul}" style="height: 200px; object-fit: cover;">
                        <div class="card-body p-4 d-flex flex-column">
                            <h5 class="card-title fw-bold text-dark">${data.judul}</h5>
                            <p class="card-text text-muted small mb-3">${summary}</p>
                            <div class="d-flex justify-content-between align-items-center mt-auto pt-3 border-top">
                                <small class="text-muted fw-medium"><i class="bi bi-calendar3 me-1"></i> ${date}</small>
                                <button type="button" class="btn btn-sm btn-primary px-3 rounded-pill" data-bs-toggle="modal" data-bs-target="#blogModal${id}">Baca <i class="bi bi-arrow-right"></i></button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            modalsHTML += `
                <div class="modal fade" id="blogModal${id}" tabindex="-1" aria-hidden="true">
                    <div class="modal-dialog modal-dialog-centered modal-lg modal-dialog-scrollable">
                        <div class="modal-content">
                            <div class="modal-header border-0 pb-0">
                                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                            </div>
                            <div class="modal-body p-4 p-md-5 pt-2">
                                <span class="badge bg-primary mb-3 px-3 py-2 rounded-pill">${data.kategori}</span>
                                <h2 class="fw-bold mb-3">${data.judul}</h2>
                                <p class="text-muted mb-4"><i class="bi bi-calendar3 me-2"></i>${date}</p>
                                <img src="${data.gambar}" class="img-fluid rounded mb-4 w-100" style="max-height: 400px; object-fit: cover;" alt="${data.judul}">
                                <div class="blog-content" style="font-size: 1.05rem; line-height: 1.8; color: #4b5563;">
                                    ${fullText}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        });

        blogContainer.innerHTML = cardsHTML;
        
        let modalContainer = document.getElementById('blogModalsContainer');
        if (!modalContainer) {
            modalContainer = document.createElement('div');
            modalContainer.id = 'blogModalsContainer';
            document.body.appendChild(modalContainer);
        }
        modalContainer.innerHTML = modalsHTML;

    } catch (error) {
        console.error("Error fetching blogs: ", error);
        blogContainer.innerHTML = '<div class="col-12 text-center text-danger py-5">Gagal memuat artikel. Silakan muat ulang halaman.</div>';
    }
}

fetchBlogs();
