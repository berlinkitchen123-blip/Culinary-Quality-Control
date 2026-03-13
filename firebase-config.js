
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js";

const firebaseConfig = {
    apiKey: "AIzaSyA3O6Dw0Hj06BH_DUupZvUrufi1jjbDi0g",
    authDomain: "quality-control-24.firebaseapp.com",
    databaseURL: "https://quality-control-24-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "quality-control-24",
    storageBucket: "quality-control-24.firebasestorage.app",
    messagingSenderId: "708146875113",
    appId: "1:708146875113:web:a318755bce78ef99ffbe78"
};

const app = initializeApp(firebaseConfig);
export const database = getDatabase(app);
