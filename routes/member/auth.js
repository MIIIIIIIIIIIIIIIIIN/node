// routes/member/auth.js
import express from 'express';
import bcrypt from 'bcrypt';
import memDB from './mem-db.js';

const router = express.Router();

// 註冊路由
router.post('/register', async (req, res) => {
  const { account, password, email } = req.body;

  if (!account || !password || !email) {
    return res.status(400).json({ message: '帳號、密碼和信箱為必填項目' });
  }

  try {
    // 檢查帳號是否已存在
    const [existingAccount] = await memDB.query('SELECT * FROM m_member WHERE m_account = ?', [account]);
    if (existingAccount.length > 0) {
      return res.status(409).json({ message: '該帳號已被註冊' });
    }

    // 檢查信箱是否已存在
    const [existingEmail] = await memDB.query('SELECT * FROM m_member WHERE m_email = ?', [email]);
    if (existingEmail.length > 0) {
      return res.status(409).json({ message: '該信箱已被註冊' });
    }

    // 加密密碼
    const hashedPassword = await bcrypt.hash(password, 10);

    // 將帳號、密碼和信箱存入資料庫
    const sql = 'INSERT INTO m_member (m_account, m_password, m_email) VALUES (?, ?, ?)';
    await memDB.query(sql, [account, hashedPassword, email]);

    res.status(201).json({ message: '註冊成功' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '伺服器錯誤' });
  }
});

export default router;
