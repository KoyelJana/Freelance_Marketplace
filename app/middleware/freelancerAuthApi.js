const jwt = require("jsonwebtoken");

const freelancerAuthApi = (req, res, next) => {
  try {
    // ✅ Extract token from "Authorization" header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Access denied. No token provided.",
      });
    }

    const token = authHeader.split(" ")[1];

    // ✅ Verify token
    jwt.verify(token, process.env.JWT_TOKEN_SECRET_KEY, (err, decoded) => {
      if (err) {
        return res.status(401).json({
          success: false,
          message: "Invalid or expired token.",
        });
      }

      // ✅ Attach decoded freelancer data to request
      req.freelancer = decoded;
      req.freelancer = decoded;
      req.session.freelancer = decoded;

      next();
    });

  } catch (error) {
    console.error("Freelancer API Auth Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during authentication.",
    });
  }
};

module.exports = freelancerAuthApi;
