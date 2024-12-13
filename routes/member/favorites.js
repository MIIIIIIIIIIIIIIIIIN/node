import express from 'express';
const router = express.Router();
import memDB from "./mem-db.js";

// 取得會員的所有收藏項目
router.get("/", async (req, res) => {
  const memberId = req.session.adminId;
  if (!memberId) return res.status(401).json({ message: "未登入" });

  try {
    const [favorites] = await memDB.query(
      "SELECT * FROM m_favorite WHERE m_member_id = ?",
      [memberId]
    );
    res.json(favorites);
  } catch (error) {
    console.error("取得收藏失敗", error);
    res.status(500).json({ message: "取得收藏失敗" });
  }
});

// 添加新收藏項目
router.post("/", async (req, res) => {
  const memberId = req.session.adminId;
  const { m_product_id, m_product_name, m_genre, m_image } = req.body;

  if (!memberId) return res.status(401).json({ message: "未登入" });

  try {
    await memDB.query(
      "INSERT INTO m_favorite (m_member_id, m_product_id, m_product_name, m_genre, m_image) VALUES (?, ?, ?, ?, ?)",
      [memberId, m_product_id, m_product_name, m_genre, m_image]
    );
    res.status(201).json({ message: "收藏已添加" });
  } catch (error) {
    console.error("添加收藏失敗", error);
    res.status(500).json({ message: "添加收藏失敗" });
  }
});

// 刪除收藏項目
router.delete("/:id", async (req, res) => {
  const memberId = req.session.adminId;
  const favoriteId = req.params.id;

  if (!memberId) return res.status(401).json({ message: "未登入" });

  try {
    await memDB.query(
      "DELETE FROM m_favorite WHERE m_favorite_id = ? AND m_member_id = ?",
      [favoriteId, memberId]
    );
    res.status(200).json({ message: "收藏已刪除" });
  } catch (error) {
    console.error("刪除收藏失敗", error);
    res.status(500).json({ message: "刪除收藏失敗" });
  }
});

export default router;
