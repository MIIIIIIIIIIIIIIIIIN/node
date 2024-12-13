import express from "express";
import jwt from "jsonwebtoken";
import memDB from "./mem-db.js";

const router = express.Router();

// Secret key for JWT (usually stored in environment variables)
const JWT_SECRET = process.env.JWT_SECRET || "idlflnlanfladgjqao;gf;w&";

router.put("/update-gender", async (req, res) => {
  // Extract token from Authorization header
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    return res.status(401).json({ message: "請先登入" });
  }

  // Verify token format as 'Bearer <token>'
  const token = authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: "無效的 token" });
  }

  // Verify the token
  jwt.verify(token, JWT_SECRET, async (err, user) => {
    if (err) {
      return res.status(403).json({ message: "token 驗證失敗" });
    }

    // Extract nickname from request body
    const { gender } = req.body;
    const memberId = user.id; // Use user.id from the verified token

    try {
      const sql = "UPDATE m_member SET m_gender = ? WHERE m_member_id = ?";
      const [result] = await memDB.query(sql, [gender, memberId]);

      if (result.affectedRows === 1) {
        res.json({ message: "暱稱已更新" });
      } else {
        res.status(500).json({ message: "更新失敗，請稍後再試" });
      }
    } catch (error) {
      console.error("Error updating gender:", error);
      res.status(500).json({ message: "伺服器錯誤" });
    }
  });
});

export default router;
