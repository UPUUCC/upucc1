import { db } from './firebase.js';
import { collection, getDocs, query, orderBy } from "firebase/firestore";

// Format tanggal
function formatTanggal(timestamp) {
  if (!timestamp) return '';
  const date = timestamp.seconds ? new Date(timestamp.seconds * 1000) : new Date(timestamp);
  return date.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
}

function nl2br(str) {
  if (typeof str !== 'string') return '';
  return str.replace(/([^>\r\n]?)(\r\n|\n\r|\r|\n)/g, '$1<br>$2');
}

function truncateText(str, length = 120) {
  if (!str) return '';
  if (str.length <= length) return str;
  return str.substring(0, length) + '...';
}

document.addEventListener('DOMContentLoaded', async () => {
  const filterContainer = document.getElementById('filterPrestasi');
  const container = document.getElementById('prestasiContainer');
  const loading = document.getElementById('prestasiLoading');
  const modalContainer = document.getElementById('modalContainer');

  let allPrestasi = [];

  try {
    // 1. Fetch Divisions for filter
    const divSnap = await getDocs(query(collection(db, "divisions"), orderBy("id", "asc")));
    let filterHTML = `<button class="btn btn-sm btn-primary filter-btn active" data-filter="semua">Semua</button>`;
    
    divSnap.forEach((docSnap) => {
      const d = docSnap.data();
      // Asumsikan relasi prestasi menggunakan nama divisi atau id. Kita gunakan nama untuk filter ini (atau d.id)
      filterHTML += ` <button class="btn btn-sm btn-outline-primary filter-btn" data-filter="${d.nama}">${d.nama}</button>`;
    });
    filterContainer.innerHTML = filterHTML;

    // 2. Fetch Prestasi
    const prestasiSnap = await getDocs(query(collection(db, "prestasi"), orderBy("tanggal", "desc")));
    
    prestasiSnap.forEach((docSnap) => {
      allPrestasi.push({ id: docSnap.id, ...docSnap.data() });
    });

    loading.style.display = 'none';
    renderPrestasi(allPrestasi, "semua");

    // 3. Event Listener for filters
    filterContainer.addEventListener('click', (e) => {
      if (e.target.tagName === 'BUTTON' && e.target.classList.contains('filter-btn')) {
        // Update active class
        document.querySelectorAll('.filter-btn').forEach(btn => {
          btn.classList.remove('btn-primary', 'active');
          btn.classList.add('btn-outline-primary');
        });
        e.target.classList.remove('btn-outline-primary');
        e.target.classList.add('btn-primary', 'active');

        const filterValue = e.target.getAttribute('data-filter');
        renderPrestasi(allPrestasi, filterValue);
      }
    });

  } catch (error) {
    console.error("Error fetching prestasi:", error);
    loading.style.display = 'none';
    container.innerHTML = '<div class="col-12"><p class="text-danger text-center">Gagal memuat data prestasi.</p></div>';
  }

  function renderPrestasi(data, filterValue) {
    let filteredData = data;
    if (filterValue !== "semua") {
      filteredData = data.filter(p => (p.divisi_nama === filterValue) || (p.divisi === filterValue) || (p.divisi_id === filterValue));
    }

    if (filteredData.length === 0) {
      container.innerHTML = '<div class="col-12"><p class="text-muted text-center">Belum ada data prestasi.</p></div>';
      modalContainer.innerHTML = '';
      return;
    }

    let cardsHTML = '';
    let modalsHTML = '';

    filteredData.forEach((p) => {
      const imgSrc = p.gambarUrl || (p.gambar ? (p.gambar.startsWith('http') ? p.gambar : `/uploads/prestasi/${p.gambar}`) : 'https://via.placeholder.com/400x180?text=Prestasi+UPUCC');
      const modalImgSrc = p.gambarUrl || (p.gambar ? (p.gambar.startsWith('http') ? p.gambar : `/uploads/prestasi/${p.gambar}`) : 'https://via.placeholder.com/800x400?text=Prestasi+UPUCC');
      const divName = p.divisi_nama || p.divisi || 'Umum';

      // Card
      cardsHTML += `
      <div class="col-md-4">
        <div class="card prestasi-card h-100" role="button" data-bs-toggle="modal" data-bs-target="#prestasiModal${p.id}">
          <img src="${imgSrc}" class="card-img-top" alt="${p.judul || 'Prestasi'}">
          <div class="card-body">
            <span class="badge bg-secondary mb-2">${divName}</span>
            <h5 class="card-title">${p.judul || 'Tanpa Judul'}</h5>
            <p class="card-text small text-muted">${formatTanggal(p.tanggal)}</p>
            <p class="card-text prestasi-excerpt">${nl2br(truncateText(p.deskripsi))}</p>
            <span class="btn btn-sm btn-outline-primary mt-2"><i class="bi bi-zoom-in"></i> Lihat Detail</span>
          </div>
        </div>
      </div>`;

      // Modal
      modalsHTML += `
      <div class="modal fade" id="prestasiModal${p.id}" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered modal-lg">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">${p.judul || 'Detail Prestasi'}</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Tutup"></button>
            </div>
            <div class="modal-body">
              <img src="${modalImgSrc}" class="img-fluid rounded mb-3" alt="${p.judul || 'Prestasi'}">
              <div class="mb-2">
                <span class="badge bg-secondary">${divName}</span>
                <span class="badge bg-light text-dark border"><i class="bi bi-calendar3"></i> ${formatTanggal(p.tanggal)}</span>
              </div>
              <p style="white-space:pre-line;">${nl2br(p.deskripsi) || '<span class="text-muted">Belum ada deskripsi.</span>'}</p>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Tutup</button>
            </div>
          </div>
        </div>
      </div>`;
    });

    container.innerHTML = cardsHTML;
    modalContainer.innerHTML = modalsHTML;
  }
});
