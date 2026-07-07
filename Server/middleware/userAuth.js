import jwt from "jsonwebtoken";

const userAuth = async (req, res, next) => {
  // Support both cookie (web) and Bearer token (mobile)
  const token = req.cookies?.token || req.headers?.authorization?.split(" ")[1];

  if (!token) {
    return res.json({ success: false, message: 'Not Authorized. Please Login Again.' });
  }
  try {
    const tokenDecode = jwt.verify(token, process.env.JWT_SECRET);
    if (tokenDecode.id) {
      req.body.userId = tokenDecode.id;
    } else {
      return res.json({ success: false, message: "Not Authorized. Please Login Again." });
    }
    next();
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

export default userAuth;
