import { initializeApp } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-auth.js";
import { getFirestore, doc, getDoc, collection, addDoc, onSnapshot, query, orderBy, limit, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-firestore.js";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAjvShhWqOBIrgero2ODtQQtSzWuafmGJw",
  authDomain: "studybase-data.firebaseapp.com",
  projectId: "studybase-data",
  storageBucket: "studybase-data.firebasestorage.app",
  messagingSenderId: "471482464641",
  appId: "1:471482464641:web:46fe6cf41e17a24e785080"
};

// Initialize Firebase services
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Global variables
let currentUser = null;
let currentUserData = null;
let messagesListener = null;
let lastMessageTime = 0; // Track when the user last sent a message
const MESSAGE_RATE_LIMIT = 2000; // Milliseconds between messages (2 seconds)
const MESSAGE_MAX_LENGTH = 500; // Maximum characters per message
let replyingTo = null; // Track which message is being replied to

// Bad words filter - common offensive terms
const BAD_WORDS = [
  'fuck', 'shit', 'asshole', 'bitch', 'cunt', 'damn', 'dick', 'pussy', 'slut', 'whore',
  'bastard', 'piss', 'cock', 'jerk', 'idiot', 'moron', 'retard', 'twat'
];

// Function to check for bad words
function containsBadWords(text) {
  const lowerText = text.toLowerCase();
  return BAD_WORDS.some(word => lowerText.includes(word));
}

// Function to censor bad words with asterisks
function censorBadWords(text) {
  let censoredText = text;
  BAD_WORDS.forEach(word => {
    const regex = new RegExp(word, 'gi');
    const censored = '*'.repeat(word.length);
    censoredText = censoredText.replace(regex, censored);
  });
  return censoredText;
}

// Initialize the chat when the user is authenticated
onAuthStateChanged(auth, async (user) => {
  if (user) {
    try {
      // Get user data from Firestore
      const userDoc = await getDoc(doc(db, "users", user.uid));
      
      if (userDoc.exists()) {
        currentUserData = userDoc.data();
      } else {
        console.warn("No user document found, using default values");
        currentUserData = {
          username: user.email.split('@')[0],
          university: "Unknown University"
        };
      }
      
      // Store current user
      currentUser = user;
      
      // Initialize chat UI
      initializeChatUI();
      
    } catch (error) {
      console.error("Error initializing chat:", error);
      showError("Failed to initialize chat. Please try refreshing the page.");
    }
  } else {
    // Redirect to login if not authenticated
    window.location.href = "index.html";
  }
});

function initializeChatUI() {
  // Hide loading indicator
  document.getElementById('loading').style.display = 'none';
  
  // Create chat container
  const chatContainer = document.getElementById('chat-container');
  
  // Create message list
  const messageList = document.createElement('div');
  messageList.className = 'message-list';
  chatContainer.appendChild(messageList);
  
  // Show empty state initially
  showEmptyState(messageList);
  
  // Create message input form
  const form = document.createElement('form');
  form.className = 'chat-form';
  
  const inputGroup = document.createElement('div');
  inputGroup.className = 'input-group';
  
  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'form-control';
  input.placeholder = 'Type your message...';
  input.required = true;
  input.maxLength = MESSAGE_MAX_LENGTH;
  
  // Create character counter
  const charCounter = document.createElement('div');
  charCounter.className = 'char-counter';
  charCounter.textContent = `0/${MESSAGE_MAX_LENGTH}`;
  
  // Update character counter on input
  input.addEventListener('input', () => {
    const count = input.value.length;
    charCounter.textContent = `${count}/${MESSAGE_MAX_LENGTH}`;
    
    // Add warning classes based on length
    if (count > MESSAGE_MAX_LENGTH * 0.8) {
      charCounter.classList.add('warning');
    } else {
      charCounter.classList.remove('warning');
    }
    
    if (count > MESSAGE_MAX_LENGTH * 0.95) {
      charCounter.classList.add('danger');
    } else {
      charCounter.classList.remove('danger');
    }
  });
  
  const button = document.createElement('button');
  button.className = 'btn btn-primary';
  button.type = 'submit';
  button.innerHTML = '<i class="fas fa-paper-plane"></i>';
  
  inputGroup.appendChild(input);
  inputGroup.appendChild(button);
  
  // Create form footer with counter
  const formFooter = document.createElement('div');
  formFooter.className = 'form-footer';
  formFooter.appendChild(charCounter);
  
  form.appendChild(inputGroup);
  form.appendChild(formFooter);
  
  // Add event listener for sending messages
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const message = input.value.trim();
    
    if (!message) {
      return;
    }
    
    // Check message length
    if (message.length > MESSAGE_MAX_LENGTH) {
      showError(`Message too long. Maximum ${MESSAGE_MAX_LENGTH} characters allowed.`);
      return;
    }
    
    // Check rate limit
    const now = Date.now();
    if (now - lastMessageTime < MESSAGE_RATE_LIMIT) {
      showError(`Please wait ${Math.ceil((MESSAGE_RATE_LIMIT - (now - lastMessageTime)) / 1000)} seconds before sending another message.`);
      return;
    }
    
    try {
      // Check for bad words
      if (containsBadWords(message)) {
        // Censor the message before sending
        const censoredMessage = censorBadWords(message);
        await sendMessage(censoredMessage);
        
        // Show warning about language
        const warning = document.createElement('div');
        warning.className = 'alert alert-warning filter-warning';
        warning.innerHTML = 'Your message contained inappropriate language and was automatically censored.';
        messageList.appendChild(warning);
        
        // Auto-remove the warning after 3 seconds
        setTimeout(() => {
          warning.remove();
        }, 3000);
      } else {
        // Send message as is
        await sendMessage(message);
      }
      
      // Update last message time
      lastMessageTime = Date.now();
      
      input.value = '';
      charCounter.textContent = `0/${MESSAGE_MAX_LENGTH}`;
      charCounter.classList.remove('warning', 'danger');
      
      // Clear reply interface state if any
      if (replyingTo) {
        cancelReply();
      }
    } catch (error) {
      console.error("Error sending message:", error);
      showError("Failed to send message. Please try again.");
    }
  });
  
  // Add form to container
  chatContainer.appendChild(form);
  
  // Add keyboard shortcut (Escape key) to cancel reply
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && replyingTo) {
      cancelReply();
    }
  });
  
  // Load messages
  loadMessages();
}

async function sendMessage(text) {
  try {
    const messagesRef = collection(db, "communityMessages");
    
    const messageData = {
      text: text,
      createdAt: serverTimestamp(),
      userId: currentUser.uid,
      username: currentUserData.username || currentUser.email.split('@')[0],
      userImage: currentUserData.photoURL || 'user.jpg',
      university: currentUserData.university || "Unknown University"
    };
    
    // Add reply information if replying to a message
    if (replyingTo) {
      messageData.replyTo = {
        id: replyingTo.id,
        text: replyingTo.text,
        username: replyingTo.username
      };
    }
    
    await addDoc(messagesRef, messageData);
    
    // Clear reply state after sending
    replyingTo = null;
    const replyIndicator = document.querySelector('.reply-indicator');
    if (replyIndicator) {
      replyIndicator.remove();
    }
    
    console.log("Message sent successfully");
  } catch (error) {
    console.error("Error sending message:", error);
    throw error;
  }
}

function loadMessages() {
  try {
    const messagesRef = collection(db, "communityMessages");
    const q = query(messagesRef, orderBy("createdAt", "desc"), limit(50));
    
    // Unsubscribe from previous listener if it exists
    if (messagesListener) {
      messagesListener();
    }
    
    // Subscribe to messages
    messagesListener = onSnapshot(q, (snapshot) => {
      const messageList = document.querySelector('.message-list');
      const messages = [];
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        if (data.createdAt) {  // Ensure we have a valid timestamp
          messages.push({
            id: doc.id,
            ...data
          });
        }
      });
      
      // Sort messages by timestamp (oldest first)
      messages.sort((a, b) => {
        const timeA = a.createdAt ? a.createdAt.toMillis() : 0;
        const timeB = b.createdAt ? b.createdAt.toMillis() : 0;
        return timeA - timeB;
      });
      
      if (messages.length === 0) {
        showEmptyState(messageList);
      } else {
        // Clear the message list
        messageList.innerHTML = '';
        
        // Add messages
        messages.forEach((message) => {
          appendMessage(message);
        });
        
        // Scroll to the bottom
        messageList.scrollTop = messageList.scrollHeight;
      }
    }, (error) => {
      console.error("Error loading messages:", error);
      showError("Failed to load messages. Please try refreshing the page.");
    });
    
  } catch (error) {
    console.error("Error setting up message listener:", error);
    showError("Failed to connect to chat. Please try refreshing the page.");
  }
}

function showEmptyState(messageList) {
  messageList.innerHTML = '';
  const emptyState = document.createElement('div');
  emptyState.className = 'empty-state';
  emptyState.innerHTML = `
    <i class="fas fa-comments"></i>
    <p>No messages yet. Be the first to send a message!</p>
  `;
  messageList.appendChild(emptyState);
}

function appendMessage(message) {
  const messageList = document.querySelector('.message-list');
  
  // Remove empty state if it exists
  const emptyState = document.querySelector('.empty-state');
  if (emptyState) {
    emptyState.remove();
  }
  
  // Create message element
  const messageEl = document.createElement('div');
  messageEl.className = `message ${message.userId === currentUser.uid ? 'message-mine' : 'message-other'}`;
  messageEl.dataset.messageId = message.id;
  
  // Format timestamp
  let formattedTime = 'Just now';
  if (message.createdAt) {
    const timestamp = message.createdAt.toDate();
    formattedTime = timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  
  // Get university
  const university = message.university || (message.userId === currentUser.uid ? currentUserData.university : "Unknown University");
  
  // Prepare reply content if this message is a reply
  let replyContent = '';
  if (message.replyTo) {
    replyContent = `
      <div class="reply-to">
        <div class="reply-to-header">
          <i class="fas fa-reply"></i>
          <span class="reply-to-username">Replying to ${message.replyTo.username}</span>
        </div>
        <div class="reply-to-text">${truncateText(message.replyTo.text, 100)}</div>
      </div>
    `;
  }
  
  // Add message content
  messageEl.innerHTML = `
    <div class="message-header">
      <div class="user-info">
        <span class="message-user">${message.username}</span>
        <span class="message-university">${university}</span>
      </div>
      <span class="message-time">${formattedTime}</span>
    </div>
    ${replyContent}
    <div class="message-text">${message.text}</div>
    <div class="message-actions">
      <button class="action-reply" title="Reply to this message">
        <i class="fas fa-reply"></i> Reply
      </button>
    </div>
  `;
  
  // Add event listener for reply button
  const replyButton = messageEl.querySelector('.action-reply');
  replyButton.addEventListener('click', () => {
    setReplyTo(message);
  });
  
  // Add to message list
  messageList.appendChild(messageEl);
  
  // Scroll to the bottom
  messageList.scrollTop = messageList.scrollHeight;
}

// Helper function to truncate text
function truncateText(text, maxLength) {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

// Function to set up replying to a message
function setReplyTo(message) {
  // Store the message we're replying to
  replyingTo = message;
  
  // Check if we already have a reply indicator
  let replyIndicator = document.querySelector('.reply-indicator');
  if (!replyIndicator) {
    // Create a new reply indicator
    replyIndicator = document.createElement('div');
    replyIndicator.className = 'reply-indicator';
    
    const form = document.querySelector('.chat-form');
    form.insertBefore(replyIndicator, form.firstChild);
  }
  
  // Update the reply indicator content
  replyIndicator.innerHTML = `
    <div class="reply-indicator-content">
      <i class="fas fa-reply"></i>
      <div class="reply-indicator-text">
        <span>Replying to <strong>${message.username}</strong></span>
        <div class="reply-preview">${truncateText(message.text, 50)}</div>
      </div>
    </div>
    <button type="button" class="cancel-reply" title="Cancel reply">
      <i class="fas fa-times"></i>
    </button>
  `;
  
  // Add event listener to cancel button
  const cancelButton = replyIndicator.querySelector('.cancel-reply');
  cancelButton.addEventListener('click', cancelReply);
  
  // Focus the input field
  document.querySelector('.form-control').focus();
}

// Function to cancel reply
function cancelReply() {
  replyingTo = null;
  const replyIndicator = document.querySelector('.reply-indicator');
  if (replyIndicator) {
    replyIndicator.remove();
  }
}

function showError(message) {
  // Remove any existing error alerts
  const existingAlerts = document.querySelectorAll('.alert-danger');
  existingAlerts.forEach(alert => alert.remove());
  
  // Create error alert
  const errorAlert = document.createElement('div');
  errorAlert.className = 'alert alert-danger';
  errorAlert.innerHTML = `
    <strong>Error:</strong> ${message}
    <hr>
    <p class="mb-0">If this problem persists, try:</p>
    <ul class="mb-0">
      <li>Refreshing the page</li>
      <li>Clearing your browser cache</li>
      <li>Checking your internet connection</li>
    </ul>
  `;
  
  // Add to container
  const container = document.querySelector('.main-content');
  const chatContainer = document.getElementById('chat-container');
  
  // Hide the loading indicator if it's visible
  const loadingIndicator = document.getElementById('loading');
  if (loadingIndicator) {
    loadingIndicator.style.display = 'none';
  }
  
  container.insertBefore(errorAlert, chatContainer);
}

// Add CSS styles for typing indicator
document.head.insertAdjacentHTML('beforeend', `
<style>
  .message-list {
    height: calc(100vh - 400px);
    min-height: 300px;
    max-height: 500px;
    overflow-y: auto;
    padding: 20px;
    background-color: var(--bs-tertiary-bg);
    border-radius: 8px 8px 0 0;
    display: flex;
    flex-direction: column;
  }
  
  .chat-form {
    padding: 15px;
    background-color: var(--bs-secondary-bg);
    border-radius: 0 0 8px 8px;
  }
  
  .message {
    margin-bottom: 10px;
    padding: 10px;
    border-radius: 8px;
    max-width: 80%;
    word-wrap: break-word;
  }
  
  .message-mine {
    align-self: flex-end;
    background-color: var(--bs-primary);
    color: white;
  }
  
  .message-other {
    align-self: flex-start;
    background-color: var(--bs-secondary-bg);
    border: 1px solid var(--bs-border-color);
  }
  
  .message-header {
    display: flex;
    justify-content: space-between;
    margin-bottom: 5px;
    font-size: 0.8rem;
  }
  
  .message-user {
    font-weight: bold;
  }
  
  .message-time {
    opacity: 0.7;
  }
  
  /* Reply styling - inline version */
  .reply-to {
    background-color: rgba(0, 0, 0, 0.05);
    border-left: 3px solid var(--bs-primary);
    padding: 8px 12px;
    margin-bottom: 8px;
    border-radius: 4px;
    font-size: 0.8rem;
  }
  
  .message-mine .reply-to {
    background-color: rgba(255, 255, 255, 0.1);
    border-left-color: rgba(255, 255, 255, 0.5);
  }
  
  .message-actions {
    display: flex;
    gap: 8px;
    margin-top: 6px;
    opacity: 0;
    transition: opacity 0.2s ease;
  }
  
  .message:hover .message-actions {
    opacity: 1;
  }
  
  .action-reply {
    background: none;
    border: none;
    font-size: 0.75rem;
    color: var(--bs-secondary-color);
    padding: 3px 6px;
    cursor: pointer;
  }
  
  .message-mine .action-reply {
    color: rgba(255, 255, 255, 0.8);
  }
  
  .typing-indicator {
    align-self: flex-start;
    color: var(--bs-secondary-color);
    font-size: 0.8rem;
    margin-bottom: 10px;
    display: flex;
    align-items: center;
    gap: 5px;
  }
  
  .typing-indicator .dots {
    display: flex;
    align-items: center;
    gap: 2px;
  }
  
  .typing-indicator .dot {
    width: 4px;
    height: 4px;
    background-color: var(--bs-secondary-color);
    border-radius: 50%;
    animation: bounce 1.5s infinite;
  }
  
  .typing-indicator .dot:nth-child(1) {
    animation-delay: 0s;
  }
  
  .typing-indicator .dot:nth-child(2) {
    animation-delay: 0.1s;
  }
  
  .typing-indicator .dot:nth-child(3) {
    animation-delay: 0.2s;
  }
  
  @keyframes bounce {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-2px); }
  }
  
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    color: var(--bs-secondary-color);
  }
  
  .empty-state i {
    font-size: 48px;
    margin-bottom: 16px;
  }
</style>
`);
