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

async function checkHasVoted(userId) {
  const q = query(collection(db, "votes"), where("userId", "==", userId), limit(1));
  const snap = await getDocs(q);
  return !snap.empty;
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
    
    const hasVoted = await checkHasVoted(user.uid);
    if (hasVoted) {
      container.innerHTML = `
        <div class="py-5 text-center">
          <div class="d-inline-flex align-items-center justify-content-center bg-success text-white rounded-circle mb-4" style="width: 80px; height: 80px;">
            <i class="bi bi-check-lg fs-1"></i>
          </div>
          <h3 class="fw-bold text-success">Terima Kasih!</h3>
          <p class="fs-5 text-muted">Anda sudah memberikan hak suara pada Pemilu ini.</p>
        </div>
      `;
      return;
    }
    
    // Member hasn't voted, load candidates
    container.style.display = 'none';
    activeContainer.style.display = 'block';
    
    const q = query(collection(db, "candidates"), orderBy("nomorUrut", "asc"));
    const candSnap = await getDocs(q);
    
    let html = '';
    candSnap.forEach(snap => {
      const c = snap.data();
      const candId = snap.id;
      const safeNama = (c.nama || '').replace(/'/g, "\\'").replace(/"/g, '&quot;');
      const safeVisi = (c.visi || '').replace(/`/g, "'").replace(/\\/g, '\\\\');
      const safeMisi = (c.misi || '').replace(/`/g, "'").replace(/\\/g, '\\\\');

      html += `
        <div class="col-md-6 col-lg-5">
          <div class="candidate-card h-100 d-flex flex-column position-relative">
            <div class="no-urut">${c.nomorUrut || '-'}</div>
            <img src="${c.photoUrl || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(c.nama || 'No Name') + '&background=e2e8f0&color=475569&size=400'}" onerror="this.src='https://ui-avatars.com/api/?name=' + encodeURIComponent('${safeNama}') + '&background=e2e8f0&color=475569&size=400'" class="candidate-photo" alt="${c.nama}">
            <div class="p-4 d-flex flex-column flex-grow-1">
              <h5 class="fw-bold mb-3 text-center">${c.nama || 'Tanpa Nama'}</h5>
              <div class="d-flex justify-content-center gap-2 mt-auto pt-3 border-top">
                <button class="btn btn-outline-secondary w-50" onclick="showDetail('${safeNama}', \`${safeVisi}\`, \`${safeMisi}\`)">
                  <i class="bi bi-eye"></i> Detail
                </button>
                <button class="btn btn-primary w-50 fw-bold" onclick="castVote('${candId}', '${safeNama}')">
                  Pilih <i class="bi bi-check-circle"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      `;
    });
    
    document.getElementById('candidatesList').innerHTML = html;

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

window.showDetail = (nama, visi, misi) => {
  document.getElementById('modalCandName').textContent = nama;
  document.getElementById('modalCandVision').textContent = visi;
  document.getElementById('modalCandMission').textContent = misi;
  const modal = new bootstrap.Modal(document.getElementById('modalDetail'));
  modal.show();
};

window.castVote = async (candId, candName) => {
  const res = await Swal.fire({
    title: 'Konfirmasi Pilihan',
    html: `Apakah Anda yakin ingin memberikan suara untuk <b>${candName}</b>?<br><br><small class="text-danger">Pilihan yang sudah disimpan tidak dapat diubah!</small>`,
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
      // Double check if already voted to prevent concurrent race condition
      const alreadyVoted = await checkHasVoted(currentUser.uid);
      if(alreadyVoted) {
         Swal.fire('Gagal', 'Anda sudah pernah memberikan suara.', 'error');
         setTimeout(() => location.reload(), 1500);
         return;
      }
      
      // 1. Record Vote
      await addDoc(collection(db, "votes"), {
        electionId: currentElectionId,
        userId: currentUser.uid,
        userEmail: currentUser.email,
        timestamp: serverTimestamp()
      });
      
      // 2. Increment Candidate Vote Count
      await updateDoc(doc(db, "candidates", candId), {
        votes: increment(1)
      });
      
      Swal.fire('Berhasil!', 'Suara Anda berhasil disimpan. Terima kasih telah berpartisipasi.', 'success').then(() => {
        location.reload();
      });
      
    } catch (e) {
      console.error(e);
      Swal.fire('Gagal', 'Terjadi kesalahan sistem.', 'error');
    }
  }
};

document.addEventListener('DOMContentLoaded', loadElection);
