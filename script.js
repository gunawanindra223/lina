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
  // Menghitung jumlah kata berdasarkan spasi
  const jumlahKata = isiJurnal ? isiJurnal.split(/\s+/).filter(kata => kata.length > 0).length : 0;

  // BAGIAN BARU (Menggunakan Pop-Up Kustom)
  if (jumlahKata < 75) {
    // Isi text jumlah kata anak secara dinamis ke dalam pop-up modal
    document.getElementById('modal-warning-text').innerHTML = `Saat ini tulisanmu baru <span style="color: var(--gold); font-weight: 700; font-size: 1.1rem;">${jumlahKata}</span> kata.`;

    // Munculkan modal dengan menambahkan class 'modal-show'
    document.getElementById('customAlertModal').classList.add('modal-show');
    return; // STOP! Membatalkan pengiriman data
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
    isiJurnal: isiJurnal // Menggunakan isi jurnal yang sudah bersih dari spasi berlebih
  };

  try {
    const response = await fetch(SCRIPT_URL, {
      method: "POST",
      body: JSON.stringify(payload)
    });

    const result = await response.json();
    
    // === 🌟 PERUBAHAN LOGIKA UTAMA DI SINI (BLOK SUKSES) 🌟 ===
    if (result.status === 'success') {
      // 1. Tampilkan container feedback utama & scroll secara halus
      document.getElementById('feedbackContainer').style.display = 'block';
      document.getElementById('feedbackContainer').scrollIntoView({ behavior: 'smooth' });

      // 2. Ambil referensi elemen penampung status loader dan kotak teks asli
      const statusLoader = document.getElementById('linaThinkingStatus');
      const boxApresiasi = document.getElementById('txtApresiasi');
      const boxBagus = document.getElementById('txtBagus');
      const boxPerbaikan = document.getElementById('txtPerbaikan');

      // 3. Kosongkan semua teks kotak lama sebelum simulasi dimulai
      boxApresiasi.innerHTML = "";
      boxBagus.innerHTML = "";
      boxPerbaikan.innerHTML = "";

      // 4. Masukkan struktur animasi berpikir LINA (Menggunakan foto ./lina.png Bapak)
      statusLoader.innerHTML = `
        <div class="lina-status-loader">
          <img src="./lina.png" class="lina-avatar-thinking" alt="LINA">
          <span><i class="fa-solid fa-ellipsis fa-bounce"></i> LINA sedang menulis feedback untukmu...</span>
        </div>
      `;

      // 5. Fungsi internal untuk mengetik teks secara halus per kalimat
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
              // Pertahankan titik di akhir kalimat agar rapi
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
            setTimeout(ketik, 900); // Kecepatan memunculkan kalimat (0.9 detik)
          } else {
            if (callbackLanjutan) callbackLanjutan();
          }
        }
        ketik();
      };

      // 6. Jalankan jeda simulasi berpikir selama 2.5 detik
      setTimeout(() => {
        // Hapus tulisan status loader berpikir karena LINA sudah siap menuangkan teks
        statusLoader.innerHTML = "";

        // Mulai ketik berantai (Apresiasi -> Kelebihan -> Intervensi Pendampingan)
        jalankanKetikTeks(boxApresiasi, result.apresiasi, () => {
          jalankanKetikTeks(boxBagus, result.bagian_bagus, () => {
            jalankanKetikTeks(boxPerbaikan, result.bagian_perbaikan);
          });
        });
      }, 2500); // Durasi LINA berpikir (2500ms = 2.5 detik)

      // 7. Reset form input jurnal
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