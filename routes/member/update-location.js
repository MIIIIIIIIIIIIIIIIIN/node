import express from "express";
import memDB from "./mem-db.js"; // 引入資料庫連線

const router = express.Router();

router.put("/update-location", async (req, res) => {
  console.log("Received request to update location"); // 確認是否收到請求
  try {
    const { county, district } = req.body; // 從請求中取得縣市和行政區
    const memberId = req.session.admin?.id; // 從 session 中取得用戶 ID

    if (!memberId) {
      // 如果用戶尚未登入
      return res.status(401).json({ message: "未登入" });
    }

    // 檢查 county 和 district 是否有效
    if (!county || !district) {
      return res.status(400).json({ message: "縣市和行政區不能為空" });
    }

    // 執行 SQL 更新，將 location 和 district 一起更新
    const [result] = await memDB.query(
      "UPDATE m_member SET m_location = ?, m_district = ? WHERE m_member_id = ?",
      [county, district, memberId]
    );

    if (result.affectedRows > 0) {
      // 更新 session 中的 location 和 district
      req.session.admin.location = county;
      req.session.admin.district = district;

      res.json({ message: "所在地更新成功", county, district });
    } else {
      res.status(404).json({ message: "用戶不存在" });
    }
  } catch (error) {
    console.error("Error updating location:", error);
    res.status(500).json({ message: "更新所在地失敗，請重試" });
  }
});

export default router;