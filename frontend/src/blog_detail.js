import { db } from "./firebase.js";
import { doc, getDoc, updateDoc, increment } from "firebase/firestore";

const blogDetailContainer = document.getElementById('blogDetailContainer');

async function loadBlogDetail() {
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');

    if (!id) {
        blogDetailContainer.innerHTML = `
            <div class="alert alert-danger text-center">
                Artikel tidak ditemukan. <a href="/blog.html">Kembali ke Blog</a>
            </div>
        `;
        return;
    }

    try {
        const docRef = doc(db, "blogs", id);
        const docSnap = await getDoc(docRef);

        // Tambah jumlah penonton (+1) setiap kali halaman dibuka
        updateDoc(docRef, { views: increment(1) }).catch(() => {});

        if (!docSnap.exists()) {
            blogDetailContainer.innerHTML = `
                <div class="alert alert-warning text-center">
                    Artikel tidak ada atau telah dihapus. <a href="/blog.html">Kembali ke Blog</a>
                </div>
            `;
            return;
        }

        const data = docSnap.data();
        
        // Hide if not published
        if (data.status === 'pending') {
            blogDetailContainer.innerHTML = `
                <div class="alert alert-warning text-center">
                    Artikel ini masih menunggu persetujuan admin. <a href="/blog.html">Kembali ke Blog</a>
                </div>
            `;
            return;
        }

        const date = data.createdAt ? data.createdAt.toDate().toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'}) : '-';
        
        // Fungsi untuk mendeteksi link dan membuatnya bisa diklik
        const linkify = (text) => {
            const urlRegex = /(https?:\/\/[^\s]+)|(www\.[^\s]+)/ig;
            return text.replace(urlRegex, function(url) {
                let href = url.startsWith('http') ? url : 'https://' + url;
                return `<a href="${href}" target="_blank" class="text-primary fw-medium" style="text-decoration: underline;">${url}</a>`;
            });
        };

        // Mempercantik paragraf dan spasi
        let isi = data.isi || '';
        // Bungkus setiap blok teks yang dipisah enter ganda menjadi paragraf
        const fullText = isi.split(/\n\s*\n/).map(p => 
            `<p style="margin-bottom: 1rem;">${linkify(p).replace(/\n/g, '<br>')}</p>`
        ).join('');
        
        const author = data.author || 'Admin UPUCC';

        blogDetailContainer.innerHTML = `
            <div class="mb-4">
                <div class="mb-4">
                    <a href="/blog.html" class="btn btn-outline-secondary btn-sm">
                        <i class="bi bi-arrow-left"></i> Kembali ke Blog
                    </a>
                </div>
                <div class="mb-2">
                    <span class="badge bg-primary px-3 py-2 rounded-pill shadow-sm">${data.kategori}</span>
                </div>
                <h1 class="fw-bold mb-3" style="color: #0f172a; font-size: 2.2rem; line-height: 1.3;">${data.judul}</h1>
                <div class="d-flex align-items-center text-secondary mb-4 gap-3 fw-medium flex-wrap">
                    <span><i class="bi bi-person-circle me-1 text-primary"></i> ${author}</span>
                    <span><i class="bi bi-calendar3 me-1 text-primary"></i> ${date}</span>
                    <span><i class="bi bi-eye me-1 text-primary"></i> ${(data.views || 0)} kali dilihat</span>
                </div>
            </div>
            
            <div class="rounded-4 overflow-hidden mb-5 shadow-sm bg-light">
                <img src="${data.gambar}" class="img-fluid w-100" style="max-height: 450px; object-fit: cover;" alt="${data.judul}">
            </div>
            
            <div class="blog-content" style="font-size: 1.05rem; text-align: justify; line-height: 1.5; color: #334155; letter-spacing: 0.2px;">
                ${fullText}
            </div>
            
            <hr class="mt-5 mb-4 opacity-10">
            <div class="share-section text-center p-4 rounded-4 shadow-sm mb-5" style="background-color: #f8fafc; border: 1px solid #e2e8f0;">
                <h5 class="fw-bold mb-2" style="color: #0f172a;">Bagikan Artikel Ini 🚀</h5>
                <p class="text-muted mb-4 small">Bermanfaat? Yuk, sebarkan wawasan dan pengetahuan teknologi ini ke teman-teman serta komunitas Anda!</p>
                <div class="d-flex gap-3 justify-content-center flex-wrap">
                    <a href="https://api.whatsapp.com/send?text=${encodeURIComponent('✨ *' + data.judul + '*\n\nYuk baca selengkapnya di UPU-CC Tech Blog:\n' + window.location.href)}" target="_blank" class="btn btn-success rounded-circle shadow-sm d-flex align-items-center justify-content-center" style="width: 48px; height: 48px;" title="Bagikan ke WhatsApp">
                        <i class="bi bi-whatsapp fs-5"></i>
                    </a>
                    <a href="https://t.me/share/url?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent('✨ ' + data.judul)}" target="_blank" class="btn rounded-circle shadow-sm d-flex align-items-center justify-content-center" style="width: 48px; height: 48px; background-color: #0088cc; color: white;" title="Bagikan ke Telegram">
                        <i class="bi bi-telegram fs-5"></i>
                    </a>
                    <button id="btnShareNative" class="btn btn-primary rounded-circle shadow-sm d-flex align-items-center justify-content-center" style="width: 48px; height: 48px;" title="Lainnya (IG, Threads, dll)">
                        <i class="bi bi-share-fill fs-5"></i>
                    </button>
                    <button id="btnCopyLink" class="btn btn-outline-secondary rounded-circle shadow-sm d-flex align-items-center justify-content-center" style="width: 48px; height: 48px;" title="Salin Tautan">
                        <i class="bi bi-link-45deg fs-4"></i>
                    </button>
                </div>
            </div>
        `;

        document.title = `${data.judul} - UPU-CC Blog`;

        // Event Listeners for Share Buttons
        document.getElementById('btnShareNative')?.addEventListener('click', async () => {
            if (navigator.share) {
                try {
                    await navigator.share({
                        title: data.judul,
                        text: 'Yuk baca artikel menarik ini di UPU-CC Tech Blog!',
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
        console.error("Error fetching blog detail: ", error);
        blogDetailContainer.innerHTML = `
            <div class="alert alert-danger text-center">
                Gagal memuat artikel. Silakan coba lagi.
            </div>
        `;
    }
}

document.addEventListener('DOMContentLoaded', loadBlogDetail);

