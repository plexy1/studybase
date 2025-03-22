/**
 * Studybase - Modern Learning Roadmap
 * 
 * A completely new, ultra-minimal implementation of the learning roadmap
 * with modern animations and a grid-based layout.
 */

// Cache for topic details
const topicCache = {};

/**
 * Generate a learning roadmap for the given query
 */
async function searchGemini(query) {
  if (!query || query.trim() === '') return;

  // Get user preferences
  const educationLevel = document.getElementById('educationLevel').value;
  const slider = document.getElementById('questionSlider');
  const topicCounts = [5, 10, 15, 20];
  const sliderValue = Math.max(1, Math.min(4, parseInt(slider.value) || 1));
  const topicCount = topicCounts[sliderValue - 1];
  
  // Format education level
  const level = formatEducationLevel(educationLevel);
  
  // Get container and show loading state
  const container = document.getElementById('geminiResult');
  showLoading(container);
  
  try {
    // Generate roadmap content
    const content = await generateRoadmapContent(query, level, topicCount);
    
    if (!content) {
      showEmptyState(container, query);
      return;
    }
    
    // Parse topics
    const topics = parseTopics(content);
    
    if (topics.length === 0) {
      showEmptyState(container, query);
      return;
    }
    
    // Render roadmap
    renderRoadmap(container, topics, query);
    
    // Load details for all topics
    loadAllTopicDetails(topics, query, level);
    
    // Track progress
    updateProgress(0, topics.length);
    
  } catch (error) {
    console.error('Error generating roadmap:', error);
    showErrorState(container);
  }
}

/**
 * Format education level for the prompt
 */
function formatEducationLevel(level) {
  switch(level) {
    case 'highSchool': return 'High School';
    case 'university12': return 'Year 1-2 University';
    case 'university34': return 'Year 3-4 University';
    case 'masters': return 'Graduate Student';
    default: return 'university level student';
  }
}

/**
 * Show loading state
 */
function showLoading(container) {
  container.innerHTML = `
    <div class="sr-roadmap-loading">
      <div class="sr-roadmap-spinner"></div>
      <div class="sr-roadmap-loading-text">Creating your learning path</div>
    </div>
  `;
}

/**
 * Show empty state when no content is found
 */
function showEmptyState(container, query) {
  container.innerHTML = `
    <div class="sr-roadmap-empty">
      <div class="sr-roadmap-empty-icon">⚠️</div>
      <div class="sr-roadmap-empty-title">No learning path found</div>
      <p class="sr-roadmap-empty-message">
        We couldn't create a learning path for "${query}". 
        Try a different search term or adjust your settings.
      </p>
    </div>
  `;
}

/**
 * Show error state
 */
function showErrorState(container) {
  container.innerHTML = `
    <div class="sr-roadmap-empty">
      <div class="sr-roadmap-empty-icon">⚠️</div>
      <div class="sr-roadmap-empty-title">Something went wrong</div>
      <p class="sr-roadmap-empty-message">
        We encountered an error while creating your learning path.
        Please try again later.
      </p>
    </div>
  `;
}

/**
 * Generate roadmap content using Gemini API
 */
async function generateRoadmapContent(query, level, topicCount) {
  const prompt = `
    Create a ${level} learning path for ${query}.
    List exactly ${topicCount} numbered topics (format: "1. Topic Name").
    Keep topic titles concise (5-6 words maximum).
    Do not use bullet points or asterisks.
  `;

  try {
    const apiKey = 'AIzaSyAJJQLYD2wHZu49VgCIzbAuc2XBWFtCBJA';
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.candidates && 
        data.candidates.length > 0 && 
        data.candidates[0].content?.parts?.length > 0) {
      return data.candidates[0].content.parts[0].text;
    }
    
    return null;
  } catch (error) {
    console.error('API error:', error);
    throw error;
  }
}

/**
 * Parse topics from generated content
 */
function parseTopics(content) {
  const topics = [];
  const lines = content.split('\n');
  
  for (const line of lines) {
    const match = line.trim().match(/^(\d+)\.(.+)$/);
    if (match) {
      topics.push({
        number: match[1],
        title: match[2].trim()
      });
    }
  }
  
  return topics;
}

/**
 * Render roadmap with grid layout
 */
function renderRoadmap(container, topics, query) {
  const title = query.charAt(0).toUpperCase() + query.slice(1);
  
  let html = `
    <div class="roadmap-container">
  `;
  
  topics.forEach(topic => {
    html += createTopicCard(topic);
  });
  
  html += `
    </div>
    <div class="roadmap-progress mt-4">
      <div class="progress" style="height: 8px;">
        <div class="progress-bar" role="progressbar" style="width: 0%" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100"></div>
      </div>
      <div class="progress-text mt-2 text-center">Loading topics: <span class="progress-value">0</span>/${topics.length}</div>
    </div>
  `;
  
  container.innerHTML = html;
  
  // Initialize interactions after rendering
  initializeRoadmap();
}

/**
 * Create HTML for a single topic card
 */
function createTopicCard(topic) {
  return `
    <div class="roadmap-card" data-topic="${topic.title}" data-number="${topic.number}">
      <div class="roadmap-header">
        <div class="roadmap-number">${topic.number}</div>
        <div class="roadmap-title">${topic.title}</div>
      </div>
      <div class="roadmap-content">
        <div class="loading-indicator">
          <div class="spinner-border spinner-border-sm text-primary" role="status">
            <span class="visually-hidden">Loading...</span>
          </div>
          <span class="ms-2">Loading content...</span>
        </div>
      </div>
    </div>
  `;
}

/**
 * Initialize roadmap interactions
 */
function initializeRoadmap() {
  // Add click handlers to cards
  document.querySelectorAll('.roadmap-card').forEach(card => {
    card.addEventListener('click', toggleCard);
  });
  
  // Animate cards appearance
  animateCards();
}

/**
 * Toggle card expansion
 */
function toggleCard() {
  const card = this.closest('.roadmap-card');
  const isExpanded = card.classList.contains('expanded');
  
  // Toggle expanded state
  if (isExpanded) {
    card.classList.remove('expanded');
  } else {
    // Close any other open cards
    document.querySelectorAll('.roadmap-card.expanded').forEach(el => {
      if (el !== card) el.classList.remove('expanded');
    });
    
    card.classList.add('expanded');
    
    // Show topic details
    const topic = card.dataset.topic;
    const topicNumber = card.dataset.number;
    const contentArea = card.querySelector('.roadmap-content');
    
    // Check if content is already loaded
    if (contentArea.querySelector('.loading-indicator')) {
      // Check cache first
      if (topicCache[topic]) {
        renderTopicContent(contentArea, topicCache[topic]);
      } else {
        // Load details
        const query = document.getElementById('searchInput').value.trim();
        const educationLevel = document.getElementById('educationLevel').value;
        const level = formatEducationLevel(educationLevel);
        
        contentArea.innerHTML = `
          <div class="d-flex align-items-center justify-content-center p-3">
            <div class="spinner-border text-primary" role="status">
              <span class="visually-hidden">Loading...</span>
            </div>
            <span class="ms-3">Loading details...</span>
          </div>
        `;
        
        fetchTopicDetails(query, topic, level)
          .then(details => {
            topicCache[topic] = details;
            renderTopicContent(contentArea, details);
          })
          .catch(error => {
            contentArea.innerHTML = `<p class="text-danger">Error loading content: ${error.message}</p>`;
          });
      }
    }
  }
}

/**
 * Animate cards appearance with staggered timing
 */
function animateCards() {
  const items = document.querySelectorAll('.roadmap-card');
  
  items.forEach((item, index) => {
    setTimeout(() => {
      item.classList.add('visible');
    }, 80 * index);
  });
}

/**
 * Load details for all topics in the roadmap
 */
async function loadAllTopicDetails(topics, query, level) {
  let completed = 0;
  const total = topics.length;
  
  for (const topic of topics) {
    const cacheKey = `${query}_${topic.title}`;
    topicCache[cacheKey] = 'loading';
    
    try {
      const details = await fetchTopicDetails(query, topic.title, level);
      topicCache[cacheKey] = details;
      
      // Update content if this card is expanded
      const item = document.querySelector(`.roadmap-card[data-topic="${topic.title}"]`);
      if (item && item.classList.contains('expanded')) {
        const contentArea = item.querySelector('.roadmap-content');
        renderTopicContent(contentArea, details);
      }
      
      // Update progress
      completed++;
      updateProgress(completed, total);
      
    } catch (error) {
      console.error(`Error loading details for "${topic.title}":`, error);
      topicCache[cacheKey] = {
        description: 'Unable to load content for this topic.',
        mistakes: []
      };
    }
  }
}

/**
 * Update progress indicators
 */
function updateProgress(completed, total) {
  if (completed > total) completed = total;
  
  const percentage = Math.round((completed / total) * 100);
  const progressBar = document.querySelector('.progress-bar');
  const progressValue = document.querySelector('.progress-value');
  
  if (progressBar && progressValue) {
    progressBar.style.width = `${percentage}%`;
    progressBar.setAttribute('aria-valuenow', percentage);
    progressValue.textContent = completed;
  }
}

/**
 * Fetch details for a specific topic
 */
async function fetchTopicDetails(mainTopic, subtopic, level) {
  const prompt = `
    You're creating educational content for a ${level} student studying ${mainTopic}.
    Explain the subtopic "${subtopic}" briefly and list common mistakes.
    
    Format your response as follows:
    First, give a clear explanation in 2-3 sentences.
    Then list 2 common mistakes with the header "Common Mistakes":
    - First mistake (one sentence)
    - Second mistake (one sentence)
    
    IMPORTANT: Do not use asterisks (**) in your response. Do not include empty bullet points.
  `;

  try {
    const apiKey = 'AIzaSyAJJQLYD2wHZu49VgCIzbAuc2XBWFtCBJA';
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.candidates && 
        data.candidates.length > 0 && 
        data.candidates[0].content?.parts?.length > 0) {
      
      return parseTopicDetails(data.candidates[0].content.parts[0].text);
    }
    
    return {
      description: 'No details available for this topic.',
      mistakes: []
    };
  } catch (error) {
    console.error('Error fetching topic details:', error);
    throw error;
  }
}

/**
 * Parse topic details response
 */
function parseTopicDetails(text) {
  const parts = text.split(/Common Mistakes:|COMMON MISTAKES:/i);
  
  const description = parts[0].trim();
  let mistakes = [];
  
  if (parts.length > 1) {
    mistakes = parts[1].trim()
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .filter(line => !line.match(/^\*\*$/)) // Filter out lines that only contain **
      .map(line => {
        // Remove any ** markers, bullet points, dashes, and numbers at the beginning of the line
        return line.replace(/^\*\*|\*\*$|^[-•*]|^\d+\.\s*/, '').trim();
      })
      .filter(line => line.length > 0); // Filter out any empty lines after cleaning
  }
  
  return { description, mistakes };
}

/**
 * Render topic content details
 */
function renderTopicContent(container, details) {
  if (!details || !details.description) {
    container.innerHTML = `<p>No details available for this topic.</p>`;
    return;
  }
  
  let html = `
    <div class="topic-description">${details.description}</div>
  `;
  
  if (details.mistakes && details.mistakes.length > 0) {
    html += `<div class="common-mistakes">
      <h4>Common Mistakes</h4>
      <ul>`;
    
    details.mistakes.forEach(mistake => {
      html += `<li>${mistake}</li>`;
    });
    
    html += `</ul></div>`;
  }
  
  if (details.examples && details.examples.length > 0) {
    html += `<div class="topic-examples mt-3">
      <h6 class="examples-title">Examples:</h6>
      <ul class="examples-list">`;
    
    details.examples.forEach(example => {
      html += `<li>${example}</li>`;
    });
    
    html += `</ul></div>`;
  }
  
  container.innerHTML = html;
}