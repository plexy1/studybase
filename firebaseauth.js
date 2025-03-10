import { initializeApp } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut, updatePassword, reauthenticateWithCredential, EmailAuthProvider } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-auth.js";
import { getFirestore, doc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyAjvShhWqOBIrgero2ODtQQtSzWuafmGJw",
  authDomain: "studybase-data.firebaseapp.com",
  projectId: "studybase-data",
  storageBucket: "studybase-data.firebasestorage.app",
  messagingSenderId: "471482464641",
  appId: "1:471482464641:web:46fe6cf41e17a24e785080"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const accountNameElement = document.getElementById("accountName");
const profileNameElement = document.getElementById("profileName");
const dateCreatedElement = document.getElementById("dateCreated");
const universityElement = document.getElementById("university");
const emailElement = document.getElementById("email");
const profileEmailElement = document.getElementById("profileEmail");
const lastLoginElement = document.getElementById("lastLogin");
const profileImageElement = document.getElementById("profileImage");
const logoutButton = document.querySelector(".btn-danger");
const accountTab = document.querySelector('.nav-link[href="account.html"]');
const darkModeToggle = document.getElementById('darkModeToggle');
const darkModePreference = document.getElementById('darkModePreference');
const emailNotifications = document.getElementById('emailNotifications');
const quizReminders = document.getElementById('quizReminders');
const newFeatures = document.getElementById('newFeatures');
const anonymousMode = document.getElementById('anonymousMode');
const savePreferencesBtn = document.getElementById('savePreferencesBtn');
const changeNameForm = document.getElementById("changeNameForm");
const changeUniversityForm = document.getElementById("changeUniversityForm");
const changePasswordForm = document.getElementById("changePasswordForm");
const changePhotoForm = document.getElementById("changePhotoForm");

onAuthStateChanged(auth, async (user) => {
  if (user) {
    try {
      const userDoc = await getDoc(doc(db, "users", user.uid));

      if (userDoc.exists()) {
        const userData = userDoc.data();

        const username = userData.username || "Not set";
        accountNameElement.textContent = username;
        profileNameElement.textContent = username;
        universityElement.textContent = userData.university || "Not set";
        emailElement.textContent = user.email;
        profileEmailElement.textContent = user.email;

        if (userData.photoURL) {
          profileImageElement.src = userData.photoURL;
          document.querySelectorAll('img[alt="Profile"]').forEach(img => {
            img.src = userData.photoURL;
          });
        }

        if (accountTab) {
          accountTab.textContent = username;
        }
        const creationTime = new Date(user.metadata.creationTime);
        dateCreatedElement.textContent = creationTime.toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric"
        });

        const lastSignInTime = new Date(user.metadata.lastSignInTime);
        lastLoginElement.textContent = lastSignInTime.toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric"
        }) + " at " + lastSignInTime.toLocaleTimeString("en-US", {
          hour: '2-digit',
          minute: '2-digit'
        });

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

function loadUserPreferences(userData) {
  if (userData.preferences) {
    if (userData.preferences.hasOwnProperty('darkMode')) {
      darkModePreference.checked = userData.preferences.darkMode;
      darkModeToggle.checked = userData.preferences.darkMode;

      if (userData.preferences.darkMode) {
        document.body.classList.add('dark-mode');
      } else {
        document.body.classList.remove('dark-mode');
      }
    }

    if (userData.preferences.hasOwnProperty('anonymousMode')) {
      anonymousMode.checked = userData.preferences.anonymousMode;
    }
  }

  if (userData.notifications) {
    if (userData.notifications.hasOwnProperty('email')) {
      emailNotifications.checked = userData.notifications.email;
    }

    if (userData.notifications.hasOwnProperty('quizReminders')) {
      quizReminders.checked = userData.notifications.quizReminders;
    }

    if (userData.notifications.hasOwnProperty('newFeatures')) {
      newFeatures.checked = userData.notifications.newFeatures;
    }
  }
}

function setDefaultValues() {
  accountNameElement.textContent = "Data not available";
  profileNameElement.textContent = "Data not available";
  dateCreatedElement.textContent = "Data not available";
  universityElement.textContent = "Data not available";
  emailElement.textContent = "Data not available";
  profileEmailElement.textContent = "Data not available";
  lastLoginElement.textContent = "Data not available";

  if (accountTab) {
    accountTab.textContent = "Account";
  }
}
if (changeNameForm) {
  changeNameForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const newName = document.getElementById("newName").value;

    try {
      const user = auth.currentUser;
      if (user) {
        await updateUserProfile(user.uid, { username: newName });
        accountNameElement.textContent = newName;
        profileNameElement.textContent = newName;

        if (accountTab) {
          accountTab.textContent = newName;
        }
        const modal = bootstrap.Modal.getInstance(document.getElementById('changeNameModal'));
        modal.hide();
        showAlert('Name updated successfully!', 'success');
      }
    } catch (error) {
      console.error("Error updating name:", error);
      showAlert('Failed to update name: ' + error.message, 'danger');
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
        universityElement.textContent = newUniversity;
        const modal = bootstrap.Modal.getInstance(document.getElementById('changeUniversityModal'));
        modal.hide();
        showAlert('University updated successfully!', 'success');
      }
    } catch (error) {
      console.error("Error updating university:", error);
      showAlert('Failed to update university: ' + error.message, 'danger');
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
      showAlert('New passwords do not match!', 'danger');
      return;
    }

    try {
      const user = auth.currentUser;
      if (user) {
        const credential = EmailAuthProvider.credential(user.email, currentPassword);
        await reauthenticateWithCredential(user, credential);
        await updatePassword(user, newPassword);
        const modal = bootstrap.Modal.getInstance(document.getElementById('changePasswordModal'));
        modal.hide();
        changePasswordForm.reset();
        showAlert('Password updated successfully!', 'success');
      }
    } catch (error) {
      console.error("Error updating password:", error);
      if (error.code === 'auth/wrong-password') {
        showAlert('Current password is incorrect', 'danger');
      } else {
        showAlert('Failed to update password: ' + error.message, 'danger');
      }
    }
  });
}

if (changePhotoForm) {
  changePhotoForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const photoFile = document.getElementById("newPhoto").files[0];

    if (!photoFile) {
      showAlert('Please select a file', 'warning');
      return;
    }

    try {
      const user = auth.currentUser;
      if (user) {
        const storageRef = ref(storage, `profile_photos/${user.uid}`);
        const snapshot = await uploadBytes(storageRef, photoFile);
        const photoURL = await getDownloadURL(snapshot.ref);
        await updateUserProfile(user.uid, { photoURL });
        const profileImages = document.querySelectorAll('img[alt="Profile"]');
        profileImages.forEach(img => {
          img.src = photoURL;
        });

        const profileImageElement = document.getElementById("profileImage");
        if (profileImageElement) {
          profileImageElement.src = photoURL;
        }
        const modal = bootstrap.Modal.getInstance(document.getElementById('changePhotoModal'));
        modal.hide();
        changePhotoForm.reset();

        showAlert('Profile photo updated successfully!', 'success');
      }
    } catch (error) {
      console.error("Error updating photo:", error);
      showAlert('Failed to update profile photo: ' + error.message, 'danger');
    }
  });
}

async function updateUserProfile(userId, data) {
  const userRef = doc(db, "users", userId);
  await updateDoc(userRef, data);
}

if (logoutButton) {
  logoutButton.addEventListener("click", async () => {
    try {
      await signOut(auth);
      window.location.href = "index.html";
    } catch (error) {
      console.error("Error signing out:", error);
      showAlert('Failed to log out: ' + error.message, 'danger');
    }
  });
}

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
        darkModeToggle.checked = darkModePreference.checked;

        showAlert('Preferences saved successfully!', 'success');
      }
    } catch (error) {
      console.error("Error saving preferences:", error);
      showAlert('Failed to save preferences: ' + error.message, 'danger');
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
