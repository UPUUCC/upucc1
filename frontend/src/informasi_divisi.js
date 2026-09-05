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
    const logoSrc = divisiData.logoUrl || (divisiData.logo ? (divisiData.logo.startsWith('http') ? divisiData.logo : `uploads/divisi/${divisiData.logo}`) : `https://via.placeholder.com/100?text=${initial}`);

    headerContainer.innerHTML = `
      <div class="d-flex align-items-center gap-3 mb-4">
        <img src="${logoSrc}" style="width:100px;height:100px;object-fit:contain;" alt="Logo ${divisiData.nama}">
        <h2 class="section-title mb-0">Divisi ${divisiData.nama}</h2>
      </div>
      <p class="lead" style="white-space:pre-line;">${nl2br(divisiData.deskripsi || 'Belum ada deskripsi.')}</p>
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
      const fotoUrl = p.fotoUrl || (p.foto ? (p.foto.startsWith('http') ? p.foto : `uploads/anggota/${p.foto}`) : 'https://via.placeholder.com/110?text=Foto');
      const jabatanText = p.jabatan_text || p.jabatan || labelRole(p.role);
      
      membersHTML += `
      <div class="col-md-3 col-6">
        <div class="struktur-card">
          <img src="${fotoUrl}" alt="${p.nama || 'Anggota'}">
          <h6 class="mb-0">${p.nama || 'Tanpa Nama'}</h6>
          <div class="jabatan">${jabatanText}</div>
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
