// URL Google Apps Script Web App Resmi ASISTEN LINA
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwbnFQtzINgJX7ntTG3w0psg8B_JAFnXzrwBgJpDnumEFOvfcoMDkukGqYW3DSEc12D/exec";
let currentChart = null;

// Fungsi Menangani Perpindahan Halaman Menu (SPA) - UPDATE AMAN
function switchPage(pageId) {
  document.querySelectorAll('.page-section').forEach(section => section.classList.remove('active'));
  document.querySelectorAll('.nav-links a').forEach(link => link.classList.remove('active'));
  
  const targetSection = document.getElementById('section-' + pageId);
  if (targetSection) {
    targetSection.classList.add('active');
  }
  
  const targetNavLink = document.getElementById('nav-' + pageId);
  if (targetNavLink) {
    targetNavLink.classList.add('active');
  }

  if (pageId === 'dashboard') {
    muatDataDashboard();
  }
}

// Fungsi Mengubah Mode Gelap / Terang (Dark Mode Toggle)
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
}

// Fungsi Mengirim Data Jurnal Siswa ke AI & Google Sheets
async function kirimJurnal(event) {
  event.preventDefault();

  const isiJurnal = document.getElementById('isiJurnal').value.trim();
  const jumlahKata = isiJurnal ? isiJurnal.split(/\s+/).filter(kata => kata.length > 0).length : 0;

  if (jumlahKata < 75) {
    document.getElementById('modal-warning-text').innerHTML = `Saat ini tulisanmu baru <span style="color: var(--gold); font-weight: 700; font-size: 1.1rem;">${jumlahKata}</span> kata.`;
    document.getElementById('customAlertModal').classList.add('modal-show');
    return; 
  }

  const btn = document.getElementById('submitBtn');
  const originalText = btn.innerHTML;
  btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> LINA sedang membaca tulisanmu...`;
  btn.disabled = true;

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

      setTimeout(() => {
        statusLoader.innerHTML = "";
        jalankanKetikTeks(boxApresiasi, result.apresiasi, () => {
          jalankanKetikTeks(boxBagus, result.bagian_bagus, () => {
            jalankanKetikTeks(boxPerbaikan, result.bagian_perbaikan);
          });
        });
      }, 1000); 

      document.getElementById('jurnalForm').reset();
      
    } else {
      document.getElementById('feedbackContainer').style.display = 'none';
      document.getElementById('linaErrorAiModal').classList.add('modal-show');
    }

  } catch (error) {
    document.getElementById('feedbackContainer').style.display = 'none';
    document.getElementById('linaNetworkModal').classList.add('modal-show');
    
  } finally {
    btn.innerHTML = originalText;
    btn.disabled = false;
  }
}

// --- FUNGSI UNTUK MENUTUP MODAL & KEMBALI KE FORM TULISAN JURNAL ---
function closeErrorAiModal() {
  document.getElementById('linaErrorAiModal').classList.remove('modal-show');
  document.getElementById('isiJurnal').scrollIntoView({ behavior: 'smooth' });
  document.getElementById('isiJurnal').focus();
}

function closeNetworkModal() {
  document.getElementById('linaNetworkModal').classList.remove('modal-show');
  document.getElementById('isiJurnal').scrollIntoView({ behavior: 'smooth' });
  document.getElementById('isiJurnal').focus();
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

// Inisialisasi Penarikan Dashboard Saat Aplikasi Pertama Kali Buku
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

// Fungsi untuk menutup pop-up modal peringatan kata kurang dari 75 kata
function closeCustomAlert() {
  document.getElementById('customAlertModal').classList.remove('modal-show');
}

// --- LOGIKA PENGENDALI NAVIGASI HP (FULL-MENU HORIZONTAL MORPHING) ---

function toggleMobileMenu(event) {
  if (window.innerWidth <= 768) {
    event.stopPropagation();
    const navbar = document.querySelector('.navbar');
    const overlay = document.getElementById('nav-overlay');
    
    navbar.classList.toggle('menu-terbuka');
    
    if (navbar.classList.contains('menu-terbuka')) {
      if (overlay) overlay.style.display = 'block';
    } else {
      closeMobileMenu();
    }
  }
}

function toggleDropdownMobile(event, dropdownId) {
  if (window.innerWidth <= 768) {
    event.preventDefault();
    event.stopPropagation();
    
    const targetDropdown = document.getElementById(dropdownId);
    const sudahTerbuka = targetDropdown.classList.contains('buka-sub');

    // Tutup sub-menu lain terlebih dahulu agar tidak saling menumpuk
    document.querySelectorAll('.dropdown-menu').forEach(menu => {
      menu.classList.remove('buka-sub');
    });

    if (!sudahTerbuka) {
      targetDropdown.classList.add('buka-sub');
    }
  }
}

function closeMobileMenu() {
  const navbar = document.querySelector('.navbar');
  const overlay = document.getElementById('nav-overlay');
  
  if (navbar) navbar.classList.remove('menu-open'); // Sesuai standarisasi
  if (navbar) navbar.classList.remove('menu-terbuka');
  if (overlay) overlay.style.display = 'none';

  document.querySelectorAll('.dropdown-menu').forEach(menu => {
    menu.classList.remove('buka-sub');
  });
}

// Menutup menu otomatis jika siswa mengetuk area kosong di mana saja
document.addEventListener('click', function(event) {
  if (window.innerWidth <= 768) {
    const navbar = document.querySelector('.navbar');
    if (navbar && !navbar.contains(event.target)) {
      closeMobileMenu();
    }
  }
});