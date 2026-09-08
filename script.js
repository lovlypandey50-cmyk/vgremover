let currentModel = 'basic';
let isProVerified = false;
let selectedFile = null;
let processedImageUrl = null;

// ================= SECURE VERCEL BACKEND API =================
const BIREFNET_API_URL = "/api/remove-bg";
// =============================================================

// Daily credits system
const getDailyCredits = () => {
  const today = new Date().toISOString().slice(0, 10);
  const savedDate = localStorage.getItem('vg_credit_date');
  if (savedDate !== today) {
    localStorage.setItem('vg_credit_date', today);
    localStorage.setItem('vg_credits', '20');
    return 20;
  }
  return parseInt(localStorage.getItem('vg_credits') || '20', 10);
};

let credits = getDailyCredits();
const creditCountEl = document.getElementById('creditCount');
if (creditCountEl) creditCountEl.innerText = credits;

// 24-Hour Pro Check
function checkProStatus() {
  const proExpiry = localStorage.getItem('vg_pro_expiry');
  if (proExpiry) {
    const now = new Date().getTime();
    if (now < parseInt(proExpiry, 10)) {
      isProVerified = true;
      setModeUI('pro');
      return;
    } else {
      localStorage.removeItem('vg_pro_expiry');
      isProVerified = false;
    }
  }
  setModeUI('basic');
}

// Switch UI Logic
function switchModel(mode) {
  if (mode === 'pro' && !isProVerified) {
    const proModal = document.getElementById('proModal');
    if (proModal) proModal.classList.remove('hidden');
    return;
  }
  setModeUI(mode);
}

function setModeUI(mode) {
  currentModel = mode;
  const basicBtn = document.getElementById('basicTab');
  const proBtn = document.getElementById('proTab');
  const creditBox = document.getElementById('creditDisplay');
  const proBox = document.getElementById('proBadge');

  if (mode === 'pro') {
    document.body.classList.add('theme-pro');
    if (basicBtn) basicBtn.classList.remove('active');
    if (proBtn) proBtn.classList.add('active');
    if (creditBox) creditBox.classList.add('hidden');
    if (proBox) proBox.classList.remove('hidden');
  } else {
    document.body.classList.remove('theme-pro');
    if (basicBtn) basicBtn.classList.add('active');
    if (proBtn) proBtn.classList.remove('active');
    if (creditBox) creditBox.classList.remove('hidden');
    if (proBox) proBox.classList.add('hidden');
  }
}

// Passcode Verification
function verifyProCode() {
  const proInput = document.getElementById('proCodeInput');
  const errorMsg = document.getElementById('codeError');
  const proModal = document.getElementById('proModal');
  const code = proInput ? proInput.value.trim() : '';

  if (code === '7509VG') {
    isProVerified = true;
    const expiryTime = new Date().getTime() + 24 * 60 * 60 * 1000;
    localStorage.setItem('vg_pro_expiry', expiryTime.toString());

    if (errorMsg) errorMsg.classList.add('hidden');
    if (proModal) proModal.classList.add('hidden');
    setModeUI('pro');
  } else {
    if (errorMsg) errorMsg.classList.remove('hidden');
  }
}

function cancelPro() {
  const proModal = document.getElementById('proModal');
  const errorMsg = document.getElementById('codeError');
  if (proModal) proModal.classList.add('hidden');
  if (errorMsg) errorMsg.classList.add('hidden');
}

// Drag & Drop Handlers
const fileInput = document.getElementById('fileInput');
const dropZone = document.getElementById('dropZone');
const btnGenerate = document.getElementById('btnGenerate');

if (fileInput) {
  fileInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files[0]) handleFile(e.target.files[0]);
  });
}

if (dropZone) {
  dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('dragover');
  });

  dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('dragover');
  });

  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('dragover');
    if (e.dataTransfer.files && e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
  });
}

function handleFile(file) {
  selectedFile = file;
  if (btnGenerate) {
    btnGenerate.disabled = false;
    btnGenerate.innerText = '✨ Remove Background';
  }

  let uploadStatus = document.getElementById('uploadFileStatus');
  if (!uploadStatus && dropZone) {
    uploadStatus = document.createElement('div');
    uploadStatus.id = 'uploadFileStatus';
    uploadStatus.className = 'upload-success-text';
    dropZone.appendChild(uploadStatus);
  }
  if (uploadStatus) {
    uploadStatus.innerHTML = `✅ <b>Selected:</b> ${file.name} (${(file.size / (1024 * 1024)).toFixed(2)} MB)`;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    const imgBefore = document.getElementById('imgBefore');
    if (imgBefore) imgBefore.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

// Comparison Slider
const slider = document.getElementById('compareSlider');
const beforeWrapper = document.getElementById('beforeWrapper');
if (slider && beforeWrapper) {
  slider.addEventListener('input', (e) => {
    beforeWrapper.style.width = `${e.target.value}%`;
  });
}

// Auto-Compress / Resize helper (Large Photos & DSLR bypass)
function resizeImageBeforeUpload(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const maxDim = 1920; // Crisp Full HD maximum edge

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob((blob) => {
          resolve(blob || file);
        }, 'image/jpeg', 0.92);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

// Process Trigger
function handleGenerate() {
  if (!selectedFile) {
    alert('Kripya pehle photo select karein!');
    return;
  }

  if (currentModel === 'basic') {
    if (credits < 5) {
      alert('Aapke daily credits khatam ho gaye hain! Kal naye milenge ya Pro passcode unlock karein.');
      return;
    }
    const adModal = document.getElementById('adModal');
    if (adModal) adModal.classList.remove('hidden');
    else startRemovalProcess();
  } else {
    startRemovalProcess();
  }
}

function closeAdModal() {
  const adModal = document.getElementById('adModal');
  if (adModal) adModal.classList.add('hidden');
  startRemovalProcess();
}

// Main AI Process
async function startRemovalProcess() {
  if (!selectedFile) return;

  const loader = document.getElementById('processLoader');
  const scanner = document.getElementById('scanEffect');

  if (loader) loader.classList.remove('hidden');
  if (scanner) scanner.classList.add('active');
  if (btnGenerate) btnGenerate.disabled = true;

  try {
    const uploadPayload = await resizeImageBeforeUpload(selectedFile);

    const res = await fetch(BIREFNET_API_URL, {
      method: "POST",
      body: uploadPayload
    });

    if (!res.ok) {
      const errText = await res.text();
      if (res.status === 503) {
        throw new Error('AI Model initialize ho raha hai, kripya 20 second baad dobara try karein.');
      }
      throw new Error(`AI Process Error (${res.status}): ${errText}`);
    }

    const blobResult = await res.blob();

    // Revoke previous blob url to prevent memory leaks
    if (processedImageUrl) {
      URL.revokeObjectURL(processedImageUrl);
    }

    // Show Output
    processedImageUrl = URL.createObjectURL(blobResult);
    const imgAfter = document.getElementById('imgAfter');
    const compBox = document.getElementById('comparisonBox');
    const downloadBtn = document.getElementById('btnDownload');

    if (imgAfter) imgAfter.src = processedImageUrl;
    if (compBox) compBox.classList.remove('hidden');
    if (downloadBtn) downloadBtn.classList.remove('hidden');

    if (currentModel === 'basic') {
      credits -= 5;
      localStorage.setItem('vg_credits', credits.toString());
      if (creditCountEl) creditCountEl.innerText = credits;
    }

  } catch (err) {
    alert(err.message);
  } finally {
    if (loader) loader.classList.add('hidden');
    if (scanner) scanner.classList.remove('active');
    if (btnGenerate) btnGenerate.disabled = false;
  }
}

function handleDownload() {
  if (!processedImageUrl) return;
  const link = document.createElement('a');
  link.href = processedImageUrl;
  link.download = 'VGREMOVER_transparent.png';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function handleVote(type) {
  const el = type === 'like' ? document.getElementById('likeCount') : document.getElementById('unlikeCount');
  if (el) el.innerText = parseInt(el.innerText || '0', 10) + 1;
}

// Init
checkProStatus();
