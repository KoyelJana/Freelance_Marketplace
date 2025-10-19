const Message = require("../../model/Message");
const User = require("../../model/User");

class MessageApiController {
  // ===============================
  // Send a new message
  // ===============================
  async sendMessage(req, res) {
    try {
      const sender = req.user || req.session.freelancer;

      if (!sender) {
        return res.status(401).json({
          success: false,
          message: "You must be logged in to send messages",
        });
      }

      const { jobId, receiverId, content } = req.body;
      if (!jobId || !receiverId || !content) {
        return res.status(400).json({
          success: false,
          message: "All fields (jobId, receiverId, content) are required",
        });
      }

      const message = await Message.create({
        jobId,
        senderId: sender._id,
        receiverId,
        message: content,
        status: "sent",
      });

      // Mark as delivered
      await Message.findByIdAndUpdate(message._id, { status: "delivered" });

      return res.status(201).json({
        success: true,
        message: "Message sent successfully",
        data: message,
      });
    } catch (err) {
      console.error("Error sending message:", err);
      return res
        .status(500)
        .json({ success: false, message: "Failed to send message" });
    }
  }

  // ===============================
  // Get conversation between two users for a job
  // ===============================
  async getConversation(req, res) {
    try {
      const currentUser = req.user || req.session.freelancer;
      if (!currentUser) {
        return res
          .status(401)
          .json({ success: false, message: "Unauthorized access" });
      }

      const { jobId, userId } = req.params;
      if (!jobId || !userId) {
        return res
          .status(400)
          .json({ success: false, message: "Missing jobId or userId" });
      }

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

      return res.status(200).json({
        success: true,
        participants: {
          currentUser: currentUser._id,
          otherUser: otherUser ? { _id: otherUser._id, name: otherUser.name } : null,
        },
        messages,
      });
    } catch (err) {
      console.error("Error fetching conversation:", err);
      return res
        .status(500)
        .json({ success: false, message: "Error fetching conversation" });
    }
  }

  // ===============================
  // Fetch chat history (via query params)
  // ===============================
  async getChatHistory(req, res) {
    try {
      const { jobId, userId, otherUserId } = req.query;
      if (!jobId || !userId || !otherUserId) {
        return res.status(400).json({
          success: false,
          message: "Missing required parameters (jobId, userId, otherUserId)",
        });
      }

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

      return res.status(200).json({ success: true, messages });
    } catch (error) {
      console.error("Error fetching chat history:", error);
      return res
        .status(500)
        .json({ success: false, message: "Server error fetching chat history" });
    }
  }

  // ===============================
  // Get all chat list for logged-in user
  // ===============================
  async getChatList(req, res) {
    try {
      const currentUser = req.user || req.session.freelancer;
      if (!currentUser || !currentUser._id) {
        return res
          .status(401)
          .json({ success: false, message: "Unauthorized access" });
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
        if (otherUser) {
          chats.push({
            user: {
              _id: otherUser._id,
              name: otherUser.name,
              email: otherUser.email,
            },
            lastMessage: chatMap[otherId],
          });
        }
      }

      return res.status(200).json({
        success: true,
        totalChats: chats.length,
        chats,
      });
    } catch (err) {
      console.error("Error loading chat list:", err);
      return res
        .status(500)
        .json({ success: false, message: "Unable to load chat list" });
    }
  }
}

module.exports = new MessageApiController();
