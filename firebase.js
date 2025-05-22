// Your Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyANUNTnm11bHwXq4gBIiSaZkRdRO1SRy8E",
    authDomain: "whatsapp-beb52.firebaseapp.com",
    projectId: "whatsapp-beb52",
    storageBucket: "whatsapp-beb52.firebasestorage.app",
    messagingSenderId: "507807907595",
    appId: "1:507807907595:web:c2ceb97eea274a05e2ac0e",
    measurementId: "G-X3K4E91PFT"
  };

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
