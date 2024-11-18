import express from "express";
import bcrypt from "bcrypt";
import memDB from "./mem-db.js"; // 假設這是資料庫連線

const router = express.Router();

router.put("/update-password", async (req, res) => {
  console.log("Received body:", req.body);

  const { currentPassword, newPassword } = req.body;
  const memberId = req.session.admin?.id;

  if (!memberId) {
    return res.status(401).json({ message: "未登入" });
  }

  try {
    // 獲取當前使用者的密碼
    const [user] = await memDB.query("SELECT m_password FROM m_member WHERE m_member_id = ?", [memberId]);

    if (!user.length || !(await bcrypt.compare(currentPassword, user[0].m_password))) {
      return res.status(400).json({ message: "當前密碼不正確" });
    }

    // 將新密碼雜湊並更新到資料庫
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await memDB.query("UPDATE m_member SET m_password = ? WHERE m_member_id = ?", [hashedPassword, memberId]);

    res.json({ message: "密碼更新成功" });
  } catch (error) {
    console.error("Error updating password:", error);
    res.status(500).json({ message: "系統錯誤，請稍後再試" });
  }
});

export default router;
