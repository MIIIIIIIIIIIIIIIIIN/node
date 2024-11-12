import express from "express";
import memDB from "./mem-db.js";

const router = express.Router();

router.put("/update-nickname", async (req, res) => {
  const memberId = req.session.admin?.id;
  const { nickname } = req.body;

  if (!memberId) {
    return res.status(401).json({ message: "請先登入" });
  }

  try {
    const sql = "UPDATE m_member SET nickname = ? WHERE m_member_id = ?";
    const [result] = await memDB.query(sql, [nickname, memberId]);

    if (result.affectedRows === 1) {
      res.json({ message: "暱稱已更新" });
    } else {
      res.status(500).json({ message: "更新失敗，請稍後再試" });
    }
  } catch (error) {
    console.error("Error updating nickname:", error);
    res.status(500).json({ message: "伺服器錯誤" });
  }
});

export default router;
