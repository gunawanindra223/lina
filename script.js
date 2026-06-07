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
      document.getElementById('feedbackContainer').style.display = 'block';
      document.getElementById('feedbackContainer').scrollIntoView({ behavior: 'smooth' });

      // === FUNGSI LOGIKA INTERNAL EFEK MENGETIK LINA + ANIMASI IKON ===
      const ketikFeedbackLINA = (elemenTarget, teksFeedback, callbackLanjutan) => {
        if (!teksFeedback) {
          if (callbackLanjutan) callbackLanjutan();
          return;
        }
        
        // 1. Buat struktur layout chat row (Ikon + Kotak Teks)
        elemenTarget.innerHTML = `
          <div class="lina-chat-row">
            <img src="https://lh3.googleusercontent.com/u/0/d/1NUrhmJO3z7j89HwsUv3noHP1GwWQ-x2i" class="lina-avatar-mini lina-typing-active" alt="LINA">
            <div class="lina-text-stream"></div>
          </div>
        `;

        const avatarIcon = elemenTarget.querySelector('.lina-avatar-mini');
        const streamBox = elemenTarget.querySelector('.lina-text-stream');
        
        let kumpulanKalimat = teksFeedback.split('. ');
        let indeksKalimat = 0;

        function tampilkanPerKalimat() {
          if (indeksKalimat < kumpulanKalimat.length) {
            let kalimatSekarang = kumpulanKalimat[indeksKalimat].trim();
            
            if (kalimatSekarang.length > 0) {
              if (indeksKalimat < kumpulanKalimat.length - 1 && !kalimatSekarang.endsWith('.')) {
                kalimatSekarang += '. ';
              } else if (indeksKalimat === kumpulanKalimat.length - 1 && !kalimatSekarang.endsWith('.')) {
                kalimatSekarang += '.';
              }

              let spanKalimat = document.createElement('span');
              spanKalimat.className = 'fade-in-sentence';
              spanKalimat.innerText = kalimatSekarang + " ";
              streamBox.appendChild(spanKalimat);
            }

            indeksKalimat++;
            setTimeout(tampilkanPerKalimat, 1100); // Jeda antar kalimat 1.1 detik
          } else {
            // Ketika kalimat habis, matikan class animasi berdenyut pada ikon LINA
            if (avatarIcon) {
              avatarIcon.classList.remove('lina-typing-active');
            }
            if (callbackLanjutan) callbackLanjutan();
          }
        }
        tampilkanPerKalimat();
      };

      // Ambil referensi elemen target box teks bawaan website Anda
      const boxApresiasi = document.getElementById('txtApresiasi');
      const boxBagus = document.getElementById('txtBagus');
      const boxPerbaikan = document.getElementById('txtPerbaikan');

      // Kosongkan semua kontainer sebelum simulasi animasi dimulai
      boxApresiasi.innerHTML = "";
      boxBagus.innerHTML = "";
      boxPerbaikan.innerHTML = "";

      // Eksekusi efek mengetik berantai secara berurutan beserta ikonnya
      ketikFeedbackLINA(boxApresiasi, result.apresiasi, () => {
        ketikFeedbackLINA(boxBagus, result.bagian_bagus, () => {
          ketikFeedbackLINA(boxPerbaikan, result.bagian_perbaikan);
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

    // 1. OLAH DATA UNTUK LEADERBOARD & GRAFIK
    const rekapSiswa = {};
    const arraySkorKelas = [];
    const arrayLabelGrafik = [];
    
    data.forEach((item, index) => {
      // Data Tren Grafik Kolektif Kelas
      arraySkorKelas.push(Number(item.skorUtama));
      arrayLabelGrafik.push(`Jurnal ${index + 1}`);

      // Data Akumulasi Per Individu Siswa
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
    })).sort((a, b) => b.rataNilai - a.rataNilai); // Urutkan berdasarkan kualitas esai tertinggi

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
          y: {
            min: 0,
            max: 100,
            grid: { color: 'rgba(0, 0, 0, 0.05)' }
          },
          x: {
            grid: { display: false }
          }
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
  
  // Sinkronisasi tombol kapsul saat refresh halaman
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