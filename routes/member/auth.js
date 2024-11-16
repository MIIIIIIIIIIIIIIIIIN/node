// routes/member/auth.js
import express from 'express';
import bcrypt from 'bcrypt';
import memDB from './mem-db.js';

const router = express.Router();

// 註冊路由
router.post('/register', async (req, res) => {
  const { name, gender, birth, nickname, account, password, email, location, district } = req.body;

  // 輸出接收到的請求資料，方便排查問題
  console.log("註冊請求資料：", req.body);

  // 檢查必填項目
  if (!nickname || !birth || !account || !password || !email) {
    return res.status(400).json({ message: '暱稱、生日、帳號、密碼和信箱為必填項目' });
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

    // 將暱稱、帳號、密碼、信箱和所在地存入資料庫
    const sql = 'INSERT INTO m_member (m_name, m_gender, m_birth, m_nickname, m_account, m_password, m_email, m_location, m_district) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)';
    await memDB.query(sql, [name, gender, birth, nickname, account, hashedPassword, email, location, district]);

    res.status(201).json({ message: '註冊成功', memberId: account }); // 假設 memberId 是 account，否則更改成資料庫生成的 ID
  } catch (error) {
    console.error("註冊時發生錯誤：", error);
    res.status(500).json({ message: '伺服器錯誤' });
  }
});

// 查詢會員資料 API
router.get('/mem-data/:account', async (req, res) => {
  const { account } = req.params;

  console.log("Received account:", account); // 檢查是否有正確接收到 account 值

  try {
    const query = 'SELECT * FROM m_member WHERE m_account = ?';
    console.log("Executing query:", query, "with account:", account);
    const [member] = await memDB.query(query, [account]);

    console.log("Query result:", member);

    if (member.length === 0) {
      console.warn("No member found with account:", account);
      return res.status(404).json({ message: '會員資料不存在' });
    }

    res.status(200).json({ success: true, memberData: member[0] });
  } catch (error) {
    console.error("查詢會員資料時發生錯誤：", error);
    res.status(500).json({ message: '伺服器錯誤' });
  }
});

export default router;
