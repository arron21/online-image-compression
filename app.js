/* global imageCompression */

const fileInput = document.getElementById('fileInput');
const dropZone = document.getElementById('dropZone');
const compressBtn = document.getElementById('compressBtn');
const progressWrapper = document.getElementById('progressWrapper');
const progressBar = document.getElementById('progressBar');
const progressLabel = document.getElementById('progressLabel');
const errorMsg = document.getElementById('errorMsg');
const results = document.getElementById('results');

const originalImg = document.getElementById('originalImg');
const originalInfo = document.getElementById('originalInfo');
const compressedImg = document.getElementById('compressedImg');
const compressedInfo = document.getElementById('compressedInfo');
const downloadBtn = document.getElementById('downloadBtn');

let selectedFile = null;
let originalObjectUrl = null;
let compressedObjectUrl = null;

/* ── Drag-and-drop support ── */
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
  const file = e.dataTransfer.files[0];
  if (file) handleFileSelected(file);
});

fileInput.addEventListener('change', () => {
  if (fileInput.files[0]) handleFileSelected(fileInput.files[0]);
});

function handleFileSelected(file) {
  if (!file.type.startsWith('image/')) {
    showError('Please select a valid image file (JPEG, PNG, WebP, BMP).');
    return;
  }
  hideError();
  selectedFile = file;
  compressBtn.disabled = false;

  /* Show original preview */
  if (originalObjectUrl) URL.revokeObjectURL(originalObjectUrl);
  originalObjectUrl = URL.createObjectURL(file);
  originalImg.src = originalObjectUrl;
  originalInfo.innerHTML = formatInfo(file.name, file.size);

  /* Reset compressed panel */
  compressedImg.src = '';
  compressedInfo.innerHTML = '';
  downloadBtn.style.display = 'none';
  results.classList.add('visible');
}

compressBtn.addEventListener('click', async () => {
  if (!selectedFile) return;

  const maxSizeMB = parseFloat(document.getElementById('maxSizeMB').value) || 1;
  const maxWidthOrHeight = parseInt(document.getElementById('maxWidthOrHeight').value, 10) || 1920;

  const options = {
    maxSizeMB,
    maxWidthOrHeight,
    useWebWorker: true,
    onProgress: (pct) => {
      progressBar.value = pct;
      progressLabel.textContent = `Compressing… ${pct}%`;
    },
  };

  compressBtn.disabled = true;
  showProgress();
  hideError();

  try {
    const compressedFile = await imageCompression(selectedFile, options);

    if (compressedObjectUrl) URL.revokeObjectURL(compressedObjectUrl);
    compressedObjectUrl = URL.createObjectURL(compressedFile);
    compressedImg.src = compressedObjectUrl;

    const sizeDiff = selectedFile.size - compressedFile.size;
    let sizeNote;
    if (sizeDiff > 0) {
      const savedPct = ((sizeDiff / selectedFile.size) * 100).toFixed(1);
      sizeNote = `<br><span class="badge badge-green">▼ ${savedPct}% smaller</span>`;
    } else {
      sizeNote = `<br><span class="badge badge-blue">Already optimised — no reduction</span>`;
    }
    compressedInfo.innerHTML = formatInfo(compressedFile.name, compressedFile.size) + sizeNote;

    downloadBtn.href = compressedObjectUrl;
    downloadBtn.download = 'compressed_' + selectedFile.name;
    downloadBtn.style.display = 'inline-block';
  } catch (err) {
    showError('Compression failed: ' + err.message);
  } finally {
    hideProgress();
    compressBtn.disabled = false;
  }
});

/* ── Helpers ── */
function formatInfo(name, bytes) {
  const kb = (bytes / 1024).toFixed(1);
  const mb = (bytes / 1024 / 1024).toFixed(2);
  const size = bytes >= 1024 * 1024 ? `${mb} MB` : `${kb} KB`;
  return `<span>${name}</span><br>Size: <span>${size}</span>`;
}

function showProgress() {
  progressWrapper.style.display = 'block';
  progressBar.value = 0;
  progressLabel.textContent = 'Compressing… 0%';
}

function hideProgress() {
  progressWrapper.style.display = 'none';
}

function showError(msg) {
  errorMsg.textContent = msg;
  errorMsg.style.display = 'block';
}

function hideError() {
  errorMsg.style.display = 'none';
}
