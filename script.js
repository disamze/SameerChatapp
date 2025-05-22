let currentChat = null;
// Generate or get a unique user ID stored in localStorage (persists per browser)
let myUserId = localStorage.getItem("userId");
if (!myUserId) {
  myUserId = "user_" + Math.floor(Math.random() * 1000000);
  localStorage.setItem("userId", myUserId);
}
console.log("Your user ID:", myUserId);

// Optional: Let user set their display name once
let myUserName = localStorage.getItem("userName");
if (!myUserName) {
  myUserName = prompt("Enter your display name:", "You") || myUserId;
  localStorage.setItem("userName", myUserName);
}

function loadChat(friend) {
  currentChat = friend;
  document.getElementById("chatTitle").innerText = friend;
  listenForMessages();
  highlightActiveChat(friend);
}

function highlightActiveChat(friend) {
  const chatItems = document.querySelectorAll("#chatList li");
  chatItems.forEach(item => {
    item.classList.toggle("active", item.innerText === friend);
  });
}

function sendMessage() {
  const input = document.getElementById("messageInput");
  const text = input.value.trim();
  if (text && currentChat) {
    db.collection("chats").add({
      chatWith: currentChat,
      message: text,
      senderId: myUserId,
      senderName: myUserName,
      timestamp: firebase.firestore.FieldValue.serverTimestamp(),
    }).then(() => {
      input.value = "";
    }).catch(console.error);
  }
}

function formatTimestamp(timestamp) {
  if (!timestamp) return "";
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  let hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12;
  hours = hours ? hours : 12; // hour '0' should be '12'
  const minStr = minutes < 10 ? "0" + minutes : minutes;
  return `${hours}:${minStr} ${ampm}`;
}

function listenForMessages() {
  const messagesDiv = document.getElementById("messages");
  messagesDiv.innerHTML = "";
  db.collection("chats")
    .where("chatWith", "==", currentChat)
    .orderBy("timestamp")
    .onSnapshot((snapshot) => {
      messagesDiv.innerHTML = "";
      snapshot.forEach((doc) => {
        const data = doc.data();

        const msg = document.createElement("div");
        msg.classList.add("message");
        if (data.senderId === myUserId) {
          msg.classList.add("sent");
        } else {
          msg.classList.add("received");
        }

        // Sender name on top-left
        const senderName = document.createElement("div");
        senderName.innerText = data.senderName || data.senderId || "Unknown";
        senderName.style.fontSize = "0.75rem";
        senderName.style.fontWeight = "600";
        senderName.style.marginBottom = "4px";
        senderName.style.color = "#555";
        senderName.style.textAlign = "left";

        // Message text
        const messageText = document.createElement("div");
        messageText.classList.add("message-text");
        messageText.innerText = data.message;

        // Timestamp at bottom-right
        const timeStampDiv = document.createElement("div");
        timeStampDiv.innerText = formatTimestamp(data.timestamp);
        timeStampDiv.style.fontSize = "0.65rem";
        timeStampDiv.style.color = "#888";
        timeStampDiv.style.marginTop = "6px";
        timeStampDiv.style.textAlign = "right";

        // Append all parts to message div
        msg.appendChild(senderName);
        msg.appendChild(messageText);
        msg.appendChild(timeStampDiv);

        messagesDiv.appendChild(msg);
      });
      messagesDiv.scrollTop = messagesDiv.scrollHeight;
    });
}

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("clearChatBtn").addEventListener("click", async () => {
    if (!currentChat) return alert("Please select a chat first!");

    if (!confirm(`Are you sure you want to clear the chat with "${currentChat}"?`)) return;

    try {
      const snapshot = await db.collection("chats")
        .where("chatWith", "==", currentChat)
        .get();

      const batch = db.batch();
      snapshot.forEach(doc => {
        batch.delete(doc.ref);
      });

      await batch.commit();

      alert("Chat cleared!");
    } catch (error) {
      console.error("Error clearing chat:", error);
      alert("Failed to clear chat.");
    }
  });
});
