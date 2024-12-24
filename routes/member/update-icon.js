import express from 'express';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import memDB from './mem-db.js'; // 確認 mem-db.js 的路徑是否正確
import upload from '../../utils/member/upload-icons.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "idlflnlanfladgjqao;gf;w&";

// 圖片更新路由
router.post('/update-icon', upload.single('icon'), async (req, res) => {
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

    const memberId = user.id; // Use user.id from the verified token

    if (!req.file) {
      return res.status(400).json({ message: "未選擇圖片檔案" });
    }

    const filePath = `/uploads/mem-icons/${req.file.filename}`;

    try {
      const sql = "UPDATE m_member SET m_icon = ? WHERE m_member_id = ?";
      const [result] = await memDB.query(sql, [filePath, memberId]);

      if (result.affectedRows === 1) {
        res.json({ message: "圖片已更新", icon: filePath });
      } else {
        res.status(500).json({ message: "更新圖片失敗，請稍後再試" });
      }
    } catch (error) {
      console.error("Error updating icon:", error);
      res.status(500).json({ message: "伺服器錯誤，無法更新圖片" });
    }
  });
});

export default router;
