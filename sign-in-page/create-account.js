//To link to firebase(for user registration)

import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyBzB_tnvVNaVOhItN_3Hw5zv325LmL1zko",
  authDomain: "studybase2311.firebaseapp.com",
  projectId: "studybase2311",
  storageBucket: "studybase2311.firebasestorage.app",
  messagingSenderId: "594569312000",
  appId: "1:594569312000:web:1340ec389ee98f5c84a5e5",
  measurementId: "G-E8E297LTXP"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);


//input fields
const floatingUsername = document.getElementById("floatingUsername").value;
const floatingEmail = document.getElementById("floatingEmail").value;
const floatingUniversity = document.getElementById("floatingUniversity").value;
const floatingPassword = document.getElementById("floatingPassword").value;
const submit = document.getElementById("submit");

submit.addEventListener('click', function(event){
event.preventDefault();
alert("Sent request")
})
