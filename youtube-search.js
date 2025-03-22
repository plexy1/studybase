const API_KEY = 'AIzaSyAs4Rbt-G3tXoCm8JKb7e-rn4V8oKx9r4s'; // temporary API key (.env to be used later)
const SEARCH_URL = 'https://www.googleapis.com/youtube/v3/search';
const VIDEO_DETAILS_URL = 'https://www.googleapis.com/youtube/v3/videos';

let currentQuery = "";
let nextPageToken = "";
let prevPageToken = "";

function searchYouTube(query, pageToken = "") {
  currentQuery = query;

  let url = `${SEARCH_URL}?part=snippet&q=${encodeURIComponent(query)}&key=${API_KEY}&maxResults=1&type=video&videoDuration=long`;
  if (pageToken) {
    url += `&pageToken=${pageToken}`;
  }
  
  fetch(url)
    .then(response => response.json())
    .then(data => {
      nextPageToken = data.nextPageToken || "";
      prevPageToken = data.prevPageToken || "";

      if (data.items && data.items.length > 0) {
        const videoId = data.items[0].id.videoId;
        getVideoDetails(videoId);
      } else {
        console.error("No video found for this query.");
        document.getElementById('videoSlider').innerHTML = "<p>No video found.</p>";
      }
    })
    .catch(error => {
      console.error('Error fetching YouTube data:', error);
    });
}

function getVideoDetails(videoId) {
  const url = `${VIDEO_DETAILS_URL}?part=snippet,statistics,contentDetails&id=${videoId}&key=${API_KEY}`;
  fetch(url)
    .then(response => response.json())
    .then(data => {
      if (data.items && data.items.length > 0) {
        displayResult(data.items[0]);
        updateNavigationButtons();
      } else {
        console.error("No video details found for videoId:", videoId);
      }
    })
    .catch(error => {
      console.error('Error fetching video details:', error);
    });
}

function displayResult(video) {
  const videoSlider = document.getElementById('videoSlider');
  const duration = formatDuration(video.contentDetails.duration);
  const viewCount = parseInt(video.statistics.viewCount).toLocaleString();
  
  videoSlider.innerHTML = `
    <div class="video-container">
      <iframe
        src="https://www.youtube.com/embed/${video.id}"
        title="${video.snippet.title}"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowfullscreen
      ></iframe>
      <div class="video-info mt-2">
        <h6 class="video-title">${video.snippet.title}</h6>
        <div class="video-meta">
          <span class="channel-name">${video.snippet.channelTitle}</span> • 
          <span class="video-views">${viewCount} views</span> • 
          <span class="video-duration">${duration}</span>
        </div>
      </div>
    </div>
  `;
}

function formatDuration(duration) {
  const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
  const hours = (match[1] || '').replace('H', '');
  const minutes = (match[2] || '').replace('M', '');
  const seconds = (match[3] || '').replace('S', '');
  
  let result = '';
  if (hours) result += `${hours}:`;
  result += `${minutes.padStart(2, '0')}:${seconds.padStart(2, '0')}`;
  return result;
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
}

function updateNavigationButtons() {
  const prevButton = document.getElementById('prevVideos');
  const nextButton = document.getElementById('nextVideos');
  
  prevButton.style.display = prevPageToken ? 'inline-block' : 'none';
  nextButton.style.display = nextPageToken ? 'inline-block' : 'none';
}

// Event listeners for navigation
document.getElementById('prevVideos')?.addEventListener('click', () => {
  if (prevPageToken) {
    searchYouTube(currentQuery, prevPageToken);
  }
});

document.getElementById('nextVideos')?.addEventListener('click', () => {
  if (nextPageToken) {
    searchYouTube(currentQuery, nextPageToken);
  }
});
