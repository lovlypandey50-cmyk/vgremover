// Main AI Process (Browser-optimized Xenova/bria-rmbg-1.4)
async function startRemovalProcess() {
  if (!selectedFile) return;

  const loader = document.getElementById('processLoader');
  const scanner = document.getElementById('scanEffect');
  const statusSpan = document.getElementById('loaderStatusText') || (loader ? loader.querySelector('span') : null);

  if (loader) loader.classList.remove('hidden');
  if (scanner) scanner.classList.add('active');
  if (btnGenerate) btnGenerate.disabled = true;

  try {
    // 1. Browser-compatible ONNX RMBG-1.4 load
    if (!aiSegmenter) {
      if (statusSpan) statusSpan.innerText = "Loading Studio AI Engine (~25MB, first time only)...";
      
      const { pipeline, env } = await import('https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2');
      env.allowLocalModels = false;
      
      aiSegmenter = await pipeline('image-segmentation', 'Xenova/bria-rmbg-1.4');
    }

    if (statusSpan) statusSpan.innerText = "Extracting Fine Edges with VG AI...";

    // 2. Original Image Load
    const imgElement = new Image();
    const originalObjectUrl = URL.createObjectURL(selectedFile);
    imgElement.src = originalObjectUrl;
    await new Promise((resolve) => { imgElement.onload = resolve; });

    // 3. AI dwara mask generation
    const result = await aiSegmenter(imgElement.src);
    const maskCanvas = result[0].mask.toCanvas();

    // 4. Clean Edge Rendering Canvas
    const canvas = document.createElement("canvas");
    canvas.width = imgElement.naturalWidth;
    canvas.height = imgElement.naturalHeight;
    const ctx = canvas.getContext("2d");

    ctx.drawImage(imgElement, 0, 0);
    ctx.globalCompositeOperation = "destination-in";
    ctx.drawImage(maskCanvas, 0, 0, imgElement.naturalWidth, imgElement.naturalHeight);

    URL.revokeObjectURL(originalObjectUrl);
    if (processedImageUrl) {
      URL.revokeObjectURL(processedImageUrl);
    }

    // 5. HD Transparent Output Blob
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
