const socket = io(); // ✅ Connect to Socket.io server
let currentRoom = "general";
let typingTimeout;

// ✅ Ensure user is logged in before connecting
const username = sessionStorage.getItem("username");
if (!username) {
    window.location.href = "login.html"; // ✅ Redirect to login if no username
}

// ✅ Wait for the DOM to load before attaching event listeners
document.addEventListener("DOMContentLoaded", () => {
    const messageInput = document.getElementById("messageInput");
    const sendButton = document.getElementById("sendButton");
    const joinRoomButton = document.getElementById("joinRoomButton");
    const joinPrivateChatButton = document.getElementById("joinPrivateChatButton");
    const leaveRoomButton = document.getElementById("leaveRoomButton");
    const logoutButton = document.getElementById("logoutButton");

    // ✅ Join Default Room
    socket.emit('joinRoom', { room: currentRoom, user: username });

    /** ✅ Function to Format Date **/
    function formatDate(timestamp) {
        const date = new Date(timestamp);
        return date.toLocaleString(); // ✅ Display date in local format
    }

    /** ✅ Function to Send Messages **/
    function sendMessage() {
        if (!messageInput) return;
        const message = messageInput.value.trim();

        if (message !== "") {
            socket.emit('sendMessage', { room: currentRoom, message, user: username });

            // ✅ Remove typing notification when message is sent
            socket.emit('stopTyping', { room: currentRoom });

            messageInput.value = "";
        }
    }

    /** ✅ Function to Send Private Messages **/
    function sendPrivateMessage() {
        const toUser = document.getElementById("privateUserInput").value.trim();
        const privateMessage = messageInput.value.trim();

        if (toUser !== "" && privateMessage !== "") {
            const privateRoom = [username, toUser].sort().join("_"); // ✅ Create private room ID

            socket.emit('privateMessage', {
                from_user: username,
                to_user: toUser,
                message: privateMessage,
                room: privateRoom
            });

            messageInput.value = "";
        }
    }

    /** ✅ Function to Add Messages to the Chat Box **/
    function addMessageToChat(user, message, date_sent, isPrivate = false) {
        const chatBox = document.getElementById('chat-box');

        const messageElement = document.createElement('p');
        messageElement.innerHTML = `<strong>${isPrivate ? "[Private] " : ""}${user}:</strong> ${message} <span class="timestamp">(${formatDate(date_sent)})</span>`;

        if (isPrivate) {
            messageElement.style.color = "red";
        }

        chatBox.appendChild(messageElement);
        chatBox.scrollTop = chatBox.scrollHeight; // ✅ Auto-scroll
    }

    /** ✅ Function to Clear Chat Box **/
    function clearChatBox() {
        const chatBox = document.getElementById('chat-box');
        chatBox.innerHTML = "";
    }

    /** ✅ Listen for Received Messages **/
    socket.on('receiveMessage', (data) => {
        addMessageToChat(data.user, data.message, data.date_sent);
    });

    /** ✅ Listen for Received Private Messages **/
    socket.on('receivePrivateMessage', (data) => {
        addMessageToChat(data.from_user, data.message, data.date_sent, true);
    });

    /** ✅ Update Members List **/
    socket.on('updateMembers', (members) => {
        const membersList = document.getElementById("members-list");
        membersList.innerHTML = "";

        members.forEach(member => {
            const listItem = document.createElement("li");
            listItem.textContent = member;
            membersList.appendChild(listItem);
        });
    });

    /** ✅ Load Previous Messages When Joining a Room **/
    socket.on('loadMessages', (messages) => {
        clearChatBox();
        messages.forEach(msg => {
            addMessageToChat(msg.from_user, msg.message, msg.date_sent);
        });
    });

    /** ✅ Join Private Chat **/
    joinPrivateChatButton?.addEventListener("click", () => {
        const toUser = document.getElementById("privateUserInput").value.trim();

        if (toUser !== "" && toUser !== username) {
            const privateRoom = [username, toUser].sort().join("_");

            socket.emit('leaveRoom', { room: currentRoom, user: username });
            socket.emit('joinRoom', { room: privateRoom, user: username });

            currentRoom = privateRoom;
            document.getElementById("room-name").textContent = `Private Chat with ${toUser}`;
        }
    });

    /** ✅ Join New Room **/
    joinRoomButton?.addEventListener("click", () => {
        const newRoom = document.getElementById("roomInput").value.trim();
        if (newRoom && newRoom !== currentRoom) {
            socket.emit('leaveRoom', { room: currentRoom, user: username });
            socket.emit('joinRoom', { room: newRoom, user: username });
            currentRoom = newRoom;
            document.getElementById("room-name").textContent = newRoom;
        }
    });

    /** ✅ Leave Room **/
    leaveRoomButton?.addEventListener("click", () => {
        socket.emit('leaveRoom', { room: currentRoom, user: username });
        currentRoom = "general";
        document.getElementById("room-name").textContent = "General";
        socket.emit('joinRoom', { room: "general", user: username });
    });

    /** ✅ Logout **/
    logoutButton?.addEventListener("click", () => {
        sessionStorage.removeItem("username");
        window.location.href = "login.html";
    });

    /** ✅ Send Message on Button Click **/
    sendButton?.addEventListener("click", sendMessage);

    /** ✅ Send Private Message on Button Click **/
    document.getElementById("sendPrivateMessageButton")?.addEventListener("click", sendPrivateMessage);

    /** ✅ Typing Indicator **/
    messageInput?.addEventListener("keypress", () => {
        console.log("🚀 Typing event emitted: ", { room: currentRoom, user: username });
        socket.emit("typing", { room: currentRoom, user: username });

        clearTimeout(typingTimeout);
        typingTimeout = setTimeout(() => {
            console.log("⌛ Stopping typing event...");
            socket.emit("stopTyping", { room: currentRoom });
        }, 3000);
    });

    /** ✅ Show Typing Indicator **/
    socket.on("userTyping", (data) => {
        console.log("📥 Received typing event from:", data.user);

        const chatBox = document.getElementById("chat-box");

        let existingTypingIndicator = document.getElementById("typing-message");
        if (existingTypingIndicator) {
            existingTypingIndicator.remove();
        }

        const typingIndicator = document.createElement("p");
        typingIndicator.id = "typing-message";
        typingIndicator.style.color = "gray";
        typingIndicator.innerHTML = `<em>${data.user} is typing...</em>`;

        chatBox.appendChild(typingIndicator);
        chatBox.scrollTop = chatBox.scrollHeight;
    });

    /** ✅ Remove Typing Indicator **/
    socket.on("stopTyping", () => {
        console.log("🛑 Received stop typing event");
        const typingMsg = document.getElementById("typing-message");
        if (typingMsg) {
            typingMsg.remove();
        }
    });
});
