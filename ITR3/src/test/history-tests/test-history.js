const firebaseConfig = {
    apiKey: "AIzaSyAjvShhWqOBIrgero2ODtQQtSzWuafmGJw", 
    authDomain: "studybase-data.firebaseapp.com",
    projectId: "studybase-data",
    storageBucket: "studybase-data.appspot.com",
    messagingSenderId: "471482464641",
    appId: "1:471482464641:web:46fe6cf41e17a24e785080"
  };
  
  firebase.initializeApp(firebaseConfig);
  const db = firebase.firestore();
  
  const historyRef = db.collection('searchHistory').doc('searchTerms');
  
  function getSearchHistory() {
    return historyRef.get()
      .then((doc) => {
        if (doc.exists) {
          return doc.data().searchTerms || [];
        } else {
          return [];  
        }
      })
      .catch((error) => {
        console.error("Error fetching document: ", error);
        return [];
      });
  }
  

  function saveSearchHistory(searchTerm) {
    getSearchHistory().then((currentHistory) => {
      currentHistory.push({
        searchTerm: searchTerm,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
      });
  
      historyRef.set({
        searchTerms: currentHistory
      }).then(() => {
        console.log("Search history saved!");
      }).catch((error) => {
        console.error("Error updating document: ", error);
      });
    });
  }
  
  function handleSearch(searchInput) {
    if (searchInput.trim() !== "") {
      saveSearchHistory(searchInput);
    }
  }
  
  handleSearch("example search term");