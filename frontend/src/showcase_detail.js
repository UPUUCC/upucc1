import { db } from "./firebase.js";
import { doc, getDoc } from "firebase/firestore";

const showcaseDetailContainer = document.getElementById('showcaseDetailContainer');

async function loadShowcaseDetail() {
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');

    if (!id) {
        showcaseDetailContainer.innerHTML = `
            <div class="alert alert-danger text-center">
                Karya tidak ditemukan. <a href="/showcase.html">Kembali ke Galeri</a>
            </div>
        `;
        return;
    }

    try {
        const docRef = doc(db, "showcase", id);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
            showcaseDetailContainer.innerHTML = `
                <div class="alert alert-warning text-center">
                    Karya tidak ada atau telah dihapus. <a href="/showcase.html">Kembali ke Galeri</a>
                </div>
            `;
            return;
        }

        const data = docSnap.data();
        const date = data.createdAt ? data.createdAt.toDate().toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'}) : '-';
        
        // Fungsi untuk mendeteksi link dan membuatnya bisa diklik
        const linkify = (text) => {
            const urlRegex = /(https?:\/\/[^\s]+)|(www\.[^\s]+)/ig;
            return text.replace(urlRegex, function(url) {
                let href = url.startsWith('http') ? url : 'https://' + url;
                return `<a href="${href}" target="_blank" class="text-primary fw-medium" style="text-decoration: underline;">${url}</a>`;
            });
        };

        let deskripsi = data.deskripsi || '';
        const fullDesc = deskripsi.split(/\n\s*\n/).map(p => 
            `<p style="margin-bottom: 1rem;">${linkify(p).replace(/\n/g, '<br>')}</p>`
        ).join('');
        
        const author = data.author || 'Anggota UPUCC';

        let mediaHTML = '';
        if (data.mediaUrl) {
            if (data.mediaUrl.match(/\.(jpeg|jpg|gif|png)$/i)) {
                mediaHTML = `
                <div class="rounded-4 overflow-hidden mb-5 shadow-sm bg-dark border border-secondary border-opacity-25">
                    <img src="${data.mediaUrl}" class="img-fluid w-100" style="max-height: 550px; object-fit: contain;" alt="${data.judul}">
                </div>`;
            } else if (data.mediaUrl.match(/\.(mp4|webm|ogg)$/i)) {
                mediaHTML = `
                    <div class="rounded-4 overflow-hidden mb-5 shadow-sm bg-dark border border-secondary border-opacity-25">
                        <video controls class="w-100" style="max-height: 550px;">
                            <source src="${data.mediaUrl}" type="video/mp4">
                            Video format tidak didukung browser.
                        </video>
                    </div>`;
            } else {
                mediaHTML = `
                <div class="rounded-4 overflow-hidden mb-5 shadow-sm bg-dark border border-secondary border-opacity-25">
                    <img src="${data.mediaUrl}" class="img-fluid w-100" style="max-height: 550px; object-fit: cover;" alt="${data.judul}">
                </div>`;
            }
        }

        const repoHTML = data.repoUrl ? `
            <div class="mt-5 p-4 rounded-4 shadow-sm" style="background: rgba(59, 130, 246, 0.1); border: 1px solid rgba(59, 130, 246, 0.3);">
                <h5 class="fw-bold mb-3 d-flex align-items-center text-primary"><i class="bi bi-github me-2"></i> Tautan Repositori / Demo</h5>
                <a href="${data.repoUrl}" target="_blank" class="btn btn-primary rounded-pill px-4 shadow-sm">Buka Tautan <i class="bi bi-box-arrow-up-right ms-2"></i></a>
            </div>
        ` : '';

        showcaseDetailContainer.innerHTML = `
            <div class="mb-5">
                <div class="mb-4">
                    <a href="/showcase.html" class="btn btn-outline-light btn-sm">
                        <i class="bi bi-arrow-left"></i> Kembali ke Galeri
                    </a>
                </div>
                <div class="mb-2">
                    <span class="badge bg-primary px-3 py-2 rounded-pill shadow-sm">${data.kategori}</span>
                </div>
                <h1 class="fw-bold mb-3 text-white" style="font-size: 2.2rem; line-height: 1.3;">${data.judul}</h1>
                <div class="d-flex align-items-center text-light opacity-75 mb-4 gap-3 fw-medium">
                    <span><i class="bi bi-person-circle me-1 text-primary"></i> ${author}</span>
                    <span><i class="bi bi-calendar3 me-1 text-primary"></i> ${date}</span>
                </div>
            </div>
            
            ${mediaHTML}
            
            <div class="showcase-content mt-4" style="font-size: 1.05rem; text-align: justify; line-height: 1.5; color: #cbd5e1; letter-spacing: 0.2px;">
                <h4 class="fw-bold mb-4 text-white" style="font-size: 1.4rem;"><i class="bi bi-journal-text text-primary me-2"></i> Deskripsi Karya</h4>
                ${fullDesc}
            </div>

            ${repoHTML}

            <hr class="mt-5 mb-4" style="border-color: rgba(255,255,255,0.1);">
            <div class="share-section text-center p-4 rounded-4 shadow-sm mb-5" style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1);">
                <h5 class="fw-bold mb-2 text-white">Bagikan Karya Ini 🚀</h5>
                <p class="mb-4 small" style="color: #94a3b8;">Kagum dengan karya ini? Yuk, sebarkan dan inspirasi teman-teman Anda untuk berkarya lebih besar!</p>
                <div class="d-flex gap-3 justify-content-center flex-wrap">
                    <a href="https://api.whatsapp.com/send?text=${encodeURIComponent('🌟 *' + data.judul + '*\n\nKarya keren dari UPU-CC! Cek selengkapnya:\n' + window.location.href)}" target="_blank" class="btn btn-success rounded-circle shadow-sm d-flex align-items-center justify-content-center" style="width: 48px; height: 48px;" title="Bagikan ke WhatsApp">
                        <i class="bi bi-whatsapp fs-5"></i>
                    </a>
                    <a href="https://t.me/share/url?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent('🌟 ' + data.judul + ' - Karya dari UPU-CC')}" target="_blank" class="btn rounded-circle shadow-sm d-flex align-items-center justify-content-center" style="width: 48px; height: 48px; background-color: #0088cc; color: white;" title="Bagikan ke Telegram">
                        <i class="bi bi-telegram fs-5"></i>
                    </a>
                    <button id="btnShareNative" class="btn btn-primary rounded-circle shadow-sm d-flex align-items-center justify-content-center" style="width: 48px; height: 48px;" title="Lainnya (IG, Threads, dll)">
                        <i class="bi bi-share-fill fs-5"></i>
                    </button>
                    <button id="btnCopyLink" class="btn rounded-circle shadow-sm d-flex align-items-center justify-content-center" style="width: 48px; height: 48px; background: rgba(255,255,255,0.1); color: white; border: 1px solid rgba(255,255,255,0.2);" title="Salin Tautan">
                        <i class="bi bi-link-45deg fs-4"></i>
                    </button>
                </div>
            </div>
        `;
        
        document.title = `${data.judul} - UPU-CC Showcase`;

        // Event Listeners for Share Buttons
        document.getElementById('btnShareNative')?.addEventListener('click', async () => {
            if (navigator.share) {
                try {
                    await navigator.share({
                        title: data.judul,
                        text: 'Karya keren dari UPU-CC! Yuk lihat selengkapnya.',
                        url: window.location.href
                    });
                } catch (err) {
                    console.log('User cancelled share');
                }
            } else {
                alert('Browser Anda tidak mendukung fitur berbagi langsung. Silakan gunakan tombol salin tautan.');
            }
        });

        document.getElementById('btnCopyLink')?.addEventListener('click', () => {
            navigator.clipboard.writeText(window.location.href).then(() => {
                alert('Tautan berhasil disalin ke clipboard!');
            }).catch(() => {
                alert('Gagal menyalin tautan.');
            });
        });

    } catch (error) {
        console.error("Error fetching showcase detail: ", error);
        showcaseDetailContainer.innerHTML = `
            <div class="alert alert-danger text-center">
                Gagal memuat detail karya. Silakan coba lagi.
            </div>
        `;
    }
}

document.addEventListener('DOMContentLoaded', loadShowcaseDetail);

