let currentModel = 'basic';
let isProVerified = false;
let selectedFile = null;
let processedImageUrl = null;

// ================= API KEYS CONFIGURATION =================
// 1. Remove.bg API Key (Basic Model - Direct Browser Allowed)
const REMOVE_BG_API_KEY = "DLH1WrF957mHS5De65HWmEad";

// 2. Photoroom API Keys Rotation (Pro Model)
const PHOTOROOM_KEYS = [
  "sk_pr_default_2517d141e809c9e93d9986e55a456dcafa2359c3",
  "sk_pr_default_8a4b46802172847b72b9e7a79a9b56e1ea353f06",
  "sk_pr_default_adfe49f942200e04910b58c6f38f67caa5c0072e"
];

let activePrKeyIndex = 0;
// ==========================================================

// Daily credit reset system
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

// 24-Hour Pro Status Check
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
    document.getElementById('proModal').classList.remove('hidden');
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

// Verify Passcode & Set 24-Hour Expiry
function verifyProCode() {
  const code = document.getElementById('proCodeInput').value.trim();
  const errorMsg = document.getElementById('codeError');

  if (code === 'RS7509') {
    isProVerified = true;
    const expiryTime = new Date().getTime() + 24 * 60 * 60 * 1000;
    localStorage.setItem('vg_pro_expiry', expiryTime.toString());

    errorMsg.classList.add('hidden');
    document.getElementById('proModal').classList.add('hidden');
    setModeUI('pro');
  } else {
    errorMsg.classList.remove('hidden');
  }
}

function cancelPro() {
  document.getElementById('proModal').classList.add('hidden');
  document.getElementById('codeError').classList.add('hidden');
}

// File Handlers
const fileInput = document.getElementById('fileInput');
const dropZone = document.getElementById('dropZone');
const btnGenerate = document.getElementById('btnGenerate');

fileInput.addEventListener('change', (e) => {
  if (e.target.files && e.target.files[0]) handleFile(e.target.files[0]);
});

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

function handleFile(file) {
  selectedFile = file;
  btnGenerate.disabled = false;
  btnGenerate.innerText = '✨ Remove Background';

  let uploadStatus = document.getElementById('uploadFileStatus');
  if (!uploadStatus) {
    uploadStatus = document.createElement('div');
    uploadStatus.id = 'uploadFileStatus';
    uploadStatus.className = 'upload-success-text';
    dropZone.appendChild(uploadStatus);
  }
  uploadStatus.innerHTML = `✅ <b>Selected:</b> ${file.name} (${(file.size / (1024 * 1024)).toFixed(2)} MB)`;

  const reader = new FileReader();
  reader.onload = (e) => {
    document.getElementById('imgBefore').src = e.target.result;
  };
  reader.readAsDataURL(file);
}

// Comparison Slider
const slider = document.getElementById('compareSlider');
const beforeWrapper = document.getElementById('beforeWrapper');
slider.addEventListener('input', (e) => {
  beforeWrapper.style.width = `${e.target.value}%`;
});

// Process Trigger
function handleGenerate() {
  if (!selectedFile) {
    alert('Kripya pehle photo select karein!');
    return;
  }

  if (currentModel === 'basic') {
    if (credits < 5) {
      alert('Aapke daily credits khatam ho gaye hain! Kal 20 credits milenge ya Pro model unlock karein.');
      return;
    }
    document.getElementById('adModal').classList.remove('hidden');
  } else {
    startRemovalProcess();
  }
}

function closeAdModal() {
  document.getElementById('adModal').classList.add('hidden');
  startRemovalProcess();
}

// Main Engine
async function startRemovalProcess() {
  if (!selectedFile) return;

  const loader = document.getElementById('processLoader');
  loader.classList.remove('hidden');
  btnGenerate.disabled = true;

  try {
    let blobResult = null;

    if (currentModel === 'basic') {
      // Remove.bg for Basic Model
      const formData = new FormData();
      formData.append('image_file', selectedFile);
      formData.append('size', 'auto');

      const res = await fetch('https://api.remove.bg/v1.0/removebg', {
        method: 'POST',
        headers: {
          'X-Api-Key': REMOVE_BG_API_KEY
        },
        body: formData
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Remove.bg Error (${res.status}): ${errText}`);
      }
      blobResult = await res.blob();

    } else {
      // Photoroom Multi-Key Rotation for Pro Model
      let success = false;
      let lastErr = '';

      for (let i = 0; i < PHOTOROOM_KEYS.length; i++) {
        const activeKey = PHOTOROOM_KEYS[activePrKeyIndex];

        try {
          const formData = new FormData();
          formData.append('image_file', selectedFile);

          const res = await fetch('https://sdk.photoroom.com/v1/segment', {
            method: 'POST',
            headers: { 'x-api-key': activeKey },
            body: formData
          });

          if (res.ok) {
            blobResult = await res.blob();
            success = true;
            break;
          } else {
            const err = await res.text();
            console.warn(`Photoroom Key ${activePrKeyIndex + 1} exhausted (${res.status}):`, err);
            lastErr = err;
            activePrKeyIndex = (activePrKeyIndex + 1) % PHOTOROOM_KEYS.length;
          }
        } catch (e) {
          activePrKeyIndex = (activePrKeyIndex + 1) % PHOTOROOM_KEYS.length;
        }
      }

      if (!success) {
        throw new Error('Sabhi Photoroom Pro API Keys ke credits khatam ho chuke hain!');
      }
    }

    // Output Display
    processedImageUrl = URL.createObjectURL(blobResult);
    document.getElementById('imgAfter').src = processedImageUrl;
    document.getElementById('comparisonBox').classList.remove('hidden');
    document.getElementById('btnDownload').classList.remove('hidden');

    if (currentModel === 'basic') {
      credits -= 5;
      localStorage.setItem('vg_credits', credits.toString());
      if (creditCountEl) creditCountEl.innerText = credits;
    }

  } catch (err) {
    alert(err.message);
  } finally {
    loader.classList.add('hidden');
    btnGenerate.disabled = false;
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
  el.innerText = parseInt(el.innerText, 10) + 1;
}

checkProStatus();
