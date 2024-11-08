import express from 'express'
const router = express.Router()

// 資料庫使用，使用原本的mysql2 + sql
import db from '##/configs/mysql.js'

// GET - 得到所有會員資料
router.get('/', async function (req, res) {
  // where條件 ----- START
  const conditions = []

  // 分每個條件加入到conditions陣列

  // 名稱 關鍵字(查詢字串QS: name_like=sa)
  const name_like = req.query.name_like || ''
  conditions[0] = name_like ? `name LIKE '%${name_like}%'` : ''

  // 品牌 複選 (查詢字串QS: brands=Apple,Google)
  const brands = req.query.brands ? req.query.brands.split(',') : []
  conditions[1] =
    brands.length > 0 ? brands.map((v) => `brand = '${v}'`).join(` OR `) : ''

  // 價格, 5000~150000 (查詢字串QS: price_gte=5000&price_lte=15000)
  const price_gte = Number(req.query.price_gte) || 0 // 最小價格
  const price_lte = Number(req.query.price_lte) || 20000 // 最大價格
  conditions[2] = `price BETWEEN ${price_gte} AND ${price_lte}`

  // 組合成where從句
  // 1. 過濾空白的條件
  const cvs = conditions.filter((v) => v)
  // 2. 用AND串接所有從句
  const where =
    cvs.length > 0 ? 'WHERE ' + cvs.map((v) => `( ${v} )`).join(` AND `) : ''

  console.log(where)

  // where條件 ----- END

  // 排序 (查詢字串QS: sort=price&order=asc) (順向asc, 逆向desc)
  const sort = req.query.sort || 'id' // 預設的排序資料庫欄位
  const order = req.query.order || 'asc'
  // 允許的排序的欄位字串
  const sortList = ['id', 'price']
  // 允許的order字串
  const orderList = ['asc', 'desc']

  let orderby = ''
  // 檢查要可用的sort與order字串
  if (orderList.includes(order) && sortList.includes(sort)) {
    orderby = `ORDER BY ${sort} ${order}`
  }

  // 分頁 (查詢字串QS: page=2&perpage=5)
  // 預設值(前後端要一致) page = 1, perpage = 10
  // 公式: limit = perpage
  //     offset = (page-1) * perpage
  // 因為要作數學運算，所以一定要轉數字
  const page = Number(req.query.page) || 1
  const perpage = Number(req.query.perpage) || 10
  const offset = (page - 1) * perpage
  const limit = perpage

  // 查詢在這頁的商品資料
  // sql套用各值的順序 where orderby limit+offset
  const [rows] = await db.query(
    `SELECT * FROM my_product ${where} ${orderby} LIMIT ${limit} OFFSET ${offset}`
  )
  const products = rows

  // 計算在此條件下總共多少筆(WHERE)
  const [rows2] = await db.query(
    `SELECT COUNT(*) AS count FROM my_product ${where}`
  )
  const { count } = rows2[0]

  // 計算總頁數
  const pageCount = Math.ceil(count / perpage)

  // 標準回傳JSON
  return res.json({
    status: 'success',
    data: {
      total: count, // 總筆數
      pageCount, // 總頁數
      page, // 目前頁
      perpage, // 每頁筆數
      products,
    },
  })
})

// GET - 得到單筆資料(注意，有動態參數時要寫在GET區段最後面)
router.get('/:id', async function (req, res) {
  // 轉為數字(為什麼要轉為數字請見下面的說明)
  const id = Number(req.params.id)

  //id的類型必需要和模型的pk主鍵一致(註: 因為在模型裡是定義為"整數值"，自動遞增pk主鍵)
  const [rows, fields] = await db.query(
    'SELECT * FROM my_product WHERE id = ?',
    [id]
  )

  return res.json({ status: 'success', data: { product: rows[0] } })
})

export default router
