// routes/member/data.js
import express from 'express';
import memDB from '../member/mem-db.js';

const router = express.Router();

// 定義 `/mem-data/:memberId` 路由，用於獲取特定會員的資料
router.get("/mem-data/:memberId", async (req, res) => {
  const { memberId } = req.params; // 獲取 URL 中的 `memberId`

  try {
    // 從資料庫中查詢會員資料
    const [data] = await memDB.query(
      "SELECT * FROM m_member WHERE m_member_id = ?",
      [memberId]
    );

    // 如果找到資料，返回成功訊息
    if (data.length > 0) {
      res.json({ success: true, ...data[0] });
    } else {
      // 如果找不到資料，返回 404 錯誤
      res.status(404).json({ message: "會員資料不存在" });
    }
  } catch (error) {
    console.error("取得會員資料失敗:", error);
    res.status(500).json({ message: "取得會員資料失敗" });
  }
});

export default router;
