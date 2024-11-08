import express from "express";
// import db from "../../utils/connect-mysqls.js";
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

// 取出專輯images
router.get("/albums/:albumsId", async (req, res) => {
  const { albumsId } = req.params;
  try {
    const sql = `SELECT p_productsimg_filename from pp_products_img where p_products_id = ?`;
    const [imgRows] = await db.query(sql, [albumsId]);
    res.json({images: imgRows}) // 傳到客戶端去嚕~
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: "無法取得圖片" });
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
