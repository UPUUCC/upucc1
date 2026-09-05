import { db } from './firebase.js';
import { collection, getDocs, query, orderBy } from "firebase/firestore";

// Fungsi untuk format tanggal menjadi format Indonesia
function formatTanggal(timestamp) {
  if (!timestamp) return '';
  const date = timestamp.seconds ? new Date(timestamp.seconds * 1000) : new Date(timestamp);
  return date.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
}

// Fungsi untuk mengganti newlines menjadi <br> (seperti nl2br di PHP)
function nl2br(str) {
  if (typeof str !== 'string') return '';
  return str.replace(/([^>\r\n]?)(\r\n|\n\r|\r|\n)/g, '$1<br>$2');
}

document.addEventListener('DOMContentLoaded', async () => {
  const container = document.getElementById('acaraContainer');
  const loading = document.getElementById('acaraLoading');

  try {
    const acaraRef = collection(db, "acara");
    // Asumsi ada field created_at atau tanggal
    const q = query(acaraRef, orderBy("created_at", "desc"));
    const snapshot = await getDocs(q);

    loading.style.display = 'none';

    if (snapshot.empty) {
      container.innerHTML = '<p class="text-muted text-center">Belum ada postingan acara.</p>';
      return;
    }

    let html = '';
    snapshot.forEach((docSnap) => {
      const a = docSnap.data();
      const carId = `carousel_${docSnap.id}`;
      const tanggal = a.created_at || a.tanggal || null;

      // Handle foto, bisa array atau string tunggal
      let carouselItems = '';
      if (Array.isArray(a.fotos) && a.fotos.length > 0) {
        a.fotos.forEach((fotoStr, index) => {
          const activeClass = index === 0 ? 'active' : '';
          const src = fotoStr.startsWith('http') ? fotoStr : `/uploads/acara/${fotoStr}`;
          carouselItems += `
            <div class="carousel-item ${activeClass}">
              <img src="${src}" class="d-block w-100" alt="Foto Acara">
            </div>
          `;
        });
      } else if (Array.isArray(a.foto) && a.foto.length > 0) {
        a.foto.forEach((fotoStr, index) => {
          const activeClass = index === 0 ? 'active' : '';
          const src = fotoStr.startsWith('http') ? fotoStr : `/uploads/acara/${fotoStr}`;
          carouselItems += `
            <div class="carousel-item ${activeClass}">
              <img src="${src}" class="d-block w-100" alt="Foto Acara">
            </div>
          `;
        });
      } else if (typeof a.foto === 'string' && a.foto.trim() !== '') {
        const src = a.foto.startsWith('http') ? a.foto : `/uploads/acara/${a.foto}`;
        carouselItems = `
          <div class="carousel-item active">
            <img src="${src}" class="d-block w-100" alt="Foto Acara">
          </div>
        `;
      } else if (a.gambar) {
        carouselItems = `
          <div class="carousel-item active">
            <img src="${a.gambar}" class="d-block w-100" alt="Foto Acara">
          </div>
        `;
      } else {
        carouselItems = `
          <div class="carousel-item active">
            <img src="https://via.placeholder.com/600x400?text=Acara+UPUCC" class="d-block w-100" alt="Foto Acara">
          </div>
        `;
      }

      html += `
        <div class="acara-card mb-4">
          <div class="acara-header">
            <div class="icon"><img src="/logo.jpg" alt="Logo UPU-CC" height="30" class="me-2 rounded-circle"></div>
            <div>
              <div class="fw-bold">UPUCC</div>
              <div class="small text-muted">${formatTanggal(tanggal)}</div>
            </div>
          </div>

          <div id="${carId}" class="carousel slide" data-bs-ride="carousel">
            <div class="carousel-inner">
              ${carouselItems}
            </div>
            ${((Array.isArray(a.fotos) && a.fotos.length > 1) || (Array.isArray(a.foto) && a.foto.length > 1)) ? `
            <button class="carousel-control-prev" type="button" data-bs-target="#${carId}" data-bs-slide="prev">
              <span class="carousel-control-prev-icon" aria-hidden="true"></span>
              <span class="visually-hidden">Previous</span>
            </button>
            <button class="carousel-control-next" type="button" data-bs-target="#${carId}" data-bs-slide="next">
              <span class="carousel-control-next-icon" aria-hidden="true"></span>
              <span class="visually-hidden">Next</span>
            </button>` : ''}
          </div>

          <div class="acara-body p-3">
            <h5 class="fw-bold">${a.judul || 'Tanpa Judul'}</h5>
            <p style="white-space:pre-line;" class="mb-0">${nl2br(a.deskripsi || '')}</p>
          </div>
        </div>
      `;
    });

    container.innerHTML = html;

  } catch (error) {
    console.error("Error fetching acara:", error);
    loading.style.display = 'none';
    container.innerHTML = '<p class="text-danger text-center">Gagal memuat data acara.</p>';
  }
});
