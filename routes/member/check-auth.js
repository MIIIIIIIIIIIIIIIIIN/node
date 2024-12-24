import express from "express";
const router = express.Router();

router.get("/check-auth", (req, res) => {
  if (req.session && req.session.adminId) {
    res.json({ isLoggedIn: true });
  } else {
    res.json({ isLoggedIn: false });
  }
});

export default router;