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

// Fungsi Mengubah Mode Gelap / Terang
function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme');
  const targetTheme = currentTheme === 'dark' ? 'light' : 'dark';
  
  document.documentElement.setAttribute('data-theme', targetTheme);
  
  if (targetTheme === 'dark') {
    document.body.classList.add('dark-theme-active');
  } else {
    document.body.classList.remove('dark-theme-active');
  }
  
  const labelStatus = document.getElementById('label-status-tema');
  if (labelStatus) {
    labelStatus.textContent = targetTheme === 'dark' ? 'Mode Gelap' : 'Mode Terang';
  }

  localStorage.setItem('lina-theme', targetTheme);
}

// Fungsi Mengirim Data Jurnal Siswa ke AI & Google Sheets
async function kirimJurnal(event) {
  event.preventDefault();
  
  // --- LOGIKA VALIDASI MINIMAL 75 KATA ---
  const isiJurnal = document.getElementById('isiJurnal').value.trim();
  const jumlahKata = isiJurnal ? isiJurnal.split(/\s+/).filter(kata => kata.length > 0).length : 0;
  
  if (jumlahKata < 75) {
    document.getElementById('modal-warning-text').innerHTML = `Saat ini tulisanmu baru <span style="color: var(--gold); font-weight: 700; font-size: 1.1rem;">${jumlahKata}</span> kata.`;
    document.getElementById('customAlertModal').classList.add('modal-show');
    return;
  }
  // ---------------------------------------

  const btn = document.getElementById('submitBtn');
  const originalText = btn.innerHTML;
  
  btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> LINA sedang membaca tulisanmu...`;
  btn.disabled = true;

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
    
    if (result.status === 'success') {
      // Tampilkan container feedback
      document.getElementById('feedbackContainer').style.display = 'block';
      document.getElementById('feedbackContainer').scrollIntoView({ behavior: 'smooth' });

      // Ambil referensi elemen asli HTML Anda
      const boxApresiasi = document.getElementById('txtApresiasi');
      const boxBagus = document.getElementById('txtBagus');
      const boxPerbaikan = document.getElementById('txtPerbaikan');

      // Kosongkan kontainer sebelum animasi teks berjalan
      boxApresiasi.innerHTML = "";
      boxBagus.innerHTML = "";
      boxPerbaikan.innerHTML = "";

      // === LOGIKA BARU: EFEK MENGETIK AMAN & SINKRON DENGAN CODE.GS ===
      // Fungsi mengetik teks biasa per kalimat tanpa merusak elemen gambar/avatar
      const jalankanKetikTeks = (elemenTarget, teksMentah, callbackLanjutan) => {
        if (!teksMentah) {
          if (callbackLanjutan) callbackLanjutan();
          return;
        }

        let kumpulanKalimat = teksMentah.split('. ');
        let indeksKalimat = 0;

        function ketik() {
          if (indeksKalimat < kumpulanKalimat.length) {
            let kalimatSekarang = kumpulanKalimat[indeksKalimat].trim();
            if (kalimatSekarang.length > 0) {
              if (indeksKalimat < kumpulanKalimat.length - 1 && !kalimatSekarang.endsWith('.')) {
                kalimatSekarang += '. ';
              } else if (indeksKalimat === kumpulanKalimat.length - 1 && !kalimatSekarang.endsWith('.')) {
                kalimatSekarang += '.';
              }

              let span = document.createElement('span');
              span.className = 'fade-in-sentence';
              span.innerText = kalimatSekarang + " ";
              elemenTarget.appendChild(span);
            }
            indeksKalimat++;
            setTimeout(ketik, 1000); // Kecepatan ketik per kalimat (1 detik)
          } else {
            if (callbackLanjutan) callbackLanjutan();
          }
        }
        ketik();
      };

      // Jalankan efek mengetik berantai menggunakan data properti yang benar dari database Anda
      jalankanKetikTeks(boxApresiasi, result.apresiasi, () => {
        jalankanKetikTeks(boxBagus, result.bagian_bagus, () => {
          jalankanKetikTeks(boxPerbaikan, result.bagian_perbaikan);
        });
      });

      document.getElementById('jurnalForm').reset();
      
    } else {
      alert("Gagal memproses analisis AI: " + result.message);
    }
  } catch (error) {
    alert("Terjadi gangguan koneksi internet saat mengirim data.");
  } finally {
    btn.innerHTML = originalText;
    btn.disabled = false;
  }
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

// Inisialisasi Pengecekan Tema Saat Pertama Kali Membuka Web
window.onload = () => {
  muatDataDashboard();
  
  const savedTheme = localStorage.getItem('lina-theme') || 'light';
  const labelStatus = document.getElementById('label-status-tema');
  
  document.documentElement.setAttribute('data-theme', savedTheme);

  if (savedTheme === 'dark') {
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