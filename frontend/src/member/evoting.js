import Swal from 'sweetalert2';
import { db, auth } from '../firebase.js';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, doc, getDoc, getDocs, addDoc, updateDoc, increment, query, orderBy, serverTimestamp, where, limit } from 'firebase/firestore';

let currentUser = null;
let currentElectionId = 'current';

async function checkMember() {
  return new Promise((resolve) => {
    onAuthStateChanged(auth, async (user) => {
      if (!user) {
        window.location.href = '/login.html';
        return resolve(null);
      }
      currentUser = user;
      resolve(user);
    });
  });
}

document.getElementById('btnLogout').addEventListener('click', () => {
    signOut(auth).then(() => {
        window.location.href = '/login.html';
    });
});

async function checkVotedCategories(userId, electionId) {
  const q = query(collection(db, "votes"), where("userId", "==", userId), where("electionId", "==", electionId));
  const snap = await getDocs(q);
  let votedCats = [];
  snap.forEach(doc => {
      if (doc.data().kategori) votedCats.push(doc.data().kategori);
      // Fallback for old votes before categories existed
      if (!doc.data().kategori) votedCats.push('Umum');
  });
  return votedCats;
}

async function loadElection() {
  try {
    const user = await checkMember();
    if (!user) return;

    const docSnap = await getDoc(doc(db, "elections", "current"));
    const container = document.getElementById('votingStatusContainer');
    const activeContainer = document.getElementById('votingActiveContainer');
    
    if (!docSnap.exists() || !docSnap.data().isActive) {
      container.innerHTML = `
        <div class="py-5 text-muted">
          <i class="bi bi-calendar-x fs-1 mb-3 d-block"></i>
          <h4>Saat ini belum ada Pemilu yang aktif.</h4>
          <p>Tunggu pengumuman dari pengurus UPU-CC.</p>
        </div>
      `;
      return;
    }
    
    document.getElementById('displayElectionTitle').textContent = docSnap.data().title;
    
    const votedCategories = await checkVotedCategories(user.uid, currentElectionId);
    
    const q = query(collection(db, "candidates"), orderBy("nomorUrut", "asc"));
    const candSnap = await getDocs(q);
    
    const categoriesMap = {};
    candSnap.forEach(snap => {
       const c = snap.data();
       const cat = c.kategori || 'Umum';
       if(!categoriesMap[cat]) categoriesMap[cat] = [];
       categoriesMap[cat].push({ id: snap.id, ...c });
    });
    
    const allCategories = Object.keys(categoriesMap);
    
    // Check if voted in ALL categories available
    if (allCategories.length > 0 && allCategories.every(cat => votedCategories.includes(cat))) {
      container.innerHTML = `
        <div class="py-5 text-center">
          <div class="d-inline-flex align-items-center justify-content-center bg-success text-white rounded-circle mb-4" style="width: 80px; height: 80px;">
            <i class="bi bi-check-lg fs-1"></i>
          </div>
          <h3 class="fw-bold text-success">Terima Kasih!</h3>
          <p class="fs-5 text-muted">Anda sudah memberikan hak suara pada Pemilu ini untuk seluruh kategori yang ada.</p>
        </div>
      `;
      return;
    }
    
    container.style.display = 'none';
    activeContainer.style.display = 'block';

    let tabsHtml = '';
    let contentHtml = '';
    
    let isFirst = true;
    for (const cat of allCategories) {
       const safeCatId = cat.replace(/\s+/g, '-').replace(/&/g, 'and');
       const isVoted = votedCategories.includes(cat);
       const tabIcon = isVoted ? '<i class="bi bi-check-circle-fill text-success ms-1"></i>' : '';
       
       tabsHtml += `
          <li class="nav-item" role="presentation">
            <button class="nav-link ${isFirst ? 'active' : ''} fw-bold px-4 rounded-pill border mb-2" id="tab-${safeCatId}" data-bs-toggle="pill" data-bs-target="#content-${safeCatId}" type="button" role="tab">${cat} ${tabIcon}</button>
          </li>
       `;
       
       contentHtml += `
          <div class="tab-pane fade ${isFirst ? 'show active' : ''}" id="content-${safeCatId}" role="tabpanel">
            ${isVoted ? `<div class="alert alert-success text-center mb-4"><i class="bi bi-check-circle-fill me-2"></i>Anda sudah memberikan suara untuk kategori <b>${cat}</b>.</div>` : ''}
            <div class="row g-4 justify-content-center">
       `;
       
       categoriesMap[cat].forEach(c => {
          const safeNama = (c.nama || '').replace(/'/g, "\\'").replace(/"/g, '&quot;');
          const safeVisi = (c.visi || '').replace(/`/g, "'").replace(/\\/g, '\\\\');
          const safeMisi = (c.misi || '').replace(/`/g, "'").replace(/\\/g, '\\\\');
          
          let actionBtn = '';
          if (isVoted) {
             actionBtn = `<button class="btn btn-secondary w-50 fw-bold" disabled>Sudah Memilih</button>`;
          } else {
             actionBtn = `<button class="btn btn-primary w-50 fw-bold" onclick="castVote('${c.id}', '${safeNama}', '${cat}')">Pilih <i class="bi bi-check-circle"></i></button>`;
          }
          
          contentHtml += `
            <div class="col-md-6 col-lg-5">
              <div class="candidate-card h-100 d-flex flex-column position-relative ${isVoted ? 'opacity-75' : ''}">
                <div class="no-urut">${c.nomorUrut || '-'}</div>
                <img src="${c.photoUrl || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(c.nama || 'No Name') + '&background=e2e8f0&color=475569&size=400'}" onerror="this.src='https://ui-avatars.com/api/?name=' + encodeURIComponent('${safeNama}') + '&background=e2e8f0&color=475569&size=400'" class="candidate-photo" alt="${c.nama}">
                <div class="p-4 d-flex flex-column flex-grow-1">
                  <h5 class="fw-bold mb-3 text-center">${c.nama || 'Tanpa Nama'}</h5>
                  <div class="d-flex justify-content-center gap-2 mt-auto pt-3 border-top">
                    <button class="btn btn-outline-secondary w-50" onclick="showDetail('${safeNama}', \`${safeVisi}\`, \`${safeMisi}\`, '${c.nomorUrut || '-'}', '${c.photoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(safeNama)}&background=e2e8f0&color=475569&size=400`}', '${c.instagram || ''}')">
                      <i class="bi bi-eye"></i> Detail
                    </button>
                    ${actionBtn}
                  </div>
                </div>
              </div>
            </div>
          `;
       });
       
       contentHtml += `</div></div>`;
       isFirst = false;
    }
    
    document.getElementById('categoryTabs').innerHTML = tabsHtml;
    document.getElementById('categoryTabContent').innerHTML = contentHtml;

  } catch (error) {
    console.error("Error loading election:", error);
    const container = document.getElementById('votingStatusContainer');
    const activeContainer = document.getElementById('votingActiveContainer');
    if (container && activeContainer) {
      container.style.display = 'block';
      activeContainer.style.display = 'none';
      container.innerHTML = `<p class="text-danger fw-bold">Terjadi kesalahan saat memuat data kandidat.</p>`;
    }
  }
}

window.showDetail = (nama, visi, misi, noUrut, photoUrl, instagram) => {
  document.getElementById('modalCandName').textContent = nama;
  
  const noEl = document.getElementById('modalCandNo');
  if(noEl) noEl.textContent = noUrut;
  
  const photoEl = document.getElementById('modalCandPhoto');
  if(photoEl) photoEl.src = photoUrl;
  
  const socialsEl = document.getElementById('modalCandSocials');
  if (socialsEl) {
    if (instagram) {
      socialsEl.classList.remove('d-none');
      document.getElementById('modalCandInstagram').href = instagram;
      let igText = 'Instagram';
      try {
        const urlObj = new URL(instagram);
        let path = urlObj.pathname.replace(/\//g, '');
        if(path) igText = '@' + path;
      } catch(e) {}
      document.getElementById('modalCandInstagramText').textContent = igText;
    } else {
      socialsEl.classList.add('d-none');
    }
  }

  document.getElementById('modalCandVision').textContent = visi;
  document.getElementById('modalCandMission').textContent = misi;
  const modal = new bootstrap.Modal(document.getElementById('modalDetail'));
  modal.show();
};

window.castVote = async (candId, candName, kategori) => {
  const res = await Swal.fire({
    title: 'Konfirmasi Pilihan',
    html: `Apakah Anda yakin ingin memberikan suara untuk <b>${candName}</b> pada kategori <b>${kategori}</b>?<br><br><small class="text-danger">Pilihan yang sudah disimpan tidak dapat diubah!</small>`,
    icon: 'question',
    showCancelButton: true,
    confirmButtonColor: '#2563eb',
    cancelButtonColor: '#94a3b8',
    confirmButtonText: 'Ya, Saya Yakin!',
    cancelButtonText: 'Batal'
  });
  
  if (res.isConfirmed) {
    Swal.showLoading();
    try {
      const votedCats = await checkVotedCategories(currentUser.uid, currentElectionId);
      if(votedCats.includes(kategori)) {
         Swal.fire('Gagal', 'Anda sudah pernah memberikan suara untuk kategori ini.', 'error');
         setTimeout(() => location.reload(), 1500);
         return;
      }
      
      // 1. Record Vote
      await addDoc(collection(db, "votes"), {
        electionId: currentElectionId,
        userId: currentUser.uid,
        userEmail: currentUser.email,
        kategori: kategori,
        timestamp: serverTimestamp()
      });
      
      // 2. Increment Candidate Vote Count
      await updateDoc(doc(db, "candidates", candId), {
        votes: increment(1)
      });
      
      Swal.fire('Berhasil!', 'Suara Anda berhasil disimpan. Lanjutkan ke kategori lain jika belum.', 'success').then(() => {
        location.reload();
      });
      
    } catch (e) {
      console.error(e);
      Swal.fire('Gagal', 'Terjadi kesalahan sistem.', 'error');
    }
  }
};

document.addEventListener('DOMContentLoaded', loadElection);
