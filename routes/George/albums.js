import express from "express";
import db from "../../utils/connect-mysqls.js";
import memDB from "../member/mem-db.js";
import axios from "axios";
import querystring from "querystring";

const router = express.Router();

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

// 取出專輯images
router.get("/albums/images/:pid", async (req, res) => {
  const { pid } = req.params;
  try {
    const sql = `SELECT p_productsimg_filename from pp_products_img where p_products_id = ?`;
    const [imgRows] = await db.query(sql, [pid]);
    res.json({ images: imgRows }); // 傳到客戶端去嚕~
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: "無法取得圖片" });
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

//FINAL Spotify
router.get("/home", (req, res) => {
  res.send("授權成功，已經可以使用Spotify API!");
});
router.get("/logintospotify", (req, res) => {
  const scope = "user-read-private user-read-email";
  const authURL =
    "https://accounts.spotify.com/authorize?" +
    querystring.stringify({
      response_type: "code",
      client_id: CLIENT_ID,
      scope: scope,
      redirect_uri: REDIRECT_URI,
    });
  res.redirect(authURL);
});

router.get("/callback", async (req, res) => {
  const code = req.query.code || null;
  try {
    const response = await axios.post(
      "https://accounts.spotify.com/api/token",
      querystring.stringify({
        code: code,
        redirect_uri: REDIRECT_URI,
        grant_type: "authorization_code",
      }),
      {
        headers: {
          Authorization:
            "Basic " +
            Buffer.from(CLIENT_ID + ":" + CLIENT_SECRET).toString("base64"),
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );
    const access_token = response.data.access_token;
    const refresh_token = response.data.refresh_token;
    res.redirect(
      `http://localhost:3000/George/products-detail?access_token=${access_token}`
    );
  } catch (error) {
    console.error(error);
    res.send("Error retrieving access token");
  }
});

export default router;
