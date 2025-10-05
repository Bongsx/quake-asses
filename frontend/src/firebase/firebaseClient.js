import { initializeApp } from "firebase/app";
import { getDatabase, ref, onValue } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyCREhGSSEm4zh2RpJG0y29Fl4YkpblJzdo",
  authDomain: "quake-detector-6f231.firebaseapp.com",
  databaseURL: "https://quake-detector-6f231-default-rtdb.firebaseio.com",
  projectId: "quake-detector-6f231",
  storageBucket: "quake-detector-6f231.firebasestorage.app",
  messagingSenderId: "962067637095",
  appId: "1:962067637095:web:e792be9773952c532445c2",
  measurementId: "G-W5XG7XNBLB",
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
export { ref, onValue };
