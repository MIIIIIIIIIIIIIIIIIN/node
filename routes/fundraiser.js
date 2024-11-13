import express from "express";
const router = express.Router();

// 資料庫使用，使用原本的mysql2 + sql
import db from "../utils/connect-mysqls.js";
// import memDB from "./member/mem-db";


const checkMember = async (req, res, next) => {
  try {
    // 取得會員資料
    const response = await fetch('http://localhost:3005/mem-data', {
      headers: {
        'Cookie': req.headers.cookie // 轉發 cookie
      },
      credentials: 'include'
    });

    if (!response.ok) {
      return res.status(401).json({ error: '請先登入' });
    }

    const memberData = await response.json();
    
    if (!memberData.admin) {
      return res.status(401).json({ error: '請先登入' });
    }

    // 將會員資料存到 req 中供後續路由使用
    req.memberData = memberData;
    next();
  } catch (error) {
    console.error('驗證會員失敗:', error);
    res.status(500).json({ error: '伺服器錯誤' });
  }
};


// 修改路由路徑，移除 fundraiser-list
router.get("/plane/:project", async (req, res) => {
  try {
    const projectId = req.params.project;
    const sql = `SELECT * FROM f_plan WHERE f_project_list=${projectId}`;
    const [rows] = await db.query(sql);

    res.json({
      success: true,
      data: rows,
    });
  } catch (error) {
    console.error("Database query error:", error);
    res.status(500).json({
      success: false,
      error: "Database query failed",
    });
  }
});
router.get("/question/:project", async (req, res) => {
  const projectId = req.params.project;
  const sql = `SELECT * FROM f_question WHERE f_project_id=${projectId}`;
  const [rows, field] = await db.query(sql);
  // fields: 會拿到欄位相關的資訊, 通常不會用到
  res.json({ rows, field });
});
router.get("/news/:project", async (req, res) => {
  const projectId = req.params.project;
  const sql = `SELECT * FROM f_news WHERE f_project_id=${projectId}`;
  const [rows, field] = await db.query(sql);
  // fields: 會拿到欄位相關的資訊, 通常不會用到
  res.json({ rows, field });
});

router.get("/list", async (req, res) => {
  const sql = `SELECT * FROM f_project_list `;
  const [rows, field] = await db.query(sql);
  // fields: 會拿到欄位相關的資訊, 通常不會用到
  res.json({ rows, field });
});
router.get("/plane", async (req, res) => {
  const sql = `SELECT * FROM f_plan `;
  const [rows, field] = await db.query(sql);
  // fields: 會拿到欄位相關的資訊, 通常不會用到
  res.json({ rows, field });
});

router.get("/list/:project", async (req, res) => {
  const projectId = req.params.project;
  const sql = `SELECT * FROM f_project_list WHERE f_project_id=${projectId}`;
  const [rows, field] = await db.query(sql);
  // fields: 會拿到欄位相關的資訊, 通常不會用到
  res.json({ rows, field });
});

router.get("/kv/:project", async (req, res) => {
  const projectId = req.params.project;
  const sql = `SELECT * FROM f_picture WHERE f_project_id=${projectId}`;
  const [rows, field] = await db.query(sql);
  // fields: 會拿到欄位相關的資訊, 通常不會用到
  res.json({ rows, field });
});
router.get("/projectsNew", async (req, res) => {
  const sql =
    "SELECT * FROM f_project_list ORDER BY f_project_current DESC LIMIT 7";
  const [rows, field] = await db.query(sql);
  // fields: 會拿到欄位相關的資訊, 通常不會用到
  res.json({ rows, field });
});
router.get("/projectsRecommend", async (req, res) => {
  const sql = "SELECT * FROM f_project_list ";
  const [rows, field] = await db.query(sql);
  // fields: 會拿到欄位相關的資訊, 通常不會用到
  res.json({ rows, field });
});
router.get("/projectsRecommend", async (req, res) => {
  const sql =
    "SELECT * FROM f_project_list ORDER BY f_project_people DESC LIMIT 7";
  const [rows, field] = await db.query(sql);
  // fields: 會拿到欄位相關的資訊, 通常不會用到
  res.json({ rows, field });
});
router.get("/message/:project", async (req, res) => {
  const projectId = req.params.project;
  const sql = `SELECT * FROM f_message WHERE f_project_id=${projectId}`;
  const [rows, field] = await db.query(sql);
  // fields: 會拿到欄位相關的資訊, 通常不會用到
  res.json({ rows, field });
});





//收藏




router.get('/favorites/check/:projectId', checkMember, async (req, res) => {
  try {
    const { projectId } = req.params;
    const memberId = req.memberData.admin.id; // 從驗證後的會員資料取得ID

    const [rows] = await db.query(
      'SELECT * FROM m_favorite WHERE m_member_id = ? AND m_project_id = ?',
      [memberId, projectId]
    );

    res.json({ isFavorite: rows.length > 0 });
  } catch (error) {
    console.error('檢查收藏狀態失敗:', error);
    res.status(500).json({ error: '伺服器錯誤' });
  }
});
// 移除收藏
router.delete('/favorites/remove/:projectId', checkMember, async (req, res) => {
  try {
    const { projectId } = req.params;
    const memberId = req.memberData.admin.id;

    const [result] = await db.query(
      'DELETE FROM m_favorite WHERE m_member_id = ? AND m_project_id = ?',
      [memberId, projectId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: '找不到收藏記錄' });
    }

    res.json({ message: '成功移除收藏' });
  } catch (error) {
    console.error('移除收藏失敗:', error);
    res.status(500).json({ error: '伺服器錯誤' });
  }

});

// 新增收藏
router.post('/favorites/add/:projectId', checkMember, async (req, res) => {
  try {
    const { projectId } = req.params;
    const memberId = req.memberData.admin.id;

    // 檢查是否已經收藏
    const [existing] = await db.query(
      'SELECT * FROM m_favorite WHERE m_member_id = ? AND m_project_id = ?',
      [memberId, projectId]
    );

    if (existing.length > 0) {
      return res.status(400).json({ error: '已經收藏過了' });
    }

    // 新增收藏記錄
    await db.query(
      'INSERT INTO m_favorite (m_member_id, m_project_id, m_create_time) VALUES (?, ?, NOW())',
      [memberId, projectId]
    );

    res.json({ message: '收藏成功' });
  } catch (error) {
    console.error('新增收藏失敗:', error);
    res.status(500).json({ error: '伺服器錯誤' });
  }
});
// 留言
router.delete("/message/:messageId", async (req, res) => {
  try {
    const { messageId } = req.params;

    // 檢查留言是否存在
    const [checkResult] = await db.query(
      "SELECT * FROM f_message WHERE f_message_id = ?",
      [messageId]
    );

    if (checkResult.length === 0) {
      return res.status(404).json({
        status: "error",
        message: "留言不存在",
      });
    }







    // 刪除留言
    await db.query("DELETE FROM f_message WHERE f_message_id = ?", [messageId]);

    res.json({
      status: "success",
      message: "留言刪除成功",
    });
  } catch (error) {
    console.error("刪除留言錯誤:", error);
    res.status(500).json({
      status: "error",
      message: "刪除留言失敗",
      error: error.message,
    });
  }
});

router.post("/message/:projectId", async (req, res) => {
  try {
    const { projectId } = req.params;
    const { title, content, member_id } = req.body;

    // 獲取最大樓層數
    const [floorResult] = await db.query(
      "SELECT MAX(f_message_floor) as maxFloor FROM f_message WHERE f_project_id = ?",
      [projectId]
    );
    const nextFloor = (floorResult[0].maxFloor || 0) + 1;

    // 插入新留言
    const [result] = await db.query(
      `INSERT INTO f_message 
      (f_project_id, f_member_id, f_sale, f_message_floor, f_message_title, f_message_content) 
      VALUES (?, ?, 0, ?, ?, ?)`,
      [projectId, member_id, nextFloor, title, content]
    );

    res.json({
      status: "success",
      message: "留言新增成功",
      id: result.insertId,
    });
  } catch (error) {
    console.error("新增留言錯誤:", error);
    res.status(500).json({
      status: "error",
      message: "新增留言失敗",
      error: error.message,
    });
  }
});

router.put("/message/:messageId", async (req, res) => {
  try {
    const { messageId } = req.params;
    const { title, content } = req.body;

    // 檢查留言是否存在
    const [checkResult] = await db.query(
      "SELECT * FROM f_message WHERE f_message_id = ?",
      [messageId]
    );

    if (checkResult.length === 0) {
      return res.status(404).json({
        status: "error",
        message: "留言不存在",
      });
    }

    // 更新留言
    await db.query(
      `UPDATE f_message 
      SET f_message_title = ?, 
          f_message_content = ?,
          f_message_current = CURRENT_TIMESTAMP
      WHERE f_message_id = ?`,
      [title, content, messageId]
    );

    res.json({
      status: "success",
      message: "留言更新成功",
    });
  } catch (error) {
    console.error("編輯留言錯誤:", error);
    res.status(500).json({
      status: "error",
      message: "編輯留言失敗",
      error: error.message,
    });
  }
});

//專案音樂

router.get('/music/:project', async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM f_music_playlist WHERE f_project_id = ?', 
      [req.params.project]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Music not found'
      });
    }

    res.json({
      success: true,
      data: rows
    });
  } catch (error) {
    console.error('Error fetching music:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch music'
    });
  }
});

//會員名稱
router.get('/member', async (req, res) => {
 
  
  try {
    const query = `
      SELECT *
      FROM 
       m_member 
    `;
    
    const [rows] = await db.query(query);
    
    res.json({
      success: true,
      rows: rows
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch messages'
    });
  }
});
export default router;
