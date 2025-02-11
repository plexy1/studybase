
const GOOGLE_API_KEY = "AIzaSyBAvcoQFLKyNjHS_g-cbHW-3b5rRy89wjQ";

const CX = "247a328ab0e4c4db3"; 


function searchGoogle(query) {
  // We append “basics filetype:pdf” to the user’s query
  const searchQuery = `${query} basics filetype:pdf`;

  const url = `https://www.googleapis.com/customsearch/v1?key=${GOOGLE_API_KEY}&cx=${CX}&q=${encodeURIComponent(searchQuery)}`;

  fetch(url)
    .then((response) => response.json())
    .then((data) => {
      if (!data.items || data.items.length === 0) {
        document.getElementById("googleResults").innerHTML =
          "<p>No Google PDF results found.</p>";
        return;
      }
      displayGoogleResults(data.items);
    })
    .catch((err) => {
      console.error("Error fetching Google data:", err);
      document.getElementById("googleResults").innerHTML =
        "<p>Error fetching Google PDF results.</p>";
    });
}

function displayGoogleResults(items) {
  const container = document.getElementById("googleResults");
  container.innerHTML = ""; // Clear old results

  items.forEach((item) => {
    const title = item.title || "No Title";
    const link = item.link || "#";
    const snippet = item.snippet || "";

    const resultHTML = `
      <div class="g-item">
        <h4><a href="${link}" target="_blank">${title}</a></h4>
        <p class="snippet">${snippet}</p>
      </div>
    `;
    container.insertAdjacentHTML("beforeend", resultHTML);
  });
}



