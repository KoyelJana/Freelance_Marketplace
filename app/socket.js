// socket.js
const MessageModel = require("./model/Message");

function initSocket(io) {
  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.on("joinRoom", ({ jobId, userId }) => {
      socket.join(jobId);
      socket.userId = userId;
      console.log(`User ${userId} joined job room ${jobId}`);
    });

    // Send message
    socket.on("sendMessage", async ({ jobId, senderId, receiverId, message }) => {
      try {
        const newMsg = await MessageModel.create({
          jobId,
          senderId,
          receiverId,
          message,
          status: "sent",
        });

        // Mark as delivered immediately
        newMsg.status = "delivered";
        await newMsg.save();

        io.to(jobId).emit("receiveMessage", newMsg);
      } catch (err) {
        console.error(err);
      }
    });

    // Mark messages as seen
    socket.on("markSeen", async ({ jobId, userId }) => {
      try {
        await MessageModel.updateMany(
          { jobId, receiverId: userId, status: { $ne: "seen" } },
          { $set: { status: "seen" } }
        );

        // Notify everyone in the room
        io.to(jobId).emit("messagesSeen", { userId });
      } catch (err) {
        console.error(err);
      }
    });

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
    });
  });
}

module.exports = initSocket;
