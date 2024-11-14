import express from "express";
import memDB from "./mem-db.js"; // 引入資料庫連線

const router = express.Router();

router.put("/update-gender", async (req, res) => {
  console.log("Received request to update gender"); // 確認是否收到請求
  try {
    const { gender } = req.body; // 從請求的資料中取得 gender
    const memberId = req.session.admin?.id; // 從 session 中取得用戶 ID

    if (!memberId) {
      // 如果用戶尚未登入
      return res.status(401).json({ message: "未登入" });
    }

    // 檢查 gender 是否有效
    if (!["男", "女", "不透露"].includes(gender)) {
      return res.status(400).json({ message: "性別格式錯誤" });
    }

    // 執行 SQL 更新
    const [result] = await memDB.query(
      "UPDATE m_member SET m_gender = ? WHERE m_member_id = ?",
      [gender, memberId]
    );

    if (result.affectedRows > 0) {
      req.session.admin.gender = gender;

      res.json({ message: "性別更新成功", gender });
    } else {
      res.status(404).json({ message: "用戶不存在" });
    }
  } catch (error) {
    console.error("Error updating gender:", error);
    res.status(500).json({ message: "更新性別失敗，請重試" });
  }
});

export default router;
