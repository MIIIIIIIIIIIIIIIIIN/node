import express from "express";
import bcrypt from "bcrypt";
import memDB from "./mem-db.js";

const app = express();
const PORT = 3005;

// 使用 JSON 中介軟體解析請求體
app.use(express.json());

// 註冊路由
app.post("/register", async (req, res) => {
  const { account, password, email } = req.body;

  try {
    // 檢查是否有相同用戶名或電子郵件的用戶
    const [existingUser] = await memDB.query(
      "SELECT * FROM m_member WHERE m_account = ? OR m_email = ?",
      [account, email]
    );

    if (existingUser.length > 0) {
      return res.status(400).json({ message: "用戶名或電子郵件已存在" });
    }

    // 加密密碼
    const hashedPassword = await bcrypt.hash(password, 10);

    // 插入新用戶數據
    await memDB.query(
      "INSERT INTO m_member (m_account, m_password, m_email) VALUES (?, ?, ?)",
      [account, hashedPassword, email]
    );

    res.status(201).json({ message: "註冊成功" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "註冊失敗，請稍後再試" });
  }
});

// 獲取會員資料的路由
app.get("/mem-data/:memberId", async (req, res) => {
  const { memberId } = req.params;

  try {
    const [data] = await memDB.query(
      "SELECT * FROM m_member WHERE m_member_id = ?",
      [memberId]
    );

    if (data.length > 0) {
      res.json({ success: true, ...data[0] });
    } else {
      res.status(404).json({ message: "會員資料不存在" });
    }
  } catch (error) {
    console.error("取得會員資料失敗:", error);
    res.status(500).json({ message: "取得會員資料失敗" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
