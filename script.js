let currentModel = 'basic';
let isProVerified = false;
let selectedFile = null;
let processedImageUrl = null;

// ================= PRIVATE BIREFNET AI CONFIG =================
// Apna Hugging Face Access Token yahan paste karein:
const HF_ACCESS_TOKEN = "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";

// BiRefNet High-Resolution Jewellery AI Endpoint
const BIREFNET_API_URL = "https://api-inference.huggingface.co/models/ZhengPeng7/BiRefNet";
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

// Passcode Verification
function verifyProCode() {
  const code = document.getElementById('proCodeInput').value.trim();
  const errorMsg = document.getElementById('codeError');

  if (code === '7509VG') {
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

// Drag & Drop Handlers
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
      alert('Aapke daily credits khatam ho gaye hain! Kal naye milenge ya Pro passcode unlock karein.');
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

// Main AI Process
async function startRemovalProcess() {
  if (!selectedFile) return;

  const loader = document.getElementById('processLoader');
  const scanner = document.getElementById('scanEffect');

  loader.classList.remove('hidden');
  if (scanner) scanner.classList.add('active'); // Start Scanner Animation
  btnGenerate.disabled = true;

  try {
    const res = await fetch(PRIVATE_API_ENDPOINT, {
      method: "POST",
      body: selectedFile
    });

    if (!res.ok) {
      const errText = await res.text();
      if (res.status === 503) {
        throw new Error('AI Engine start ho raha hai... 20-30 second baad dobara "Remove Background" dabayein.');
      }
      throw new Error(`AI Process Error (${res.status}): ${errText}`);
    }

    const blobResult = await res.blob();

    // Show Output
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
    if (scanner) scanner.classList.remove('active'); // Stop Scanner Animation
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

// Init
checkProStatus();
