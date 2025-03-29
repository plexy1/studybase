
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-auth.js";
import {
    getFirestore,
    collection,
    addDoc,
    onSnapshot,
    serverTimestamp,
    query,
    orderBy,
    doc,
    getDoc,
    setDoc,
    updateDoc,
    arrayUnion,
    arrayRemove,
    where,
    limit
} from "https://www.gstatic.com/firebasejs/11.2.0/firebase-firestore.js";

// Initialize Firebase services
const auth = getAuth();
const db = getFirestore();

// DOM Elements
const messageContainer = document.getElementById('messageContainer');
const messageInput = document.getElementById('messageInput');
const sendButton = document.getElementById('sendButton');
const logoutButton = document.getElementById('logoutButton');
const usernameDisplay = document.getElementById('usernameDisplay');
const darkModeToggle = document.getElementById('darkModeToggle');
const onlineCounter = document.getElementById('onlineCounter');
const profileName = document.getElementById('profileName');
const emojiButton = document.getElementById('emojiButton');
const replyIndicator = document.getElementById('replyIndicator');
const replyToName = document.getElementById('replyToName');
const cancelReply = document.getElementById('cancelReply');


// Templates
const messageTemplate = document.getElementById('messageTemplate');
const reactionTemplate = document.getElementById('reactionTemplate');
const typingIndicatorTemplate = document.getElementById('typingIndicatorTemplate');
const systemMessageTemplate = document.getElementById('systemMessageTemplate');

// State variables
let currentUser = null;
let userData = null;
let isTyping = false;
let typingTimeout;
let onlineUsers = 0;
let replyingTo = null;
let loadedMessages = {};

// Emojis for reactions
const commonEmojis = ['👍', '❤️', '😂', '😮', '😢', '👏', '🎉', '🤔', '📚', '💡'];

// Auth state observer
onAuthStateChanged(auth, async (user) => {
    if (user) {
        currentUser = user;
        await loadUserData();
        setupChat();
        updateOnlineCounter();

        // Update online counter periodically
        setInterval(updateOnlineCounter, 30000);

        // Show welcome message
        setTimeout(() => {
            displaySystemMessage("Welcome to the community chat! Connect with fellow students and share knowledge.");
        }, 500);
    } else {
        window.location.href = 'index.html';
    }
});

// Load user data from Firestore
async function loadUserData() {
    try {
        const userDoc = await getDoc(doc(db, "users", currentUser.uid));

        if (userDoc.exists()) {
            userData = userDoc.data();
            displayUserInfo();
        } else {
            // Default data if user document doesn't exist
            userData = {
                username: currentUser.email.split('@')[0],
                email: currentUser.email,
                university: "Not set",
                major: "Not set",
                createdAt: new Date()
            };
            displayUserInfo();
        }
    } catch (error) {
        console.error("Error loading user data:", error);
        userData = {
            username: currentUser.email.split('@')[0],
            email: currentUser.email,
            university: "Not set",
            major: "Not set"
        };
        displayUserInfo();
    }
}

// Display user info in UI
function displayUserInfo() {
    if (usernameDisplay) usernameDisplay.textContent = userData.username;
    if (profileName) profileName.textContent = userData.username;
}

// Set up chat listeners and handlers
function setupChat() {
    // Load messages from Firestore
    const messagesRef = collection(db, 'chatMessages');
    const q = query(messagesRef, orderBy('timestamp', 'desc'), limit(50));

    onSnapshot(q, (snapshot) => {
        const messages = [];

        snapshot.docChanges().forEach((change) => {
            const message = { ...change.doc.data(), id: change.doc.id };

            if (change.type === 'added') {
                if (!loadedMessages[message.id]) {
                    messages.push(message);
                    loadedMessages[message.id] = true;
                }
            } else if (change.type === 'modified') {
                // Update reactions or reply count in UI
                updateMessage(message);
            }
        });

        // Display new messages
        messages.sort((a, b) => {
            const timeA = a.timestamp ? a.timestamp.toMillis() : 0;
            const timeB = b.timestamp ? b.timestamp.toMillis() : 0;
            return timeA - timeB;
        }).forEach((message, index) => {
            const delay = index * 100;
            setTimeout(() => {
                displayMessage(message);
            }, delay);
        });

        // Scroll to bottom after messages are loaded
        if (messages.length > 0) {
            setTimeout(scrollToBottom, messages.length * 100 + 100);
        }
    });

    // Event listeners
    sendButton.addEventListener('click', sendMessage);
    messageInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            sendMessage();
        }
    });

    messageInput.addEventListener('input', handleTypingIndicator);

    messageInput.addEventListener('input', () => {
        const characterCounter = document.getElementById('characterCounter');
        if (!characterCounter) return;
    
        const maxLength = 300;
        let currentLength = messageInput.value.length;
        
        if (currentLength > maxLength) {
            messageInput.value = messageInput.value.substring(0, maxLength);
            currentLength = maxLength;
        }
        
        characterCounter.textContent = `${currentLength}/${maxLength}`;
    
        if (currentLength > 250) {
            characterCounter.classList.add('text-amber-500');
        } else {
            characterCounter.classList.remove('text-amber-500');
        }
    
        if (currentLength >= maxLength) {
            characterCounter.classList.add('text-red-500');
            characterCounter.classList.remove('text-amber-500');
        } else {
            characterCounter.classList.remove('text-red-500');
        }
    });

    darkModeToggle.addEventListener('change', toggleDarkMode);

    cancelReply.addEventListener('click', () => {
        replyingTo = null;
        replyIndicator.style.display = 'none';
    });

    emojiButton.addEventListener('click', showEmojiPicker);

    // Load dark mode preference
    if (localStorage.getItem('darkMode') === 'enabled') {
        enableDarkMode();
    } else {
        disableDarkMode();
    }

    // Event delegation for message actions
    messageContainer.addEventListener('click', handleMessageActions);
    initializeCharacterCounter();
}

// Handle message actions (reply, react)
function handleMessageActions(event) {
    const actionButton = event.target.closest('.action-button');

    if (!actionButton) return;

    const messageElement = actionButton.closest('.message');
    const messageId = messageElement.dataset.id;
    const action = actionButton.dataset.action;

    if (action === 'reply') {
        // Set up reply
        setReplyingTo(messageId, messageElement);
    } else if (action === 'react') {
        // Show emoji picker for reactions
        showReactionPicker(messageElement, messageId);
    }

    // Handle clicking on an existing reaction
    const reaction = event.target.closest('.reaction');
    if (reaction && reaction.dataset.messageId) {
        toggleReaction(reaction.dataset.messageId, reaction.dataset.emoji);
    }
}

// Set up reply to a message
function setReplyingTo(messageId, messageElement) {
    const sender = messageElement.querySelector('.message-sender').textContent;
    const messageBody = messageElement.querySelector('.message-body').textContent;

    replyingTo = {
        id: messageId,
        sender: sender,
        text: messageBody
    };

    replyToName.textContent = sender;
    replyIndicator.style.display = 'flex';
    messageInput.focus();
}

// Show emoji picker for reactions
function showReactionPicker(messageElement, messageId) {
    // Create a simple emoji picker
    const picker = document.createElement('div');
    picker.className = 'emoji-picker';
    picker.style.position = 'absolute';
    picker.style.zIndex = '1000';
    picker.style.background = 'white';
    picker.style.border = '1px solid #e5e7eb';
    picker.style.borderRadius = '8px';
    picker.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
    picker.style.padding = '8px';
    picker.style.display = 'flex';
    picker.style.flexWrap = 'wrap';
    picker.style.gap = '8px';
    picker.style.maxWidth = '200px';

    // Add emojis
    commonEmojis.forEach(emoji => {
        const emojiButton = document.createElement('button');
        emojiButton.className = 'emoji-button';
        emojiButton.style.background = 'none';
        emojiButton.style.border = 'none';
        emojiButton.style.fontSize = '1.25rem';
        emojiButton.style.cursor = 'pointer';
        emojiButton.style.padding = '5px';
        emojiButton.style.borderRadius = '4px';
        emojiButton.style.transition = 'all 0.15s';
        emojiButton.textContent = emoji;

        emojiButton.addEventListener('mouseover', () => {
            emojiButton.style.background = 'rgba(79, 70, 229, 0.1)';
        });

        emojiButton.addEventListener('mouseout', () => {
            emojiButton.style.background = 'none';
        });

        emojiButton.addEventListener('click', () => {
            toggleReaction(messageId, emoji);
            document.body.removeChild(picker);
        });

        picker.appendChild(emojiButton);
    });

    // Position near the reaction button
    const rect = messageElement.getBoundingClientRect();
    picker.style.top = `${window.scrollY + rect.bottom}px`;
    picker.style.left = `${rect.left}px`;

    // Close when clicking outside
    document.addEventListener('click', function closeEmojiPicker(e) {
        if (!picker.contains(e.target) && e.target !== messageElement) {
            if (document.body.contains(picker)) {
                document.body.removeChild(picker);
            }
            document.removeEventListener('click', closeEmojiPicker);
        }
    });

    document.body.appendChild(picker);
}

// Toggle a reaction on a message
async function toggleReaction(messageId, emoji) {
    try {
        const messageRef = doc(db, 'chatMessages', messageId);
        const messageDoc = await getDoc(messageRef);

        if (messageDoc.exists()) {
            const message = messageDoc.data();
            const reactions = message.reactions || {};
            const userReactions = reactions[emoji] || [];

            if (userReactions.includes(currentUser.uid)) {
                // Remove reaction
                await updateDoc(messageRef, {
                    [`reactions.${emoji}`]: arrayRemove(currentUser.uid)
                });
            } else {
                // Add reaction
                await updateDoc(messageRef, {
                    [`reactions.${emoji}`]: arrayUnion(currentUser.uid)
                });
            }
        }
    } catch (error) {
        console.error("Error toggling reaction:", error);
    }
}

// Show emoji picker for messages
function showEmojiPicker() {
    const picker = document.createElement('div');
    picker.className = 'emoji-picker';
    picker.style.position = 'absolute';
    picker.style.zIndex = '1000';
    picker.style.background = 'white';
    picker.style.border = '1px solid #e5e7eb';
    picker.style.borderRadius = '8px';
    picker.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
    picker.style.padding = '8px';
    picker.style.display = 'flex';
    picker.style.flexWrap = 'wrap';
    picker.style.gap = '8px';
    picker.style.maxWidth = '200px';

    // Add emojis
    commonEmojis.forEach(emoji => {
        const emojiButton = document.createElement('button');
        emojiButton.className = 'emoji-button';
        emojiButton.style.background = 'none';
        emojiButton.style.border = 'none';
        emojiButton.style.fontSize = '1.25rem';
        emojiButton.style.cursor = 'pointer';
        emojiButton.style.padding = '5px';
        emojiButton.style.borderRadius = '4px';
        emojiButton.style.transition = 'all 0.15s';
        emojiButton.textContent = emoji;

        emojiButton.addEventListener('mouseover', () => {
            emojiButton.style.background = 'rgba(79, 70, 229, 0.1)';
        });

        emojiButton.addEventListener('mouseout', () => {
            emojiButton.style.background = 'none';
        });

        emojiButton.addEventListener('click', () => {
            insertEmoji(emoji);
            document.body.removeChild(picker);
        });

        picker.appendChild(emojiButton);
    });

    // Position near the emoji button
    const rect = emojiButton.getBoundingClientRect();
    picker.style.top = `${window.scrollY + rect.bottom + 5}px`;
    picker.style.left = `${rect.left}px`;

    // Close when clicking outside
    document.addEventListener('click', function closeEmojiPicker(e) {
        if (!picker.contains(e.target) && e.target !== emojiButton) {
            if (document.body.contains(picker)) {
                document.body.removeChild(picker);
            }
            document.removeEventListener('click', closeEmojiPicker);
        }
    });

    document.body.appendChild(picker);
}

// Insert emoji into message input
function insertEmoji(emoji) {
    const start = messageInput.selectionStart;
    const end = messageInput.selectionEnd;
    const text = messageInput.value;
    const newText = text.slice(0, start) + emoji + text.slice(end);
    messageInput.value = newText;
    messageInput.focus();
    messageInput.selectionStart = messageInput.selectionEnd = start + emoji.length;
}

// Update message when reactions change
function updateMessage(message) {
    const messageElement = document.querySelector(`.message[data-id="${message.id}"]`);
    if (!messageElement) return;

    const reactionsContainer = messageElement.querySelector('.message-reactions');
    reactionsContainer.innerHTML = '';

    if (message.reactions) {
        Object.entries(message.reactions).forEach(([emoji, users]) => {
            if (users.length > 0) {
                const reactionElement = createReactionElement(emoji, users.length, message.id, users.includes(currentUser.uid));
                reactionsContainer.appendChild(reactionElement);
            }
        });
    }
}

// Create a reaction element
function createReactionElement(emoji, count, messageId, isActive) {
    const reactionClone = reactionTemplate.content.cloneNode(true);
    const reactionElement = reactionClone.querySelector('.reaction');

    reactionElement.dataset.messageId = messageId;
    reactionElement.dataset.emoji = emoji;

    if (isActive) {
        reactionElement.classList.add('active');
    }

    reactionElement.querySelector('.reaction-emoji').textContent = emoji;
    reactionElement.querySelector('.reaction-count').textContent = count;

    return reactionElement;
}

// Handle typing indicator
function handleTypingIndicator() {
    if (!isTyping && messageInput.value.trim() !== '') {
        isTyping = true;
        sendTypingStatus(true);
    }

    clearTimeout(typingTimeout);

    typingTimeout = setTimeout(() => {
        isTyping = false;
        sendTypingStatus(false);
    }, 2000);
}

// Send typing status to Firestore
async function sendTypingStatus(isTyping) {
    try {
        const typingRef = doc(db, 'typingStatus', currentUser.uid);
        await setDoc(typingRef, {
            username: userData.username,
            isTyping: isTyping,
            timestamp: serverTimestamp()
        });
    } catch (error) {
        console.error("Error updating typing status:", error);
    }
}

// Update online counter
function updateOnlineCounter() {
    // In a real app, this would use Firebase Presence
    // For now, we'll simulate with random numbers
    onlineUsers = Math.floor(Math.random() * 10) + 3;
    onlineCounter.textContent = `${onlineUsers} online`;
    onlineCounter.classList.add('pulse');
    setTimeout(() => {
        onlineCounter.classList.remove('pulse');
    }, 1000);
}

// Scroll to bottom of chat
function scrollToBottom() {
    messageContainer.scrollTop = messageContainer.scrollHeight;
}

// Send a message
async function sendMessage() {
    const messageText = messageInput.value.trim();
    if (!messageText) return;

    try {
        // Clear typing indicator
        clearTimeout(typingTimeout);
        isTyping = false;
        sendTypingStatus(false);

        // Add animation to send button
        sendButton.classList.add('sending');

        // Create message object
        const messageData = {
            text: messageText,
            uid: currentUser.uid,
            username: userData.username,
            university: userData.university || "Not set",
            major: userData.major || "Not set",
            timestamp: serverTimestamp(),
            userPhotoURL: userData.photoURL || null
        };

        // Add reply info if replying
        if (replyingTo) {
            messageData.replyTo = {
                id: replyingTo.id,
                sender: replyingTo.sender,
                text: replyingTo.text
            };

            // Reset reply state
            replyingTo = null;
            replyIndicator.style.display = 'none';
        }

        // Send to Firestore
        await addDoc(collection(db, 'chatMessages'), messageData);

        // Clear input and focus
        messageInput.value = '';
        messageInput.focus();

        // Remove animation class
        setTimeout(() => {
            sendButton.classList.remove('sending');
        }, 500);
    } catch (error) {
        console.error("Error sending message:", error);
        sendButton.classList.remove('sending');
    }
}

// Display a message in the UI
function displayMessage(message) {
    const messageClone = messageTemplate.content.cloneNode(true);
    const messageElement = messageClone.querySelector('.message');

    // Set message ID for reference
    messageElement.dataset.id = message.id;

    // Check if sent by current user
    const isCurrentUser = message.uid === currentUser.uid;
    if (isCurrentUser) {
        messageElement.classList.add('sent');
    }

    // Set sender info
    const senderElement = messageElement.querySelector('.message-sender');
    senderElement.textContent = message.username;

    // Set university and major if available
    const universityElement = messageElement.querySelector('.university');
    const majorElement = messageElement.querySelector('.major');

    if (message.university && message.university !== "Not set") {
        universityElement.textContent = message.university;
    } else {
        universityElement.style.display = 'none';
    }

    if (message.major && message.major !== "Not set") {
        majorElement.textContent = message.major;
    } else {
        majorElement.style.display = 'none';
    }

    // Set avatar if available
    const avatarElement = messageElement.querySelector('.message-avatar');
    if (message.userPhotoURL) {
        avatarElement.src = message.userPhotoURL;
    }

    // Set message body
    const bodyElement = messageElement.querySelector('.message-body');
    bodyElement.textContent = message.text;

    // Set message time
    const timeElement = messageElement.querySelector('.message-time');
    const timestamp = message.timestamp ? new Date(message.timestamp.toMillis()) : new Date();
    timeElement.textContent = formatDate(timestamp);

    // Handle reply
    if (message.replyTo) {
        const replyElement = messageElement.querySelector('.reply-to');
        replyElement.style.display = 'block';
        replyElement.querySelector('.reply-sender').textContent = message.replyTo.sender;
        replyElement.querySelector('.reply-preview').textContent = message.replyTo.text;
    }

    // Add reactions if any
    if (message.reactions) {
        const reactionsContainer = messageElement.querySelector('.message-reactions');
        Object.entries(message.reactions).forEach(([emoji, users]) => {
            if (users.length > 0) {
                const reactionElement = createReactionElement(emoji, users.length, message.id, users.includes(currentUser.uid));
                reactionsContainer.appendChild(reactionElement);
            }
        });
    }

    // Add to container
    messageContainer.appendChild(messageElement);

    // Scroll into view
    messageElement.scrollIntoView({ behavior: 'smooth', block: 'end' });
}

// Display a system message
function displaySystemMessage(text) {
    const systemClone = systemMessageTemplate.content.cloneNode(true);
    const systemElement = systemClone.querySelector('.system-message');
    systemElement.textContent = text;
    messageContainer.appendChild(systemElement);
    scrollToBottom();
}

// Format date for message timestamp
function formatDate(date) {
    const now = new Date();
    const diff = now - date;

    // If less than 24 hours, show time
    if (diff < 24 * 60 * 60 * 1000) {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    // If less than a week, show day and time
    if (diff < 7 * 24 * 60 * 60 * 1000) {
        return date.toLocaleDateString([], { weekday: 'short' }) + ' ' +
            date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    // Otherwise show full date
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ' ' +
        date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// Toggle dark mode
function toggleDarkMode() {
    if (document.body.classList.contains('dark-mode')) {
        disableDarkMode();
    } else {
        enableDarkMode();
    }
}

// Enable dark mode
function enableDarkMode() {
    document.body.classList.add('dark-mode');
    darkModeToggle.checked = true;
    localStorage.setItem('darkMode', 'enabled');
}

// Disable dark mode
function disableDarkMode() {
    document.body.classList.remove('dark-mode');
    darkModeToggle.checked = false;
    localStorage.setItem('darkMode', null);
}

// Logout
logoutButton.addEventListener('click', async () => {
    try {
        await signOut(auth);
        window.location.href = 'index.html';
    } catch (error) {
        console.error('Error signing out:', error);
    }
});

function initializeCharacterCounter() {
    const characterCounter = document.getElementById('characterCounter');
    if (characterCounter) {
        characterCounter.textContent = "0/300";
    } else {
        console.error("Character counter element not found");
    }
}


