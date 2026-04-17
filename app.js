// 🔥 Firebase Imports (CDN Modular)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";

import { 
  getAuth, 
  signInWithEmailAndPassword, 
  onAuthStateChanged, 
  signOut 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

import {
  getFirestore,
  collection,
  addDoc,
  onSnapshot,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// 🔑 Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyBJeSiCRIltuDtB9ztQju8sBZ2zJfYUMtI",
  authDomain: "seatsync-3e23b.firebaseapp.com",
  projectId: "seatsync-3e23b",
  storageBucket: "seatsync-3e23b.firebasestorage.app",
  messagingSenderId: "446161771063",
  appId: "1:446161771063:web:02de1da576721fe8babdb2"
};

// 🔥 Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

console.log("Firestore Database connected successfully!");

// ===== STATE =====
let currentUser = null;
let selectedSeat = null;
let bookings = [];

// ===== UI =====
const loginScreen = document.getElementById("loginScreen");
const appScreen = document.getElementById("app");
const seatingEl = document.getElementById("seating");
const formEl = document.getElementById("bookingForm");
const seatNumberEl = document.getElementById("seatNumber");

// ===== PRICING =====
const PRICE_ADULT = 10;
const PRICE_CHILD = 5;

// ===== SEATS =====
const seats = [];
for (let i = 1; i <= 25; i++) {
  seats.push({ id: i, taken: false });
}

// ===== AUTH =====
onAuthStateChanged(auth, (user) => {
  if (user) {
    currentUser = user;
    loginScreen.classList.add("hidden");
    appScreen.classList.remove("hidden");

    startRealtimeListener();
  } else {
    loginScreen.classList.remove("hidden");
    appScreen.classList.add("hidden");
  }
});

// ===== LOGIN =====
window.login = async function () {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  try {
    await signInWithEmailAndPassword(auth, email, password);
  } catch (error) {
    alert(error.message);
  }
};

// ===== LOGOUT =====
window.logout = function () {
  signOut(auth);
};

// ===== UI RENDER =====
function renderSeats() {
  seatingEl.innerHTML = "";

  seats.forEach(seat => {
    const btn = document.createElement("button");
    btn.textContent = seat.id;

    btn.className = `p-4 rounded text-white ${
      seat.taken ? "bg-red-500" : "bg-green-500"
    }`;

    btn.onclick = () => handleSeatClick(seat);
    seatingEl.appendChild(btn);
  });
}

function handleSeatClick(seat) {
  if (seat.taken) return;

  selectedSeat = seat;
  seatNumberEl.textContent = seat.id;
  formEl.classList.remove("hidden");
}

// ===== SAVE BOOKING =====
window.saveBooking = async function () {
  const adults = parseInt(document.getElementById("adults").value) || 0;
  const children = parseInt(document.getElementById("children").value) || 0;

  if (adults + children === 0) {
    alert("Please enter at least one ticket.");
    return;
  }

  const total = adults * PRICE_ADULT + children * PRICE_CHILD;

  const booking = {
    seatId: selectedSeat.id,
    adults,
    children,
    total,
    userId: currentUser.uid,
    createdAt: serverTimestamp()
  };

  try {
    await addDoc(collection(db, "bookings"), booking);
    cancelBooking();
  } catch (err) {
    console.error(err);
    alert("Error saving booking");
  }
};

// ===== REALTIME SYNC =====
function startRealtimeListener() {
  onSnapshot(collection(db, "bookings"), (snapshot) => {

    bookings = [];

    // reset seats
    seats.forEach(s => s.taken = false);

    snapshot.forEach(doc => {
      const data = doc.data();
      bookings.push(data);

      const seat = seats.find(s => s.id === data.seatId);
      if (seat) seat.taken = true;
    });

    renderSeats();
    updateRevenue();
  });
}

// ===== REVENUE =====
function updateRevenue() {
  let totalRevenue = 0;
  let totalTickets = 0;

  bookings.forEach(b => {
    totalRevenue += b.total;
    totalTickets += b.adults + b.children;
  });

  document.getElementById("revenue").textContent = totalRevenue;
  document.getElementById("tickets").textContent = totalTickets;
}

// ===== CANCEL =====
window.cancelBooking = function () {
  formEl.classList.add("hidden");
  document.getElementById("adults").value = "";
  document.getElementById("children").value = "";
};

// ===== INIT =====
renderSeats();
