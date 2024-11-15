// routes/member/login.js
import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import upload from "../../utils/upload-imgs.js";
import memDB from "./mem-db.js";
import dotenv from "dotenv";

dotenv.config({ path: "./dev.env" }); // 指定載入 dev.env 檔案

const router = express.Router();
const JWT_SECRET_KEY = process.env.JWT_KEY; // 從 dev.env 中讀取 JWT_KEY

router.post("/login", upload.none(), async (req, res) => {
  const output = {
    success: false,
    code: 0,
    error: "",
  };

  let { email, password } = req.body;
  email = email ? email.trim() : "";
  password = password ? password.trim() : "";

  if (!email || !password) {
    output.code = 400;
    output.error = "請提供有效的帳號和密碼";
    return res.json(output);
  }

  // 支援帳號或信箱登入
  const sql = `SELECT * FROM m_member WHERE m_account=? OR m_email=?`;
  const [rows] = await memDB.query(sql, [email, email]);
  if (!rows.length) {
    output.code = 401;
    output.error = "帳號或密碼錯誤";
    return res.json(output);
  }

  const row = rows[0];

  // 使用 bcrypt.compare 比較密碼
  const isPasswordCorrect = await bcrypt.compare(password, row.m_password);

  if (!isPasswordCorrect) {
    output.code = 403;
    output.error = "帳號或密碼錯誤";
    return res.json(output);
  }

  // 成功登入後，生成 JWT token
  const token = jwt.sign(
    {
      id: row.m_member_id,
      account: row.m_account,
      email: row.m_email,
    },
    JWT_SECRET_KEY, // 使用從 dev.env 中讀取的密鑰
    { expiresIn: "1h" }
  );

  req.session.admin = {
    id: row.m_member_id,
    account: row.m_account,
    nickname: row.m_nickname,
    email: row.m_email,
    birth: row.m_birth,
    gender: row.m_gender,
    location: row.m_location,
    phone: row.m_phone,
    icon: row.m_icon,
    bio: row.m_bio,
    district: row.m_district,
  };

  output.success = true;
  output.data = {
    id: row.m_member_id, // 確保 id 被包含在回傳的資料中
    token: token,
    nickname: row.m_nickname,
    email: row.m_email,
  };

  res.json(output);
});

export default router;
