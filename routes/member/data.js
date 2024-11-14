import express from 'express';
import memDB from './mem-db.js';

const router = express.Router();
router.get("/mem-data", async (req, res) => {
  try {
    const [data] = await memDB.query(
      "SELECT m_nickname, m_birth, m_location, m_district, m_bio FROM m_member"
    );

    console.log("Query Result:", data); // 測試輸出

    res.json(data); // 返回所有會員的公開資料
  } catch (error) {
    console.error("取得會員資料失敗:", error);
    res.status(500).json({ message: "取得會員資料失敗" });
  }
});


export default router;
