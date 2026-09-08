import { db } from './firebase.js';
import { collection, getDocs, query, where } from "firebase/firestore";

function nl2br(str) {
  if (typeof str !== 'string') return '';
  return str.replace(/([^>\r\n]?)(\r\n|\n\r|\r|\n)/g, '$1<br>$2');
}

function labelRole(roleStr) {
  if (!roleStr) return 'Anggota';
  const r = roleStr.toLowerCase();
  if (r === 'ketum') return 'Ketua Umum';
  if (r === 'waketum') return 'Wakil Ketua Umum';
  if (r === 'sekretaris') return 'Sekretaris';
  if (r === 'wakil_sekretaris') return 'Wakil Sekretaris';
  if (r === 'wakil_bendahara') return 'Wakil Bendahara';
  if (r === 'bendahara') return 'Bendahara';
  if (r === 'kadiv') return 'Kepala Divisi';
  if (r === 'wakadiv') return 'Wakil Kepala Divisi';
  return 'Anggota';
}

document.addEventListener('DOMContentLoaded', async () => {
  const headerContainer = document.getElementById('divisiHeader');
  const membersContainer = document.getElementById('divisiMembers');
  
  // Ambil slug dari URL parameter
  const urlParams = new URLSearchParams(window.location.search);
  const slug = urlParams.get('slug');

  if (!slug) {
    headerContainer.innerHTML = '<div class="alert alert-danger">Divisi tidak ditemukan. Parameter slug kosong.</div>';
    return;
  }

  try {
    // 1. Fetch Divisi Info
    const divQuery = query(collection(db, "divisions"), where("slug", "==", slug));
    const divSnap = await getDocs(divQuery);
    
    // Fallback: Jika tidak ketemu via slug, coba cari by ID
    let divisiData = null;
    let divisiId = null;

    if (!divSnap.empty) {
      const doc = divSnap.docs[0];
      divisiData = doc.data();
      divisiId = doc.id;
    } else {
      // Coba cari dokument berdasarkan ID (kalau slug = ID)
      const allDivSnap = await getDocs(collection(db, "divisions"));
      const docById = allDivSnap.docs.find(d => d.id === slug);
      if (docById) {
        divisiData = docById.data();
        divisiId = docById.id;
      }
    }

    if (!divisiData) {
      headerContainer.innerHTML = '<div class="alert alert-danger">Divisi tidak ditemukan.</div>';
      return;
    }

    const initial = divisiData.nama ? divisiData.nama.substring(0, 1) : 'U';
    const logoSrc = divisiData.logoUrl || (divisiData.logo ? (divisiData.logo.startsWith('http') ? divisiData.logo : `uploads/divisi/${divisiData.logo}`) : `https://ui-avatars.com/api/?name=${initial}&background=e2e8f0&color=475569&size=128&bold=true`);

    headerContainer.innerHTML = `
      <img src="${logoSrc}" class="divisi-hero-logo" alt="Logo ${divisiData.nama}">
      <span class="info-badge"><i class="bi bi-grid-3x3-gap me-2"></i>Divisi UPUCC</span>
      <h1 class="divisi-hero-name mt-2">Divisi <span class="highlight">${divisiData.nama}</span></h1>
      <p class="divisi-hero-desc">${divisiData.deskripsi ? divisiData.deskripsi.substring(0,220) + (divisiData.deskripsi.length > 220 ? '...' : '') : 'Belum ada deskripsi.'}</p>
    `;

    // 2. Fetch Pengurus
    const membersQuery = collection(db, "members");
    const membersSnap = await getDocs(membersQuery);
    
    let membersList = [];
    membersSnap.forEach(docSnap => {
      const m = docSnap.data();
      // Filter untuk divisi ini (pakai divisi_id atau nama divisi)
      if (m.divisi_id === divisiId || m.divisi === divisiData.nama) {
        membersList.push({ id: docSnap.id, ...m });
      }
    });

    if (membersList.length === 0) {
      membersContainer.innerHTML = '<div class="col-12"><p class="text-muted">Belum ada data pengurus divisi.</p></div>';
      return;
    }

    // Urutkan pengurus (Kadiv -> Wakadiv -> Anggota)
    const roleOrder = { 'kadiv': 1, 'wakadiv': 2, 'anggota': 3 };
    membersList.sort((a, b) => {
      const rA = a.role ? a.role.toLowerCase() : 'anggota';
      const rB = b.role ? b.role.toLowerCase() : 'anggota';
      return (roleOrder[rA] || 99) - (roleOrder[rB] || 99);
    });

    let membersHTML = '';
    membersList.forEach(p => {
      const namaAnggota = p.nama || 'Anggota';
      const initial = namaAnggota.charAt(0).toUpperCase();
      const fallbackFoto = `https://ui-avatars.com/api/?name=${initial}&background=e2e8f0&color=475569&size=128&bold=true`;
      const fotoUrl = p.fotoUrl || (p.foto ? (p.foto.startsWith('http') ? p.foto : `uploads/anggota/${p.foto}`) : fallbackFoto);
      const jabatanText = p.jabatan_text || p.jabatan || labelRole(p.role);
      
      const isLeader = ['kadiv','wakadiv'].includes(p.role ? p.role.toLowerCase() : '');
      membersHTML += `
      <div class="col-md-3 col-6">
        <div class="pengurus-card${isLeader ? ' is-leader' : ''}">
          <div class="pengurus-card-img-wrap">
            <img src="${fotoUrl}" alt="${namaAnggota}">
          </div>
          <h6 class="text-truncate" title="${namaAnggota}">${namaAnggota}</h6>
          <div class="jabatan-text">${jabatanText}</div>
        </div>
      </div>
      `;
    });
    membersContainer.innerHTML = membersHTML;

  } catch (error) {
    console.error("Error fetching divisi detail:", error);
    headerContainer.innerHTML = '<div class="alert alert-danger">Gagal memuat detail divisi.</div>';
    membersContainer.innerHTML = '';
  }
});

