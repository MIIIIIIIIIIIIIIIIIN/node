// routes/member/auth.js
import express from 'express';
import bcrypt from 'bcrypt';
import memDB from './mem-db.js';

const router = express.Router();

// 檢查登入狀態 API
router.get('/check-login', (req, res) => {
  if (req.session && req.session.admin) {
    // 使用者已登入
    res.json({ loggedIn: true, admin: req.session.admin });
  } else {
    // 使用者未登入
    res.json({ loggedIn: false });
  }
});

// 註冊路由
router.post('/register', async (req, res) => {
  const { name, gender, birth, nickname, account, password, email, location, district } = req.body;

  if (!nickname || !birth || !account || !password || !email) {
    return res.status(400).json({ message: '暱稱、生日、帳號、密碼和信箱為必填項目' });
  }

  try {
    const [existingAccount] = await memDB.query('SELECT * FROM m_member WHERE m_account = ?', [account]);
    if (existingAccount.length > 0) {
      return res.status(409).json({ message: '該帳號已被註冊' });
    }

    const [existingEmail] = await memDB.query('SELECT * FROM m_member WHERE m_email = ?', [email]);
    if (existingEmail.length > 0) {
      return res.status(409).json({ message: '該信箱已被註冊' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const sql = 'INSERT INTO m_member (m_name, m_gender, m_birth, m_nickname, m_account, m_password, m_email, m_location, m_district) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)';
    await memDB.query(sql, [name, gender, birth, nickname, account, hashedPassword, email, location, district]);

    res.status(201).json({ message: '註冊成功', memberId: account });
  } catch (error) {
    console.error("註冊時發生錯誤：", error);
    res.status(500).json({ message: '伺服器錯誤' });
  }
});

router.get('/mem-data/:account', async (req, res) => {
  const { account } = req.params;
  try {
    const query = 'SELECT * FROM m_member WHERE m_account = ?';
    const [member] = await memDB.query(query, [account]);

    if (member.length === 0) {
      return res.status(404).json({ message: '會員資料不存在' });
    }

    res.status(200).json({ success: true, memberData: member[0] });
  } catch (error) {
    console.error("查詢會員資料時發生錯誤：", error);
    res.status(500).json({ message: '伺服器錯誤' });
  }
});

// 根據 id 查詢會員資料
router.get('/mem-data/by-id/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const query = 'SELECT * FROM m_member WHERE m_member_id = ?';
    const [member] = await memDB.query(query, [id]);

    if (member.length === 0) {
      return res.status(404).json({ message: '會員資料不存在' });
    }

    res.status(200).json({ success: true, memberData: member[0] });
  } catch (error) {
    console.error("查詢會員資料時發生錯誤：", error);
    res.status(500).json({ message: '伺服器錯誤' });
  }
});

export default router;
