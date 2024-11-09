// routes/member/update-info.js
import express from "express";
import memDB from "../utils/mem-db.js";

const router = express.Router();

// 更新暱稱路由
router.post("/nickname", async (req, res) => { // 確保使用 POST 而不是 PUT
  console.log("收到 /nickname 的 POST 請求");
  const { nickname } = req.body;
  const memberId = req.session.admin?.id;

  if (!memberId) return res.status(401).json({ success: false, message: "未登入" });

  try {
    const sql = `UPDATE m_member SET m_nickname = ? WHERE m_member_id = ?`;
    const [result] = await memDB.query(sql, [nickname, memberId]);
    res.json({ success: result.affectedRows > 0, message: result.affectedRows > 0 ? "暱稱更新成功" : "暱稱更新失敗" });
  } catch (error) {
    console.error("Error updating nickname:", error);
    res.status(500).json({ success: false, message: "伺服器錯誤" });
  }
});

export default router;
