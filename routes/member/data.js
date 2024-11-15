import express from 'express';
import memDB from './mem-db.js';

const router = express.Router();

// 使用動態路由來接收 memberId
router.get("/mem-data/:memberId", async (req, res) => {
  const { memberId } = req.params; // 從路徑參數中獲取 memberId
  try {
    const [data] = await memDB.query(
      "SELECT m_nickname, m_birth, m_gender, m_location, m_bio, m_district, m_icon FROM m_member WHERE m_member_id = ?",
      [memberId]
    );

    if (data.length > 0) {
      res.json(data[0]); // 返回會員資料
    } else {
      res.status(404).json({ message: "會員資料不存在" });
    }
  } catch (error) {
    console.error("取得會員資料失敗:", error);
    res.status(500).json({ message: "取得會員資料失敗" });
  }
});

export default router;
