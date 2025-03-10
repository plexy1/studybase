import { initializeApp } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut, updatePassword, reauthenticateWithCredential, EmailAuthProvider } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-auth.js";
import { getFirestore, doc, getDoc, updateDoc, addDoc, collection, getDocs } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-storage.js";

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

// DOM Elements
const accountNameElement = document.getElementById("accountName");
const profileNameElement = document.getElementById("profileName");
const dateCreatedElement = document.getElementById("dateCreated");
const universityElement = document.getElementById("university");
const emailElement = document.getElementById("email");
const profileEmailElement = document.getElementById("profileEmail");
const lastLoginElement = document.getElementById("lastLogin");
const profileImageElement = document.getElementById("profileImage");
const logoutButton = document.querySelector(".btn-danger");
const changeNameForm = document.getElementById("changeNameForm");
const changeUniversityForm = document.getElementById("changeUniversityForm");
const changePasswordForm = document.getElementById("changePasswordForm");
const changePhotoForm = document.getElementById("changePhotoForm");
const savePreferencesBtn = document.getElementById("savePreferencesBtn");
const darkModeToggle = document.getElementById("darkModeToggle");
const darkModePreference = document.getElementById("darkModePreference");
const anonymousMode = document.getElementById("anonymousMode");
const emailNotifications = document.getElementById("emailNotifications");
const quizReminders = document.getElementById("quizReminders");
const newFeatures = document.getElementById("newFeatures");
const accountTab = document.getElementById("accountTab");

// Auth state observer
onAuthStateChanged(auth, async (user) => {
  if (user) {
    try {
      const userDoc = await getDoc(doc(db, "users", user.uid));
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        
        const username = userData.username || "Not set";
        if (accountNameElement) accountNameElement.textContent = username;
        if (profileNameElement) profileNameElement.textContent = username;
        if (universityElement) universityElement.textContent = userData.university || "Not set";
        if (emailElement) emailElement.textContent = user.email;
        if (profileEmailElement) profileEmailElement.textContent = user.email;
        
        if (userData.photoURL && profileImageElement) {
          profileImageElement.src = userData.photoURL;
          document.querySelectorAll('img[alt="Profile"]').forEach(img => {
            img.src = userData.photoURL;
          });
        }

        if (accountTab) {
          accountTab.textContent = username;
        }
        
        if (dateCreatedElement) {
          const creationTime = new Date(user.metadata.creationTime);
          dateCreatedElement.textContent = creationTime.toLocaleDateString("en-US", {
            year: "numeric", month: "long", day: "numeric"
          });
        }
        
        if (lastLoginElement) {
          const lastSignInTime = new Date(user.metadata.lastSignInTime);
          lastLoginElement.textContent = lastSignInTime.toLocaleDateString("en-US", {
            year: "numeric", month: "long", day: "numeric"
          }) + " at " + lastSignInTime.toLocaleTimeString("en-US", {
            hour: '2-digit', minute: '2-digit'
          });
        }
        
        loadUserPreferences(userData);
      } else {
        console.log("No user document found");
        setDefaultValues();
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
      setDefaultValues();
    }
  } else {
    window.location.href = "index.html";
  }
});

// Functions for user profile and preferences
function loadUserPreferences(userData) {
  if (userData.preferences) {
    if (userData.preferences.hasOwnProperty('darkMode') && darkModePreference && darkModeToggle) {
      darkModePreference.checked = userData.preferences.darkMode;
      darkModeToggle.checked = userData.preferences.darkMode;
      
      if (userData.preferences.darkMode) {
        document.body.classList.add('dark-mode');
      } else {
        document.body.classList.remove('dark-mode');
      }
    }
    
    if (userData.preferences.hasOwnProperty('anonymousMode') && anonymousMode) {
      anonymousMode.checked = userData.preferences.anonymousMode;
    }
  }

  if (userData.notifications) {
    if (userData.notifications.hasOwnProperty('email') && emailNotifications) {
      emailNotifications.checked = userData.notifications.email;
    }
    
    if (userData.notifications.hasOwnProperty('quizReminders') && quizReminders) {
      quizReminders.checked = userData.notifications.quizReminders;
    }
    
    if (userData.notifications.hasOwnProperty('newFeatures') && newFeatures) {
      newFeatures.checked = userData.notifications.newFeatures;
    }
  }
}

function setDefaultValues() {
  const user = auth.currentUser;
  if (!user) return;
  
  const username = user.email.split('@')[0];
  
  if (accountNameElement) accountNameElement.textContent = username;
  if (profileNameElement) profileNameElement.textContent = username;
  if (dateCreatedElement) dateCreatedElement.textContent = new Date(user.metadata.creationTime).toLocaleDateString("en-US", {
    year: "numeric", month: "long", day: "numeric"
  });
  if (universityElement) universityElement.textContent = "Not set";
  if (emailElement) emailElement.textContent = user.email;
  if (profileEmailElement) profileEmailElement.textContent = user.email;
  if (lastLoginElement) lastLoginElement.textContent = new Date(user.metadata.lastSignInTime).toLocaleDateString("en-US", {
    year: "numeric", month: "long", day: "numeric"
  }) + " at " + new Date(user.metadata.lastSignInTime).toLocaleTimeString("en-US", {
    hour: '2-digit', minute: '2-digit'
  });
  
  if (accountTab) {
    accountTab.textContent = username;
  }
}

// Update user profile data
async function updateUserProfile(userId, data) {
  const userRef = doc(db, "users", userId);
  await updateDoc(userRef, data);
}

// Event listeners for profile forms
if (changeNameForm) {
  changeNameForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const newName = document.getElementById("newName").value;
    
    try {
      const user = auth.currentUser;
      if (user) {
        await updateUserProfile(user.uid, { username: newName });
        if (accountNameElement) accountNameElement.textContent = newName;
        if (profileNameElement) profileNameElement.textContent = newName;
        if (accountTab) accountTab.textContent = newName;
        
        const modal = bootstrap.Modal.getInstance(document.getElementById('changeNameModal'));
        if (modal) modal.hide();
      }
    } catch (error) {
      console.error("Error updating name:", error);
    }
  });
}

if (changeUniversityForm) {
  changeUniversityForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const newUniversity = document.getElementById("newUniversity").value;
    
    try {
      const user = auth.currentUser;
      if (user) {
        await updateUserProfile(user.uid, { university: newUniversity });
        if (universityElement) universityElement.textContent = newUniversity;
        
        const modal = bootstrap.Modal.getInstance(document.getElementById('changeUniversityModal'));
        if (modal) modal.hide();
      }
    } catch (error) {
      console.error("Error updating university:", error);
    }
  });
}

if (changePasswordForm) {
  changePasswordForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const currentPassword = document.getElementById("currentPassword").value;
    const newPassword = document.getElementById("newPassword").value;
    const confirmPassword = document.getElementById("confirmPassword").value;
    
    if (newPassword !== confirmPassword) {
      return;
    }
    
    try {
      const user = auth.currentUser;
      if (user) {
        const credential = EmailAuthProvider.credential(user.email, currentPassword);
        await reauthenticateWithCredential(user, credential);
        await updatePassword(user, newPassword);
        
        const modal = bootstrap.Modal.getInstance(document.getElementById('changePasswordModal'));
        if (modal) modal.hide();
        changePasswordForm.reset();
      }
    } catch (error) {
      console.error("Error updating password:", error);
    }
  });
}

// Logout functionality
if (logoutButton) {
  logoutButton.addEventListener("click", async () => {
    try {
      await signOut(auth);
      window.location.href = "index.html";
    } catch (error) {
      console.error("Error signing out:", error);
    }
  });
}

// Preferences functionality
if (savePreferencesBtn) {
  savePreferencesBtn.addEventListener('click', async () => {
    try {
      const user = auth.currentUser;
      if (user) {
        const preferencesData = {
          preferences: {
            darkMode: darkModePreference.checked,
            anonymousMode: anonymousMode.checked
          },
          notifications: {
            email: emailNotifications.checked,
            quizReminders: quizReminders.checked,
            newFeatures: newFeatures.checked
          }
        };
        await updateUserProfile(user.uid, preferencesData);
        if (darkModePreference.checked) {
          enableDarkMode();
        } else {
          disableDarkMode();
        }
        if (darkModeToggle) darkModeToggle.checked = darkModePreference.checked;
      }
    } catch (error) {
      console.error("Error saving preferences:", error);
    }
  });
}

if (darkModeToggle) {
  darkModeToggle.addEventListener('change', () => {
    if (darkModeToggle.checked) {
      enableDarkMode();
      if (darkModePreference) {
        darkModePreference.checked = true;
      }
    } else {
      disableDarkMode();
      if (darkModePreference) {
        darkModePreference.checked = false;
      }
    }
  });
}

function enableDarkMode() {
  document.body.classList.add('dark-mode');
  localStorage.setItem('darkMode', 'enabled');
}

function disableDarkMode() {
  document.body.classList.remove('dark-mode');
  localStorage.setItem('darkMode', null);
}

// Search history functions
async function saveSearchTopic(topic) {
  try {
    await addDoc(collection(db, "searchHistory"), {
      topic,
      timestamp: new Date()
    });
  } catch (error) {
    console.error("Error saving search history:", error);
  }
}

async function getSearchHistory() {
  try {
    const querySnapshot = await getDocs(collection(db, "searchHistory"));
    let history = [];
    querySnapshot.forEach((doc) => {
      history.push(doc.data().topic);
    });
    return history;
  } catch (error) {
    console.error("Error getting search history:", error);
    return [];
  }
}

// Initialize review form handling
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("reviewForm");
  const successMessageDiv = document.getElementById("successMessage");

  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      // Retrieve form values
      const course = document.getElementById("courseInput").value;
      const yourMajor = document.getElementById("yourMajor").value;
      const semester = document.getElementById("semester").value;
      const year = document.getElementById("year").value;
      const professorName = document.getElementById("professorName").value;
      const reviewText = document.getElementById("reviewText").value;
      const starRating = document.getElementById("starRating").value;
      const anonymous = document.getElementById("anonymousCheckbox").checked;

      try {
        // Save review
        await addDoc(collection(db, "reviews"), {
          course,
          yourMajor,
          semester,
          year,
          professorName,
          reviewText,
          starRating,
          anonymous,
          timestamp: new Date()
        });

        // Display success message
        if (successMessageDiv) {
          successMessageDiv.textContent = "Review submitted successfully! Redirecting...";
          successMessageDiv.style.display = "block";
          successMessageDiv.style.color = "green";
        }

        setTimeout(() => {
          window.location.href = "courses.html";
        }, 1000);
      } catch (error) {
        console.error("Error submitting review:", error);
        if (successMessageDiv) {
          successMessageDiv.textContent = "Error submitting review: " + error.message;
          successMessageDiv.style.display = "block";
          successMessageDiv.style.color = "red";
        }
      }
    });
  }
});

// Export functions for modules that need them
export { saveSearchTopic, getSearchHistory, updateUserProfile };