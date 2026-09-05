<?php
$pageTitle = 'Struktur Organisasi';
$activeMenu = 'struktur';
require_once __DIR__ . '/partials/header.php';

/**
 * Halaman Struktur Organisasi -- ditampilkan sebagai BAGAN/POHON dengan
 * tata letak mengikuti bagan "STRUKTUR ORGANISASI UPUCC":
 *
 *                     KETUM
 *                       |
 *                    WAKETUM
 *          ______________|______________
 *         |               |              |
 *     SEKRETARIS    (garis diteruskan)  BENDAHARA
 *                         |
 *          ______________|______________________________
 *         |               |              |               |
 *   Divisi Progra.   Divisi NetSect  Divisi Knowtech  Divisi Multimedia
 *   (Kadiv+Wakadiv)   (Kadiv+Wakadiv) (Kadiv+Wakadiv)  (Kadiv+Wakadiv)
 *         |                |              |                |
 *      Anggota           Anggota        Anggota          Anggota
 *
 * Setiap kotak memakai FOTO & NAMA asli dari akun login yang dibuatkan
 * lewat menu "Anggota / Struktur" di Dashboard CMS (tabel members),
 * sehingga bagan ini selalu sinkron dengan akun yang benar-benar ada.
 * Hanya anggota dengan tampil_struktur = 1 yang ditampilkan.
 *
 * Sekretaris & Bendahara ditempatkan sebagai "anak" WAKETUM di baris
 * pertama, sedangkan ke-4 Divisi ditempatkan sebagai "anak" WAKETUM di
 * baris kedua (lebih bawah). Supaya garis vertikal dari WAKETUM tetap
 * lurus menerus ke tengah baris Divisi (persis seperti pada bagan
 * referensi), dipakai satu node tak-terlihat (.oc-trunk) di tengah
 * baris Sekretaris/Bendahara yang isinya adalah <ul> baris Divisi.
 *
 * CATATAN PENTING: seluruh CSS bagan ini SENGAJA ditulis langsung di
 * dalam <style> pada file ini (bukan hanya mengandalkan css/style.css),
 * supaya bagan tetap tampil rapi walau file css/style.css di server
 * belum ter-upload ulang / masih ke-cache oleh browser. Jika Anda
 * meng-upload ulang, upload folder ini APA ADANYA (jangan hanya
 * mengganti sebagian file) lalu hard refresh browser (Ctrl+Shift+R).
 */

function oc_fetch_all($pdo, $role, $divisiId = null) {
    if ($divisiId === null) {
        $stmt = $pdo->prepare("SELECT * FROM members WHERE role = ? AND tampil_struktur = 1 ORDER BY urutan ASC, id ASC");
        $stmt->execute([$role]);
    } else {
        $stmt = $pdo->prepare("SELECT * FROM members WHERE role = ? AND divisi_id = ? AND tampil_struktur = 1 ORDER BY urutan ASC, id ASC");
        $stmt->execute([$role, $divisiId]);
    }
    return $stmt->fetchAll();
}

/** Render satu kotak orang (foto bulat + label nama) berdasarkan akun asli di tabel members */
function oc_person_node($m, $roleClass, $jabatanFallback = null) {
    $foto = $m['foto'] ? 'uploads/anggota/' . e($m['foto']) : null;
    $jabatan = $m['jabatan_text'] ?: ($jabatanFallback ?: label_role($m['role']));
    ?>
    <div class="oc-person role-<?= e($roleClass) ?>">
      <div class="oc-avatar-ring">
        <?php if ($foto): ?>
          <img src="<?= $foto ?>" alt="<?= e($m['nama']) ?>">
        <?php else: ?>
          <div class="oc-avatar-placeholder"><i class="bi bi-person-fill"></i></div>
        <?php endif; ?>
      </div>
      <div class="oc-label">
        <div class="oc-label-name"><?= e($m['nama']) ?></div>
        <div class="oc-label-jabatan"><?= e($jabatan) ?></div>
      </div>
    </div>
    <?php
}

/** Kotak kosong (placeholder) jika jabatan tersebut belum ada akunnya */
function oc_empty_node($label, $roleClass = 'kosong') {
    ?>
    <div class="oc-person role-<?= e($roleClass) ?> oc-kosong">
      <div class="oc-avatar-ring"><div class="oc-avatar-placeholder"><i class="bi bi-person"></i></div></div>
      <div class="oc-label">
        <div class="oc-label-name"><?= e($label) ?></div>
        <div class="oc-label-jabatan">Belum diisi</div>
      </div>
    </div>
    <?php
}

/** Render sekelompok orang (bisa lebih dari satu akun untuk jabatan yang sama) */
function oc_person_group($list, $roleClass, $jabatanFallback, $emptyLabel) {
    if ($list) {
        if (count($list) > 1) echo '<div class="oc-multi">';
        foreach ($list as $m) { oc_person_node($m, $roleClass, $jabatanFallback); }
        if (count($list) > 1) echo '</div>';
    } else {
        oc_empty_node($emptyLabel, $roleClass);
    }
}

$ketumList      = oc_fetch_all($pdo, 'ketum');
$waketumList    = oc_fetch_all($pdo, 'waketum');
$sekretarisList = oc_fetch_all($pdo, 'sekretaris');
$bendaharaList  = oc_fetch_all($pdo, 'bendahara');
$divisions      = $pdo->query("SELECT * FROM divisions ORDER BY id ASC")->fetchAll();

$divisionData = [];
foreach ($divisions as $d) {
    $divisionData[] = [
        'div'     => $d,
        'kadiv'   => oc_fetch_all($pdo, 'kadiv', $d['id']),
        'wakadiv' => oc_fetch_all($pdo, 'wakadiv', $d['id']),
        'anggota' => oc_fetch_all($pdo, 'anggota', $d['id']),
    ];
}

$adaDivisiIsi = false;
foreach ($divisionData as $dd) {
    if ($dd['kadiv'] || $dd['wakadiv'] || $dd['anggota']) { $adaDivisiIsi = true; break; }
}
$adaData = $ketumList || $waketumList || $sekretarisList || $bendaharaList || $adaDivisiIsi;
?>
<style>
/* =====================================================================
   BAGAN STRUKTUR ORGANISASI (org chart) -- khusus struktur.php
   Ditulis inline di sini (bukan hanya di css/style.css) supaya bagan
   tetap tampil benar meski file css/style.css eksternal belum
   ter-upload ulang / masih ke-cache oleh browser.
   Teknik "CSS-only tree": setiap level dibuat dari <ul><li> yang saling
   bersarang, garis penghubung dibuat lewat border pada ::before/::after
   tiap <li> (bukan gambar / bukan bullet list bawaan browser).
   ===================================================================== */
.oc-wrap { width:100%; overflow-x:auto; padding:10px 4px 20px; }

.oc-wrap .tree,
.oc-wrap .tree ul,
.oc-wrap .tree li { margin:0; padding:0; list-style:none; list-style-type:none; }
.oc-wrap .tree { text-align:center; display:inline-block; min-width:100%; }
.oc-wrap .tree ul { display:flex; padding-top:36px; position:relative; }
.oc-wrap .tree > ul { padding-top:0; justify-content:center; }
.oc-wrap .tree li { flex:1; display:flex; flex-direction:column; align-items:center; position:relative; padding:36px 16px 0; }

/* garis vertikal turun dari kotak induk ke baris anak */
.oc-wrap .tree li::before {
  content:''; position:absolute; top:0; left:50%; width:0; height:36px;
  border-left:2.5px solid #9fb3cc;
}
.oc-wrap .tree > ul > li::before { display:none; }

/* garis horizontal penghubung antar-saudara pada satu baris <ul> */
.oc-wrap .tree ul:not(.tree > ul)::before {
  content:''; position:absolute; top:0; left:0; right:0; height:0;
  border-top:2.5px solid #9fb3cc;
}
.oc-wrap .tree ul li:first-child::after,
.oc-wrap .tree ul li:last-child::after { content:''; position:absolute; top:0; width:50%; height:2.5px; background:#f5f7fa; }
.oc-wrap .tree ul li:first-child::after { left:0; }
.oc-wrap .tree ul li:last-child::after { right:0; }
.oc-wrap .tree > ul > li:first-child::after,
.oc-wrap .tree > ul > li:last-child::after { display:none; }
.oc-wrap .tree ul:not(.tree > ul) li:only-child::after { display:none; }
/* Baris yang cuma berisi 1 kotak (misal WAKETUM) -- tidak perlu garis
   horizontal, cukup garis vertikal lurus. Dipakai class ".single"
   langsung dari HTML (bukan :has()) supaya kompatibel di semua browser. */
.oc-wrap .tree ul.oc-row-single::before { display:none; }

/* ---------------------------------------------------------------------
   Kotak "orang" -- foto bulat (bingkai dua warna) + label nama gelap.
   --------------------------------------------------------------------- */
.oc-wrap .oc-multi { display:flex; flex-direction:column; align-items:center; gap:18px; }

.oc-wrap .oc-person { display:inline-flex; flex-direction:column; align-items:center; position:relative; z-index:1; width:132px; }

.oc-wrap .oc-avatar-ring {
  width:88px; height:88px; border-radius:50%; padding:4px; margin-bottom:8px;
  background:conic-gradient(var(--upucc-secondary, #1e6fd9) 0 50%, var(--upucc-primary, #0d2b4e) 50% 100%);
  box-shadow:0 3px 8px rgba(13,43,78,.25);
  flex:none; display:block;
}
.oc-wrap .oc-person.role-ketum .oc-avatar-ring {
  background:conic-gradient(var(--upucc-accent, #f2a900) 0 50%, var(--upucc-primary, #0d2b4e) 50% 100%);
  width:98px; height:98px;
}
.oc-wrap .oc-person.role-waketum .oc-avatar-ring { width:92px; height:92px; }
.oc-wrap .oc-person.role-anggota .oc-avatar-ring { width:60px; height:60px; padding:3px; }

.oc-wrap .oc-avatar-ring img, .oc-wrap .oc-avatar-ring .oc-avatar-placeholder {
  width:100%; height:100%; border-radius:50%; object-fit:cover; display:block;
  border:3px solid #fff; background:#eef2f7;
}
.oc-wrap .oc-avatar-ring .oc-avatar-placeholder {
  display:flex; align-items:center; justify-content:center; color:#9fb3cc; font-size:1.5rem;
}

.oc-wrap .oc-label {
  background:var(--upucc-primary, #0d2b4e); color:#fff; border-radius:8px;
  padding:6px 12px; text-align:center; min-width:118px; max-width:150px;
  box-shadow:0 2px 6px rgba(13,43,78,.25);
}
.oc-wrap .oc-person.role-ketum .oc-label { background:linear-gradient(135deg, var(--upucc-primary, #0d2b4e), #163f6e); border:1px solid var(--upucc-accent, #f2a900); }
.oc-wrap .oc-label-name { font-weight:700; font-size:.82rem; line-height:1.2; word-break:break-word; }
.oc-wrap .oc-label-jabatan { font-size:.66rem; font-weight:600; letter-spacing:.3px; text-transform:uppercase; color:var(--upucc-accent, #f2a900); margin-top:2px; }
.oc-wrap .oc-person.role-anggota .oc-label { min-width:0; padding:4px 8px; }
.oc-wrap .oc-person.role-anggota .oc-label-name { font-size:.7rem; }
.oc-wrap .oc-person.role-anggota .oc-label-jabatan { display:none; }

/* Kotak kosong (placeholder) jika jabatan tersebut belum ada akunnya */
.oc-wrap .oc-person.oc-kosong .oc-avatar-ring { background:#dbe3ee; }
.oc-wrap .oc-person.oc-kosong .oc-avatar-placeholder { background:#f1f4f9; border:3px dashed #b9c6d6; }
.oc-wrap .oc-person.oc-kosong .oc-label { background:#eef2f7; color:#7c8ea6; box-shadow:none; }
.oc-wrap .oc-person.oc-kosong .oc-label-jabatan { color:#9fb3cc; }

/* Node tak-terlihat: hanya berfungsi meneruskan garis vertikal dari
   baris Sekretaris/Bendahara turun ke baris 4 Divisi (garis tengah). */
.oc-wrap .oc-trunk { width:6px; min-width:6px; padding:0; margin:0; }

/* ---------------------------------------------------------------------
   Kotak Divisi -- judul divisi + Kadiv & Wakadiv berdampingan + Anggota.
   --------------------------------------------------------------------- */
.oc-wrap .oc-division { display:flex; flex-direction:column; align-items:center; }
.oc-wrap .oc-division-title {
  background:linear-gradient(135deg, var(--upucc-primary, #0d2b4e), var(--upucc-secondary, #1e6fd9));
  color:#fff; font-weight:700; font-size:.82rem; letter-spacing:.3px; text-transform:uppercase;
  padding:8px 16px; border-radius:8px; margin-bottom:18px; box-shadow:0 2px 6px rgba(13,43,78,.2);
  white-space:nowrap;
}
.oc-wrap .oc-division-pair { display:flex; gap:14px; justify-content:center; }
.oc-wrap .oc-division-empty { font-size:.72rem; color:#9fb3cc; font-style:italic; margin-top:4px; }

.oc-wrap .oc-division-connector { width:0; height:22px; border-left:2.5px solid #9fb3cc; margin:2px 0 0; }

/* Kotak "Anggota" -- kumpulan anggota divisi ditampilkan sebagai chip
   yang dapat mengalir (flex-wrap), supaya jumlah anggota berapa pun
   tetap rapi tanpa membuat pohon melebar tak terkendali. */
.oc-wrap .oc-anggota-group { min-width:170px; max-width:280px; text-align:center; margin-top:14px; }
.oc-wrap .oc-anggota-title { font-weight:700; color:var(--upucc-primary, #0d2b4e); font-size:.72rem; text-transform:uppercase; letter-spacing:.3px; margin-bottom:10px; }
.oc-wrap .oc-anggota-list { display:flex; flex-wrap:wrap; gap:12px 10px; justify-content:center; }

@media (max-width:768px) {
  .oc-wrap .oc-person { width:104px; }
  .oc-wrap .oc-avatar-ring { width:70px; height:70px; }
  .oc-wrap .oc-person.role-ketum .oc-avatar-ring { width:78px; height:78px; }
  .oc-wrap .oc-label { min-width:96px; padding:5px 8px; }
  .oc-wrap .oc-label-name { font-size:.72rem; }
  .oc-wrap .oc-label-jabatan { font-size:.58rem; }
  .oc-wrap .oc-division-title { font-size:.72rem; padding:6px 10px; }
}
</style>

<div class="container my-5">
  <h2 class="section-title">Struktur Organisasi UPUCC</h2>
  <p class="text-muted mb-4">Bagan berikut menampilkan susunan pengurus UPUCC beserta foto dan nama akun masing-masing, sesuai data yang dikelola lewat Dashboard.</p>

  <?php if (!$adaData): ?>
    <p class="text-muted">Data struktur organisasi belum diisi.</p>
  <?php else: ?>

  <div class="oc-wrap">
    <div class="tree">
      <ul>
        <li>
          <?php oc_person_group($ketumList, 'ketum', 'Ketua Umum', 'Ketua Umum'); ?>

          <ul class="oc-row-single">
            <li>
              <?php oc_person_group($waketumList, 'waketum', 'Wakil Ketua Umum', 'Wakil Ketua Umum'); ?>

              <ul>
                <!-- Kiri: Sekretaris -->
                <li>
                  <?php oc_person_group($sekretarisList, 'sekretaris', 'Sekretaris', 'Sekretaris'); ?>
                </li>

                <!-- Tengah: node tak-terlihat, hanya meneruskan garis lurus turun
                     ke baris ke-4 Divisi (supaya garis vertikal WAKETUM tampak
                     menerus lurus di tengah, persis seperti bagan referensi) -->
                <li>
                  <div class="oc-person oc-trunk"></div>
                  <ul>
                    <?php foreach ($divisionData as $dd):
                        $d = $dd['div'];
                        $adaKadivWakadiv = $dd['kadiv'] || $dd['wakadiv'];
                    ?>
                    <li>
                      <div class="oc-division">
                        <div class="oc-division-title"><?= e($d['nama']) ?></div>

                        <?php if ($adaKadivWakadiv): ?>
                        <div class="oc-division-pair">
                          <?php if ($dd['kadiv']): foreach ($dd['kadiv'] as $m) { oc_person_node($m, 'kadiv', 'Ketua Divisi ' . $d['nama']); } else: ?>
                            <?php oc_empty_node('Ketua Divisi', 'kadiv'); ?>
                          <?php endif; ?>
                          <?php if ($dd['wakadiv']): foreach ($dd['wakadiv'] as $m) { oc_person_node($m, 'wakadiv', 'Wakil Ketua Divisi ' . $d['nama']); } else: ?>
                            <?php oc_empty_node('Wakil Ketua Divisi', 'wakadiv'); ?>
                          <?php endif; ?>
                        </div>
                        <?php else: ?>
                        <div class="oc-division-empty">Kadiv &amp; Wakadiv belum diisi</div>
                        <?php endif; ?>

                        <?php if ($dd['anggota']): ?>
                        <div class="oc-division-connector"></div>
                        <div class="oc-anggota-group">
                          <div class="oc-anggota-title">Anggota (<?= count($dd['anggota']) ?>)</div>
                          <div class="oc-anggota-list">
                            <?php foreach ($dd['anggota'] as $m) { oc_person_node($m, 'anggota'); } ?>
                          </div>
                        </div>
                        <?php endif; ?>
                      </div>
                    </li>
                    <?php endforeach; ?>
                  </ul>
                </li>

                <!-- Kanan: Bendahara -->
                <li>
                  <?php oc_person_group($bendaharaList, 'bendahara', 'Bendahara', 'Bendahara'); ?>
                </li>
              </ul>
            </li>
          </ul>
        </li>
      </ul>
    </div>
  </div>

  <?php endif; ?>
</div>
<script>
// Bagan bisa lebih lebar dari layar (terutama di HP), jadi saat halaman
// dibuka posisi geser (scroll) horizontal langsung ditengahkan supaya
// KETUM/WAKETUM langsung terlihat, tidak perlu geser ke kiri dulu.
document.addEventListener('DOMContentLoaded', function () {
  var wrap = document.querySelector('.oc-wrap');
  if (wrap) { wrap.scrollLeft = (wrap.scrollWidth - wrap.clientWidth) / 2; }
});
</script>
<?php require_once __DIR__ . '/partials/footer.php'; ?>
