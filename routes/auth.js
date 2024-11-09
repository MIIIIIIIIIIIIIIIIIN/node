// routes/auth.js 
import express from 'express';
import bcrypt from 'bcrypt';
import memDB from './member/mem-db';

const router = express.Router();

// 註冊路由
router.post('/auth/register', async (req, res) => {
  const { account, password } = req.body;

  if (!account || !password) {
    return res.status(400).json({ message: '帳號和密碼為必填項目' });
  }

  try {
    // 檢查帳號是否已存在
    const [existingUser] = await db.query('SELECT * FROM m_member WHERE m_account = ?', [account]);
    if (existingUser.length > 0) {
      return res.status(409).json({ message: '該帳號已存在' });
    }

    // 加密密碼
    const hashedPassword = await bcrypt.hash(password, 10);

    // 將帳號和加密密碼存入資料庫
    const sql = 'INSERT INTO m_member (m_account, m_password) VALUES (?, ?)';
    await db.query(sql, [account, hashedPassword]);

    res.status(201).json({ message: '註冊成功' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '伺服器錯誤' });
  }
});

export default router;
