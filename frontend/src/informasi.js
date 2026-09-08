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
      const logoSrc = d.logoUrl || (d.logo ? (d.logo.startsWith('http') ? d.logo : `uploads/divisi/${d.logo}`) : `https://ui-avatars.com/api/?name=${initial}&background=e2e8f0&color=475569&size=128&bold=true`);
      
      cardsHTML += `
      <div class="col-md-6 col-lg-4">
        <div class="card-divisi-info">
          <div class="divisi-img-wrap">
            <img src="${logoSrc}" class="divisi-logo" alt="Logo ${d.nama}">
          </div>
          <div class="divisi-body">
            <h5 class="divisi-name">${d.nama || 'Tanpa Nama'}</h5>
            <p class="divisi-desc">${truncateText(d.deskripsi, 110)}</p>
            <div class="divisi-btn-wrap">
              <a href="informasi_divisi.html?slug=${d.slug || docSnap.id}" class="divisi-btn">
                <i class="bi bi-arrow-right-circle"></i> Selengkapnya
              </a>
            </div>
          </div>
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
