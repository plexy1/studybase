import { initializeApp } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, onAuthStateChanged, signOut, updatePassword, reauthenticateWithCredential, EmailAuthProvider } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-auth.js";
import { getFirestore, doc, getDoc, updateDoc, addDoc, collection, getDocs, setDoc, query, where } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-firestore.js";
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

const registerForm = document.getElementById("registerForm");
if (registerForm) {
  registerForm.addEventListener("submit", handleRegistration);
}

async function handleRegistration(e) {
  e.preventDefault();
  
  const username = document.getElementById("floatingUsername").value;
  const university = document.getElementById("floatingUniversity").value;
  const major = document.getElementById("floatingMajor").value;
  const email = document.getElementById("floatingEmail").value;
  const password = document.getElementById("floatingPassword").value;
  const successMessage = document.getElementById("successMessage");
  
  // Basic validation
  if (!username || !email || !password) {
    successMessage.textContent = "Please fill in all fields";
    successMessage.style.display = "block";
    successMessage.style.color = "red";
    return;
  }

  // Show loading state
  successMessage.textContent = "Creating your account...";
  successMessage.style.display = "block";
  successMessage.style.color = "black";
  
  try {
    // First check if username already exists
    const usersRef = collection(db, "users");
    const usernameQuery = query(usersRef, where("username", "==", username));
    const usernameSnapshot = await getDocs(usernameQuery);
    
    if (!usernameSnapshot.empty) {
      successMessage.textContent = "Username already taken";
      successMessage.style.color = "red";
      successMessage.style.display = "block";
      return;
    }

    // Create user in Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    await setDoc(doc(db, "users", user.uid), {
      username: username,
      university: university || "Not set",
      major: major || "Not set",
      email: email,
      createdAt: new Date(),
      role: "Student",
      preferences: {
        darkMode: false,
        anonymousMode: false
      },
      notifications: {
        email: true,
        quizReminders: true,
        newFeatures: true
      }
    });
    
    successMessage.textContent = "Account created! Redirecting to login...";
    successMessage.style.color = "green";
    successMessage.style.display = "block";
    
    setTimeout(() => {
      window.location.href = "index.html";
    }, 2000);
    
  } catch (error) {
    console.error("Error creating account:", error);
    let errorMessage = "Unable to create account";
    
    switch (error.code) {
      case 'auth/email-already-in-use':
        errorMessage = "Email already registered";
        break;
      case 'auth/invalid-email':
        errorMessage = "Please enter a valid email";
        break;
      case 'auth/weak-password':
        errorMessage = "Password must be at least 6 characters";
        break;
      default:
        errorMessage = "Unable to create account";
    }
    
    successMessage.textContent = errorMessage;
    successMessage.style.color = "red";
    successMessage.style.display = "block";
  }
}

// Auth state observer
onAuthStateChanged(auth, async (user) => {
  if (user) {
    try {
      const userDoc = await getDoc(doc(db, "users", user.uid));
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        
        // Update profile photo if available
        if (userData.photoURL) {
          const profileImages = document.querySelectorAll('img[alt="Profile"]');
          profileImages.forEach(img => {
            img.src = userData.photoURL;
          });
        }
        
        const username = userData.username || "Not set";
        
        // Update UI elements if they exist
        const accountNameElement = document.getElementById("accountName");
        const profileNameElement = document.getElementById("profileName");
        const dateCreatedElement = document.getElementById("dateCreated");
        const universityElement = document.getElementById("university");
        const emailElement = document.getElementById("email");
        const profileEmailElement = document.getElementById("profileEmail");
        const lastLoginElement = document.getElementById("lastLogin");
        const accountTab = document.getElementById("accountTab");
        
        if (accountNameElement) accountNameElement.textContent = username;
        if (profileNameElement) profileNameElement.textContent = username;
        if (universityElement) universityElement.textContent = userData.university || "Not set";
        if (emailElement) emailElement.textContent = user.email;
        if (profileEmailElement) profileEmailElement.textContent = user.email;
        
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
      } 
      
      else {
        console.log("No user document found");
        setDefaultValues();
      }
    } 
    
    catch (error) {
      console.error("Error fetching user data:", error);
      setDefaultValues();
    }
  } else {
    if (!window.location.href.includes("create-account.html")) {
      window.location.href = "index.html";
    }
  }
});

// Functions for user profile and preferences
function loadUserPreferences(userData) {
  const darkModePreference = document.getElementById("darkModePreference");
  const darkModeToggle = document.getElementById("darkModeToggle");
  const anonymousMode = document.getElementById("anonymousMode");
  const emailNotifications = document.getElementById("emailNotifications");
  const quizReminders = document.getElementById("quizReminders");
  const newFeatures = document.getElementById("newFeatures");
  
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
  
  const accountNameElement = document.getElementById("accountName");
  const profileNameElement = document.getElementById("profileName");
  const dateCreatedElement = document.getElementById("dateCreated");
  const universityElement = document.getElementById("university");
  const emailElement = document.getElementById("email");
  const profileEmailElement = document.getElementById("profileEmail");
  const lastLoginElement = document.getElementById("lastLogin");
  const accountTab = document.getElementById("accountTab");
  
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

// Set up form listeners
document.addEventListener("DOMContentLoaded", () => {
  // Change name form
  const changeNameForm = document.getElementById("changeNameForm");
  if (changeNameForm) {
    changeNameForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const newName = document.getElementById("newName").value;
      
      try {
        const user = auth.currentUser;
        if (user) {
          const usersRef = collection(db, "users");
          const usernameQuery = query(usersRef, where("username", "==", newName));
          const usernameSnapshot = await getDocs(usernameQuery);
          
          if (!usernameSnapshot.empty) {
            const foundUser = usernameSnapshot.docs[0];
            if (foundUser.id !== user.uid) {
              displayStatusMessage("This username is already taken", false);
              return;
            }
          }

          await updateUserProfile(user.uid, { username: newName });
          const accountNameElement = document.getElementById("accountName");
          const profileNameElement = document.getElementById("profileName");
          const accountTab = document.getElementById("accountTab");
          
          if (accountNameElement) accountNameElement.textContent = newName;
          if (profileNameElement) profileNameElement.textContent = newName;
          if (accountTab) accountTab.textContent = newName;
          
          const modal = bootstrap.Modal.getInstance(document.getElementById('changeNameModal'));
          if (modal) modal.hide();
          
          displayStatusMessage("Username updated successfully!", true);
          changeNameForm.reset();
        }
      } catch (error) {
        console.error("Error updating name:", error);
        displayStatusMessage("Error updating username: " + error.message, false);
      }
    });
  }

  // Change university form
  const changeUniversityForm = document.getElementById("changeUniversityForm");
  if (changeUniversityForm) {
    changeUniversityForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const newUniversity = document.getElementById("newUniversity").value;
      
      try {
        const user = auth.currentUser;
        if (user) {
          await updateUserProfile(user.uid, { university: newUniversity });
          const universityElement = document.getElementById("university");
          if (universityElement) universityElement.textContent = newUniversity;
          
          const modal = bootstrap.Modal.getInstance(document.getElementById('changeUniversityModal'));
          if (modal) modal.hide();
        }
      } catch (error) {
        console.error("Error updating university:", error);
      }
    });
  }

  // Change password form
  const changePasswordForm = document.getElementById("changePasswordForm");
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

  // Photo upload handler
  const changePhotoForm = document.getElementById("changePhotoForm");
  if (changePhotoForm) {
    changePhotoForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const fileInput = document.getElementById("newPhoto");
      const file = fileInput.files[0];

      if (!file) {
        alert("Please select a file first");
        return;
      }

      try {
        const user = auth.currentUser;
        if (user) {
          const storage = getStorage();
          const storageRef = ref(storage, `profile_photos/${user.uid}`);
          await uploadBytes(storageRef, file);
          const photoURL = await getDownloadURL(storageRef);
          
          // Update user profile with new image URL
          await updateUserProfile(user.uid, { photoURL: photoURL });

          // Update all profile images on the page
          const profileImages = document.querySelectorAll('img[alt="Profile"]');
          profileImages.forEach(img => {
            img.src = photoURL;
          });

          const modal = bootstrap.Modal.getInstance(document.getElementById('changePhotoModal'));
          if (modal) modal.hide();
          changePhotoForm.reset();
        }
      } catch (error) {
        console.error("Error uploading profile photo:", error);
        alert("Failed to upload photo. Please try again.");
      }
    });
  }
  
  // Logout button
  const logoutButton = document.querySelector(".btn-danger");
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

  // Save preferences button
  const savePreferencesBtn = document.getElementById("savePreferencesBtn");
  const darkModePreference = document.getElementById("darkModePreference");
  const anonymousMode = document.getElementById("anonymousMode");
  const emailNotifications = document.getElementById("emailNotifications");
  const quizReminders = document.getElementById("quizReminders");
  const newFeatures = document.getElementById("newFeatures");
  
  if (savePreferencesBtn && darkModePreference && anonymousMode && 
      emailNotifications && quizReminders && newFeatures) {
      
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
          const darkModeToggle = document.getElementById("darkModeToggle");
          
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

  // Dark mode toggle
  const darkModeToggle = document.getElementById("darkModeToggle");
  if (darkModeToggle) {
    darkModeToggle.addEventListener('change', () => {
      if (darkModeToggle.checked) {
        enableDarkMode();
        const darkModePreference = document.getElementById("darkModePreference");
        if (darkModePreference) {
          darkModePreference.checked = true;
        }
      } else {
        disableDarkMode();
        const darkModePreference = document.getElementById("darkModePreference");
        if (darkModePreference) {
          darkModePreference.checked = false;
        }
      }
    });
  }

  // Review form
  const reviewForm = document.getElementById("reviewForm");
  const successMessageDiv = document.getElementById("successMessage");

  if (reviewForm) {
    reviewForm.addEventListener("submit", async (e) => {
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

// Export functions for modules that need them
export { saveSearchTopic, getSearchHistory, updateUserProfile };