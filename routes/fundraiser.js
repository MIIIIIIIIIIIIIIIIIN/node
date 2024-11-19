import express from "express";
import multer from "multer";
import db from "../utils/connect-mysqls.js";
import path from 'path';
import cors from "cors";
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fs from 'fs';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 檔案上傳路徑配置
const frontendPublicPath = path.resolve('/Users/倪敏家/Desktop/react/music-next-mfee58/public');

// 定義所有需要的路徑
const paths = {
  video: path.join(frontendPublicPath, 'Liam/videos'),
  image: path.join(frontendPublicPath, 'Liam/images/cover'),
  header: path.join(frontendPublicPath, 'Liam/images/header')
};

// 建立所有必要的目錄
Object.values(paths).forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`Created directory: ${dir}`);
  }
});

// CORS 設定
router.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));

// 檔案存儲配置
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    let uploadPath;
    switch(file.fieldname) {
      case 'f_project_picture':
        uploadPath = paths.video;
        break;
      case 'top':
        uploadPath = paths.image;
        break;
      case 'header':
        uploadPath = paths.header;
        break;
      default:
        uploadPath = paths.image;
    }
    console.log(`Uploading ${file.fieldname} to: ${uploadPath}`);
    cb(null, uploadPath);
  },
  filename: function(req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const filename = file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname);
    console.log(`Generated filename: ${filename}`);
    cb(null, filename);
  }
});

// 檔案過濾器
const fileFilter = function(req, file, cb) {
  if (file.fieldname === 'f_project_picture') {
    if (!file.mimetype.startsWith('video/')) {
      return cb(new Error('請上傳視頻文件'), false);
    }
    const maxVideoSize = 200 * 1024 * 1024; // 200MB
    if (file.size > maxVideoSize) {
      return cb(new Error('視頻文件不能超過200MB'), false);
    }
  } else if (file.fieldname === 'top' || file.fieldname === 'header') {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('請上傳圖片文件'), false);
    }
    const maxImageSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxImageSize) {
      return cb(new Error('圖片文件不能超過5MB'), false);
    }
  }
  cb(null, true);
};

// Multer 配置
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 200 * 1024 * 1024
  }
});

// 輔助函數：產生資料庫路徑
const getDbPath = (file, type) => {
  const filename = file.filename;
  switch(type) {
    case 'video':
      return `/Liam/videos/${filename}`;
    case 'image':
      return `/Liam/images/cover/${filename}`;
    case 'header':
      return `/Liam/images/header/${filename}`;
    default:
      return '';
  }
};

// 檔案上傳日誌
const logFileUpload = (file, destination) => {
  console.log('File Upload Details:');
  console.log(`Original name: ${file.originalname}`);
  console.log(`Stored at: ${destination}`);
  console.log(`Size: ${file.size} bytes`);
  console.log(`Mime type: ${file.mimetype}`);
};

// 建立專案路由
router.post('/projects/create', (req, res) => {
  upload.fields([
    { name: 'f_project_picture', maxCount: 1 },
    { name: 'top', maxCount: 1 },
    { name: 'header', maxCount: 1 }
  ])(req, res, async function(err) {
    if (err) {
      console.error('Upload error:', err);
      return res.status(400).json({
        success: false,
        message: err.message
      });
    }

    let connection;
    try {
      // 檢查必要欄位
      const requiredFields = [
        'f_project_name',
        'f_tag',
        'f_project_amount',
        'f_project_title',
        'f_project_content'
      ];

      const missingFields = requiredFields.filter(field => !req.body[field]);
      if (missingFields.length > 0) {
        throw new Error(`缺少必要欄位: ${missingFields.join(', ')}`);
      }

      // 檢查檔案上傳
      if (!req.files['f_project_picture'] || !req.files['top'] || !req.files['header']) {
        throw new Error('請上傳所有必要的文件（影片、封面圖片和Header圖片）');
      }

      // 記錄檔案上傳資訊
      Object.values(req.files).forEach(files => {
        files.forEach(file => {
          logFileUpload(file, file.destination);
        });
      });

      connection = await db.getConnection();
      await connection.beginTransaction();

      const {
        f_project_name,
        f_tag,
        f_project_amount,
        f_project_title,
        f_project_content,
      } = req.body;

      // 取得檔案資訊
      const videoFile = req.files['f_project_picture'][0];
      const imageFile = req.files['top'][0];
      const headerFile = req.files['header'][0];

      // 產生資料庫路徑
      const videoPath = getDbPath(videoFile, 'video');
      const imagePath = getDbPath(imageFile, 'image');
      const headerPath = getDbPath(headerFile, 'header');

      // 寫入資料庫
      const [result] = await connection.execute(
        `INSERT INTO f_project_list (
          f_project_name,
          f_tag,
          f_project_amount,
          f_project_title,
          f_project_content,
          video,
          f_project_picture,   
          top
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          f_project_name,
          f_tag,
          f_project_amount,
          f_project_title,
          f_project_content,
          videoPath,
          imagePath,
          headerPath
        ]
      );

      await connection.commit();

      res.json({
        success: true,
        message: '專案創建成功',
        project: {
          id: result.insertId,
          f_project_name,
          f_tag,
          f_project_amount,
          f_project_title,
          f_project_content,
          video: videoPath,
          f_project_picture: imagePath,
          top: headerPath
        }
      });

    } catch (error) {
      if (connection) {
        await connection.rollback();
      }
      console.error('Database error:', error);
      res.status(500).json({
        success: false,
        message: '創建專案失敗',
        error: error.message
      });
    } finally {
      if (connection) {
        connection.release();
      }
    }
  });
});



router.post('/api/updatePlanPeople', async (req, res) => {
  const { f_plan_id, f_project_list, increment } = req.body;
  let connection;

  try {
    // 驗證輸入數據
    if (!f_plan_id || !f_project_list || !increment) {
      return res.status(400).json({
        success: false,
        message: '缺少必要參數'
      });
    }

    // 獲取數據庫連接
    connection = await db.getConnection();

    // 開始事務
    await connection.beginTransaction();

    // 查詢當前數據
    const [currentData] = await connection.execute(
      'SELECT f_plan_people FROM f_plan WHERE f_plan_id = ? AND f_project_list = ?',
      [f_plan_id, f_project_list]
    );

    if (currentData.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: '找不到指定的方案'
      });
    }

    // 計算新的購買人數
    const currentPeople = currentData[0].f_plan_people || 0;  // 加入預設值處理
    const newPeople = currentPeople + parseInt(increment);

    // 更新數據
    await connection.execute(
      'UPDATE f_plan SET f_plan_people = ?, f_plan_current = NOW() WHERE f_plan_id = ? AND f_project_list = ?',
      [newPeople, f_plan_id, f_project_list]
    );

    // 提交事務
    await connection.commit();

    // 回傳成功結果
    res.json({
      success: true,
      message: '成功更新購買人數',
      data: {
        f_plan_id,
        f_project_list,
        previous_people: currentPeople,
        new_people: newPeople,
        increment
      }
    });

  } catch (error) {
    // 如果有錯誤，回滾事務
    if (connection) {
      await connection.rollback();
    }

    console.error('更新購買人數時發生錯誤:', error);
    res.status(500).json({
      success: false,
      message: '更新購買人數時發生錯誤',
      error: error.message
    });

  } finally {
    // 釋放數據庫連接
    if (connection) {
      connection.release();
    }
  }
});







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




router.post('/api/orders', async (req, res) => {
  const { memberId, products } = req.body;
  let connection;

  try {
    if (!memberId || !products || products.length === 0) {
      return res.status(400).json({
        success: false,
        message: '缺少必要參數'
      });
    }

    connection = await db.getConnection();
    await connection.beginTransaction();

    // 計算總金額
    const totalAmount = products.reduce((sum, item) => 
      sum + (item.price * item.quantity), 0
    );

    // 創建訂單主表記錄
    const [orderResult] = await connection.execute(
      `INSERT INTO f_order (f_member_id, f_total_amount, f_order_status)
       VALUES (?, ?, 'pending')`,
      [memberId, totalAmount]
    );

    const orderId = orderResult.insertId;

    // 創建訂單明細記錄
    for (const item of products) {
      await connection.execute(
        `INSERT INTO f_order_detail 
         (f_order_id, f_plan_id, f_project_list, f_quantity, f_price, f_subtotal)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          orderId,
          item.planId,
          item.projectList,
          item.quantity,
          item.price,
          item.price * item.quantity
        ]
      );
    }

    await connection.commit();

    res.json({
      success: true,
      message: '訂單創建成功',
      data: {
        orderId,
        totalAmount
      }
    });

  } catch (error) {
    if (connection) {
      await connection.rollback();
    }
    console.error('創建訂單失敗:', error);
    res.status(500).json({
      success: false,
      message: '創建訂單失敗',
      error: error.message
    });
  } finally {
    if (connection) {
      connection.release();
    }
  }
});

// 獲取訂單列表
router.get('/api/orders/:memberId', async (req, res) => {
  try {
    const { memberId } = req.params;
    
    const [orders] = await db.execute(
      `SELECT 
        o.f_order_id,
        o.f_total_amount,
        o.f_order_status,
        o.f_created_at,
        JSON_ARRAYAGG(
          JSON_OBJECT(
            'planId', od.f_plan_id,
            'projectList', od.f_project_list,
            'quantity', od.f_quantity,
            'price', od.f_price,
            'subtotal', od.f_subtotal
          )
        ) as details
       FROM f_order o
       JOIN f_order_detail od ON o.f_order_id = od.f_order_id
       WHERE o.f_member_id = ?
       GROUP BY o.f_order_id
       ORDER BY o.f_created_at DESC`,
      [memberId]
    );

    res.json({
      success: true,
      data: orders
    });

  } catch (error) {
    console.error('獲取訂單列表失敗:', error);
    res.status(500).json({
      success: false,
      message: '獲取訂單列表失敗',
      error: error.message
    });
  }
});

// 更新訂單狀態
router.put('/api/orders/:orderId/status', async (req, res) => {
  const { orderId } = req.params;
  const { status } = req.body;
  let connection;

  try {
    if (!['pending', 'paid', 'cancelled'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: '無效的訂單狀態'
      });
    }

    connection = await db.getConnection();
    await connection.beginTransaction();

    await connection.execute(
      'UPDATE f_order SET f_order_status = ? WHERE f_order_id = ?',
      [status, orderId]
    );

    await connection.commit();

    res.json({
      success: true,
      message: '訂單狀態更新成功'
    });

  } catch (error) {
    if (connection) {
      await connection.rollback();
    }
    console.error('更新訂單狀態失敗:', error);
    res.status(500).json({
      success: false,
      message: '更新訂單狀態失敗',
      error: error.message
    });
  } finally {
    if (connection) {
      connection.release();
    }
  }
});




//收藏


router.get('/favorites/check/:projectId/:memberId', async (req, res) => {
  try {
    const { projectId, memberId } = req.params;

    // 檢查參數是否存在
    if (!projectId || !memberId) {
      return res.status(400).json({ 
        success: false, 
        error: '缺少必要參數'
      });
    }

    // 先檢查會員和專案是否存在
    const [memberExists] = await db.query(
      'SELECT 1 FROM m_member WHERE m_member_id = ?',
      [memberId]
    );

    const [projectExists] = await db.query(
      'SELECT 1 FROM f_project_list WHERE f_project_id  = ?',
      [projectId]
    );

    if (memberExists.length === 0 || projectExists.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: '會員或專案不存在'
      });
    }

    const [rows] = await db.query(
      'SELECT 1 FROM m_favorite WHERE m_member_id = ? AND m_project_id = ?',
      [memberId, projectId]
    );

    res.json({ 
      success: true,
      isFavorite: rows.length > 0 
    });

  } catch (error) {
    console.error('檢查收藏狀態失敗:', error);
    res.status(500).json({ 
      success: false, 
      error: '伺服器錯誤' 
    });
  }
});

// 新增收藏
router.post('/favorites/add/:projectId/:memberId', async (req, res) => {
  const conn = await db.getConnection();
  
  try {
    await conn.beginTransaction();
    
    const { projectId, memberId } = req.params;

    // 檢查參數
    if (!projectId || !memberId) {
      await conn.rollback();
      return res.status(400).json({ 
        success: false, 
        error: '缺少必要參數' 
      });
    }

    // 檢查會員是否存在
    const [memberExists] = await conn.query(
      'SELECT 1 FROM m_member WHERE m_member_id = ?',
      [memberId]
    );

    if (memberExists.length === 0) {
      await conn.rollback();
      return res.status(404).json({ 
        success: false, 
        error: '會員不存在' 
      });
    }

    // 檢查專案是否存在
    const [projectExists] = await conn.query(
      'SELECT 1 FROM f_project_list WHERE f_project_id  = ?',
      [projectId]
    );

    if (projectExists.length === 0) {
      await conn.rollback();
      return res.status(404).json({ 
        success: false, 
        error: '專案不存在' 
      });
    }

    // 檢查是否已經收藏
    const [existing] = await conn.query(
      'SELECT 1 FROM m_favorite WHERE m_member_id = ? AND m_project_id = ?',
      [memberId, projectId]
    );

    if (existing.length > 0) {
      await conn.rollback();
      return res.status(400).json({ 
        success: false, 
        error: '已經收藏過此專案' 
      });
    }

    // 新增收藏記錄
    await conn.query(
      'INSERT INTO m_favorite (m_member_id, m_project_id, m_create_time) VALUES (?, ?, NOW())',
      [memberId, projectId]
    );

    await conn.commit();

    res.json({ 
      success: true,
      message: '收藏成功' 
    });

  } catch (error) {
    await conn.rollback();
    console.error('新增收藏失敗:', error);
    res.status(500).json({ 
      success: false, 
      error: '伺服器錯誤' 
    });
  } finally {
    conn.release();
  }
});

// 移除收藏
router.delete('/favorites/remove/:projectId/:memberId', async (req, res) => {
  try {
    const { projectId, memberId } = req.params;

    // 檢查參數
    if (!projectId || !memberId) {
      return res.status(400).json({ 
        success: false, 
        error: '缺少必要參數' 
      });
    }

    // 檢查並刪除收藏
    const [result] = await db.query(
      'DELETE FROM m_favorite WHERE m_member_id = ? AND m_project_id = ?',
      [memberId, projectId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ 
        success: false, 
        error: '找不到收藏記錄' 
      });
    }

    res.json({ 
      success: true,
      message: '成功移除收藏' 
    });

  } catch (error) {
    console.error('移除收藏失敗:', error);
    res.status(500).json({ 
      success: false, 
      error: '伺服器錯誤' 
    });
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
