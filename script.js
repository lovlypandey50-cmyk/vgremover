let currentModel = 'basic';
let isProVerified = false;
let selectedFile = null;
let processedImageUrl = null;

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
document.getElementById('creditCount').innerText = credits;

// Switch Model
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
    document.getElementById('creditDisplay').classList.add('hidden');
    document.getElementById('proBadge').classList.remove('hidden');
  } else {
    document.getElementById('creditDisplay').classList.remove('hidden');
    document.getElementById('proBadge').classList.add('hidden');
  }
}

// Pro Verification Code Logic
function verifyProCode() {
  const code = document.getElementById('proCodeInput').value.trim();
  const errorMsg = document.getElementById('codeError');
  
  if (code === '7509VG') {
    isProVerified = true;
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

// Drag and Drop & File Select
const fileInput = document.getElementById('fileInput');
const dropZone = document.getElementById('dropZone');
const btnGenerate = document.getElementById('btnGenerate');

fileInput.addEventListener('change', (e) => {
  if (e.target.files.length) handleFile(e.target.files[0]);
});

dropZone.addEventListener('dragover', (e) => {
  e.preventDefault();
  dropZone.style.borderColor = '#0077ff';
});

dropZone.addEventListener('dragleave', () => {
  dropZone.style.borderColor = '#2f3854';
});

dropZone.addEventListener('drop', (e) => {
  e.preventDefault();
  dropZone.style.borderColor = '#2f3854';
  if (e.dataTransfer.files.length) handleFile(e.dataTransfer.files[0]);
});

function handleFile(file) {
  selectedFile = file;
  btnGenerate.disabled = false;
  btnGenerate.innerText = `Process (${file.name.slice(0, 15)}...)`;
  
  // Preview
  const reader = new FileReader();
  reader.onload = (e) => {
    document.getElementById('imgBefore').src = e.target.result;
  };
  reader.readAsDataURL(file);
}

// Slider Logic
const slider = document.getElementById('compareSlider');
const beforeWrapper = document.getElementById('beforeWrapper');

slider.addEventListener('input', (e) => {
  beforeWrapper.style.width = `${e.target.value}%`;
});

// Ad Trigger and Removal Call
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
        'x-api-key': 'sandbox_sk_pr_vgdesigner7509_716eea600332baa214121f7dc65f6e3442873e86'
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
