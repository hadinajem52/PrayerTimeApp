// firebaseConfig.js
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyDnKAs_kh1VgNp96roswXA3H7EhWp7VD6c',
  authDomain: 'shiaaprayerleb.firebaseapp.com',
  projectId: 'shiaaprayerleb',
  storageBucket: 'shiaaprayerleb.firebasestorage.app',
  messagingSenderId: '150749699048',
  appId: '1:150749699048:android:a990311e3a8ea2a4c9e25d',
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };
