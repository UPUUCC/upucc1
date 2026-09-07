import { db } from "./firebase.js";
import { collection, getDocs, query, orderBy } from "firebase/firestore";

const showcaseContainer = document.getElementById('showcaseContainer');

async function fetchShowcases() {
    try {
        const q = query(collection(db, "showcases"), orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);
        
        showcaseContainer.innerHTML = '';
        
        if (snapshot.empty) {
            showcaseContainer.innerHTML = '<div class="col-12 text-center text-muted py-5">Belum ada karya yang diunggah.</div>';
            return;
        }

        snapshot.forEach(docSnap => {
            const data = docSnap.data();
            
            let badgeClass = 'bg-primary';
            let borderClass = 'border-primary';
            if(data.kategori.toLowerCase() === 'multimedia') {
                badgeClass = 'bg-danger'; borderClass = 'border-danger';
            } else if (data.kategori.toLowerCase() === 'netsect') {
                badgeClass = 'bg-success'; borderClass = 'border-success';
            }

            const linkHTML = data.link ? `<a href="${data.link}" target="_blank" class="text-decoration-none text-light mt-2 d-inline-block border-bottom ${borderClass} pb-1">Lihat Project <i class="bi bi-arrow-right"></i></a>` : '';

            showcaseContainer.innerHTML += `
                <div class="col-md-6 col-lg-4">
                    <div class="project-card h-100">
                        <img src="${data.gambar}" class="project-img" alt="${data.judul}">
                        <div class="p-4">
                            <span class="badge ${badgeClass} mb-2">${data.kategori}</span>
                            <h5 class="fw-bold">${data.judul}</h5>
                            <p class="small opacity-75">${data.deskripsi}</p>
                            ${linkHTML}
                        </div>
                    </div>
                </div>
            `;
        });
    } catch (error) {
        console.error("Error fetching showcases: ", error);
        showcaseContainer.innerHTML = '<div class="col-12 text-center text-danger py-5">Gagal memuat karya. Silakan muat ulang halaman.</div>';
    }
}

fetchShowcases();
