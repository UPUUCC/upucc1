import './style.css'; // Vite supports CSS imports
import { db, auth } from './firebase.js';
import { onAuthStateChanged } from "firebase/auth";
import { collection, getDocs, doc, getDoc, query, orderBy, limit } from "firebase/firestore";

async function fetchHomeData() {
  try {
    // 1. Fetch Informasi Umum
    const infoDoc = await getDoc(doc(db, "settings", "informasi"));
    const infoEl = document.getElementById('infoUPUCC');
    if (infoDoc.exists()) {
      infoEl.innerHTML = infoDoc.data().konten.replace(/\n/g, '<br>');
    } else {
      infoEl.innerHTML = "Informasi UPUCC belum ditambahkan.";
    }

    // 2. Fetch Sliders
    const slidersSnap = await getDocs(query(collection(db, "sliders"), orderBy("urutan", "asc")));
    let indicatorsHTML = '';
    let innerHTML = '';
    let i = 0;
    
    if (!slidersSnap.empty) {
      slidersSnap.forEach((docSnap) => {
        const s = docSnap.data();
        const activeClass = i === 0 ? 'active' : '';
        indicatorsHTML += `<button type="button" data-bs-target="#heroCarousel" data-bs-slide-to="${i}" class="${activeClass}"></button>`;
        
        let imgSrc = s.gambarUrl || (s.gambar ? (s.gambar.startsWith('http') ? s.gambar : `/uploads/slider/${s.gambar}`) : 'https://via.placeholder.com/800x400');
        
        innerHTML += `
          <div class="carousel-item ${activeClass}">
            <img src="${imgSrc}" alt="${s.judul}">
            ${s.judul ? `
            <div class="carousel-caption text-white">
              <h3>${s.judul}</h3>
              ${s.deskripsi ? `<p class="mb-0">${s.deskripsi}</p>` : ''}
            </div>` : ''}
          </div>
        `;
        i++;
      });
      document.getElementById('sliderIndicators').innerHTML = indicatorsHTML;
      document.getElementById('sliderInner').innerHTML = innerHTML;
    } else {
      document.getElementById('sliderInner').innerHTML = `
        <div class="d-flex align-items-center justify-content-center text-white" style="height:480px; background:linear-gradient(120deg,#0d2b4e,#1e6fd9);">
          <div class="text-center">
            <h1 class="fw-bold">Selamat Datang di UPUCC</h1>
            <p>Sistem baru berbasis Firebase telah aktif.</p>
          </div>
        </div>
      `;
    }

    // 3. Fetch Divisi
    const divSnap = await getDocs(query(collection(db, "divisions"), orderBy("id", "asc")));
    let divHTML = '';
    if (!divSnap.empty) {
      divSnap.forEach((docSnap) => {
        const d = docSnap.data();
        const logoSrc = d.logoUrl || (d.logo ? (d.logo.startsWith('http') ? d.logo : `/uploads/divisi/${d.logo}`) : 'https://via.placeholder.com/90?text=' + d.nama.substring(0,1));
        divHTML += `
        <div class="col-md-3 col-6">
          <a href="/informasi_divisi.html?slug=${d.slug}" class="text-decoration-none text-dark">
            <div class="card card-divisi h-100 text-center">
              <img src="${logoSrc}" class="logo-divisi" alt="${d.nama}">
              <div class="card-body">
                <h5 class="card-title">${d.nama}</h5>
              </div>
            </div>
          </a>
        </div>`;
      });
      document.getElementById('divisiList').innerHTML = divHTML;
    } else {
      document.getElementById('divisiList').innerHTML = '<div class="col-12 text-center text-muted">Divisi belum dikonfigurasi.</div>';
    }

    // 4. Fetch Prestasi
    const prestasiSnap = await getDocs(query(collection(db, "prestasi"), orderBy("tanggal", "desc"), limit(3)));
    if (!prestasiSnap.empty) {
      document.getElementById('prestasiSection').style.display = 'block';
      let presHTML = '';
      prestasiSnap.forEach((docSnap) => {
        const p = docSnap.data();
        const imgSrc = p.gambarUrl || (p.gambar ? (p.gambar.startsWith('http') ? p.gambar : `/uploads/prestasi/${p.gambar}`) : 'https://via.placeholder.com/400x180?text=UPUCC');
        
        let formattedDate = 'Tanggal tidak diketahui';
        if (p.tanggal) {
            const dDate = new Date(p.tanggal);
            if (!isNaN(dDate)) {
                formattedDate = dDate.toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' });
            }
        }
        
        presHTML += `
        <div class="col-md-4">
          <div class="card prestasi-card h-100">
            <img src="${imgSrc}" class="card-img-top" alt="">
            <div class="card-body">
              <h5 class="card-title">${p.judul}</h5>
              <p class="card-text small text-muted">${formattedDate}</p>
              <p class="card-text">${p.deskripsi.substring(0,100)}...</p>
            </div>
          </div>
        </div>`;
      });
      document.getElementById('prestasiList').innerHTML = presHTML;
    }

  } catch (error) {
    console.error('Error fetching home data:', error);
    document.getElementById('infoUPUCC').innerText = "Gagal memuat data dari Firebase.";
  }
}

document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('infoUPUCC') || document.getElementById('sliderIndicators')) {
    fetchHomeData();
  }

  // Check Maintenance Mode
  const isLoginPage = window.location.pathname.includes('login.html');
  if (!isLoginPage && !window.location.pathname.includes('/dashboard/')) {
    getDoc(doc(db, "settings", "maintenance")).then(mainSnap => {
        if (mainSnap.exists() && mainSnap.data().isMaintenance === true) {
            document.body.innerHTML = `
            <div style="position:fixed; top:0; left:0; width:100vw; height:100vh; background:#0f172a; color:#fff; z-index:999999; display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center; padding:20px;">
              <i class="bi bi-cone-striped" style="font-size: 5rem; color: #f59e0b; margin-bottom: 20px;"></i>
              <h1 style="font-family:'Outfit',sans-serif; font-weight:700; font-size: 2.5rem; margin-bottom: 15px;">Sedang Dalam Perbaikan</h1>
              <p style="font-family:'Outfit',sans-serif; font-size: 1.2rem; color: #cbd5e1; max-width: 500px;">Website UPUCC saat ini sedang dalam mode pemeliharaan (Maintenance) untuk peningkatan sistem dan layanan kami. Silakan kembali lagi nanti.</p>
              <a href="/login.html" style="margin-top: 40px; color: #475569; text-decoration:none; font-size:0.9rem;">Admin Login</a>
            </div>
            `;
            document.body.style.overflow = 'hidden';
        }
    }).catch(err => console.error(err));
  }

  // Handle Authentication State for Navbar Login Button
  onAuthStateChanged(auth, (user) => {
    const loginLink = document.querySelector('a[href="/login.html"]');
    if (loginLink) {
      if (user) {
        loginLink.innerHTML = '<i class="bi bi-speedometer2"></i> Dashboard';
        loginLink.href = "/dashboard/anggota.html";
        loginLink.classList.replace('btn-outline-light', 'btn-light');
        loginLink.classList.add('text-dark');
      } else {
        loginLink.innerHTML = '<i class="bi bi-box-arrow-in-right"></i> Login';
        loginLink.href = "/login.html";
        loginLink.classList.replace('btn-light', 'btn-outline-light');
        loginLink.classList.remove('text-dark');
      }
    }
  });
});

