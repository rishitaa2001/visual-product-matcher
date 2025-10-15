const imageUpload = document.getElementById('imageUpload');
const urlInput = document.getElementById('urlInput');
const goButton = document.getElementById('goButton');
const overlay = document.getElementById('overlay');
const overlayResults = document.getElementById('overlayResults');
const backButton = document.getElementById('overlayBack');
const fileInput = document.getElementById('imageUpload');
const uploadBtn = document.querySelector('.upload-btn');
const categoryFilter = document.getElementById('filterCategory');
const scoreFilter = document.getElementById('filterScore');
const applyFilters = document.getElementById('applyFilters');

// file upload 
uploadBtn.addEventListener('click', (e) => {
  e.preventDefault();
  fileInput.click();
});

// selected filename display
fileInput.addEventListener('change', () => {
  uploadBtn.textContent = fileInput.files.length > 0 ? fileInput.files[0].name : "Choose File";
});

// submit/go button
goButton.addEventListener('click', async () => {
  const file = imageUpload.files[0];
  const url = urlInput.value.trim();

  if (!file && !url) {
    alert("Please upload a file or enter an image URL.");
    return;
  }

  const formData = new FormData();
  if (file) {
    formData.append('image', file);
  } else {
    const response = await fetch(url);
    const blob = await response.blob();
    formData.append('image', blob, 'url_image.jpg');
  }

  try {
    const res = await fetch('/match', { method: 'POST', body: formData });
    const data = await res.json();

    if (data.error) {
      alert(data.error);
      return;
    }

    displayOverlayResults(data);
  } catch (err) {
    console.error("❌ Fetch error:", err);
    alert("Something went wrong!");
  }
});

// results
function displayOverlayResults(data) {
  overlayResults.innerHTML = '';

  const uploadedSection = document.createElement('div');
  uploadedSection.classList.add('mb-6', 'text-center');
  uploadedSection.innerHTML = `
    <p class="font-semibold mb-2 text-xl">Uploaded Image</p>
    <img src="${data.query}" class="w-48 h-48 object-cover rounded-lg mx-auto shadow-lg border border-gray-300">
  `;
  overlayResults.appendChild(uploadedSection);

  const resultsSection = document.createElement('div');
  resultsSection.classList.add('grid', 'grid-cols-1', 'sm:grid-cols-2', 'md:grid-cols-3', 'lg:grid-cols-4', 'xl:grid-cols-5', 'gap-4');

  // filters
  const minScore = parseFloat(scoreFilter.value) || 0.4;
  const selectedCategory = categoryFilter.value;
  const filtered = data.results.filter(item => {
    const scoreOK = item.similarity >= minScore;
    const categoryOK = !selectedCategory || item.category === selectedCategory;
    return scoreOK && categoryOK;
  });

  if (filtered.length === 0) {
    resultsSection.innerHTML = `<p class="text-lg font-semibold text-center col-span-full">No similar items found</p>`;
  } else {
    filtered.forEach(item => {
      const card = document.createElement('div');
      card.classList.add('flex', 'flex-col', 'items-center', 'bg-gray-100', 'p-2', 'rounded-lg');
      card.innerHTML = `
        <img src="${item.path}" class="w-32 h-32 object-cover rounded-lg mb-2">
        <p class="text-sm font-semibold">${item.filename.replace(/\.[^/.]+$/, "")}</p>
        <p class="text-sm text-gray-700">Category: ${item.category}</p>
        <p class="text-sm text-gray-700">Similarity: ${(item.similarity * 100).toFixed(2)}%</p>
      `;
      resultsSection.appendChild(card);
    });
  }

  overlayResults.appendChild(resultsSection);
  overlay.classList.remove('hidden');
  overlay.classList.add('show');
}

// Hide overlay 
backButton.addEventListener('click', () => {
  overlay.classList.remove('show');
  setTimeout(() => overlay.classList.add('hidden'), 300);
});

let lastResultsData = null;

function displayOverlayResults(data) {
  lastResultsData = data; 
  renderFilteredResults();
  overlay.classList.remove('hidden');
  overlay.classList.add('show');
}

function renderFilteredResults() {
  if (!lastResultsData) return;
  
  overlayResults.innerHTML = '';

  const uploadedSection = document.createElement('div');
  uploadedSection.classList.add('mb-6', 'text-center');
  uploadedSection.innerHTML = `
    <p class="font-semibold mb-2 text-xl">Uploaded Image</p>
    <img src="${lastResultsData.query}" class="w-48 h-48 object-cover rounded-lg mx-auto shadow-lg border border-gray-300">
  `;
  overlayResults.appendChild(uploadedSection);

  // results grid
  const resultsSection = document.createElement('div');
  resultsSection.classList.add('grid', 'grid-cols-1', 'sm:grid-cols-2', 'md:grid-cols-3', 'lg:grid-cols-4', 'xl:grid-cols-5', 'gap-4');

  const minScore = parseFloat(scoreFilter.value) || 0.4;
  const selectedCategory = categoryFilter.value;

  const filtered = lastResultsData.results.filter(item => {
    const scoreOK = item.similarity >= minScore;
    const categoryOK = !selectedCategory || item.category === selectedCategory;
    return scoreOK && categoryOK;
  });
 
  // filtered results
  if (filtered.length === 0) {
    resultsSection.innerHTML = `<p class="text-lg font-semibold text-center col-span-full">No similar items found</p>`;
  } else {
    filtered.forEach(item => {
      const card = document.createElement('div');
      card.classList.add('flex', 'flex-col', 'items-center', 'bg-gray-100', 'p-2', 'rounded-lg');
      card.innerHTML = `
        <img src="${item.path}" class="w-32 h-32 object-cover rounded-lg mb-2">
        <p class="text-sm font-semibold">${item.filename.replace(/\.[^/.]+$/, "")}</p>
        <p class="text-sm text-gray-700">Category: ${item.category}</p>
        <p class="text-sm text-gray-700">Similarity: ${(item.similarity * 100).toFixed(2)}%</p>
      `;
      resultsSection.appendChild(card);
    });
  }

  overlayResults.appendChild(resultsSection);
}

applyFilters.addEventListener('click', renderFilteredResults);

