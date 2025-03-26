const spinnerOverlay = document.getElementById('spinnerOverlay');
const fileInput = document.getElementById('fileInput');

fileInput.addEventListener('change', async function (event) {
  if (event.target.files && event.target.files[0]) {
    showSpinner();
    try {
      const imageUrl = await uploadImageToImgbb(event.target.files[0]);
      const calorieData = await callCalorieApi(imageUrl);
      displayCalorieData(calorieData);
    } catch (error) {
      console.error("Error:", error);
      alert("Error processing image. Please try again.");
    } finally {
      hideSpinner();
    }
  }
});

function showSpinner() {
  spinnerOverlay.style.display = "flex";
}

function hideSpinner() {
  spinnerOverlay.style.display = "none";
}

async function uploadImageToImgbb(file) {
  const formData = new FormData();
  formData.append("image", file);
  const imgbbUrl = "https://api.imgbb.com/1/upload?key=4c47e7b4e478ff70d1d718503a0a6078";
  
  const response = await fetch(imgbbUrl, {
    method: "POST",
    body: formData
  });
  const result = await response.json();
  return result.data?.url || Promise.reject("Image upload failed");
}

async function callCalorieApi(imageUrl) {
  const payload = {
    messages: [{
      role: "user",
      content: [{
        type: "text",
        text: "Provide nutritional data in JSON format: {items:[{item_name, total_calories, total_protein, total_carbs, total_fats}]}"
      }, {
        type: "image_url",
        image_url: { url: imageUrl }
      }]
    }],
    model: "llama-3.2-90b-vision-preview",
    response_format: { type: "json_object" }
  };

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer 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"
    },
    body: JSON.stringify(payload)
  });
  const result = await response.json();
  return JSON.parse(result.choices[0].message.content);
}

function displayCalorieData(data) {
  const cardContainer = document.getElementById('cardContainer');
  const resultSection = document.getElementById('resultSection');
  resultSection.style.display = 'block';
  cardContainer.innerHTML = '';

  data.items.forEach(item => {
    const card = document.createElement('div');
    card.className = "card";
    card.innerHTML = `
      <div class="card-content">
        <h3>${item.item_name}</h3>
        <p>🍎 ${item.total_calories} Calories</p>
        <div class="progress-circle" data-calories="${item.total_calories}">
          <svg>
            <circle class="bg" cx="50%" cy="50%" r="45%"></circle>
            <circle class="progress" cx="50%" cy="50%" r="45%"></circle>
          </svg>
          <div class="progress-text">0%</div>
        </div>
        <div class="nutrition-facts">
          <p>🥩 Protein: ${item.total_protein}g</p>
          <p>🍞 Carbs: ${item.total_carbs}g</p>
          <p>🥑 Fats: ${item.total_fats}g</p>
        </div>
      </div>
    `;
    cardContainer.appendChild(card);
    animateProgress(card.querySelector('.progress-circle'), item.total_calories, 500);
  });
}

function animateProgress(progressEl, calories, maxCalories) {
  const percentage = Math.min((calories / maxCalories) * 100, 100);
  const circle = progressEl.querySelector('.progress');
  const progressText = progressEl.querySelector('.progress-text');
  const radius = circle.r.baseVal.value;
  const circumference = 2 * Math.PI * radius;

  circle.style.strokeDasharray = circumference;
  circle.style.strokeDashoffset = circumference;

  let currentPercent = 0;
  const updateInterval = setInterval(() => {
    currentPercent += 1;
    const offset = circumference * (1 - currentPercent / 100);
    circle.style.strokeDashoffset = offset;
    progressText.textContent = `${Math.min(currentPercent, Math.round(percentage))}%`;
    
    if(currentPercent >= percentage) clearInterval(updateInterval);
  }, 20);
}