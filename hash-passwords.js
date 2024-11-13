// hash-passwords.js
import bcrypt from 'bcrypt';
import memDB from './routes/member/mem-db.js'; // 根據你的專案結構修改路徑

async function hashAllPasswords() {
  try {
    // 1. 查詢所有會員的 ID 和未雜湊的密碼
    const [rows] = await memDB.query("SELECT m_member_id, m_password FROM m_member");

    for (const row of rows) {
      // 2. 檢查是否需要加密 (假設未加密的密碼都是簡單文本，可以根據長度判斷)
      if (row.m_password && row.m_password.length < 60) { // bcrypt 雜湊通常超過 60 字符
        // 3. 使用 bcrypt 加密密碼
        const hashedPassword = await bcrypt.hash(row.m_password, 10);

        // 4. 更新資料庫中的密碼
        await memDB.query(
          "UPDATE m_member SET m_password = ? WHERE m_member_id = ?",
          [hashedPassword, row.m_member_id]
        );

        console.log(`Password for member ID ${row.m_member_id} has been hashed and updated.`);
      }
    }

    console.log("All passwords have been hashed successfully.");
  } catch (error) {
    console.error("Error hashing passwords:", error);
  }
}

// 執行批次更新
hashAllPasswords();
