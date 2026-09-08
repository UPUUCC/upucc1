import Swal from 'sweetalert2';
import { db, auth } from '../firebase.js';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, doc, getDoc, getDocs, setDoc, addDoc, updateDoc, deleteDoc, query, orderBy, where, limit } from 'firebase/firestore';

let votingChart = null;

async function checkAdmin() {
  return new Promise((resolve) => {
    onAuthStateChanged(auth, async (user) => {
      if (!user) {
        window.location.href = '/login.html';
        return resolve(false);
      }
      try {
        const q = query(collection(db, "members"), where("email", "==", user.email.toLowerCase().trim()), limit(1));
        const snap = await getDocs(q);
        
        let role = 'admin';
        if (!snap.empty) {
          role = (snap.docs[0].data().role || 'admin').toLowerCase();
        }

        if (role !== 'admin') {
          window.location.href = '/dashboard/index.html';
          return resolve(false);
        }
        
        const adminNameEl = document.getElementById('adminName');
        if (adminNameEl) {
           adminNameEl.textContent = user.displayName || 'Admin';
        }
        resolve(true);
      } catch (e) {
        console.error(e);
        resolve(false);
      }
    });
  });
}

async function loadElectionSettings() {
  try {
    const docSnap = await getDoc(doc(db, "elections", "current"));
    if (docSnap.exists()) {
      const data = docSnap.data();
      document.getElementById('electionTitle').value = data.title || '';
      const switchBtn = document.getElementById('electionStatus');
      switchBtn.checked = data.isActive || false;
      document.getElementById('statusLabel').textContent = data.isActive ? 'Dibuka (Aktif)' : 'Ditutup';
      if(data.isActive) {
        document.getElementById('statusLabel').className = 'form-check-label fs-6 ms-2 mt-1 text-success fw-bold';
      } else {
        document.getElementById('statusLabel').className = 'form-check-label fs-6 ms-2 mt-1 text-danger';
      }
    }
  } catch (error) {
    console.error("Error loading election settings:", error);
  }
}

document.getElementById('electionStatus').addEventListener('change', (e) => {
  const lbl = document.getElementById('statusLabel');
  if(e.target.checked) {
    lbl.textContent = 'Dibuka (Aktif)';
    lbl.className = 'form-check-label fs-6 ms-2 mt-1 text-success fw-bold';
  } else {
    lbl.textContent = 'Ditutup';
    lbl.className = 'form-check-label fs-6 ms-2 mt-1 text-danger';
  }
});

document.getElementById('electionSettingsForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = document.getElementById('btnSaveElection');
  const title = document.getElementById('electionTitle').value;
  const isActive = document.getElementById('electionStatus').checked;

  btn.disabled = true;
  btn.innerHTML = 'Menyimpan...';

  try {
    await setDoc(doc(db, "elections", "current"), {
      title: title,
      isActive: isActive,
      updatedAt: new Date().toISOString()
    }, { merge: true });
    
    Swal.fire('Berhasil', 'Pengaturan Pemilu berhasil disimpan!', 'success');
  } catch (error) {
    console.error(error);
    Swal.fire('Gagal', 'Gagal menyimpan pengaturan.', 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = 'Simpan Pengaturan';
  }
});

async function loadCandidates() {
  try {
    const q = query(collection(db, "candidates"), orderBy("nomorUrut", "asc"));
    const snap = await getDocs(q);
    
    const tbody = document.getElementById('candidateTableBody');
    let html = '';
    
    let labels = [];
    let dataVotes = [];
    let colors = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
    let totalVotes = 0;

    if (snap.empty) {
      html = '<tr><td colspan="5" class="text-center text-muted py-4">Belum ada kandidat terdaftar.</td></tr>';
      updateChart([], []);
      document.getElementById('totalVotesCount').textContent = '0';
    } else {
      let colorIndex = 0;
      snap.forEach(docSnap => {
        const c = docSnap.data();
        const candId = docSnap.id;
        html += `
          <tr>
            <td>
              <div class="d-flex align-items-center">
                <img src="${c.photoUrl || 'https://via.placeholder.com/60'}" class="candidate-img me-3">
                <span class="fw-bold">${c.nama}</span>
              </div>
            </td>
            <td class="text-center fw-bold fs-5">${c.nomorUrut}</td>
            <td>
              <div class="small"><b>Visi:</b> ${c.visi.substring(0, 50)}...</div>
              <div class="small mt-1"><b>Misi:</b> ${c.misi.substring(0, 50)}...</div>
            </td>
            <td class="text-center fw-bold text-primary fs-5">${c.votes || 0}</td>
            <td>
              <button class="btn btn-sm btn-outline-danger" onclick="deleteCandidate('${candId}')"><i class="bi bi-trash"></i> Hapus</button>
            </td>
          </tr>
        `;
        labels.push(c.nomorUrut + '. ' + c.nama);
        dataVotes.push(c.votes || 0);
        totalVotes += (c.votes || 0);
      });
      document.getElementById('totalVotesCount').textContent = totalVotes;
      updateChart(labels, dataVotes, colors);
    }
    tbody.innerHTML = html;
  } catch (error) {
    console.error("Error loading candidates:", error);
  }
}

function updateChart(labels, dataVotes, colors) {
  const ctx = document.getElementById('votingChart').getContext('2d');
  
  if (votingChart) {
    votingChart.destroy();
  }
  
  votingChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Perolehan Suara',
        data: dataVotes,
        backgroundColor: colors || '#2563eb',
        borderRadius: 6,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          ticks: { stepSize: 1 }
        }
      },
      plugins: {
        legend: { display: false }
      }
    }
  });
}

document.getElementById('formAddCandidate').addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = document.getElementById('btnSaveCandidate');
  btn.disabled = true;
  btn.innerHTML = 'Menyimpan...';

  try {
    const no = parseInt(document.getElementById('candNo').value);
    const nama = document.getElementById('candName').value;
    const visi = document.getElementById('candVision').value;
    const misi = document.getElementById('candMission').value;
    const photoUrl = document.getElementById('candPhotoUrl').value;
    
    await addDoc(collection(db, "candidates"), {
      nomorUrut: no,
      nama: nama,
      visi: visi,
      misi: misi,
      photoUrl: photoUrl,
      votes: 0
    });

    Swal.fire('Berhasil', 'Kandidat berhasil ditambahkan!', 'success');
    document.getElementById('formAddCandidate').reset();
    const modal = bootstrap.Modal.getInstance(document.getElementById('modalAddCandidate'));
    modal.hide();
    loadCandidates();
  } catch (error) {
    console.error(error);
    Swal.fire('Gagal', 'Gagal menambah kandidat.', 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = 'Simpan Kandidat';
  }
});

window.deleteCandidate = async (id) => {
  const res = await Swal.fire({
    title: 'Hapus Kandidat?',
    text: "Data kandidat dan perolehan suaranya akan dihapus permanen!",
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#ef4444',
    confirmButtonText: 'Ya, Hapus!'
  });
  if (res.isConfirmed) {
    try {
      await deleteDoc(doc(db, "candidates", id));
      Swal.fire('Terhapus!', 'Kandidat berhasil dihapus.', 'success');
      loadCandidates();
    } catch (e) {
      Swal.fire('Gagal', 'Terjadi kesalahan.', 'error');
    }
  }
};

document.getElementById('btnResetVotes').addEventListener('click', async () => {
  const res = await Swal.fire({
    title: 'RESET SEMUA SUARA?',
    text: "Tindakan ini akan mengembalikan semua perolehan suara kandidat menjadi 0 dan menghapus semua catatan pemilih! Gunakan hanya saat ingin memulai ulang pemilu.",
    icon: 'error',
    showCancelButton: true,
    confirmButtonColor: '#ef4444',
    confirmButtonText: 'SAYA YAKIN, RESET SEKARANG!'
  });

  if (res.isConfirmed) {
    Swal.showLoading();
    try {
      // Reset candidate votes to 0
      const cands = await getDocs(collection(db, "candidates"));
      for (const c of cands.docs) {
        await updateDoc(doc(db, "candidates", c.id), { votes: 0 });
      }
      // Delete all votes logs
      const votes = await getDocs(collection(db, "votes"));
      for (const v of votes.docs) {
        await deleteDoc(doc(db, "votes", v.id));
      }
      
      Swal.fire('Berhasil Reset', 'Semua perolehan suara kembali 0.', 'success');
      loadCandidates();
    } catch (e) {
      console.error(e);
      Swal.fire('Gagal', 'Terjadi kesalahan saat mereset data.', 'error');
    }
  }
});

async function init() {
  const isAdmin = await checkAdmin();
  if (isAdmin) {
    loadElectionSettings();
    loadCandidates();
    // Auto refresh candidates every 10 seconds for live update
    setInterval(loadCandidates, 10000);
  }
}

document.addEventListener('DOMContentLoaded', init);
