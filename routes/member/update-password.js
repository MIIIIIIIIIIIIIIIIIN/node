import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import memDB from "./mem-db.js";

const router = express.Router();
const JWT_KEY = process.env.JWT_KEY || "idlflnlanfladgjqao;gf;w&";

router.put("/update-password", async (req, res) => {
  console.log("密碼更新路由被調用");

  const authHeader = req.headers["authorization"];
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.log("授權標頭缺失或格式不正確");
      return res.status(401).json({ message: "請先登入" });
  }

  const token = authHeader.split(" ")[1];
  try {
      const user = jwt.verify(token, JWT_KEY);
      console.log("解碼的用戶信息:", user);

      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
          console.log("密碼欄位缺失");
          return res.status(400).json({ message: "請提供當前密碼和新密碼" });
      }

      const memberId = user.id;
      console.log("正在查詢資料庫，用戶 ID:", memberId);

      const [rows] = await memDB.query(
          "SELECT m_password FROM m_member WHERE m_member_id = ?",
          [memberId]
      );
      console.log("資料庫查詢結果:", rows);

      if (!rows || rows.length === 0) {
          console.log("用戶不存在，會員 ID:", memberId);
          return res.status(400).json({ message: "用戶不存在" });
      }

      const userRecord = rows[0];

      // 密碼比對
      const passwordMatch = await bcrypt.compare(currentPassword, userRecord.m_password);
      console.log("密碼比對結果:", passwordMatch);

      if (!passwordMatch) {
          console.log("當前密碼不正確，會員 ID:", memberId);
          return res.status(400).json({ message: "當前密碼不正確" });
      }

      // 更新密碼
      const hashedPassword = await bcrypt.hash(newPassword, 12);
      const [result] = await memDB.query(
          "UPDATE m_member SET m_password = ? WHERE m_member_id = ?",
          [hashedPassword, memberId]
      );

      if (result.affectedRows === 1) {
          console.log("密碼更新成功，會員 ID:", memberId);
          return res.json({ message: "密碼更新成功" });
      } else {
          console.error("密碼更新失敗，資料庫未更新，會員 ID:", memberId);
          return res.status(500).json({ message: "更新失敗，請稍後再試" });
      }
  } catch (err) {
      if (err.name === "JsonWebTokenError") {
          console.error("Token 驗證失敗:", err);
          return res.status(403).json({ message: "Token 驗證失敗" });
      } else if (err.name === "TokenExpiredError") {
          console.error("Token 已過期:", err);
          return res.status(403).json({ message: "Token 已過期" });
      } else {
          console.error("伺服器錯誤:", err);
          return res.status(500).json({ message: "伺服器錯誤，請稍後再試" });
      }
  }
});


export default router;
