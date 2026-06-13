// ═══════════════════════════════════════════════════════════════
//  ASISTEN LINA — script.js
//  Urutan:
//  1. Konfigurasi & State Global
//  2. Navigasi (switchPage, toggleTheme)
//  3. Kirim Jurnal (kirimJurnal + helper typewriter)
//  4. Modal utilitas (closeCustomAlert, closeErrorAiModal, closeNetworkModal)
//  5. Dashboard (initDashboard, muatDataDashboard, resetDashboard)
//  6. Helper grafik (_renderChart, _renderKosongChart)
//  7. Mobile Navbar (toggleMobileNav, closeMobileNav, toggleMobileDropdown)
//  8. Mode Guru (bukaModalGuru, tutupModalGuru, cekPinGuru)
//  9. Inisialisasi (window.onload, event listeners)
// ═══════════════════════════════════════════════════════════════


// ───────────────────────────────────────────────────────────────
// 1. KONFIGURASI & STATE GLOBAL
// ───────────────────────────────────────────────────────────────

const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwbnFQtzINgJX7ntTG3w0psg8B_JAFnXzrwBgJpDnumEFOvfcoMDkukGqYW3DSEc12D/exec';
const GURU_PIN   = '2306';

let currentChart        = null;
let isGuruMode          = false;
let dashboardStartIndex = 0;


// ───────────────────────────────────────────────────────────────
// 2. NAVIGASI
// ───────────────────────────────────────────────────────────────

function switchPage(pageId) {
  document.querySelectorAll('.page-section').forEach(section => section.classList.remove('active'));
  document.querySelectorAll('.nav-links a').forEach(link => link.classList.remove('active'));

  document.getElementById('section-' + pageId).classList.add('active');
  document.getElementById('nav-' + pageId).classList.add('active');

  if (pageId === 'dashboard') {
    muatDataDashboard();
  }
}

function toggleTheme() {
  const isDark      = document.documentElement.getAttribute('data-theme') === 'dark';
  const targetTheme = isDark ? 'light' : 'dark';

  document.documentElement.setAttribute('data-theme', targetTheme);
  document.body.classList.toggle('dark-theme-active', !isDark);

  const labelStatus = document.getElementById('label-status-tema');
  if (labelStatus) {
    labelStatus.textContent = isDark ? 'Mode Terang' : 'Mode Gelap';
  }
}


// ───────────────────────────────────────────────────────────────
// 3. KIRIM JURNAL
// ───────────────────────────────────────────────────────────────

async function kirimJurnal(event) {
  event.preventDefault();

  const isiJurnal  = document.getElementById('isiJurnal').value.trim();
  const jumlahKata = isiJurnal ? isiJurnal.split(/\s+/).filter(k => k.length > 0).length : 0;

  if (jumlahKata < 75) {
    document.getElementById('modal-warning-text').innerHTML =
      `Saat ini tulisanmu baru <span style="color:var(--gold);font-weight:700;font-size:1.1rem;">${jumlahKata}</span> kata.`;
    document.getElementById('customAlertModal').classList.add('modal-show');
    return;
  }

  const btn          = document.getElementById('submitBtn');
  const originalText = btn.innerHTML;

  btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> LINA sedang membaca tulisanmu...';
  btn.disabled  = true;

  const elApresiasi  = document.getElementById('txtApresiasi');
  const elBagus      = document.getElementById('txtBagus');
  const elPerbaikan  = document.getElementById('txtPerbaikan');
  const statusLoader = document.getElementById('linaThinkingStatus');

  elApresiasi.innerHTML = '';
  elBagus.innerHTML     = '';
  elPerbaikan.innerHTML = '';

  const feedbackBox = document.getElementById('feedbackContainer');
  feedbackBox.style.display = 'block';
  feedbackBox.scrollIntoView({ behavior: 'smooth' });

  statusLoader.innerHTML = `
    <div class="lina-status-loader">
      <img src="./lina.png" class="lina-avatar-thinking" alt="LINA">
      <div class="thinking-text-wrapper">
        <span>sedang menganalisa tulisanmu</span>
        <div class="wave-dots">
          <span></span><span></span><span></span>
        </div>
      </div>
    </div>
  `;

  const payload = {
    namaSiswa    : document.getElementById('namaSiswa').value,
    judulBuku    : document.getElementById('judulBuku').value,
    noWaOrangTua : document.getElementById('waInput').value,
    isiJurnal    : isiJurnal
  };

  try {
    const response = await fetch(SCRIPT_URL, {
      method : 'POST',
      body   : JSON.stringify(payload)
    });

    const result = await response.json();

    if (result.status === 'success') {
      setTimeout(() => {
        statusLoader.innerHTML = '';
        _ketikTeks(elApresiasi, result.apresiasi, () => {
          _ketikTeks(elBagus, result.bagian_bagus, () => {
            _ketikTeks(elPerbaikan, result.bagian_perbaikan);
          });
        });
      }, 1000);

      document.getElementById('jurnalForm').reset();

    } else {
      feedbackBox.style.display = 'none';
      document.getElementById('modal-error-ai-text').innerHTML = `
        <span style="font-size:1rem;line-height:1.5;color:#b91c1c;">
          Server LINA sedang mengalami kendala teknis.
        </span>
      `;
      document.getElementById('linaErrorAiModal').classList.add('lina-show-aktif');
    }

  } catch (error) {
    feedbackBox.style.display = 'none';
    document.getElementById('linaNetworkModal').classList.add('lina-show-aktif');

  } finally {
    btn.innerHTML = originalText;
    btn.disabled  = false;
  }
}

// Efek mesin ketik karakter per karakter
function _ketikTeks(elTarget, teks, callback) {
  if (!teks) {
    if (callback) callback();
    return;
  }

  let idx = 0;
  const KECEPATAN = 15;

  function ketik() {
    if (idx < teks.length) {
      elTarget.innerHTML += teks.charAt(idx);
      idx++;
      setTimeout(ketik, KECEPATAN);
    } else {
      setTimeout(() => { if (callback) callback(); }, 500);
    }
  }

  ketik();
}


// ───────────────────────────────────────────────────────────────
// 4. MODAL UTILITAS
// ───────────────────────────────────────────────────────────────

function closeCustomAlert() {
  document.getElementById('customAlertModal').classList.remove('modal-show');
}

function closeErrorAiModal() {
  document.getElementById('linaErrorAiModal').classList.remove('lina-show-aktif');
  document.getElementById('isiJurnal').scrollIntoView({ behavior: 'smooth' });
  document.getElementById('isiJurnal').focus();
}

function closeNetworkModal() {
  document.getElementById('linaNetworkModal').classList.remove('lina-show-aktif');
  document.getElementById('isiJurnal').scrollIntoView({ behavior: 'smooth' });
  document.getElementById('isiJurnal').focus();
}


// ───────────────────────────────────────────────────────────────
// 5. DASHBOARD
// ───────────────────────────────────────────────────────────────

// Inisialisasi: ambil titik reset dari spreadsheet, lalu muat data
async function initDashboard() {
  try {
    const res  = await fetch(SCRIPT_URL + '?action=getResetIndex');
    const json = await res.json();
    dashboardStartIndex = parseInt(json.resetIndex) || 0;
  } catch (e) {
    dashboardStartIndex = 0;
  }

  await muatDataDashboard();
}

// Tarik data dari spreadsheet dan tampilkan grafik + leaderboard
async function muatDataDashboard() {
  const tbody = document.getElementById('leaderboard-data');

  try {
    const response  = await fetch(SCRIPT_URL);
    const data      = await response.json();
    const dataAktif = Array.isArray(data) ? data.slice(dashboardStartIndex) : [];

    if (dataAktif.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="4" class="text-center" style="padding:1.5rem;color:var(--text-muted);">
            <i class="fa-solid fa-chart-simple" style="font-size:1.4rem;opacity:0.35;display:block;margin-bottom:0.4rem;"></i>
            Belum ada data baru sejak reset terakhir.
          </td>
        </tr>`;
      _renderKosongChart();
      return;
    }

    // Olah data: rekap per siswa + array untuk grafik
    const rekapSiswa       = {};
    const arraySkorKelas   = [];
    const arrayLabelGrafik = [];

    dataAktif.forEach((item, index) => {
      arraySkorKelas.push(Number(item.skorUtama));
      arrayLabelGrafik.push('Jurnal ' + (index + 1));

      if (!rekapSiswa[item.namaSiswa]) {
        rekapSiswa[item.namaSiswa] = { buku: 0, totalSkor: 0 };
      }
      rekapSiswa[item.namaSiswa].buku      += 1;
      rekapSiswa[item.namaSiswa].totalSkor += Number(item.skorUtama);
    });

    // Urutkan leaderboard: rata-rata skor tertinggi di atas
    const listSiswa = Object.keys(rekapSiswa).map(nama => ({
      nama      : nama,
      buku      : rekapSiswa[nama].buku,
      rataNilai : Math.round(rekapSiswa[nama].totalSkor / rekapSiswa[nama].buku)
    })).sort((a, b) => b.rataNilai - a.rataNilai);

    const MEDALI     = ['🥇', '🥈', '🥉'];
    const KELAS_RANK = ['rank-1', 'rank-2', 'rank-3'];

    tbody.innerHTML = '';

    listSiswa.forEach((siswa, idx) => {
      const rankClass = idx < 3 ? KELAS_RANK[idx] : '';
      const rankCell  = idx < 3
        ? `<span class="rank-badge">${MEDALI[idx]}</span>`
        : `<span class="rank-number">${idx + 1}</span>`;

      const skorKelas = siswa.rataNilai >= 80 ? 'skor-tinggi'
                      : siswa.rataNilai >= 60 ? 'skor-sedang'
                      : 'skor-rendah';

      tbody.innerHTML += `
        <tr class="${rankClass}">
          <td style="text-align:center;">${rankCell}</td>
          <td><span class="nama-siswa-cell">${siswa.nama}</span></td>
          <td style="text-align:center;">
            <span class="jurnal-chip">
              <i class="fa-solid fa-book-open" style="font-size:0.7rem;"></i>&nbsp;${siswa.buku}
            </span>
          </td>
          <td style="text-align:center;">
            <span class="skor-chip ${skorKelas}">${siswa.rataNilai}</span>
          </td>
        </tr>`;
    });

    _renderChart(arrayLabelGrafik, arraySkorKelas);

  } catch (error) {
    tbody.innerHTML = `
      <tr>
        <td colspan="4" class="text-center text-warning">
          <i class="fa-solid fa-triangle-exclamation"></i>
          Gagal sinkronisasi data dari spreadsheet.
        </td>
      </tr>`;
  }
}

// Reset dashboard: simpan titik baru ke spreadsheet, kosongkan tampilan
async function resetDashboard() {
  if (!isGuruMode) return;

  const tbody = document.getElementById('leaderboard-data');
  tbody.innerHTML = `
    <tr>
      <td colspan="4" class="text-center" style="padding:1.2rem;">
        <i class="fa-solid fa-spinner fa-spin"></i> Menyimpan titik reset...
      </td>
    </tr>`;

  try {
    const resData  = await fetch(SCRIPT_URL);
    const allData  = await resData.json();
    const newIndex = Array.isArray(allData) ? allData.length : dashboardStartIndex;

    await fetch(SCRIPT_URL + '?action=setResetIndex&index=' + newIndex);

    dashboardStartIndex = newIndex;

  } catch (e) {
    console.warn('Gagal simpan reset ke spreadsheet:', e);
  }

  _renderKosongChart();

  tbody.innerHTML = `
    <tr>
      <td colspan="4" class="text-center" style="padding:1.5rem;color:var(--text-muted);">
        <i class="fa-solid fa-rotate-left" style="font-size:1.4rem;opacity:0.35;display:block;margin-bottom:0.4rem;"></i>
        Reset berhasil. Menunggu data baru dari siswa.
      </td>
    </tr>`;
}


// ───────────────────────────────────────────────────────────────
// 6. HELPER GRAFIK
// ───────────────────────────────────────────────────────────────

const CHART_CONFIG_BASE = {
  type    : 'line',
  options : {
    responsive          : true,
    maintainAspectRatio : false,
    plugins : { legend: { display: false } },
    scales  : {
      y : { min: 0, max: 100, grid: { color: 'rgba(0,0,0,0.05)' } },
      x : { grid: { display: false } }
    }
  }
};

const DATASET_STYLE = {
  label               : 'Skor Mutu Jurnal Kelas',
  borderColor         : '#2563eb',
  backgroundColor     : 'rgba(37,99,235,0.05)',
  borderWidth         : 3,
  tension             : 0.25,
  fill                : true,
  pointBackgroundColor: '#2563eb',
  pointRadius         : 4
};

function _renderChart(labels, data) {
  const ctx = document.getElementById('chartKelas').getContext('2d');
  if (currentChart) currentChart.destroy();

  currentChart = new Chart(ctx, {
    ...CHART_CONFIG_BASE,
    data: {
      labels,
      datasets: [{ ...DATASET_STYLE, data }]
    }
  });
}

function _renderKosongChart() {
  const ctx = document.getElementById('chartKelas').getContext('2d');
  if (currentChart) { currentChart.destroy(); currentChart = null; }

  currentChart = new Chart(ctx, {
    ...CHART_CONFIG_BASE,
    data: {
      labels   : [],
      datasets : [{ ...DATASET_STYLE, data: [] }]
    }
  });
}


// ───────────────────────────────────────────────────────────────
// 7. MOBILE NAVBAR
// ───────────────────────────────────────────────────────────────

function toggleMobileNav() {
  const drawer  = document.getElementById('mobileDrawer');
  const overlay = document.getElementById('mobileOverlay');
  const trigger = document.getElementById('mobileLinaTrigger');
  if (!drawer) return;

  if (drawer.classList.contains('drawer-open')) {
    closeMobileNav();
  } else {
    drawer.classList.add('drawer-open');
    overlay.classList.add('overlay-show');
    trigger.classList.add('menu-open');
  }
}

function closeMobileNav() {
  const drawer  = document.getElementById('mobileDrawer');
  const overlay = document.getElementById('mobileOverlay');
  const trigger = document.getElementById('mobileLinaTrigger');
  if (!drawer) return;

  drawer.classList.remove('drawer-open');
  trigger.classList.remove('menu-open');

  document.querySelectorAll('.mobile-sub-menu').forEach(sub => sub.classList.remove('sub-open'));
  document.querySelectorAll('.mobile-nav-dropdown').forEach(d => d.classList.remove('sub-active'));

  setTimeout(() => overlay.classList.remove('overlay-show'), 120);
}

function toggleMobileDropdown(dropdownId) {
  const dropdown = document.getElementById(dropdownId);
  if (!dropdown) return;

  const subMenu = dropdown.querySelector('.mobile-sub-menu');
  const isOpen  = subMenu.classList.contains('sub-open');

  // Tutup semua, lalu buka yang diklik (jika sebelumnya tertutup)
  document.querySelectorAll('.mobile-nav-dropdown').forEach(d => {
    d.classList.remove('sub-active');
    d.querySelector('.mobile-sub-menu').classList.remove('sub-open');
  });

  if (!isOpen) {
    dropdown.classList.add('sub-active');
    subMenu.classList.add('sub-open');
  }
}


// ───────────────────────────────────────────────────────────────
// 8. MODE GURU
// ───────────────────────────────────────────────────────────────

function bukaModalGuru() {
  const overlay = document.getElementById('modalGuruOverlay');
  const input   = document.getElementById('inputPinGuru');
  const pesan   = document.getElementById('pesanSalahPin');

  overlay.style.display = 'flex';
  input.value           = '';
  pesan.style.display   = 'none';

  setTimeout(() => input.focus(), 80);
}

function tutupModalGuru() {
  const overlay = document.getElementById('modalGuruOverlay');
  if (overlay) overlay.style.display = 'none';
}

function cekPinGuru() {
  const input = document.getElementById('inputPinGuru');
  const pesan = document.getElementById('pesanSalahPin');
  const pin   = input.value.trim();

  if (pin === GURU_PIN) {
    isGuruMode = true;
    tutupModalGuru();

    const wrapper    = document.getElementById('btn-reset-wrapper');
    const btnDesktop = document.getElementById('btnModeGuru');
    const btnMobile  = document.getElementById('btnModeGuruMobile');

    if (wrapper)    wrapper.classList.remove('hidden');
    if (btnDesktop) { btnDesktop.classList.add('guru-aktif'); btnDesktop.title = 'Mode Guru Aktif'; }
    if (btnMobile)  btnMobile.classList.add('guru-aktif');

  } else {
    pesan.style.display   = 'block';
    input.value           = '';
    input.focus();

    // Animasi goyang sebagai feedback PIN salah
    input.style.animation = 'none';
    input.offsetHeight;
    input.style.animation = 'shakePinInput 0.35s ease';
  }
}

// Inject keyframe animasi goyang PIN ke <head>
(function _injectShakeStyle() {
  if (document.getElementById('_lina-shake-style')) return;
  const style      = document.createElement('style');
  style.id         = '_lina-shake-style';
  style.textContent = `
    @keyframes shakePinInput {
      0%, 100% { transform: translateX(0); }
      20%      { transform: translateX(-6px); }
      40%      { transform: translateX(6px); }
      60%      { transform: translateX(-4px); }
      80%      { transform: translateX(4px); }
    }
  `;
  document.head.appendChild(style);
})();


// ───────────────────────────────────────────────────────────────
// 9. INISIALISASI
// ───────────────────────────────────────────────────────────────

window.onload = () => {
  initDashboard();

  const isDark      = document.documentElement.getAttribute('data-theme') === 'dark';
  const labelStatus = document.getElementById('label-status-tema');

  document.body.classList.toggle('dark-theme-active', isDark);
  if (labelStatus) labelStatus.textContent = isDark ? 'Mode Gelap' : 'Mode Terang';

  // Enter di input PIN = submit
  const inputPin = document.getElementById('inputPinGuru');
  if (inputPin) {
    inputPin.addEventListener('keydown', e => {
      if (e.key === 'Enter') cekPinGuru();
    });
  }

  // Klik di luar kotak modal guru = tutup
  const overlayGuru = document.getElementById('modalGuruOverlay');
  if (overlayGuru) {
    overlayGuru.addEventListener('click', e => {
      if (e.target === overlayGuru) tutupModalGuru();
    });
  }

  // Escape = tutup drawer dan modal guru
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      closeMobileNav();
      tutupModalGuru();
    }
  });
};