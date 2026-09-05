import { resolve } from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
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
      }
    }
  }
});
