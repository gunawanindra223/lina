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

      // 4. Masukkan struktur animasi berpikir LINA (Menggunakan foto ./lina.png)
      statusLoader.innerHTML = `
        <div class="lina-status-loader">
          <img src="./lina.png" class="lina-avatar-thinking" alt="LINA">
          <div class="thinking-text-wrapper">
            <span>sedang menganalisa tulisanmu...</span>
            <div class="wave-dots">
              <span></span><span></span><span></span>
            </div>
          </div>
        </div>
      `;

      // 5. 🔥 LOGIKA BARU: Fungsi Mengetik Realistis Huruf demi Huruf 🔥
      const jalankanKetikTeks = (elemenTarget, teksMentah, callbackLanjutan) => {
        if (!teksMentah) {
          if (callbackLanjutan) callbackLanjutan();
          return;
        }

        let indeksKarakter = 0;
        
        // ⚙️ PENGATURAN KECEPATAN (Milidetik) ⚙️
        // Semakin besar angkanya, semakin lambat ketikannya.
        // 20 - 40 ms adalah kecepatan ideal mengetik AI yang natural.
        const KECEPATAN_KETIK = 15; 

        function ketikHuruf() {
          if (indeksKarakter < teksMentah.length) {
            // Tambahkan huruf satu per satu ke dalam kotak HTML
            elemenTarget.innerHTML += teksMentah.charAt(indeksKarakter);
            indeksKarakter++;
            
            // Jalankan perulangan huruf berikutnya
            setTimeout(ketikHuruf, KECEPATAN_KETIK);
          } else {
            // Jika teks di kotak ini sudah selesai diketik, beri jeda 500ms sebelum lanjut ke kotak berikutnya
            setTimeout(() => {
              if (callbackLanjutan) callbackLanjutan();
            }, 500);
          }
        }
        ketikHuruf();
      };

      // 6. Jalankan jeda simulasi berpikir selama 2 detik
      setTimeout(() => {

        // Hapus status loader berpikir karena LINA mulai mengetik
        statusLoader.innerHTML = "";

        // Mulai ketik berantai secara realistis (Apresiasi -> Kelebihan -> Intervensi)
        jalankanKetikTeks(boxApresiasi, result.apresiasi, () => {
          jalankanKetikTeks(boxBagus, result.bagian_bagus, () => {
            jalankanKetikTeks(boxPerbaikan, result.bagian_perbaikan);
          });
        });
      }, 2000); 

      // 7. Reset form input jurnal
      document.getElementById('jurnalForm').reset();
      
    // === 🌟 REVISI 1: CUSTOM POP-UP GAGAL PROSES ANALISA AI 🌟 ===
    } else {
      document.getElementById('modal-warning-text').innerHTML = `
        <div style="text-align: center; padding: 10px;">
          <i class="fa-solid fa-robot" style="font-size: 3rem; color: #ef4444; margin-bottom: 15px;"></i>
          <p style="font-size: 1.15rem; font-weight: 700; margin-bottom: 10px; color: #ef4444;">Gagal Memproses Analisis AI</p>
          <p style="font-size: 0.95rem; line-height: 1.5; color: var(--text-main);">
            Gagal Proses Analisa AI: <br>
            <span style="font-family: monospace; background: rgba(239, 64, 64, 0.1); padding: 4px 8px; border-radius: 4px; color: #b91c1c; display: inline-block; margin-top: 5px; font-size: 0.9rem;">${result.message}</span>
          </p>
          <p style="font-size: 0.9rem; margin-top: 15px; color: var(--text-muted);">Silakan coba klik kembali tombol "Kirim Tulisan" beberapa saat lagi.</p>
        </div>
      `;
      document.getElementById('customAlertModal').classList.add('modal-show');
    }

  // === 🌟 REVISI 2: CUSTOM POP-UP GANGGUAN KONEKSI INTERNET 🌟 ===
  } catch (error) {
    document.getElementById('modal-warning-text').innerHTML = `
      <div style="text-align: center; padding: 10px;">
        <i class="fa-solid fa-wifi" style="font-size: 3rem; color: #f59e0b; margin-bottom: 15px;"></i>
        <p style="font-size: 1.15rem; font-weight: 700; margin-bottom: 10px; color: #f59e0b;">Koneksi Internet Terganggu</p>
        <p style="font-size: 0.95rem; line-height: 1.5; color: var(--text-main);">
          LINA mendeteksi sinyal internetmu kurang stabil atau terputus saat mencoba mengirim data jurnal siswa ke server.
        </p>
        <p style="font-size: 0.9rem; margin-top: 15px; font-style: italic; color: var(--text-muted);">
          Pastikan sinyal internetmu bagus, lalu dicoba kirim kembali ya!
        </p>
      </div>
    `;
    document.getElementById('customAlertModal').classList.add('modal-show');
    
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