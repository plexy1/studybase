// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-auth.js";
import { getFirestore,setDoc } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-firestore.js";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAxZAi4bKJxNSO7paLae8rUDz6DxYbFc7o",
  authDomain: "studybase-data.firebaseapp.com",
  projectId: "studybase-data",
  storageBucket: "studybase-data.firebasestorage.app",
  messagingSenderId: "471482464641",
  appId: "1:471482464641:web:46fe6cf41e17a24e785080"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
function showMessage(message, divId) {
    var messageDiv = document.getElementById(divId);
    messageDiv.innerHTML = message;
    messageDiv.style.display = 'block';  // Ensure the div is visible
 }
const signUp=document.getElementById('submit-register');
signUp.addEventListener('click', (event)=>{
    event.preventDefault();
    const username=document.getElementById('floatingUsername').value;
    const email=document.getElementById('floatingEmail').value;
    const university=document.getElementById('floatingUniversity').value;
    const password=document.getElementById('floatingPassword').value;


    const auth = getAuth();
    const db = getFirestore();
    createUserWithEmailAndPassword(auth, email, password)
    .then((userCredential)=>{
        const user=userCredential.user;
        const userData={
            email: email,
            university: university,

        };
        showMessage('Account created successfully','signUpMessage' );
        const docRef=doc(db, "users", user.uid);
        setDoc(docRef, userData)
        .then(()=>{ 
            window.location.href="index.html";
        })
        .catch((error)=>{
            console.error("error writing document", error);
        })
    })

    .catch((error) => {
        const errorCode = error.code;  // Correct the error property
        if (errorCode == 'auth/email-already-in-use') {
            showMessage('Email already registered to a studybase account', 'signUpMessage');
        } else {
            showMessage('Unable to create user', 'signUpMessage');
        }
    });
    
    


})