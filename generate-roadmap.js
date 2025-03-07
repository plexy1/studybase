// test-gemini.js
async function searchGemini(query) {
  // Get education level from the dropdown
  const educationLevel = document.getElementById('educationLevel').value;
  
  // Get count from the slider
  const questionSlider = document.getElementById('questionSlider');
  const count = parseInt(questionSlider.value);
  const finalCount = isNaN(count) || count < 1 ? 1 : (count > 8 ? 8 : count);
  
  // Map slider values to actual question counts
  const questionCounts = [5, 10, 15, 20];
  const actualCount = questionCounts[finalCount - 1] || 5;
  
  let levelText = '';
  switch(educationLevel) {
    case 'highSchool':
      levelText = 'High School';
      break;
    case 'university12':
      levelText = 'Year 1-2 University';
      break;
    case 'university34':
      levelText = 'Year 3-4 University';
      break;
    case 'masters':
      levelText = 'Graduate Student';
      break;
    default:
      levelText = 'university level student';
  }

  const promptText = `generate a ${levelText} study roadmap for ${query}, topics only, numbered 1 to ${actualCount}, do not give any prequel to your generation just start with topics straight up, do no include * in output. Generate a one to two second description of the roadmap under the title`;

  const geminiResultDiv = document.getElementById('geminiResult');
  // Add loading animation here
  const loadingText = "Loading Roadmap...";
  let loadingHTML = '<div class="loading-container">';
  for (let i = 0; i < loadingText.length; i++) {
    loadingHTML += `<span style="animation-delay: ${i * 0.1}s" class="loading-letter">${loadingText[i]}</span>`;
  }
  loadingHTML += '</div>';
  geminiResultDiv.innerHTML = loadingHTML;

  try {
    const apiKey = 'AIzaSyAJJQLYD2wHZu49VgCIzbAuc2XBWFtCBJA';
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: promptText
          }]
        }]
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    let roadmap = "No roadmap found.";

    if (data.candidates && data.candidates.length > 0 && data.candidates[0].content && data.candidates[0].content.parts && data.candidates[0].content.parts.length > 0) {
      roadmap = data.candidates[0].content.parts[0].text;
    }

    // Format the roadmap with proper styling
    geminiResultDiv.innerHTML = formatRoadmap(roadmap, query);
    
    // Call animation function if it exists
    if (typeof animateTiles === 'function') {
      animateTiles();
    }

  } catch (error) {
    console.error('Gemini search error:', error);
    geminiResultDiv.innerHTML = '<p>Error fetching Gemini roadmap.</p>';
  }
}

function formatRoadmap(roadmapText, query) {
  const formattedTitle = query ? (query.charAt(0).toUpperCase() + query.slice(1)) : "Study Roadmap";
    let html = `<div class="gemini-roadmap-container">
                <h2 class="roadmap-title">Study Roadmap: ${formattedTitle}</h2>`;
  
  const lines = roadmapText.trim().split('\n');
  let inTopics = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    if (/^\d+\./.test(line)) {
      inTopics = true;
      const match = line.match(/^(\d+)\.(.*)$/);
      
      if (match) {
        const number = match[1];
        const text = match[2].trim();
        
        html += `
          <div class="roadmap-tile">
            <div class="topic-title"><b>${number}. ${text}</b></div>`;
        
        if (i + 1 < lines.length && lines[i + 1].trim() && !/^\d+\./.test(lines[i + 1])) {
          html += `<div class="topic-description">${lines[i + 1].trim()}</div>`;
          i++;
        }
        
        html += `</div>`;
      }
    }
  }
  
  html += '</div>';
  return html;
}

function animateTiles() {
  const tiles = document.querySelectorAll('.roadmap-tile');
  tiles.forEach((tile, index) => {
    setTimeout(() => {
      tile.classList.add('roadmap-tile-animated');
    }, index * 150);
  });
}