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
    // 1. Fetch Sejarah Umum (from sejarah doc "umum")
    const infoDoc = await getDoc(doc(db, "sejarah", "umum"));
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
    
    for (let i = 0; i < divSnap.docs.length; i++) {
      const docSnap = divSnap.docs[i];
      const d = docSnap.data();
      const divId = docSnap.id;
      const isFirst = i === 0;
      
      let kontenDivisi = d.deskripsi || 'Sejarah divisi belum diisi.';
      try {
        const sejDoc = await getDoc(doc(db, "sejarah", `divisi_${divId}`));
        if (sejDoc.exists() && sejDoc.data().konten) {
            kontenDivisi = sejDoc.data().konten;
        }
      } catch (e) { console.error(e); }

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
    }

    accSejarahEl.innerHTML = accordionHTML;

  } catch (error) {
    console.error("Error fetching sejarah:", error);
    sejarahUmumEl.innerHTML = '<span class="text-danger">Gagal memuat sejarah umum.</span>';
    accSejarahEl.innerHTML = '<p class="text-danger">Gagal memuat sejarah divisi.</p>';
  }
});
