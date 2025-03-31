/**
 * studybase - modern animations and effects
 * enhances the page with scroll-triggered animations and effects
 */

document.addEventListener('DOMContentLoaded', () => {
  // Initialize animations for search results
  initializeAnimations();
  
  // Add smooth scroll behavior
  initializeSmoothScroll();
});

/**
 * Initialize animations for dynamic content
 */
function initializeAnimations() {
  // Apply animation to search button
  const searchBtn = document.getElementById('searchBtn');
  if (searchBtn) {
    searchBtn.addEventListener('click', () => {
      // Add animation to results after search
      setTimeout(() => {
        animateResults();
      }, 500);
    });
  }

  // Set up step selector animations
  animateStepSelector();
}

/**
 * Animate search results when they appear
 */
function animateResults() {
  const resultsPanels = document.querySelectorAll('.results-panel');
  
  resultsPanels.forEach((panel, index) => {
    // Reset any existing animations
    panel.style.animation = 'none';
    panel.offsetHeight; // Force reflow
    
    // Apply new animations with staggered delays
    panel.style.animation = `scaleIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards`;
    panel.style.animationDelay = `${0.1 + (index * 0.2)}s`;
  });
  
  // Animate roadmap cards with a staggered effect
  const roadmapCards = document.querySelectorAll('.roadmap-card');
  
  roadmapCards.forEach((card, index) => {
    card.style.animation = 'none';
    card.offsetHeight; // Force reflow
    
    // Alternate between slide-up and slide-in animations
    if (index % 2 === 0) {
      card.style.animation = `slideUp 0.5s ease-out forwards`;
    } else {
      card.style.animation = `slideInRight 0.5s ease-out forwards`;
    }
    
    card.style.animationDelay = `${0.2 + (index * 0.1)}s`;
  });
}

/**
 * Set up animations for the step selector
 */
function animateStepSelector() {
  const stepOptions = document.querySelectorAll('.step-option');
  
  stepOptions.forEach(option => {
    option.addEventListener('mouseenter', () => {
      option.style.animation = 'float 1s ease-in-out infinite';
    });
    
    option.addEventListener('mouseleave', () => {
      option.style.animation = 'none';
    });
  });
}

/**
 * Add smooth scroll behavior to the page
 */
function initializeSmoothScroll() {
  // Add smooth scrolling to the page
  document.body.style.scrollBehavior = 'smooth';
  
  // Check for accessibility preferences
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  
  if (prefersReducedMotion) {
    // Remove animations for users who prefer reduced motion
    document.body.classList.add('reduced-motion');
  }
} 