// middleware/clientAuth.js
const jwt = require("jsonwebtoken");
const UserModel = require("../model/User");

const clientAuth = async (req, res, next) => {
  try {
    const token = req.cookies.clientToken;
    if (!token) {
      return res.redirect("/client/login");
    }

    // verify token
    const decoded = jwt.verify(token, "clientlogineuieioewhre");

    // fetch user from DB (to get latest info)
    const user = await UserModel.findById(decoded._id);
    if (!user) {
      return res.redirect("/client/login");
    }

    // attach user to request
    req.user = user;
    next();
  } catch (err) {
    console.error("ClientAuth Error:", err);
    res.redirect("/client/login");
  }
};

module.exports = clientAuth;
