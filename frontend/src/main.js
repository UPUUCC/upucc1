import './style.css'; // Vite supports CSS imports
import Swal from 'sweetalert2';
import { db, auth } from './firebase.js';
import { onAuthStateChanged } from "firebase/auth";
import { collection, getDocs, doc, getDoc, query, orderBy, limit, addDoc, serverTimestamp, where } from "firebase/firestore";

// === Proteksi Kode Sumber ===
// Disable klik kanan (context menu)
document.addEventListener('contextmenu', (e) => e.preventDefault());

// Disable F12, Ctrl+Shift+I/J/C, Ctrl+U (View Source)
document.addEventListener('keydown', (e) => {
  if (e.key === 'F12') { e.preventDefault(); return false; }
  if (e.ctrlKey && e.shiftKey && ['I', 'i', 'J', 'j', 'C', 'c'].includes(e.key)) { e.preventDefault(); return false; }
  if (e.ctrlKey && (e.key === 'U' || e.key === 'u')) { e.preventDefault(); return false; }
});
// ============================

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

function initMain() {
  if (document.getElementById('infoUPUCC') || document.getElementById('sliderIndicators')) {
    fetchHomeData();
  }
  
  if (document.getElementById('accordionFaq')) {
    fetchFaq();
  }

  // Set Automatic Footer Year
  const footerYear = document.getElementById('footerYear');
  if (footerYear) {
    footerYear.textContent = new Date().getFullYear();
  }

  // Handle Form Saran
  const formSaran = document.getElementById('formSaran');
  if (formSaran) {
      formSaran.addEventListener('submit', async (e) => {
          e.preventDefault();
          const btn = document.getElementById('btnSubmitSaran');
          const namaInput = document.getElementById('saranNama').value.trim();
          const pesanInput = document.getElementById('saranPesan').value.trim();

          btn.disabled = true;
          btn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Mengirim...';

          try {
              await addDoc(collection(db, "saran"), {
                  nama: namaInput || 'Anonim',
                  pesan: pesanInput,
                  tanggal: serverTimestamp()
              });
              Swal.fire({
                  icon: 'success',
                  title: 'Terkirim!',
                  text: 'Terima kasih atas saran dan masukan Anda untuk UPU-CC.',
                  confirmButtonColor: '#2563eb'
              });
              formSaran.reset();
          } catch (err) {
              console.error(err);
              Swal.fire({
                  icon: 'error',
                  title: 'Gagal',
                  text: 'Terjadi kesalahan saat mengirim saran. Silakan coba lagi.'
              });
          } finally {
              btn.disabled = false;
              btn.innerHTML = '<i class="bi bi-send me-2"></i> Kirim Pesan';
          }
      });
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
            </div>
            `;
            document.body.style.overflow = 'hidden';
        }
    }).catch(err => console.error(err));
  }

  // Check Registration (Oprec) Popup
  if (!isLoginPage && !window.location.pathname.includes('/dashboard/')) {
    getDoc(doc(db, "settings", "pendaftaran")).then(regSnap => {
        if (regSnap.exists() && regSnap.data().isOpen === true) {
            if (sessionStorage.getItem('oprecPopupShown')) return;
            sessionStorage.setItem('oprecPopupShown', 'true');
            
            const thumbnailUrl = regSnap.data().thumbnailUrl || null;
            
            let swalConfig = {
                title: 'Open Recruitment UPU-CC',
                html: 'Pendaftaran anggota baru UPU-CC telah dibuka!<br>Mari bergabung dan kembangkan potensimu di bidang teknologi bersama kami.',
                confirmButtonText: 'Daftar Sekarang',
                showCancelButton: true,
                cancelButtonText: 'Nanti Saja',
                confirmButtonColor: '#2563eb',
                reverseButtons: true,
                padding: '1.5em',
                customClass: {
                    popup: 'rounded-4'
                }
            };

            if (thumbnailUrl) {
                swalConfig.imageUrl = thumbnailUrl;
                swalConfig.imageWidth = 400;
                swalConfig.imageAlt = 'Oprec UPU-CC';
                swalConfig.imageClass = 'rounded-3 shadow-sm border mb-3';
            }

            setTimeout(() => {
                Swal.fire(swalConfig).then((result) => {
                    if (result.isConfirmed) {
                        window.location.href = '/pendaftaran.html';
                    }
                });
            }, 1000); // 1 second delay for better UX
        }
    }).catch(err => console.error(err));
  }

  // Handle Authentication State for Navbar Login Button
  onAuthStateChanged(auth, async (user) => {
    const loginLink = document.querySelector('a[href="/login.html"]');
    if (loginLink) {
      if (user) {
        let isPengurus = false;
        try {
            const q = query(collection(db, "members"), where("email", "==", user.email), limit(1));
            const snap = await getDocs(q);
            if (!snap.empty && snap.docs[0].data().role !== 'anggota') {
                isPengurus = true;
            }
        } catch(e) {}

        if (isPengurus) {
            loginLink.innerHTML = '<i class="bi bi-speedometer2"></i> Panel Admin';
            loginLink.href = "/dashboard/index.html";
        } else {
            loginLink.innerHTML = '<i class="bi bi-person-circle"></i> Member Area';
            loginLink.href = "/member/profil.html";
        }
        
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
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initMain);
} else {
  initMain();
}


async function fetchFaq() {
    try {
        const q = query(collection(db, 'faq'), orderBy('order', 'asc'));
        const querySnapshot = await getDocs(q);
        
        const faqSection = document.getElementById('faqSection');
        const accordionFaq = document.getElementById('accordionFaq');
        
        if (querySnapshot.empty) {
            faqSection.style.display = 'none';
            return;
        }
        
        faqSection.style.display = 'block';
        let html = '';
        let i = 0;
        
        querySnapshot.forEach((docSnap) => {
            const data = docSnap.data();
            const collapseId = 'faqCollapse' + i;
            const headingId = 'faqHeading' + i;
            const isExpanded = i === 0;
            const showClass = i === 0 ? 'show' : '';
            const collapsedClass = i === 0 ? '' : 'collapsed';
            
            html += `
              <div class="accordion-item border-0 mb-3 rounded-4 shadow-sm overflow-hidden">
                <h2 class="accordion-header" id="${headingId}">
                  <button class="accordion-button ${collapsedClass} fw-bold" type="button" data-bs-toggle="collapse" data-bs-target="#${collapseId}" aria-expanded="${isExpanded}" aria-controls="${collapseId}">
                    ${data.pertanyaan}
                  </button>
                </h2>
                <div id="${collapseId}" class="accordion-collapse collapse ${showClass}" aria-labelledby="${headingId}" data-bs-parent="#accordionFaq">
                  <div class="accordion-body text-muted">
                    ${data.jawaban}
                  </div>
                </div>
              </div>
            `;
            i++;
        });
        
        accordionFaq.innerHTML = html;
        
    } catch (error) {
        console.error('Error fetching FAQ:', error);
    }
}
