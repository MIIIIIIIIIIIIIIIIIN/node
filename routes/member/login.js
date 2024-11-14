// routes/member/login.js
import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import upload from "../../utils/upload-imgs.js"; // 根據實際位置調整
import memDB from "./mem-db.js"; // 引入資料庫連接

const router = express.Router();

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
    return res.json(output);
  }

  // 支援帳號或信箱登入
  const sql = `SELECT * FROM m_member WHERE m_account=? OR m_email=?`;
  const [rows] = await memDB.query(sql, [email, email]);
  if (!rows.length) {
    output.code = 400;
    output.error = "帳號或密碼錯誤";
    return res.json(output);
  }

  const row = rows[0];
  
  // 使用 bcrypt.compare 比較密碼
  const isPasswordCorrect = await bcrypt.compare(password, row.m_password);

  if (!isPasswordCorrect) {
    output.code = 450;
    output.error = "帳號或密碼錯誤";
    return res.json(output);
  }

  // 將登入成功的會員資料儲存到 session
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
  };
  output.success = true;
  res.json(output);
});

export default router;
