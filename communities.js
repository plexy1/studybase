import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-auth.js";
import { getFirestore, collection, addDoc, onSnapshot, serverTimestamp, query, orderBy, doc, getDoc } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-firestore.js";

const auth = getAuth();
const db = getFirestore();

const messageContainer = document.getElementById('messageContainer');
const messageInput = document.getElementById('messageInput');
const sendButton = document.getElementById('sendButton');
const logoutButton = document.getElementById('logoutButton');
const usernameDisplay = document.getElementById('usernameDisplay');
const darkModeToggle = document.getElementById('darkModeToggle'); 
const body = document.body;

let currentUser;

onAuthStateChanged(auth, async (user) => {
    if (user) {
        currentUser = user;
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
            usernameDisplay.textContent = `${userDoc.data().username}`;
        } else {
            usernameDisplay.textContent = `${user.email.split('@')[0]}`;
        }
        setupChat();
    } else {
        window.location.href = 'index.html'; 
    }
});

logoutButton.addEventListener('click', async () => {
    try {
        await signOut(auth);
        console.log('User signed out');
        window.location.href = 'index.html';
    } catch (error) {
        console.error('Error signing out:', error);
    }
});

function setupChat() {
    const messagesRef = collection(db, 'chatMessages');
    const q = query(messagesRef, orderBy('timestamp'));

    onSnapshot(q, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
            if (change.type === 'added') {
                const messageData = change.doc.data();
                displayMessage(messageData.text, messageData.username, messageData.uid === currentUser.uid, messageData.timestamp);
            }
        });
       
        messageContainer.scrollTop = messageContainer.scrollHeight;
    });

    sendButton.addEventListener('click', sendMessage);
    messageInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            sendMessage();
        }
    });
}

async function sendMessage() {
    const messageText = messageInput.value.trim();
    if (messageText) {
        const userDoc = await getDoc(doc(db, "users", currentUser.uid));
        let username = currentUser.email.split('@')[0]; 
        if (userDoc.exists()) {
            username = userDoc.data().username;
        }

        await addDoc(collection(db, 'chatMessages'), {
            text: messageText,
            uid: currentUser.uid,
            username: username,
            timestamp: serverTimestamp()
        });
        messageInput.value = '';
    }
}

function displayMessage(text, username, isCurrentUser, timestamp) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message');
    if (isCurrentUser) {
        messageDiv.classList.add('sent');
    } else {
        const infoDiv = document.createElement('div');
        infoDiv.classList.add('message-info');
        infoDiv.textContent = username;
        messageDiv.appendChild(infoDiv);
    }

    const messageContent = document.createElement('p');
    messageContent.textContent = text;
    messageDiv.appendChild(messageContent);

    const timestampDiv = document.createElement('div');
    timestampDiv.classList.add('message-info');
    const date = timestamp ? new Date(timestamp.toMillis()) : new Date();
    const formattedTime = date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
    timestampDiv.textContent = formattedTime;
    messageDiv.appendChild(timestampDiv);

    messageContainer.appendChild(messageDiv);
}


function enableDarkMode() {
    body.classList.add('dark-mode');
    darkModeToggle.checked = true;
    localStorage.setItem('darkMode', 'enabled');
    console.log('Dark mode enabled'); 
}

function disableDarkMode() {
    body.classList.remove('dark-mode');
    darkModeToggle.checked = false;
    localStorage.setItem('darkMode', null);
    console.log('Dark mode disabled'); 
}

function toggleDarkMode() {
    console.log('Toggle function called');
    if (body.classList.contains('dark-mode')) {
        disableDarkMode();
    } else {
        enableDarkMode();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    if (darkModeToggle) {
        darkModeToggle.addEventListener('change', toggleDarkMode);
        console.log('Dark mode toggle event listener attached');

        if (localStorage.getItem('darkMode') === 'enabled') {
            enableDarkMode();
        } else {
            disableDarkMode();
        }
    } else {
        console.error('Dark mode toggle element not found!'); 
    }
});