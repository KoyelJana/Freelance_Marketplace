const Message = require("../model/Message");
const User = require("../model/User");

class MessageController {
  // Send a message
  async sendMessage(req, res) {
    try {
      const sender = req.user || req.session.freelancer;

      if (!sender) {
        req.flash("message", "You must be logged in to send messages");
        return res.redirect("/login");
      }

      const { jobId, receiverId, content } = req.body;
      if (!jobId || !receiverId || !content) {
        return res.status(400).json({ success: false, error: "All fields are required" });
      }

      const message = await Message.create({
        jobId,
        senderId: sender._id,
        receiverId,
        message: content,
      });

      // Mark as delivered immediately (optional)
      await Message.findByIdAndUpdate(message._id, { status: "delivered" });

      res.status(200).json({ success: true, message });
    } catch (err) {
      console.error("Error sending message:", err);
      res.status(500).json({ success: false, error: "Failed to send message" });
    }
  }

  // Get conversation between two users for a job
  async getConversation(req, res) {
    try {
      const currentUser = req.user || req.session.freelancer;

      if (!currentUser) {
        req.flash("message", "Unauthorized access. Please login.");
        return res.redirect("/login");
      }

      const { jobId, userId } = req.params;
      if (!jobId || !userId) return res.status(400).send("Missing job or user ID");

      const messages = await Message.find({
        jobId,
        $or: [
          { senderId: currentUser._id, receiverId: userId },
          { senderId: userId, receiverId: currentUser._id },
        ],
      }).sort({ createdAt: 1 });

      // Mark unseen messages as seen
      await Message.updateMany(
        { jobId, receiverId: currentUser._id, status: { $ne: "seen" } },
        { $set: { status: "seen" } }
      );

      const otherUser = await User.findById(userId);

      res.render("messages/conversation", {
        title: otherUser ? `Chat with ${otherUser.name}` : "Conversation",
        messages,
        jobId,
        otherUser,
        user: currentUser,
        message: req.flash("message"),
      });
    } catch (err) {
      console.error("Error fetching conversation:", err);
      res.status(500).send("Error fetching conversation");
    }
  }

  // Fetch chat history for a specific job (API)
  async getChatHistory(req, res) {
    try {
      const { jobId, userId, otherUserId } = req.query;
      if (!jobId || !userId || !otherUserId)
        return res.status(400).json({ message: "Missing required parameters" });

      const messages = await Message.find({
        jobId,
        $or: [
          { senderId: userId, receiverId: otherUserId },
          { senderId: otherUserId, receiverId: userId },
        ],
      }).sort({ createdAt: 1 });

      // Mark unseen messages as seen
      await Message.updateMany(
        { jobId, receiverId: userId, status: { $ne: "seen" } },
        { $set: { status: "seen" } }
      );

      res.json(messages);
    } catch (error) {
      console.error("Error fetching chat history:", error);
      res.status(500).json({ message: "Server Error" });
    }
  }

  // Get all chats for dashboard view
  async getChatList(req, res) {
    try {
      const currentUser = req.user || req.session.freelancer;

      if (!currentUser || !currentUser._id) {
        req.flash("message", "You must be logged in to view chats");
        return res.redirect("/login");
      }

      const userId = currentUser._id;
      const messages = await Message.find({
        $or: [{ senderId: userId }, { receiverId: userId }],
      }).sort({ createdAt: -1 });

      const chatMap = {};
      messages.forEach((msg) => {
        const otherId = msg.senderId.equals(userId)
          ? msg.receiverId.toString()
          : msg.senderId.toString();
        if (!chatMap[otherId]) chatMap[otherId] = msg;
      });

      const chats = [];
      for (const otherId in chatMap) {
        const otherUser = await User.findById(otherId);
        if (otherUser) chats.push({ otherUser, lastMessage: chatMap[otherId] });
      }

      const viewPath =
        currentUser.role === "client"
          ? "client/chats"
          : "frontend/chats";

      res.render(viewPath, {
        title: "Chats",
        chats,
        user: currentUser,
        activePage: "chats",
        message: req.flash("message"),
      });
    } catch (err) {
      console.error("Error loading chat list:", err);
      req.flash("message", "Unable to load chats");
      res.redirect("/");
    }
  }
}

module.exports = new MessageController();
