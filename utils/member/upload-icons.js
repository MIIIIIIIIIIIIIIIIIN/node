import multer from 'multer';
import path from 'path';

// 設置圖片存儲位置
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/mem-icons'); // 設定圖片儲存的資料夾
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname); // 設定圖片名稱
  }
});

// 設置文件過濾條件，僅允許圖片文件
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'));
  }
};

// 初始化 multer 並設置文件大小限制為 2MB
const upload = multer({
  storage: storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  fileFilter: fileFilter,
});


export default upload;
