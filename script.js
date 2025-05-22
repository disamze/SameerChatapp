let currentChat = null;

// Generate or get a unique user ID stored in localStorage (persists per browser)
let myUserId = localStorage.getItem("userId");
if (!myUserId) {
  myUserId = "user_" + Math.floor(Math.random() * 1000000);
  localStorage.setItem("userId", myUserId);
}
console.log("Your user ID:", myUserId);

// Get or prompt username, store in localStorage
let myUsername = localStorage.getItem("username");
if (!myUsername) {
  myUsername = prompt("Enter your display name:", "Anonymous") || "Anonymous";
  localStorage.setItem("username", myUsername);
}

// DOM elements
const messagesDiv = document.getElementById("messages");
const messageInput = document.getElementById("messageInput");
const chatTitle = document.getElementById("chatTitle");
const clearChatBtn = document.getElementById("clearChatBtn");
const chatListItems = document.querySelectorAll(".sidebar li");

// To keep Firestore unsubscribe listener for current chat
let unsubscribeListener = null;

// Load a chat room
function loadChat(chatName) {
  if (unsubscribeListener) unsubscribeListener(); // Detach old listener

  currentChat = chatName;
  chatTitle.textContent = chatName;

  // Mark active chat in sidebar
  chatListItems.forEach((li) => {
    li.classList.toggle("active", li.textContent === chatName);
  });

  // Clear messages display
  messagesDiv.innerHTML = "";

  // Listen to messages collection ordered by timestamp ascending
  unsubscribeListener = db
    .collection("chats")
    .doc(chatName)
    .collection("messages")
    .orderBy("timestamp", "asc")
    .onSnapshot((snapshot) => {
      messagesDiv.innerHTML = ""; // Clear all messages and re-render fresh (simple)
      snapshot.forEach((doc) => {
        const msg = doc.data();
        addMessage(msg);
      });

      // Scroll to bottom on new messages
      messagesDiv.scrollTop = messagesDiv.scrollHeight;
    });
}

// Add a message element to messagesDiv
function addMessage(msg) {
  const div = document.createElement("div");
  div.classList.add("message");

  if (msg.userId === myUserId) {
    div.classList.add("sent");
  } else {
    div.classList.add("received");
  }

  // Message content: username in bold + message text
  div.innerHTML = `<strong>${msg.username}</strong><br>${escapeHTML(
    msg.text
  )}<div class="timestamp">${formatTimestamp(msg.timestamp)}</div>`;

  messagesDiv.appendChild(div);
}

// Escape HTML to avoid injection
function escapeHTML(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

// Format timestamp nicely
function formatTimestamp(timestamp) {
  if (!timestamp) return "";
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

// Send a message to current chat
function sendMessage() {
  const text = messageInput.value.trim();
  if (!text) return;
  if (!currentChat) {
    alert("Select a chat first.");
    return;
  }

  const messageObj = {
    text,
    userId: myUserId,
    username: myUsername,
    timestamp: firebase.firestore.FieldValue.serverTimestamp(),
  };

  db.collection("chats")
    .doc(currentChat)
    .collection("messages")
    .add(messageObj)
    .then(() => {
      messageInput.value = "";
    })
    .catch((e) => {
      console.error("Error sending message:", e);
    });
}

// Clear chat messages in Firestore for current chat
clearChatBtn.addEventListener("click", () => {
  if (!currentChat) return alert("Select a chat first.");
  if (
    confirm(
      `Are you sure you want to clear all messages in "${currentChat}"? This cannot be undone.`
    )
  ) {
    // Delete all messages in chat collection
    clearChatMessages(currentChat);
  }
});

async function clearChatMessages(chatName) {
  const messagesRef = db.collection("chats").doc(chatName).collection("messages");
  const snapshot = await messagesRef.get();

  const batch = db.batch();
  snapshot.forEach((doc) => {
    batch.delete(doc.ref);
  });

  await batch.commit();
  alert(`All messages cleared in "${chatName}".`);
}

// Load default chat on page load
loadChat("Global 1");

// THEME & LIGHT/DARK MODE TOGGLE

const themeSelect = document.getElementById("themeSelect");
const modeToggle = document.getElementById("modeToggle");

function applyTheme(themeClass) {
  // Remove old theme classes
  document.body.classList.remove("theme-blue", "theme-purple");

  if (themeClass) {
    document.body.classList.add(themeClass);
  }
  localStorage.setItem("selectedTheme", themeClass || "");
}

function applyMode(light) {
  if (light) {
    document.body.classList.add("light");
  } else {
    document.body.classList.remove("light");
  }
  localStorage.setItem("lightMode", light ? "true" : "false");
}

// Load saved preferences
window.addEventListener("load", () => {
  const savedTheme = localStorage.getItem("selectedTheme");
  const savedMode = localStorage.getItem("lightMode");

  if (savedTheme) {
    applyTheme(savedTheme);
    themeSelect.value = savedTheme;
  }

  if (savedMode === "true") {
    applyMode(true);
    modeToggle.checked = true;
  } else {
    applyMode(false);
    modeToggle.checked = false;
  }
});

// Event listeners
themeSelect.addEventListener("change", (e) => {
  applyTheme(e.target.value);
});

modeToggle.addEventListener("change", (e) => {
  applyMode(e.target.checked);
});
