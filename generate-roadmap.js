async function searchGemini(query) {
  const educationLevel = document.getElementById('educationLevel').value;
  const questionSlider = document.getElementById('questionSlider');
  const questionCounts = [5, 10, 15, 20];
  let sliderValue = parseInt(questionSlider.value) || 1;
  if (sliderValue < 1) {
    sliderValue = 1;
  }
  if (sliderValue > 4) {
    sliderValue = 4; 
  }
  const actualCount = questionCounts[sliderValue - 1];
  
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

  const promptText = `Generate a ${levelText} study roadmap for ${query}. 
  List ${actualCount} numbered topics (format: "1. Topic Name"). 
  Do not use asterisks or bullet points. Keep topic titles 5-6 words maximum. Keep all descriptions concise.`;

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

    geminiResultDiv.innerHTML = formatRoadmap(roadmap, query);
    fetchAndCacheAllTopicDetails(query, levelText);
    addTileClickListeners();
    initializeRoadmap();

  } catch (error) {
    console.error('Gemini search error:', error);
    geminiResultDiv.innerHTML = '<p>Error fetching Gemini roadmap.</p>';
  }
}
const topicDetailsCache = {};

async function fetchAndCacheAllTopicDetails(query, educationLevel) {
  const tiles = document.querySelectorAll('.roadmap-tile');
  
  for (const tile of tiles) {
    const topicNumber = tile.dataset.topicNumber;
    const topicText = tile.dataset.topicText;
    const cacheKey = `${query}_${topicText}`;
    topicDetailsCache[cacheKey] = 'loading';
    
    try {
      const details = await getTopicDetails(query, topicText, educationLevel);
      topicDetailsCache[cacheKey] = details;
    } catch (error) {
      console.error('Error fetching topic details:', error);
      topicDetailsCache[cacheKey] = '<div class="topic-error">Failed to load details.</div>';
    }
  }
}

function formatRoadmap(roadmapText, query) {
  const formattedTitle = query ? (query.charAt(0).toUpperCase() + query.slice(1)) : "Study Roadmap";
  let html = `<div class="gemini-roadmap-container" style="text-align: left;">
              <h2 class="roadmap-title" style="text-align: left;">Study Roadmap: ${formattedTitle}</h2>`;
  
  const lines = roadmapText.trim().split('\n');
  let inTopics = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    if (/^\d+\./.test(line)) {
      const match = line.match(/^(\d+)\.(.+)$/);
      
      if (match) {
        const number = match[1];
        const topicName = match[2].trim();
        
        html += `
          <div class="roadmap-tile" data-topic-number="${number}" data-topic-text="${topicName}" style="text-align: left;">
            <div class="topic-header" style="text-align: left;">
              <div class="topic-title" style="text-align: left;"><b>${number}. ${topicName}</b></div>
              <div class="expand-icon">+</div>
            </div>
            <div class="topic-details" style="display: none; text-align: left;">
              <div class="topic-loading">Loading details...</div>
            </div>
          </div>`;
      }
    }
  }
  
  html += '</div>';
  return html;
}

function addTileClickListeners() {
  const tiles = document.querySelectorAll('.roadmap-tile');
  const searchInput = document.getElementById('searchInput');
  const educationLevel = document.getElementById('educationLevel').value;
  const query = searchInput.value.trim();
  
  tiles.forEach(tile => {
    const header = tile.querySelector('.topic-header');
    const detailsDiv = tile.querySelector('.topic-details');
    const expandIcon = tile.querySelector('.expand-icon');
    const topicText = tile.dataset.topicText;
    const cacheKey = `${query}_${topicText}`;
    
    header.addEventListener('click', function() {
      const isExpanded = detailsDiv.style.display !== 'none';
      
      if (isExpanded) {
        detailsDiv.style.display = 'none';
        expandIcon.textContent = '+';
      } else {
        detailsDiv.style.display = 'block';
        expandIcon.textContent = '-';
        
        if (topicDetailsCache[cacheKey]) {
          if (topicDetailsCache[cacheKey] === 'loading') {
            detailsDiv.innerHTML = '<div class="topic-loading">Loading details...</div>';
          } else {
            detailsDiv.innerHTML = topicDetailsCache[cacheKey];
          }
        } else {
          detailsDiv.innerHTML = '<div class="topic-loading">Loading details...</div>';
        }
      }
    });
  });
}

async function getTopicDetails(mainTopic, subtopic, educationLevel) {
  const promptText = `
You are creating educational content for a ${educationLevel} student studying ${mainTopic}.
Provide a brief explanation of the subtopic "${subtopic}" followed by common mistakes.

Format your response exactly like this:
First, give a clear explanation of the topic in like 2-3 sentences.

Then list 2 common mistakes with the header "Common Mistakes":
- First common mistake (one sentence)
- Second common mistake (one sentence)`;

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
    
    if (data.candidates && data.candidates.length > 0 && 
        data.candidates[0].content && 
        data.candidates[0].content.parts && 
        data.candidates[0].content.parts.length > 0) {
      
      const detailText = data.candidates[0].content.parts[0].text;
      return formatTopicDetails(detailText);
    }
    
    return '<div class="topic-error">No details available.</div>';
  } catch (error) {
    console.error('Topic details error:', error);
    return '<div class="topic-error">Error fetching details.</div>';
  }
}

function formatTopicDetails(detailText) {
  const parts = detailText.split(/Common Mistakes:|COMMON MISTAKES:/i);
  
  let html = `<div class="topic-description">${parts[0].trim()}</div>`;
  
  if (parts.length > 1) {
    const mistakesPart = parts[1].trim();

    const mistakeLines = mistakesPart.split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);
    
    const mistakes = [];
    
    for (const line of mistakeLines) {
      if (line.match(/^[-•]\s+/) || line.match(/^\d+\.\s+/)) {
        mistakes.push(line.replace(/^[-•\d+\.]\s+/, ''));
      } else {
        mistakes.push(line);
      }
    }
    
    html += `<div class="common-mistakes">
              <h4>Common Mistakes</h4>
              <ul>`;
    
    mistakes.forEach(mistake => {
      html += `<li>${mistake}</li>`;
    });
    
    html += `</ul>
            </div>`;
  }
  
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

function addExpandIconHoverEffect() {
  const expandIcons = document.querySelectorAll('.expand-icon');
  expandIcons.forEach(icon => {
    icon.addEventListener('mouseenter', () => {
      icon.style.backgroundColor = 'rgba(0, 123, 255, 0.1)';
    });
    
    icon.addEventListener('mouseleave', () => {
      icon.style.backgroundColor = 'transparent';
    });
  });
}

function initializeRoadmap() {
  animateTiles();
  addExpandIconHoverEffect();
}