// URL Google Apps Script Web App Resmi ASISTEN LINA
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwbnFQtzINgJX7ntTG3w0psg8B_JAFnXzrwBgJpDnumEFOvfcoMDkukGqYW3DSEc12D/exec";
let currentChart = null;

// Fungsi Menangani Perpindahan Halaman Menu (SPA)
function switchPage(pageId) {
  document.querySelectorAll('.page-section').forEach(section => section.classList.remove('active'));
  document.querySelectorAll('.nav-links a').forEach(link => link.classList.remove('active'));
  document.getElementById('section-' + pageId).classList.add('active');
  document.getElementById('nav-' + pageId).classList.add('active');
  if (pageId === 'dashboard') {
    muatDataDashboard();
  }
}

// Fungsi Mengubah Mode Gelap / Terang (Dark Mode Toggle)
function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme');
  const targetTheme = currentTheme === 'dark' ? 'light' : 'dark';

  // 1. Set atribut tema pada dokumen (tetap mempertahankan sistem warna lama Bapak)
  document.documentElement.setAttribute('data-theme', targetTheme);
  
  // 2. Sinkronisasi class body untuk mengaktifkan animasi geser kapsul CSS
  if (targetTheme === 'dark') {
    document.body.classList.add('dark-theme-active');
  } else {
    document.body.classList.remove('dark-theme-active');
  }

  // 3. Mengubah text label di samping tombol secara dinamis sesuai video
  const labelStatus = document.getElementById('label-status-tema');
  if (labelStatus) {
    labelStatus.textContent = targetTheme === 'dark' ? 'Mode Gelap' : 'Mode Terang';
  }
}

// Fungsi Mengirim Data Jurnal Siswa ke AI & Google Sheets
async function kirimJurnal(event) {
  event.preventDefault();

  // --- LOGIKA VALIDASI MINIMAL 75 KATA ---
  const isiJurnal = document.getElementById('isiJurnal').value.trim();
  const jumlahKata = isiJurnal ? isiJurnal.split(/\s+/).filter(kata => kata.length > 0).length : 0;

  // Jurnal Kurang Kata (Tetap Menggunakan Modal Bawaan Asli Bapak)
  if (jumlahKata < 75) {
    document.getElementById('modal-warning-text').innerHTML = `Saat ini tulisanmu baru <span style="color: var(--gold); font-weight: 700; font-size: 1.1rem;">${jumlahKata}</span> kata.`;
    document.getElementById('customAlertModal').classList.add('modal-show');
    return; 
  }

  const btn = document.getElementById('submitBtn');
  const originalText = btn.innerHTML;
  btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> sedang membaca tulisanmu...`;
  btn.disabled = true;

  // STRATEGI TUKAR POSISI: Munculkan Loader LINA Lebih Awal di Sisi Bawah
  const statusLoader = document.getElementById('linaThinkingStatus');
  const boxApresiasi = document.getElementById('txtApresiasi');
  const boxBagus = document.getElementById('txtBagus');
  const boxPerbaikan = document.getElementById('txtPerbaikan');

  boxApresiasi.innerHTML = "";
  boxBagus.innerHTML = "";
  boxPerbaikan.innerHTML = "";

  document.getElementById('feedbackContainer').style.display = 'block';
  document.getElementById('feedbackContainer').scrollIntoView({ behavior: 'smooth' });

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
    namaSiswa: document.getElementById('namaSiswa').value,
    judulBuku: document.getElementById('judulBuku').value,
    noWaOrangTua: document.getElementById('waInput').value,
    isiJurnal: isiJurnal
  };

  try {
    const response = await fetch(SCRIPT_URL, {
      method: "POST",
      body: JSON.stringify(payload)
    });

    const result = await response.json();
    
    // === BLOK DATA SUKSES DITERIMA ===
    if (result.status === 'success') {
      
      const jalankanKetikTeks = (elemenTarget, teksMentah, callbackLanjutan) => {
        if (!teksMentah) {
          if (callbackLanjutan) callbackLanjutan();
          return;
        }

        let indeksKarakter = 0;
        const KECEPATAN_KETIK = 15; 

        function ketikHuruf() {
          if (indeksKarakter < teksMentah.length) {
            elemenTarget.innerHTML += teksMentah.charAt(indeksKarakter);
            indeksKarakter++;
            setTimeout(ketikHuruf, KECEPATAN_KETIK);
          } else {
            setTimeout(() => {
              if (callbackLanjutan) callbackLanjutan();
            }, 500);
          }
        }
        ketikHuruf();
      };

      // Jeda transisi 1 detik agar animasi berdenyut menghilang dengan halus
      setTimeout(() => {
        statusLoader.innerHTML = "";
        jalankanKetikTeks(boxApresiasi, result.apresiasi, () => {
          jalankanKetikTeks(boxBagus, result.bagian_bagus, () => {
            jalankanKetikTeks(boxPerbaikan, result.bagian_perbaikan);
          });
        });
      }, 1000); 

      document.getElementById('jurnalForm').reset();
      
    // === MANDIRI: MODAL ERROR PROSES AI (ANTI TUMPANG TINDIH) ===
    } else {
      document.getElementById('feedbackContainer').style.display = 'none';
      
      // Masukkan teks pesan galat bawaan Google Apps ke penampung khusus
      document.getElementById('modal-error-ai-text').innerHTML = `
        Gagal Proses Analisa AI: <br>
        <span class="code-block">${result.message}</span>
      `;
      
      // Tembakkan modal error khusus AI
      document.getElementById('errorAiModal').classList.add('modal-show');
    }

  // === MANDIRI: MODAL ERROR SINYAL INTERNET (ANTI TUMPANG TINDIH) ===
  } catch (error) {
    document.getElementById('feedbackContainer').style.display = 'none';
    
    // Tembakkan modal khusus gangguan sinyal internet
    document.getElementById('networkModal').classList.add('modal-show');
    
  } finally {
    btn.innerHTML = originalText;
    btn.disabled = false;
  }
}

// --- FUNGSI BARU UNTUK MENUTUP MODAL MANDIRI ---
function closeErrorAiModal() {
  document.getElementById('errorAiModal').classList.remove('modal-show');
}

function closeNetworkModal() {
  document.getElementById('networkModal').classList.remove('modal-show');
}

// Fungsi Menarik Data Real-Time & Membangun Dashboard Grafik
async function muatDataDashboard() {
  const tbody = document.getElementById('leaderboard-data');
  try {
    const response = await fetch(SCRIPT_URL);
    const data = await response.json();
    if (!data || data.length === 0) {
      tbody.innerHTML = `<tr><td colspan="3" class="text-center">Belum ada rekaman data jurnal literasi di spreadsheet.</td></tr>`;
      return;
    }

    // 1. OLAH DATA UNTUK LEADERBOARD & GRAFIK
    const rekapSiswa = {};
    const arraySkorKelas = [];
    const arrayLabelGrafik = [];
    data.forEach((item, index) => {
      arraySkorKelas.push(Number(item.skorUtama));
      arrayLabelGrafik.push(`Jurnal ${index + 1}`);
      if (!rekapSiswa[item.namaSiswa]) {
        rekapSiswa[item.namaSiswa] = { buku: 0, totalSkor: 0 };
      }
      rekapSiswa[item.namaSiswa].buku += 1;
      rekapSiswa[item.namaSiswa].totalSkor += Number(item.skorUtama);
    });

    // 2. TAMPILKAN MATRIKS PAPAN PERINGKAT (LEADERBOARD)
    tbody.innerHTML = "";
    const listSiswaUrut = Object.keys(rekapSiswa).map(nama => ({
      nama: nama,
      buku: rekapSiswa[nama].buku,
      rataNilai: Math.round(rekapSiswa[nama].totalSkor / rekapSiswa[nama].buku)
    })).sort((a, b) => b.rataNilai - a.rataNilai);

    listSiswaUrut.forEach(siswa => {
      tbody.innerHTML += `
        <tr>
          <td><strong>${siswa.nama}</strong></td>
          <td><span class="badge"><i class="fa-solid fa-book text-muted"></i> ${siswa.buku} Jurnal</span></td>
          <td><strong>${siswa.rataNilai}</strong> /100</td>
        </tr>
      `;
    });

    // 3. BANGUN GRAFIK TREN KELAS DENGAN CHART.JS
    const ctx = document.getElementById('chartKelas').getContext('2d');
    if (currentChart) {
      currentChart.destroy();
    }

    currentChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: arrayLabelGrafik,
        datasets: [{
          label: 'Skor Mutu Jurnal Kelas',
          data: arraySkorKelas,
          borderColor: '#2563eb',
          backgroundColor: 'rgba(37, 99, 235, 0.05)',
          borderWidth: 3,
          tension: 0.25,
          fill: true,
          pointBackgroundColor: '#2563eb',
          pointRadius: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          y: { min: 0, max: 100, grid: { color: 'rgba(0, 0, 0, 0.05)' } },
          x: { grid: { display: false } }
        }
      }
    });

  } catch (error) {
    tbody.innerHTML = `<tr><td colspan="3" class="text-center text-warning"><i class="fa-solid fa-triangle-exclamation"></i> Gagal sinkronisasi data dari spreadsheet.</td></tr>`;
  }
}

// Inisialisasi Penarikan Dashboard Saat Aplikasi Pertama Kali Dibuka
window.onload = () => {
  muatDataDashboard();
  const currentTheme = document.documentElement.getAttribute('data-theme');
  const labelStatus = document.getElementById('label-status-tema');
  if (currentTheme === 'dark') {
    document.body.classList.add('dark-theme-active');
    if (labelStatus) labelStatus.textContent = 'Mode Gelap';
  } else {
    document.body.classList.remove('dark-theme-active');
    if (labelStatus) labelStatus.textContent = 'Mode Terang';
  }
};

// Fungsi untuk menutup pop-up modal peringatan kata
function closeCustomAlert() {
  document.getElementById('customAlertModal').classList.remove('modal-show');
}