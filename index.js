import dotenv from 'dotenv';
import express from 'express';
import axios from 'axios';
import querystring from 'querystring';

dotenv.config();

const app = express();


const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI;

//fake data
const artists = ["周杰倫", "蔡依林", "五月天", "林俊傑", "孫燕姿", "張惠妹", "王力宏", "楊丞琳", "范瑋琪", "S.H.E"];
const albums = [];




app.get("/home", (req, res) => {
  res.send("授權成功，已經可以使用Spotify API!");
});

app.get("/login", (req, res) => {
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

app.get("/callback", async (req, res) => {
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
    res.redirect(`http://localhost:3000/George/products-detail?access_token=${access_token}`);
  } catch (error) {
    console.error(error);
    res.send("Error retrieving access token");
  }
});

app.listen(8888, () => {
  console.log("Server running on http://localhost:8888");
});
