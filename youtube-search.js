// YouTube API key (replace with your own key)
const API_KEY = 'AIzaSyD02YTPwO5ewUdc13zkl17fv9I44AeXS3k';
const SEARCH_URL = 'https://www.googleapis.com/youtube/v3/search';
const VIDEO_DETAILS_URL = 'https://www.googleapis.com/youtube/v3/videos';

// Handle search button click
document.getElementById('searchBtn').addEventListener('click', function() {
    const query = document.getElementById('searchInput').value;
    if (query) {
        searchYouTube(query);
    }
});

// Search YouTube
function searchYouTube(query) {
    const url = `${SEARCH_URL}?part=snippet&q=${encodeURIComponent(query)}&key=${API_KEY}&maxResults=1`;
    fetch(url)
        .then(response => response.json())
        .then(data => {
            const result = data.items[0];
            getVideoDetails(result.id.videoId); // Get video details after search result
        })
        .catch(error => {
            console.error('Error fetching YouTube data:', error);
        });
}

// Get video details such as views, likes, and creator
function getVideoDetails(videoId) {
    const url = `${VIDEO_DETAILS_URL}?part=snippet,statistics&id=${videoId}&key=${API_KEY}`;
    fetch(url)
        .then(response => response.json())
        .then(data => {
            const video = data.items[0];
            displayResult(video);
        })
        .catch(error => {
            console.error('Error fetching video details:', error);
        });
}

// Display video details in the right half
function displayResult(video) {
    const title = video.snippet.title;
    const videoId = video.id;
    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
    const description = video.snippet.description;
    const thumbnail = video.snippet.thumbnails.high.url;
    const views = video.statistics.viewCount;
    const likes = video.statistics.likeCount;
    const creator = video.snippet.channelTitle;

    const resultHTML = `
        <div>
            <iframe width="100%" height="315" src="https://www.youtube.com/embed/${videoId}" frameborder="0" allowfullscreen></iframe>
        </div>
        <div class="video-details">
            <h3><a href="${videoUrl}" target="_blank">${title}</a></h3>
            <div class="video-info">
                <p><strong>Creator:</strong> ${creator}</p>
                <p><strong>Views:</strong> ${views}</p>
                <p><strong>Likes:</strong> ${likes}</p>
            </div>
            <p><strong>Description:</strong> ${description.slice(0, 150)}...</p>
        </div>
    `;

    document.getElementById('videoDetails').innerHTML = resultHTML;
}
