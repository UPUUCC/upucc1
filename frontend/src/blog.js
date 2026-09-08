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
        

        snapshot.forEach(docSnap => {
            const data = docSnap.data();
            const id = docSnap.id;
            if (data.status && data.status !== 'approved') return;

            const date = data.createdAt ? data.createdAt.toDate().toLocaleDateString('id-ID', {day: 'numeric', month: 'short', year: 'numeric'}) : 'Baru saja';
            const isi = data.isi || '';
            const summary = isi.length > 100 ? isi.substring(0, 100) + '...' : isi;
            const kategori = data.kategori || 'Artikel';
            const gambar = data.gambar || 'https://via.placeholder.com/400x200?text=No+Image';
            const judul = data.judul || 'Tanpa Judul';
            const views = data.views || 0;
            cardsHTML += `
                <div class="col-md-4 mb-4">
                    <div class="card blog-card h-100 shadow-sm border-0">
                        <span class="badge bg-primary position-absolute m-3 px-3 py-2 rounded-pill shadow-sm" style="z-index: 2;">${kategori}</span>
                        <img src="${gambar}" class="card-img-top" alt="${judul}" style="height: 200px; object-fit: contain; background-color: #f8f9fa;">
                        <div class="card-body p-4 d-flex flex-column">
                            <h5 class="card-title fw-bold text-dark">${judul}</h5>
                            <p class="card-text text-muted small mb-3">${summary}</p>
                            <div class="d-flex justify-content-between align-items-center mt-auto pt-3 border-top">
                                <div class="d-flex gap-3">
                                    <small class="text-muted fw-medium"><i class="bi bi-calendar3 me-1"></i> ${date}</small>
                                    <small class="text-muted fw-medium"><i class="bi bi-eye me-1"></i> ${views}</small>
                                </div>
                                <a href="blog_detail.html?id=${id}" class="btn btn-sm btn-primary px-3 rounded-pill">Baca <i class="bi bi-arrow-right"></i></a>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            
        });

        blogContainer.innerHTML = cardsHTML;
        
        // Modals are handled in detail page now

    } catch (error) {
        console.error("Error fetching blogs: ", error);
        blogContainer.innerHTML = '<div class="col-12 text-center text-danger py-5">Gagal memuat artikel. Silakan muat ulang halaman.</div>';
    }
}

fetchBlogs();


