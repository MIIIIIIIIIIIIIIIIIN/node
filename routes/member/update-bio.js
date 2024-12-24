import express from "express";
import jwt from "jsonwebtoken";
import memDB from "./mem-db.js";

const router = express.Router();

// Secret key for JWT (通常儲存在環境變數中)
const JWT_SECRET = process.env.JWT_SECRET || "idlflnlanfladgjqao;gf;w&";

router.put("/update-bio", async (req, res) => {
  // 從 Authorization header 中提取 token
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    return res.status(401).json({ message: "請先登入" });
  }

  // 確認 token 格式為 'Bearer <token>'
  const token = authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: "無效的 token" });
  }

  // 驗證 token
  jwt.verify(token, JWT_SECRET, async (err, user) => {
    if (err) {
      return res.status(403).json({ message: "token 驗證失敗" });
    }

    // 從請求的 body 中獲取 bio
    const { bio } = req.body;
    const memberId = user.id; // 使用驗證後的 user.id

    try {
      const sql = "UPDATE m_member SET m_bio = ? WHERE m_member_id = ?";
      const [result] = await memDB.query(sql, [bio, memberId]);

      if (result.affectedRows === 1) {
        res.json({ message: "簡介已更新" });
      } else {
        res.status(500).json({ message: "更新失敗，請稍後再試" });
      }
    } catch (error) {
      console.error("Error updating bio:", error);
      res.status(500).json({ message: "伺服器錯誤" });
    }
  });
});

export default router;
