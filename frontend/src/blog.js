import { db } from "./firebase.js";
import { collection, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

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

        snapshot.forEach(docSnap => {
            const data = docSnap.data();
            const date = data.createdAt ? data.createdAt.toDate().toLocaleDateString('id-ID', {day: 'numeric', month: 'short', year: 'numeric'}) : 'Baru saja';
            
            // Limit characters for summary
            const summary = data.isi.length > 100 ? data.isi.substring(0, 100) + '...' : data.isi;

            blogContainer.innerHTML += `
                <div class="col-md-4 mb-4">
                    <div class="card blog-card h-100 shadow-sm border-0">
                        <span class="badge bg-primary position-absolute m-3 px-3 py-2 rounded-pill shadow-sm" style="z-index: 2;">${data.kategori}</span>
                        <img src="${data.gambar}" class="card-img-top" alt="${data.judul}" style="height: 200px; object-fit: cover;">
                        <div class="card-body p-4 d-flex flex-column">
                            <h5 class="card-title fw-bold text-dark">${data.judul}</h5>
                            <p class="card-text text-muted small mb-3">${summary}</p>
                            <div class="d-flex justify-content-between align-items-center mt-auto pt-3 border-top">
                                <small class="text-muted fw-medium"><i class="bi bi-calendar3 me-1"></i> ${date}</small>
                                <a href="#" class="btn btn-sm btn-primary px-3 rounded-pill">Baca <i class="bi bi-arrow-right"></i></a>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        });
    } catch (error) {
        console.error("Error fetching blogs: ", error);
        blogContainer.innerHTML = '<div class="col-12 text-center text-danger py-5">Gagal memuat artikel. Silakan muat ulang halaman.</div>';
    }
}

fetchBlogs();
