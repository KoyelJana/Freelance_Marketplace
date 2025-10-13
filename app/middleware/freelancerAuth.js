const jwt = require('jsonwebtoken');

const freelancerAuth = (req, res, next) => {
  try {
    const token = req.cookies?.FreelancerToken;

    if (!token) {
      req.flash("message", "You need to login first!!");
      return res.redirect("/login");
    }

    jwt.verify(token, process.env.JWT_TOKEN_SECRET_KEY, (err, decoded) => {
      if (err) {
        console.error("JWT verify error:", err.message);
        req.flash("message", "Session expired, please log in again!");
        return res.redirect("/login");
      }

      // ✅ Attach user data consistently
      req.freelancer = decoded;
      req.freelancer = decoded;
      req.session.freelancer = decoded;

      console.log("Freelancer data:", decoded);

      next();
    });

  } catch (error) {
    console.error("Auth error:", error);
    req.flash("message", "Something went wrong. Please log in again.");
    res.redirect("/login");
  }
};

module.exports = freelancerAuth;
