import express from 'express';
import multer from 'multer';
import memDB from './mem-db.js'; // 請確認 mem-db.js 的路徑是否正確
import upload from '../../utils/member/upload-icons.js';

const router = express.Router();


// 圖片更新路由
router.post('/update-icon', upload.single('icon'), async (req, res) => {
  const memberId = req.session.admin.id; // 從 session 取得 admin ID
  if (!memberId) {
    return res.status(401).json({ message: "請先登入" });
  }

  if (!req.file) {
    return res.status(400).json({ message: "未選擇圖片檔案" });
  }

  const filePath = `/uploads/mem-icons/${req.file.filename}`;

  try {
    const sql = "UPDATE m_member SET m_icon = ? WHERE m_member_id = ?";
    const [result] = await memDB.query(sql, [filePath, memberId]);

    if (result.affectedRows === 1) {
      res.json({ message: "圖片已更新", icon: filePath });
    } else {
      res.status(500).json({ message: "更新圖片失敗，請稍後再試" });
    }
  } catch (error) {
    console.error("Error updating icon:", error);
    res.status(500).json({ message: "伺服器錯誤，無法更新圖片" });
  }
});

export default router;

// // 配置 multer 儲存上傳的圖片
// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, 'uploads/mem-icons'); // 設定圖片儲存的資料夾
//   },
//   filename: (req, file, cb) => {
//     const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
//     cb(null, uniqueSuffix + '-' + file.originalname); // 設定圖片名稱
//   }
// });

// const upload = multer({
//   storage: storage,
//   limits: { fileSize: 2 * 1024 * 1024 }, // 限制上傳圖片大小為 2MB
//   fileFilter: (req, file, cb) => {
//     if (file.mimetype.startsWith('image/')) {
//       cb(null, true);
//     } else {
//       cb(new Error('Only image files are allowed'));
//     }
//   }
// });

// // 圖片更新路由
// router.post('/update-icon', upload.single('icon'), async (req, res) => {
//   const memberId = req.session.adminId;
//   if (!memberId) {
//     return res.status(401).json({ message: "請先登入" });
//   }

//   if (!req.file) {
//     return res.status(400).json({ message: "未選擇圖片檔案" });
//   }

//   const filePath = `/uploads/mem-icons/${req.file.filename}`;

//   try {
//     const sql = "UPDATE m_member SET m_icon = ? WHERE m_member_id = ?";
//     const [result] = await memDB.query(sql, [filePath, memberId]);

//     if (result.affectedRows === 1) {
//       res.json({ message: "圖片已更新", icon: filePath });
//     } else {
//       res.status(500).json({ message: "更新圖片失敗，請稍後再試" });
//     }
//   } catch (error) {
//     console.error("Error updating icon:", error);
//     res.status(500).json({ message: "伺服器錯誤，無法更新圖片" });
//   }
// });

// export default router;
