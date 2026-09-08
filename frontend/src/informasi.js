import { db } from './firebase.js';
import { collection, getDocs, doc, getDoc, query, orderBy } from "firebase/firestore";

function nl2br(str) {
  if (typeof str !== 'string') return '';
  return str.replace(/([^>\r\n]?)(\r\n|\n\r|\r|\n)/g, '$1<br>$2');
}

function truncateText(str, length = 150) {
  if (!str) return '';
  if (str.length <= length) return str;
  return str.substring(0, length) + '...';
}

document.addEventListener('DOMContentLoaded', async () => {
  const infoUmumText = document.getElementById('infoUmumText');
  const divisiContainer = document.getElementById('divisiContainer');

  try {
    // 1. Fetch Informasi Umum
    const infoDoc = await getDoc(doc(db, "informasi_umum", "1"));
    if (infoDoc.exists() && infoDoc.data().konten) {
      infoUmumText.innerHTML = nl2br(infoDoc.data().konten);
    } else {
      infoUmumText.innerHTML = '<span class="text-muted">Belum ada informasi umum yang ditambahkan.</span>';
    }

    // 2. Fetch Divisi
    const divSnap = await getDocs(query(collection(db, "divisions"), orderBy("id", "asc")));
    
    if (divSnap.empty) {
      divisiContainer.innerHTML = '<div class="col-12"><p class="text-muted">Belum ada divisi.</p></div>';
      return;
    }

    let cardsHTML = '';
    divSnap.forEach((docSnap) => {
      const d = docSnap.data();
      const initial = d.nama ? d.nama.substring(0, 1) : 'U';
      const logoSrc = d.logo ? (d.logo.startsWith('http') ? d.logo : `uploads/divisi/${d.logo}`) : `https://via.placeholder.com/90?text=${initial}`;
      
      cardsHTML += `
      <div class="col-md-6 col-lg-4">
        <div class="card card-divisi h-100 shadow-sm border-0 text-center p-4 rounded-4" style="transition: 0.3s; background: #fff;">
          <img src="${logoSrc}" class="mx-auto mb-3 rounded-circle shadow-sm" style="width:90px; height:90px; object-fit:cover; border:3px solid #f8fafc;" alt="Logo ${d.nama}">
          <h5 class="card-title fw-bold mb-3" style="color: #1e293b;">${d.nama || 'Tanpa Nama'}</h5>
          <p class="card-text text-muted small mb-4 flex-grow-1">${truncateText(d.deskripsi, 100)}</p>
          <a href="informasi_divisi.html?slug=${d.slug || docSnap.id}" class="btn btn-primary rounded-pill px-4 mt-auto mx-auto d-inline-block">Selengkapnya</a>
        </div>
      </div>
      `;
    });

    divisiContainer.innerHTML = cardsHTML;

  } catch (error) {
    console.error("Error fetching informasi:", error);
    infoUmumText.innerHTML = '<span class="text-danger">Gagal memuat informasi umum.</span>';
    divisiContainer.innerHTML = '<div class="col-12"><p class="text-danger">Gagal memuat divisi.</p></div>';
  }
});
