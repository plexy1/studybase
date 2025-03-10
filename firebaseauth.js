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
const changeNameForm = document.getElementById("changeNameForm");
const changeUniversityForm = document.getElementById("changeUniversityForm");
const changePasswordForm = document.getElementById("changePasswordForm");
const changePhotoForm = document.getElementById("changePhotoForm");

function initializePlaceholders() {
  if (accountNameElement) accountNameElement.textContent = "Not available";
  if (profileNameElement) profileNameElement.textContent = "Not available";
  if (dateCreatedElement) dateCreatedElement.textContent = "Not available";
  if (universityElement) universityElement.textContent = "Not available";
  if (emailElement) emailElement.textContent = "Not available";
  if (profileEmailElement) profileEmailElement.textContent = "Not available";
  if (lastLoginElement) lastLoginElement.textContent = "Not available";
}

initializePlaceholders();

onAuthStateChanged(auth, async (user) => {
  if (user) {
    try {
      if (emailElement) emailElement.textContent = user.email || "Not available";
      if (profileEmailElement) profileEmailElement.textContent = user.email || "Not available";

      if (user.metadata) {
        const creationTime = new Date(user.metadata.creationTime);
        if (dateCreatedElement) {
          dateCreatedElement.textContent = creationTime.toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric"
          });
        }

        const lastSignInTime = new Date(user.metadata.lastSignInTime);
        if (lastLoginElement) {
          lastLoginElement.textContent = lastSignInTime.toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric"
          }) + " at " + lastSignInTime.toLocaleTimeString("en-US", {
            hour: '2-digit',
            minute: '2-digit'
          });
        }
      }

      const userDoc = await getDoc(doc(db, "users", user.uid));

      if (userDoc.exists()) {
        const userData = userDoc.data();

        const username = userData.username || "Not set";
        if (accountNameElement) accountNameElement.textContent = username;
        if (profileNameElement) profileNameElement.textContent = username;
        if (universityElement) universityElement.textContent = userData.university || "Not set";

        if (userData.photoURL) {
          document.querySelectorAll('img[alt="Profile"]').forEach(img => {
            img.src = userData.photoURL;
          });
          if (profileImageElement) profileImageElement.src = userData.photoURL;
        }

        if (accountTab) {
          accountTab.textContent = username;
        }
      }
      else {
        console.log("No user document found");
        if (accountNameElement && !accountNameElement.textContent)
          accountNameElement.textContent = "Not set";
        if (profileNameElement && !profileNameElement.textContent)
          profileNameElement.textContent = "Not set";
        if (universityElement && !universityElement.textContent)
          universityElement.textContent = "Not set";
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
      if (user.email) {
        if (emailElement) emailElement.textContent = user.email;
        if (profileEmailElement) profileEmailElement.textContent = user.email;
      }

      showAlert('Error loading profile data. Some information may be incomplete.', 'warning');
    }
  } 
});

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

        if (accountTab) {
          accountTab.textContent = newName;
        }

        const modal = bootstrap.Modal.getInstance(document.getElementById('changeNameModal'));
        if (modal) modal.hide();
        showAlert('Name updated successfully!', 'success');
      }
    } catch (error) {
      console.error("Error updating name:", error);
      showAlert('Failed to update name: ' + error.message, 'danger');
    }
  });
}

// Handle University Change
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
        showAlert('University updated successfully!', 'success');
      }
    } catch (error) {
      console.error("Error updating university:", error);
      showAlert('Failed to update university: ' + error.message, 'danger');
    }
  });
}

// Handle Password Change
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
        if (modal) modal.hide();
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

// Handle Logout
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