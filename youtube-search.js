const API_KEY = 'AIzaSyAjvShhWqOBIrgero2ODtQQtSzWuafmGJw'; // temporary API key (.env to be used later)
  const SEARCH_URL = 'https://www.googleapis.com/youtube/v3/search';
  const VIDEO_DETAILS_URL = 'https://www.googleapis.com/youtube/v3/videos';

  let currentQuery = "";
  let nextPageToken = "";
  let searchHistory = JSON.parse(localStorage.getItem("searchHistory")) || ["boom"];
  let prevPageToken = "";

  function searchYouTube(query, pageToken = "") {
    currentQuery = query; // update global query for pagination

    if (!searchHistory.includes(query)) { //added this to help with getting history -Peter
      searchHistory.push(query);
      localStorage.setItem("searchHistory", JSON.stringify(searchHistory)); 
  }

    let url = `${SEARCH_URL}?part=snippet&q=${encodeURIComponent(query)}&key=${API_KEY}&maxResults=1&type=video`;
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

  function getQuery() { // method to return history topics -Peter
    return JSON.parse(localStorage.getItem("searchHistory")) || searchHistory;
  }

  function getVideoDetails(videoId) {
    const url = `${VIDEO_DETAILS_URL}?part=snippet,statistics&id=${videoId}&key=${API_KEY}`;
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
    const title = video.snippet.title;
    const videoId = video.id;
    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
    const description = video.snippet.description;
    const views = video.statistics.viewCount;
    const likes = video.statistics.likeCount;
    const creator = video.snippet.channelTitle;

    const resultHTML = `
      <div class="video-result" style="min-width:300px; margin: 0 auto;">
        <iframe width="100%" height="200" src="https://www.youtube.com/embed/${videoId}" frameborder="0" allowfullscreen></iframe>
        <div class="video-details mt-2">
          <h3><a href="${videoUrl}" target="_blank">${title}</a></h3>
          <div class="video-info">
            <p><strong>Creator:</strong> ${creator}</p>
            <p><strong>Views:</strong> ${views}</p>
            <p><strong>Likes:</strong> ${likes}</p>
          </div>
          <div class="description">
            <p><strong>Description:</strong> ${description.slice(0, 150)}...</p>
          </div>
        </div>
      </div>
    `;
    document.getElementById('videoSlider').innerHTML = resultHTML;
  }

  function updateNavigationButtons() {
    const nextBtn = document.getElementById('nextVideos');
    const prevBtn = document.getElementById('prevVideos');

    nextBtn.style.display = nextPageToken ? "inline-block" : "none";
    prevBtn.style.display = prevPageToken ? "inline-block" : "none";
  }

  document.getElementById('nextVideos').addEventListener('click', function() {
    if (nextPageToken) {
      searchYouTube(currentQuery, nextPageToken);
    }
  });

  document.getElementById('prevVideos').addEventListener('click', function() {
    if (prevPageToken) {
      searchYouTube(currentQuery, prevPageToken);
    }
  });