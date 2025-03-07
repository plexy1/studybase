async function searchGemini(query) {
  const apiKey = 'AIzaSyAJJQLYD2wHZu49VgCIzbAuc2XBWFtCBJA'; 

  const promptText = `university level study roadmap for ${query}, topics only, numbered 1 to n, do not give any prequel to the answer start with topics straight up`;

  const geminiResultDiv = document.getElementById('geminiResult');
  geminiResultDiv.innerHTML = '<p>Loading Gemini Roadmap...</p>';

  try {
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

      geminiResultDiv.innerHTML = formatRoadmap(roadmap);
      animateTiles();


  } catch (error) {
      console.error('Gemini search error:', error);
      geminiResultDiv.innerHTML = '<p>Error fetching Gemini roadmap.</p>';
  }
}

function formatRoadmap(roadmapText) {
  const points = roadmapText.split(/(\d+\.)/).filter(Boolean);
  let formattedRoadmap = '<div class="gemini-roadmap-container">'; 

  for (let i = 0; i < points.length; i += 2) {
      const pointNumber = points[i];
      const pointDescription = points[i + 1] ? points[i + 1].trim() : '';
      if (pointDescription) {
          formattedRoadmap += `
              <div class="roadmap-tile">
                  <b>${pointNumber.trim()}</b>
                  ${pointDescription}
              </div>`;
      }
  }
  formattedRoadmap += '</div>'; 
  return formattedRoadmap;
}

function animateTiles() {
  const tiles = document.querySelectorAll('.roadmap-tile');
  tiles.forEach((tile, index) => {
      setTimeout(() => {
          tile.classList.add('roadmap-tile-animated');
      }, index * 150); 
  });
}