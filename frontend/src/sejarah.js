import { db } from './firebase.js';
import { collection, getDocs, doc, getDoc, query, orderBy } from "firebase/firestore";

function nl2br(str) {
  if (typeof str !== 'string') return '';
  return str.replace(/([^>\r\n]?)(\r\n|\n\r|\r|\n)/g, '$1<br>$2');
}

document.addEventListener('DOMContentLoaded', async () => {
  const sejarahUmumEl = document.getElementById('sejarahUmum');
  const accSejarahEl = document.getElementById('accSejarah');

  try {
    // 1. Fetch Sejarah Umum (from informasi_umum doc "1")
    const infoDoc = await getDoc(doc(db, "informasi_umum", "1"));
    if (infoDoc.exists() && infoDoc.data().konten) {
      sejarahUmumEl.innerHTML = nl2br(infoDoc.data().konten);
    } else {
      sejarahUmumEl.innerHTML = '<span class="text-muted">Sejarah UPUCC belum diisi.</span>';
    }

    // 2. Fetch Sejarah per Divisi (from divisions)
    const divSnap = await getDocs(query(collection(db, "divisions"), orderBy("id", "asc")));
    
    if (divSnap.empty) {
      accSejarahEl.innerHTML = '<p class="text-muted">Belum ada data divisi.</p>';
      return;
    }

    let accordionHTML = '';
    let i = 0;
    
    divSnap.forEach((docSnap) => {
      const d = docSnap.data();
      const divId = docSnap.id;
      const isFirst = i === 0;
      
      const kontenDivisi = d.konten || d.deskripsi || 'Sejarah divisi belum diisi.';

      accordionHTML += `
      <div class="accordion-item">
        <h2 class="accordion-header">
          <button class="accordion-button ${!isFirst ? 'collapsed' : ''}" type="button" data-bs-toggle="collapse" data-bs-target="#coll_${divId}">
            Divisi ${d.nama}
          </button>
        </h2>
        <div id="coll_${divId}" class="accordion-collapse collapse ${isFirst ? 'show' : ''}" data-bs-parent="#accSejarah">
          <div class="accordion-body" style="white-space:pre-line;">${nl2br(kontenDivisi)}</div>
        </div>
      </div>
      `;
      i++;
    });

    accSejarahEl.innerHTML = accordionHTML;

  } catch (error) {
    console.error("Error fetching sejarah:", error);
    sejarahUmumEl.innerHTML = '<span class="text-danger">Gagal memuat sejarah umum.</span>';
    accSejarahEl.innerHTML = '<p class="text-danger">Gagal memuat sejarah divisi.</p>';
  }
});
