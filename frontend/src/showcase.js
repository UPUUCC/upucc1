import { db } from "./firebase.js";
import { collection, getDocs, query, orderBy } from "firebase/firestore";

const showcaseContainer = document.getElementById('showcaseContainer');

async function fetchShowcases() {
    try {
        const q = query(collection(db, "showcases"), orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);
        
        showcaseContainer.innerHTML = '';
        
        if (snapshot.empty) {
            showcaseContainer.innerHTML = `
                <div class="col-12 text-center py-5">
                    <div class="empty-state mx-auto" style="max-width: 500px;">
                        <i class="bi bi-folder-x display-1 mb-3 opacity-25"></i>
                        <h4 class="fw-bold">Belum Ada Karya</h4>
                        <p class="mb-0">Karya dari anggota belum diunggah untuk kategori ini.</p>
                    </div>
                </div>
            `;
            return;
        }

        let cardsHTML = '';
        

        snapshot.forEach(docSnap => {
            const data = docSnap.data();
            const id = docSnap.id;
            
            let badgeClass = 'bg-primary';
            let borderClass = 'border-primary';
            const kategori = data.kategori || '';
            if(kategori.toLowerCase() === 'multimedia') {
                badgeClass = 'bg-danger'; borderClass = 'border-danger';
            } else if (kategori.toLowerCase() === 'netsect') {
                badgeClass = 'bg-success'; borderClass = 'border-success';
            }

            const linkHTML = data.link ? `<a href="${data.link}" target="_blank" class="btn btn-outline-primary mt-3"><i class="bi bi-link-45deg"></i> Kunjungi Project</a>` : '';
            
            const deskripsi = data.deskripsi || '';
            const summary = deskripsi.length > 100 ? deskripsi.substring(0, 100) + '...' : deskripsi;
            const fullText = deskripsi.replace(/\n/g, '<br>');

            const gambar = data.gambar || data.mediaUrl || 'https://via.placeholder.com/400x200?text=No+Image';
            const judul = data.judul || 'Tanpa Judul';
            const views = data.views || 0;

            cardsHTML += `
                <div class="col-md-6 col-lg-4 mb-4">
                    <div class="project-card h-100 d-flex flex-column">
                        <div class="project-img-wrapper">
                            <img src="${gambar}" class="project-img" alt="${judul}" style="background-color: rgba(255,255,255,0.05);">
                        </div>
                        <div class="p-4 d-flex flex-column flex-grow-1">
                            <span class="badge ${badgeClass} mb-2 align-self-start">${kategori}</span>
                            <h5 class="fw-bold">${judul}</h5>
                            <p class="small opacity-75 mb-3 flex-grow-1">${summary}</p>
                            <div class="d-flex align-items-center justify-content-between">
                                <small class="opacity-50"><i class="bi bi-eye me-1"></i> ${views} dilihat</small>
                                <a href="showcase_detail.html?id=${id}" class="btn btn-sm btn-light border px-3 rounded-pill text-dark">Lihat <i class="bi bi-arrow-right"></i></a>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        });
        
        showcaseContainer.innerHTML = cardsHTML;

    } catch (error) {
        console.error("Error fetching showcases: ", error);
        showcaseContainer.innerHTML = '<div class="col-12 text-center text-danger py-5">Gagal memuat karya. Silakan muat ulang halaman.</div>';
    }
}

fetchShowcases();

