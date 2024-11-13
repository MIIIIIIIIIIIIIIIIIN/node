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
  //  LIMIT 3, 6"; //從第4筆開始取6筆資料
  const [rows] = await db.query(sql);
  // fields: 會拿到欄位相關的資訊, 通常不會用到
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


//Spotify
router.get("/home", (req, res) => {
  res.send("授權成功，已經可以使用Spotify API!");
});

// Login Spotify
router.get("/logintospotify", (req, res) => {
  const pid = req.query.pid; // 獲取 pid
  const scope = "user-read-private user-read-email";
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
            Buffer.from(process.env.CLIENT_ID + ":" + process.env.CLIENT_SECRET).toString("base64"),
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );
    const access_token = response.data.access_token;
    // 重定向回前端頁面，包含動態 pid 和 access_token
    res.redirect(`http://localhost:3000/George/product/${pid}?access_token=${access_token}`);
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
  const { pid } = req.params.pid; // 拿動態變數
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

//jamendo api for music
router.get("/tracks", async (req, res) => {
  try {
    const response = await axios.get(`${JAMENDO_API_BASE_URL}/tracks`, {
      params: {
        client_id: JAMENDO_API_KEY,
        format: "json",
        limit: 10,
        order: "popularity_total",
      },
    });
    res.json(response.data);
  } catch (error) {
    console.error("Error fetching tracks:", error.message);
    res.status(500).json({ error: "Failed to fetch tracks from Jamendo" });
  }
});

// router.get('/tracks', (req, res) => {
//   res.send("Tracks endpoint is working!");
// });

export default router;
