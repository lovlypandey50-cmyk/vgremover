let currentModel = 'basic';
let isProVerified = false;
let selectedFile = null;
let processedImageUrl = null;

// ================= API KEYS CONFIGURATION =================
// 1. Pixelcut API Key (Basic Model ke liye)
const PIXELCUT_API_KEY = "PIXELCUT_PAST_API_KEY";

// 2. Photoroom 2 API Keys Rotation (Pro Model ke liye)
const PHOTOROOM_KEYS = [
  "PHOTOROOM_PAST_API_KEY",
  "PHOTOROOM_PAST_API_KEY"
];

let activePrKeyIndex = 0;
// ==========================================================

// Daily credit reset system (Localstorage)
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

// 24-Hour Pro Status Check on Page Load/Refresh
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
  document.getElementById('basicTab').classList.toggle('active', mode === 'basic');
  document.getElementById('proTab').classList.toggle('active', mode === 'pro');

  if (mode === 'pro') {
    document.body.classList.add('theme-pro');
    document.getElementById('creditDisplay').classList.add('hidden');
    document.getElementById('proBadge').classList.remove('hidden');
  } else {
    document.body.classList.remove('theme-pro');
    document.getElementById('creditDisplay').classList.remove('hidden');
    document.getElementById('proBadge').classList.add('hidden');
  }
}

// Verify Passcode & Set 24-Hour Expiry
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

// File Drag & Drop Handlers
const fileInput = document.getElementById('fileInput');
const dropZone = document.getElementById('dropZone');
const btnGenerate = document.getElementById('btnGenerate');

fileInput.addEventListener('change', (e) => {
  if (e.target.files.length) handleFile(e.target.files[0]);
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
  if (e.dataTransfer.files.length) handleFile(e.dataTransfer.files[0]);
});

function handleFile(file) {
  selectedFile = file;
  btnGenerate.disabled = false;
  btnGenerate.innerText = '✨ Remove Background';

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

// Main Processing Engine
async function startRemovalProcess() {
  if (!selectedFile) return;

  const loader = document.getElementById('processLoader');
  loader.classList.remove('hidden');
  btnGenerate.disabled = true;

  try {
    let blobResult = null;

    if (currentModel === 'basic') {
      // 1. Pixelcut API Call for Basic Model
      const formData = new FormData();
      formData.append('image', selectedFile);

      const res = await fetch('https://api.pixelcut.ai/v1/remove-background', {
        method: 'POST',
        headers: {
          'X-API-KEY': PIXELCUT_API_KEY
        },
        body: formData
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Pixelcut API Error (${res.status}): ${errText}`);
      }
      blobResult = await res.blob();

    } else {
      // 2. Photoroom Multi-Key Rotation for Pro Model
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
            console.warn(`Photoroom Key ${activePrKeyIndex + 1} exhausted:`, err);
            lastErr = err;
            activePrKeyIndex = (activePrKeyIndex + 1) % PHOTOROOM_KEYS.length;
          }
        } catch (e) {
          activePrKeyIndex = (activePrKeyIndex + 1) % PHOTOROOM_KEYS.length;
        }
      }

      if (!success) {
        throw new Error('Dono Photoroom Pro API Keys ke credits khatam ho chuke hain!');
      }
    }

    // Show Result
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
    alert('Processing Error: ' + err.message);
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

// Initialize on Load
checkProStatus();
function handleGenerate() {
  if (currentModel === 'basic') {
    if (credits < 5) {
      alert('Aapke pas credits khatam ho gaye hain! Kal 20 naye credits milenge ya Pro model unlock karein.');
      return;
    }
    // Trigger ad popup before processing
    document.getElementById('adModal').classList.remove('hidden');
  } else {
    runPhotoroomCall();
  }
}

function closeAdModal() {
  document.getElementById('adModal').classList.add('hidden');
  runPhotoroomCall();
}

async function runPhotoroomCall() {
  if (!selectedFile) return;

  const loader = document.getElementById('processLoader');
  loader.classList.remove('hidden');
  btnGenerate.disabled = true;

  try {
    const formData = new FormData();
    formData.append('image_file', selectedFile);

    // Standard Photoroom background removal endpoint
    const response = await fetch('https://sdk.photoroom.com/v1/segment', {
      method: 'POST',
      headers: {
        'x-api-key': 'sk_pr_vgdesigner7509_716eea600332baa214121f7dc65f6e3442873e86'
      },
      body: formData
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('API Error:', errText);
      throw new Error(`Status ${response.status}: ${errText}`);
    }

    const blob = await response.blob();
    processedImageUrl = URL.createObjectURL(blob);

    // Result display
    document.getElementById('imgAfter').src = processedImageUrl;
    document.getElementById('comparisonBox').classList.remove('hidden');
    document.getElementById('btnDownload').classList.remove('hidden');

    // Deduct credit for Basic Model
    if (currentModel === 'basic') {
      credits -= 5;
      localStorage.setItem('vg_credits', credits.toString());
      document.getElementById('creditCount').innerText = credits;
    }

  } catch (err) {
    alert('Processing error: ' + err.message);
  } finally {
    loader.classList.add('hidden');
    btnGenerate.disabled = false;
  }
}

function handleDownload() {
  if (!processedImageUrl) return;
  const link = document.createElement('a');
  link.href = processedImageUrl;
  link.download = 'VGREMOVER_result.png';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Like / Unlike Vote
function handleVote(type) {
  if (type === 'like') {
    let count = parseInt(document.getElementById('likeCount').innerText, 10);
    document.getElementById('likeCount').innerText = count + 1;
  } else {
    let count = parseInt(document.getElementById('unlikeCount').innerText, 10);
    document.getElementById('unlikeCount').innerText = count + 1;
  }
}
