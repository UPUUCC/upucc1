import { resolve } from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        acara: resolve(__dirname, 'acara.html'),
        informasi_divisi: resolve(__dirname, 'informasi_divisi.html'),
        informasi: resolve(__dirname, 'informasi.html'),
        login: resolve(__dirname, 'login.html'),
        pendaftaran: resolve(__dirname, 'pendaftaran.html'),
        prestasi: resolve(__dirname, 'prestasi.html'),
        sejarah: resolve(__dirname, 'sejarah.html'),
        struktur: resolve(__dirname, 'struktur.html'),
        dashboard_index: resolve(__dirname, 'dashboard/index.html'),
        dashboard_acara: resolve(__dirname, 'dashboard/acara.html'),
        dashboard_anggota: resolve(__dirname, 'dashboard/anggota.html'),
        dashboard_divisi: resolve(__dirname, 'dashboard/divisi.html'),
        dashboard_informasi: resolve(__dirname, 'dashboard/informasi.html'),
        dashboard_login: resolve(__dirname, 'dashboard/login.html'),
        dashboard_logout: resolve(__dirname, 'dashboard/logout.html'),
        dashboard_pendaftaran: resolve(__dirname, 'dashboard/pendaftaran.html'),
        dashboard_prestasi: resolve(__dirname, 'dashboard/prestasi.html'),
        dashboard_sejarah: resolve(__dirname, 'dashboard/sejarah.html'),
        dashboard_slider: resolve(__dirname, 'dashboard/slider.html'),
        dashboard_saran: resolve(__dirname, 'dashboard/saran.html'),
        dashboard_faq: resolve(__dirname, 'dashboard/faq.html'),
      }
    }
  }
});
