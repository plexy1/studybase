
const YT_API_KEY = 'AIzaSyAs4Rbt-G3tXoCm8JKb7e-rn4V8oKx9r4s';
const YT_SEARCH_URL = 'https://www.googleapis.com/youtube/v3/search';
const YT_VIDEOS_URL = 'https://www.googleapis.com/youtube/v3/videos';

// Google Custom Search config
const GOOGLE_API_KEY = 'AIzaSyBAvcoQFLKyNjHS_g-cbHW-3b5rRy89wjQ';
const GOOGLE_CX = '247a328ab0e4c4db3';
const GOOGLE_SEARCH_URL = 'https://www.googleapis.com/customsearch/v1';

/***************************************
 *  EVENT LISTENER
 ***************************************/
document.getElementById('searchBtn').addEventListener('click', () => {
  const query = document.getElementById('searchInput').value.trim();
  if (!query) return;

  // Clear old results
  document.getElementById('googleResults').innerHTML = '';
  document.getElementById('videoDetails').innerHTML = '';

  // Trigger both searches in parallel
  searchGoogle(query);
  searchYouTube(query);
});

/***************************************
 *  GOOGLE CUSTOM SEARCH
 ***************************************/
function searchGoogle(query) {
  const url = `${GOOGLE_SEARCH_URL}?key=${GOOGLE_API_KEY}&cx=${GOOGLE_CX}&q=${encodeURIComponent(query)}`;
  
  fetch(url)
    .then(response => response.json())
    .then(data => {
      if (data.items && data.items.length) {
        displayGoogleResults(data.items);
      } else {
        document.getElementById('googleResults').innerHTML = '<p>No Google results found.</p>';
      }
    })
    .catch(error => {
      console.error('Error fetching Google data:', error);
      document.getElementById('googleResults').innerHTML = '<p>Error fetching Google results.</p>';
    });
}

function displayGoogleResults(items) {
  const container = document.getElementById('googleResults');
  let html = '';
  items.forEach(item => {
    const title = item.title;
    const link = item.link;
    const snippet = item.snippet;

    html += `
      <div class="google-result">
        <a href="${link}" target="_blank">${title}</a>
        <p>${snippet}</p>
      </div>
    `;
  });
  container.innerHTML = html;
}

/***************************************
 *  YOUTUBE SEARCH
 ***************************************/
function searchYouTube(query) {
  const url = `${YT_SEARCH_URL}?part=snippet&q=${encodeURIComponent(query)}&key=${YT_API_KEY}&maxResults=1`;
  
  fetch(url)
    .then(response => response.json())
    .then(data => {
      if (!data.items || !data.items.length) {
        document.getElementById('videoDetails').innerHTML = '<p>No YouTube results found.</p>';
        return;
      }

      const firstItem = data.items[0];
      // If it's a channel or playlist, it might not have videoId
      if (!firstItem.id.videoId) {
        document.getElementById('videoDetails').innerHTML = '<p>No video result found.</p>';
        return;
      }
      
      getVideoDetails(firstItem.id.videoId);
    })
    .catch(error => {
      console.error('Error fetching YouTube data:', error);
      document.getElementById('videoDetails').innerHTML = '<p>Error fetching YouTube results.</p>';
    });
}

function getVideoDetails(videoId) {
  const url = `${YT_VIDEOS_URL}?part=snippet,statistics&id=${videoId}&key=${YT_API_KEY}`;
  fetch(url)
    .then(response => response.json())
    .then(data => {
      if (!data.items || !data.items.length) {
        document.getElementById('videoDetails').innerHTML = '<p>No video details found.</p>';
        return;
      }

      displayYouTubeResult(data.items[0]);
    })
    .catch(error => {
      console.error('Error fetching video details:', error);
      document.getElementById('videoDetails').innerHTML = '<p>Error fetching video details.</p>';
    });
}

function displayYouTubeResult(video) {
  const videoId = video.id;
  const snippet = video.snippet;
  const stats = video.statistics || {};
  
  const title = snippet.title;
  const description = snippet.description;
  const creator = snippet.channelTitle;
  const views = stats.viewCount || 'N/A';
  const likes = stats.likeCount || 'N/A';
  const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;

  const html = `
    <div>
      <iframe
        src="https://www.youtube.com/embed/${videoId}"
        frameborder="0"
        allowfullscreen>
      </iframe>
    </div>
    <div class="video-details">
      <h3><a href="${videoUrl}" target="_blank">${title}</a></h3>
      <p><strong>Creator:</strong> ${creator}</p>
      <p><strong>Views:</strong> ${views}</p>
      <p><strong>Likes:</strong> ${likes}</p>
      <p><strong>Description:</strong> ${description.slice(0, 150)}...</p>
    </div>
  `;

  document.getElementById('videoDetails').innerHTML = html;
}
