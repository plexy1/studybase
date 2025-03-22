const GOOGLE_API_KEY = "AIzaSyDhbZhNaXbdi55f8M6iGxG-A0--OOH2v20";

const CX = "231b4ea4797884527"; 


function searchGoogle(query) {
  const searchQuery = `${query} basics`;

  const url = `https://www.googleapis.com/customsearch/v1?key=${GOOGLE_API_KEY}&cx=${CX}&q=${encodeURIComponent(searchQuery)}&num=6`;

  fetch(url)
    .then((response) => response.json())
    .then((data) => {
      if (!data.items || data.items.length === 0) {
        document.getElementById("googleResults").innerHTML =
          "<p>No Google results found.</p>";
        return;
      }
      displayGoogleResults(data.items);
    })
    .catch((err) => {
      console.error("Error fetching Google data:", err);
      document.getElementById("googleResults").innerHTML =
        "<p>Error fetching Google results.</p>";
    });
}

function displayGoogleResults(items) {
  const container = document.getElementById('googleResults');
  if (!items || items.length === 0) {
    container.innerHTML = '<p>No Google results found.</p>';
    return;
  }

  container.innerHTML = '';
  
  items.forEach(item => {
    const hostname = new URL(item.link).hostname.replace('www.', '');
    let description = item.snippet || '';
    // Get first sentence and ensure it ends with a period
    description = description.split('.')[0].trim() + '.';
    // Limit to roughly 10 words
    description = description.split(' ').slice(0, 10).join(' ');
    if (!description.endsWith('.')) {
      description += '...';
    }
    
    const div = document.createElement('div');
    div.className = 'g-item';
    div.onclick = () => window.open(item.link, '_blank');
    
    div.innerHTML = `
      <h4>${hostname}</h4>
      <p>${description}</p>
    `;
    
    container.appendChild(div);
  });
}



