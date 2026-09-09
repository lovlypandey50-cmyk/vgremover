let currentModel = 'basic';
let isProVerified = false;
let selectedFile = null;
let processedImageUrl = null;
let aiSegmenter = null;

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

// Main AI Process (BRIA RMBG-1.4 Studio Model)
async function startRemovalProcess() {
  if (!selectedFile) return;

  const loader = document.getElementById('processLoader');
  const scanner = document.getElementById('scanEffect');
  const statusSpan = document.getElementById('loaderStatusText');

  if (loader) loader.classList.remove('hidden');
  if (scanner) scanner.classList.add('active');
  if (btnGenerate) btnGenerate.disabled = true;

  try {
    // 1. Photoroom-grade AI Model load (first time setup)
    if (!aiSegmenter) {
      if (statusSpan) statusSpan.innerText = "Loading Studio AI Engine (first time only)...";
      transformers.env.allowLocalModels = false;
      aiSegmenter = await transformers.pipeline('image-segmentation', 'briaai/RMBG-1.4');
    }

    if (statusSpan) statusSpan.innerText = "Extracting Fine Edges with VG AI...";

    // 2. Original Image Load
    const imgElement = new Image();
    const originalObjectUrl = URL.createObjectURL(selectedFile);
    imgElement.src = originalObjectUrl;
    await new Promise((resolve) => { imgElement.onload = resolve; });

    // 3. AI dwara high precision mask calculate
    const result = await aiSegmenter(imgElement.src);
    const maskCanvas = result[0].mask.toCanvas();

    // 4. Studio E-commerce Cutout Rendering
    const canvas = document.createElement("canvas");
    canvas.width = imgElement.naturalWidth;
    canvas.height = imgElement.naturalHeight;
    const ctx = canvas.getContext("2d");

    // Original Image draw
    ctx.drawImage(imgElement, 0, 0);

    // Alpha mask combine (Natural Sharp Edges)
    ctx.globalCompositeOperation = "destination-in";
    ctx.drawImage(maskCanvas, 0, 0, imgElement.naturalWidth, imgElement.naturalHeight);

    // Revoke previous URLs
    URL.revokeObjectURL(originalObjectUrl);
    if (processedImageUrl) {
      URL.revokeObjectURL(processedImageUrl);
    }

    // 5. HD Transparent PNG Blob create
    await new Promise((resolve) => {
      canvas.toBlob((blob) => {
        processedImageUrl = URL.createObjectURL(blob);

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

        resolve();
      }, "image/png");
    });

  } catch (err) {
    console.error("VGRemover Process Error:", err);
    alert('Processing Error: ' + err.message);
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
