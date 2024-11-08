const connectedUsers = new Map();
const messageHistory = [];
const MAX_HISTORY = 100;

const chatController = (io) => {
  io.on("connection", (socket) => {
    console.log("A user connected:", socket.id);

    // Send message history to newly connected user
    socket.emit("message_history", messageHistory);

    // Handle user joining
    socket.on("user_join", (userData) => {
      connectedUsers.set(socket.id, userData);

      const joinMessage = {
        type: "system",
        text: `${userData.nickname} has joined the chat`,
        timestamp: new Date().toISOString(),
      };

      messageHistory.push(joinMessage);
      io.emit("receive_message", joinMessage);
    });

    // Handle messages
    socket.on("send_message", (data) => {
      const messageWithTimestamp = {
        ...data,
        type: "user",
        serverTimestamp: new Date().toISOString(),
      };

      messageHistory.push(messageWithTimestamp);

      if (messageHistory.length > MAX_HISTORY) {
        messageHistory.shift();
      }

      io.emit("receive_message", messageWithTimestamp);
    });

    // Handle disconnection
    socket.on("disconnect", () => {
      const userData = connectedUsers.get(socket.id);
      if (userData) {
        const leaveMessage = {
          type: "system",
          text: `${userData.nickname} has left the chat`,
          timestamp: new Date().toISOString(),
        };

        messageHistory.push(leaveMessage);
        io.emit("receive_message", leaveMessage);
        connectedUsers.delete(socket.id);
      }
      console.log("User disconnected:", socket.id);
    });
  });
};

export default chatController;
