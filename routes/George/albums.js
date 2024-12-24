import express from "express";
import db from "../../utils/connect-mysqls.js";
import memDB from "../member/mem-db.js";
import axios from "axios";
import querystring from "querystring";

const router = express.Router();
const JAMENDO_API_BASE_URL = "https://api.jamendo.com/v3.0";
const JAMENDO_API_KEY = "1c0b1d31";

// 從albums table 撈資料
router.get("/albums", async (req, res) => {
  const sql = "SELECT * FROM pp_albums ORDER BY p_albums_id DESC";
  const [rows] = await db.query(sql);
  res.json({ rows });
});

router.get("/albums/:pid", async (req, res) => {
  const { pid } = req.params;
  try {
    const sql = `SELECT * FROM pp_albums WHERE p_albums_id = ?`;
    const [rowss] = await db.query(sql, [pid]);
    res.json(rowss[0]);
  } catch (error) {
    console.error(err);
    res.status(500).send("Error fetching album data");
  }
});

// 也~可以
router.get("/otheralbums/:artist/:pid", async (req, res) => {
  const { artist, pid } = req.params;
  try {
    const otherAlbumsQuery = `
      SELECT * FROM pp_albums 
      WHERE p_albums_artist = ? AND p_albums_id != ? 
      ORDER BY p_albums_release_date DESC;
    `;
    const [otherAlbums] = await db.query(otherAlbumsQuery, [artist, pid]);

    res.json({ otherAlbums });
  } catch (error) {
    console.error(error);
    res.status(500).send("Error fetching album data");
  }
});

// 取出專輯images
router.get("/getImages/:pid", async (req, res) => {
  const { pid } = req.params;

  try {
    const sql = `SELECT p_productsimg_filename from pp_products_img where p_albums_id = ?`;
    const [imgRows] = await db.query(sql, [pid]);
    res.json({ images: imgRows }); // 傳到客戶端去嚕~
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: "無法取得圖片" });
  }
});

router.get("/getImages/:artist/:pid", async (req, res) => {
  const { artist, pid } = req.params;
  try {
    const otherImagesquery = `
    SELECT 
    pp_albums.p_albums_id, 
    pp_albums.p_albums_artist,
    pp_albums.p_albums_title,
    pp_products_img.p_productsimg_filename 
	FROM pp_albums 
    JOIN pp_products_img 
    ON pp_products_img.p_albums_id = pp_albums.p_albums_id 
    WHERE pp_albums.p_albums_artist = ?
    AND pp_albums.p_albums_id != ?
    ORDER BY pp_albums.p_albums_release_date DESC;
    `;
    const [otherImages] = await db.query(otherImagesquery, [artist, pid]);

    res.json(otherImages);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error fetching album data");
  }
});

// you may like
router.get("/youmaylike/:pid", async (req, res) => {
  const { pid } = req.params;
  try {
    const otheryoumaylikequery = `
    SELECT 
      pp_albums.p_albums_id, 
      pp_albums.p_albums_artist, 
      pp_albums.p_albums_title, 
      pp_products_img.p_productsimg_filename,
      pp_genres.p_genres_name
    FROM 
      pp_albums 
    JOIN 
      pp_album_genres ON pp_album_genres.p_albums_id = pp_albums.p_albums_id
    JOIN 
      pp_products_img ON pp_products_img.p_albums_id = pp_albums.p_albums_id
    JOIN
      pp_genres ON pp_album_genres.p_genres_id = pp_genres.p_genres_id
    WHERE 
      pp_album_genres.p_genres_id = (SELECT p_genres_id FROM pp_album_genres WHERE p_albums_id = ? LIMIT 1) 
      AND pp_albums.p_albums_id != ? 
    ORDER BY 
      pp_albums.p_albums_release_date DESC;
  `;
    const [youmaylike] = await db.query(otheryoumaylikequery, [pid, pid]);
    res.json(youmaylike);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error fetching albums");
  }
});

// genres fetching
router.get("/getGenres", async (req, res) => {
  const query = " SELECT * FROM pp_genres";
  try {
    const [genresRow] = await db.query(query);
    res.json(genresRow);
  } catch (err) {
    console.error("查詢錯誤", err);
    return res.status(500).json({ error: "查詢錯誤" });
  }
});

// 分類資料收 & 送
router.post("/postGenres", async (req, res) => {
  // console.log("Received POST request at /postGenres");
  const { genres } = req.body;
  // console.log('Received genres:', genres);
  const query = `
    SELECT pp_albums.p_albums_id, pp_albums.p_albums_title, pp_albums.p_albums_artist, pp_albums.p_albums_description, pp_albums.p_albums_price, pp_albums.p_albums_release_date FROM pp_albums JOIN pp_album_genres ON pp_albums.p_albums_id = pp_album_genres.p_albums_id JOIN pp_genres ON pp_genres.p_genres_id = pp_album_genres.p_genres_id WHERE pp_genres.p_genres_name = ?;`;
  try {
    const [postResults] = await db.query(query, [genres]);
    res.json(postResults);
  } catch (error) {
    console.error("Error fetching albums:", error);
    res.status(500).send("Server error");
  }
});

// posting keywords
router.get("/getKeyWord", async (req, res) => {
  const { keyword } = req.query;
  // console.log("到底是誰? ", keyword);
  // console.log("Received GET request at /postKeyWord");

  const query = `SELECT 
  pp_albums.p_albums_id,
  pp_albums.p_albums_title,
  pp_albums.p_albums_artist,
  pp_albums.p_albums_description,
  pp_albums.p_albums_price,
  pp_albums.p_albums_release_date,
  pp_genres.p_genres_name
FROM 
  pp_albums
JOIN 
  pp_album_genres ON pp_albums.p_albums_id = pp_album_genres.p_albums_id
JOIN 
  pp_genres ON pp_genres.p_genres_id = pp_album_genres.p_genres_id
WHERE 
  pp_genres.p_genres_name LIKE CONCAT('%', ? , '%')
  OR pp_albums.p_albums_title LIKE CONCAT('%', ? , '%')
  OR pp_albums.p_albums_artist LIKE CONCAT('%', ? , '%')`;

  try {
    const [keywordresults] = await db.query(query, [keyword, keyword, keyword]);
    res.json(keywordresults);
  } catch (error) {
    console.error("Error fetching keywords", error);
    res.status(500).send("Server error");
  }
});

// Cart
// 加入購物車 API 路由
router.post("/addToCart", async (req, res) => {
  // console.log("收到的請求資料：", req.body);
  const { commodity_id, albumId, userId, pic, quantity, price } = req.body;

  if (!price || !quantity || !pic || !albumId || !userId) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  try {
    const checkQuery = `SELECT p_cart_quantity FROM pp_carts WHERE p_albums_id = ? AND user_id = ?`;
    // console.log("Executing Check Query:", checkQuery, [albumId, userId]);

    const [rows] = await db.query(checkQuery, [albumId, userId]);
    // console.log("Check Results:", rows);

    if (rows && rows.length > 0) {
      // 從嵌套結構中取出 p_cart_quantity
      const currentQuantity = rows[0].p_cart_quantity;
      const newQuantity = parseInt(currentQuantity) + parseInt(quantity);

      if (isNaN(newQuantity)) {
        console.error("Error: Invalid quantity calculation.");
        return res
          .status(400)
          .json({ message: "Invalid quantity calculation" });
      }

      const updateQuery = `UPDATE pp_carts SET p_cart_quantity = ?, p_cart_price = ? WHERE p_albums_id = ? AND user_id = ?`;
      // console.log("Executing Update Query:", updateQuery, [newQuantity, price, albumId, userId]);

      const [updateResults] = await db.query(updateQuery, [
        newQuantity,
        price,
        albumId,
        userId,
      ]);
      // console.log("Update Results:", updateResults);
      res.status(200).json({
        message: "Item quantity updated in cart",
        data: updateResults,
      });
    } else {
      // 專輯不在購物車中，插入新紀錄
      const insertQuery = `INSERT INTO pp_carts (p_commodity_id, p_albums_id, user_id, p_cart_created_at, p_cart_img_filename, p_cart_quantity, p_cart_price)
      VALUES (?, ?, ?, NOW(), ?, ?, ?)`;

      const insertValues = [
        commodity_id,
        albumId,
        userId,
        pic,
        quantity,
        price,
      ];
      // console.log("Executing Insert Query:", insertQuery, insertValues);

      const [insertResults] = await db.query(insertQuery, insertValues);
      // console.log("Insert Results:", insertResults);
      res
        .status(200)
        .json({ message: "Item added to cart", data: insertResults });
    }
  } catch (error) {
    console.error("Database Error:", error);
    return res.status(500).json({ message: "Database error", error });
  }
});

// delete cart
router.delete("/deleteFromCart/:id", async (req, res) => {
  console.log("路由參數: ", req.params); // 檢查路由參數
  const { id } = req.params;

  try {
    const sql = "DELETE FROM pp_carts WHERE p_albums_id = ?";
    const [result] = await db.query(sql, [id]);
    if (result.affectedRows) {
      res.json({ success: true, message: "商品已刪除" });
    } else {
      res.status(404).json({ success: false, message: "商品不存在" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "伺服器錯誤" });
  }
});

// clean cart
router.delete("/cleanFromCart/:id", async (req, res) => {
  const { id} = req.params;
  const { pid } = req.query;
  console.log("ID: ", id, "PID: ", pid);
  const pidArray = pid.split(',');

  if (!pid || pid.length === 0) {
    return res.status(400).json({ success: false, message: "沒有提供 pid" });
  }

  try {
    const sql = "DELETE FROM pp_carts WHERE user_id = ? AND p_albums_id IN (?)";
    const [result] = await db.query(sql, [id, pidArray]);
    if (result.affectedRows) {
      res.json({ success: true, message: "清楚購物車完成" });
    } else {
      res.status(404).json({ success: false, message: "商品不存在" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "伺服器錯誤" });
  }
});

// 寫入訂單爹斯
router.post("/addToOrder", async (req, res) => {
  // console.log("收到的訂單資料：", req.body);
  const { orderData, orderItemsData } = req.body;
  const {
    userId,
    totalAmount,
    shippingAddress,
    shippingFee,
    paymentStatus,
    orderStatus,
    phone,
    email,
    orderNumber,
    createdAt,
    updatedAt,
  } = orderData;

  try {
    // 訂單本人
    const sqlOrder = `
      INSERT INTO pp_orders 
      (user_id, p_order_status, p_order_total_amount, p_order_shipping_address, p_order_shipping_fee, 
      p_order_payment_status, p_order_orderNumber, p_order_created_at, p_order_updated_at, 
      p_order_phone, p_order_email) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    const insertOrder = [
      userId,
      orderStatus,
      totalAmount,
      shippingAddress,
      shippingFee,
      paymentStatus,
      orderNumber,
      createdAt,
      updatedAt,
      phone,
      email,
    ];
    const [orderRow] = await db.query(sqlOrder, insertOrder);
    //訂單項目
    const orderId = orderRow.insertId; // 關聯
    const sqlOrderItems = `
    INSERT INTO pp_order_items (p_order_id, p_albums_id, p_order_items_totalAmount)
    VALUES (?, ?, ?)`;
    const orderItemsPromises = orderItemsData.map((item) => {
      const { albumsId, totalAmount } = item;
      return db.query(sqlOrderItems, [orderId, albumsId, totalAmount]);
    });
    await Promise.all(orderItemsPromises);

    res.status(200).json({ message: "Item added to order", data: orderRow });
  } catch (error) {
    console.error("Database Error:", error);
    return res.status(500).json({ message: "Database error", error });
  }
});

// 讀取訂單爹斯
router.get("/fetchOrders", (req, res) => {
  const query = `SELECT * FROM pp_order`
});

// get data from mem db
router.get("/getMem", async (req, res) => {
  const query = `SELECT * FROM m_member`;
  try {
    const [memrows] = await db.query(query);
    res.json(memrows);
  } catch (err) {
    console.error("查詢錯誤", err);
    return res.status(500).json({ error: "查詢錯誤" });
  }
});

router.get("/getMem/:urid", async (req, res) => {
  const { urid } = req.params;
  try {
    const sql = `SELECT * FROM pp_carts WHERE user_id = ?`;
    const [memrowss] = await db.query(sql, [urid]);
    res.json(memrowss);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error fetching album data");
  }
});

const checkMember = async (req, res, next) => {
  try {
    // 取得會員資料
    const response = await fetch("http://localhost:3005/mem-data", {
      headers: {
        Cookie: req.headers.cookie, // 轉發 cookie
      },
      credentials: "include",
    });

    if (!response.ok) {
      return res.status(401).json({ error: "請先登入" });
    }

    const memberData = await response.json();

    if (!memberData.admin) {
      return res.status(401).json({ error: "請先登入" });
    }

    // 將會員資料存到 req 中供後續路由使用
    req.memberData = memberData;
    next();
  } catch (error) {
    console.error("驗證會員失敗:", error);
    res.status(500).json({ error: "伺服器錯誤" });
  }
};

//Spotify
router.get("/home", (req, res) => {
  res.send("授權成功，已經可以使用Spotify API!");
});

// Login Spotify
router.get("/logintospotify", (req, res) => {
  const pid = req.query.pid; // 獲取 pid
  const scope =
    "user-read-private user-read-email user-modify-playback-state user-read-playback-state user-read-currently-playing streaming";
  const authURL =
    "https://accounts.spotify.com/authorize?" +
    querystring.stringify({
      response_type: "code",
      client_id: process.env.CLIENT_ID,
      scope: scope,
      redirect_uri: process.env.REDIRECT_URI,
      state: pid,
    });
  res.redirect(authURL);
});

// go to front end
router.get("/callback", async (req, res) => {
  const code = req.query.code || null;
  const pid = req.query.state; // 動態取得 pid

  try {
    const response = await axios.post(
      "https://accounts.spotify.com/api/token",
      querystring.stringify({
        code: code,
        redirect_uri: process.env.REDIRECT_URI,
        grant_type: "authorization_code",
      }),
      {
        headers: {
          Authorization:
            "Basic " +
            Buffer.from(
              process.env.CLIENT_ID + ":" + process.env.CLIENT_SECRET
            ).toString("base64"),
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );
    const access_token = response.data.access_token;
    // 重定向回前端頁面，包含動態 pid 和 access_token
    res.redirect(
      `http://localhost:3000/George/product/${pid}?access_token=${access_token}`
    );
  } catch (error) {
    console.error(error);
    res.send("Error retrieving access token");
  }
});

// get spotify play list
// 抓取播放清單資料的 API 路由
router.get("/playlist/:playlistId", async (req, res) => {
  const accessToken = req.query.access_token;
  const playlistId = req.params.playlistId;

  try {
    const response = await axios.get(
      `https://api.spotify.com/v1/playlists/${playlistId}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
    res.json(response.data);
  } catch (error) {
    console.error("Error fetching playlist:", error);
    res.status(500).send("Failed to fetch playlist data");
  }
});

router.get('/favorites/check/:albumUrl/:memberId', async (req, res) => {
  try {
    const { albumUrl, memberId } = req.params;

    // 檢查參數是否存在
    if (!albumUrl || !memberId) {
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
      'SELECT 1 FROM pp_albums WHERE p_albums_id  = ?',
      [albumUrl]
    );

    if (memberExists.length === 0 || projectExists.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: '會員或專案不存在'
      });
    }

    const [rows] = await db.query(
      'SELECT 1 FROM m_favorite WHERE m_member_id = ? AND m_project_id = ?',
      [memberId, albumUrl]
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
router.post('/favorites/add/:albumUrl/:memberId', async (req, res) => {
  const conn = await db.getConnection();
  
  try {
    await conn.beginTransaction();
    
    const { albumUrl, memberId } = req.params;

    // 檢查參數
    if (!albumUrl || !memberId) {
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
      'SELECT 1 FROM pp_albums WHERE p_albums_id  = ?',
      [albumUrl]
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
      [memberId, albumUrl]
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
      [memberId, albumUrl]
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
router.delete('/favorites/remove/:albumUrl/:memberId', async (req, res) => {
  try {
    const { albumUrl, memberId } = req.params;

    // 檢查參數
    if (!albumUrl || !memberId) {
      return res.status(400).json({ 
        success: false, 
        error: '缺少必要參數' 
      });
    }

    // 檢查並刪除收藏
    const [result] = await db.query(
      'DELETE FROM m_favorite WHERE m_member_id = ? AND m_project_id = ?',
      [memberId, albumUrl]
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

export default router;
