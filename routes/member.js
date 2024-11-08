import express from 'express'
const router = express.Router()

// 資料庫使用，使用原本的mysql2 + sql
import db from '../utils/connect-mysqls.js'

// import jsonwebtoken from 'jsonwebtoken'
// 中介軟體，存取隱私會員資料用
// import authenticate from '../middleware/auth.js'

// // 檢查空物件, 轉換req.params為數字
// import { getIdParams } from '../utils/params.js'

// import { generateHash, compareHash } from '../utils/hash.js'

router.get('/members/:member', async (req, res) => {
  const id = req.params.member;

  const sql = `SELECT * FROM m_member WHERE m_member_id = ?`;
  try {
    const [rows] = await db.query(sql, [id]);
    res.json({ rows });
  } catch (error) {
    console.error("Database query error:", error);
    res.status(500).json({ error: "Database query error" });
  }
});
// 定義安全的私鑰字串
const accessTokenSecret = process.env.ACCESS_TOKEN_SECRET

// GET - 得到單筆資料(注意，有動態參數時要寫在GET區段最後面)
// router.get('/', authenticate, async function (req, res) {
//   // id可以用jwt的存取令牌(accessToken)從authenticate中得到(如果有登入的話)
//   const id = req.user.id

//   // 檢查是否為授權會員，只有授權會員可以存取自己的資料
//   if (req.user.id !== id) {
//     return res.json({ status: 'error', message: '存取會員資料失敗' })
//   }

//   const [rows] = await db.query('SELECT * FROM member WHERE id= ?', [id])

//   if (rows.length === 0) {
//     return res.json({ status: 'error', message: '沒有找到會員資料' })
//   }

//   const member = rows[0]

//   // 不回傳密碼
//   delete member.password

//   return res.json({ status: 'success', data: { member } })
// })

// 會員註冊
router.post('/', async (req, res, next) => {
  console.log(req.body)

  const newMember = req.body

  // 有沒有重覆的email或username
  const [rows] = await db.query(
    'SELECT * FROM member WHERE email = ? OR username = ?',
    [newMember.email, newMember.username]
  )

  if (rows.length > 0) {
    return res.json({ status: 'error', message: '有重覆的email或帳號' })
  }

  // 密碼要先經過bcrypt編碼
  const passwordHash = await generateHash(newMember.password)

  const [rows2] = await db.query(
    "INSERT INTO `member`(`name`,`username`,`password`,`email`,`created_at`,`updated_at`) VALUES(?,?,?,?,'2024-10-18 00:00:00','2024-10-18 00:00:00')",
    [newMember.name, newMember.username, passwordHash, newMember.email]
  )

  console.log(rows2)

  // 檢查是否有產生insertId，代表新增成功
  if (rows2.insertId) {
    return res.json({ status: 'success', data: null })
  } else {
    return res.json({ status: 'error', message: '新增到資料庫失敗' })
  }
})

// 登入用
router.post('/login', async (req, res, next) => {
  console.log(req.body)

  const loginMember = req.body

  // 1. 先用username查詢該會員
  const [rows] = await db.query('SELECT * FROM member WHERE username = ?', [
    loginMember.username,
  ])

  if (rows.length === 0) {
    return res.json({ status: 'error', message: '該會員不存在' })
  }

  const dbMember = rows[0]

  // 2. 比對密碼hash是否相同(返回true代表密碼正確)
  const isValid = await compareHash(loginMember.password, dbMember.password)

  if (!isValid) {
    return res.json({ status: 'error', message: '密碼錯誤' })
  }

  // 存取令牌(access token)只需要id和username就足夠，其它資料可以再向資料庫查詢
  const returnUser = {
    id: dbMember.id,
    username: dbMember.username,
  }

  // 產生存取令牌(access token)，其中包含會員資料
  const accessToken = jsonwebtoken.sign(returnUser, accessTokenSecret, {
    expiresIn: '3d',
  })

  // 使用httpOnly cookie來讓瀏覽器端儲存access token
  res.cookie('accessToken', accessToken, { httpOnly: true })

  // 傳送access token回應(例如react可以儲存在state中使用)
  return res.json({
    status: 'success',
    data: { accessToken },
  })
})

// router.post('/logout', authenticate, (req, res) => {
//   // 清除cookie
//   res.clearCookie('accessToken', { httpOnly: true })
//   res.json({ status: 'success', data: null })
// })

// 更新會員資料
// router.put('/', authenticate, async (req, res, next) => {
//   // id可以用jwt的存取令牌(accessToken)從authenticate中得到(如果有登入的話)
//   const id = req.user.id

//   // 這裡可以檢查
//   const updateMember = req.body

//   let result = null

//   if (updateMember.password) {
//     // 密碼要先經過bcrypt編碼
//     const passwordHash = await generateHash(updateMember.password)
//     result = await db.query(
//       'UPDATE `member` SET `name`=?,`password`=?,`email`=? WHERE `id`=?;',
//       [updateMember.name, passwordHash, updateMember.email, id]
//     )
//   } else {
//     result = await db.query(
//       'UPDATE `member` SET `name`=?,`email`=? WHERE `id`=?;',
//       [updateMember.name, updateMember.email, id]
//     )
//   }

//   const [rows2] = result
//   console.log(rows2)

//   // 檢查是否有產生affectedRows，代表新增成功
//   if (rows2.affectedRows) {
//     return res.json({ status: 'success', data: null })
//   } else {
//     return res.json({ status: 'error', message: '更新到資料庫失敗' })
//   }
// })


export default router
