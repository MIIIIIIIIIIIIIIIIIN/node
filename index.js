// console.log(process.env.WEB_PORT);
//取得環境變數檔 dev.env 當中的 WEB_PORT
//在 package.json 的 scripts 中輸入 "dev": "nodemon --env-file=dev.env index.js",

//******************引入 express ********************
import express from "express";
import session from "express-session";
import moment from "moment-timezone";
import upload from "./utils/upload-imgs.js";
//引入路由群組
import admin2Router from "./routes/admin2.js";
import memberRouter from "./routes/member/member.js";
import memberRouters from "./routes/member/auth.js";
import updateNicknameRouter from './routes/member/update-nickname.js'
import updateIconRouter from './routes/member/update-icon.js'
import fundraiserRouter from "./routes/fundraiser.js";
import loginRouter from "./routes/member/login.js"; // 引入新的 login.js
import authRouter from "./routes/member/auth.js";
// import spotifyRouter from "./routes/George/albums.js";
import albumsRouter from "./routes/George/albums.js";

import forumRouter from "./routes/forum.js";
import { fileURLToPath } from "url";
import path from "path";

//引入資料庫
import db from "./utils/connect-mysqls.js";
import memDB from "./routes/member/mem-db.js";
//引入雜湊工具
import bcrypt from "bcrypt";
//引入cors
import cors from "cors";
//引入token
import jwt from "jsonwebtoken";
//讀取 .env
import dotenv from "dotenv";

// 引入暱稱更新
// import updateIconRouter from "./routes/member/update-icon.js";

dotenv.config();
// console.log("JWT_KEY is:", process.env.JWT_KEY);

// 引入暱稱更新
import updateBioRouter from "./routes/member/update-bio.js";
import updateGenderRouter from "./routes/member/update-gender.js";
import updateLocationRouter from "./routes/member/update-location.js";
import updatePasswordRouter from "./routes/member/update-password.js";
import favoritesRouter from "./routes/member/favorites.js";
import memberDataRouter from "./routes/member/data.js";
import checkAuth from "./routes/member/check-auth.js";


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 建立 web server 物件
const app = express();

// 將 bcrypt 替換為 bcryptjs
// const bcrypt = require("bcryptjs");



//註冊樣板引擎
app.set("view engine", "ejs");
// 設定 top-level middleware
const corsOptions = {
  credentials: true,
  // origin: (origin, callback) => {
  //   callback(null, true);
  // },
  origin: "http://localhost:3000",
};
app.use(cors(corsOptions));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(
  session({
    saveUninitialized: false,
    resave: false,
    secret: "kdhhkffhifaoi", // 替換為您的 session 密鑰
    cookie: {
      maxAge: 1200_000, // 設定 session 的存活時間（20 分鐘）
      httpOnly: true, // 確保 Cookie 僅在 HTTP 請求中傳遞
    },
  })
);

// 設置 session 和其他資料

app.use((req, res, next) => {
  res.locals.title = "光芒萬丈的官方網站";
  res.locals.pageName = "";
  res.locals.session = req.session;

  let auth = req.get("Authorization");
  if (auth && auth.indexOf("Bearer") === 0) {
    const token = auth.slice(7);
    try {
      req.my_jwt = jwt.verify(token, process.env.JWT_KEY);
    } catch (ex) {}
  }

  next();
});

// 設置路由
app.use("/members", memberRouter);
app.use("/member", memberRouters);
// 使用新的更新暱稱路由
app.use("/member", updateNicknameRouter);
app.use("/member", updateIconRouter);
app.use("/member", updateBioRouter);
app.use("/member", updateGenderRouter);
app.use("/member", updateLocationRouter);
app.use("/member", updatePasswordRouter);
// console.log("update-password 路由已掛載在 /member/update-password");
app.use("/member", memberDataRouter);
app.use("/member", checkAuth);



//*********************************路由 *********************************/
// 路由定義, callback 為路由處理器
// 路由的兩個條件: 1. HTTP method; 2. 路徑


//FINAL

// 註冊表單路由 11.09 建立
app.get("/auth/register", (req, res) => {
  res.render("register"); // 渲染註冊表單頁面
});

app.use("/member", loginRouter); // 使用新的登入路由

// 其他路由及頁面

// 使用註冊路由
app.use("/member", authRouter); // 使用 /member 作為註冊請求路徑前端
app.use("/fundraiser", fundraiserRouter);

// 註冊處理路由
app.post("/auth/register", upload.none(), async (req, res) => {
  const { account, password } = req.body;
  const output = {
    success: false,
    code: 0,
    error: "",
  };

  if (!account || !password) {
    output.error = "帳號和密碼皆為必填";
    return res.json(output);
  }

  try {
    // 1. 檢查帳號是否已存在
    const checkSql = "SELECT * FROM m_member WHERE m_account = ?";
    const [existingUser] = await memDB.query(checkSql, [account]);
    if (existingUser.length > 0) {
      output.error = "帳號已被使用";
      output.code = 409; // 錯誤代碼，表示衝突
      return res.json(output);
    }

    // 2. 雜湊密碼
    const hashedPassword = await bcrypt.hash(password, 12);

    // 3. 新增會員資料到資料庫
    const insertSql =
      "INSERT INTO m_member (m_account, m_password) VALUES (?, ?)";
    const [result] = await memDB.query(insertSql, [account, hashedPassword]);

    if (result.affectedRows === 1) {
      output.success = true;
      output.message = "註冊成功";
    } else {
      output.error = "註冊失敗，請稍後再試";
    }

    res.json(output);
  } catch (error) {
    console.error("註冊錯誤：", error);
    output.error = "系統錯誤，請稍後再試";
    res.json(output);
  }
});

//首頁
app.get("/", (req, res) => {
  res.locals.title = "首頁 - " + res.locals.title;
  res.locals.pageName = "home";
  res.render("home", { name: "Balduran" });
});

// 測試頁面

//FINAL
//表格
app.get("/json-sales", (req, res) => {
  res.locals.title = "表格 - " + res.locals.title;
  res.locals.pageName = "json-sales";
  const sales = [
    {
      name: "Bill",
      age: 28,
      id: "A001",
    },
    {
      name: "Peter",
      age: 32,
      id: "A002",
    },
    {
      name: "Carl",
      age: 29,
      id: "A003",
    },
  ];
  res.render("json-sales", { sales });
});

app.get("/try-qs", (req, res) => {
  res.json(req.query); // 查看 query-string parameters
});

//FINAL
//上傳表單資料
app.get("/try-post-form", (req, res) => {
  res.locals.pageName = "try-post-form";
  res.render("try-post-form");
});

app.post("/try-post-form", (req, res) => {
  res.locals.pageName = "try-post-form";
  res.render("try-post-form", req.body);
});

app.post("/try-post", (req, res) => {
  res.json({ ...req.body, t: "try-post" });
});

//FINAL
//上傳單一檔案
app.post("/try-upload", upload.single("avatar"), (req, res) => {
  res.json({
    file: req.file,
    body: req.body,
  });
});
//上傳多個檔案
app.post("/try-uploads", upload.array("photos"), (req, res) => {
  res.json(req.files);
});

//4.5
app.get("/my-params1/:action?/:id?", (req, res) => {
  res.json(req.params);
});

//4.6
app.use("/admins", admin2Router);

//session 顯示頁面刷新次數
app.get("/mem-data", (req, res) => {
  req.session.my_num ||= 0;
  req.session.my_num++;
  res.json(req.session);
});



app.get("/test", async (req, res) => {
  const sql = "SELECT * FROM m_member WHERE m_member_id BETWEEN 1 and 20 "; //從第4筆開始取6筆資料
  const [rows, field] = await db.query(sql);
  // fields: 會拿到欄位相關的資訊, 通常不會用到
  res.json({ rows, field });
});
app.get("/try-moment", (req, res) => {
  const fm = "YYYY-MM-DD HH:mm:ss";
  const m1 = moment(); //取得當下時間
  const m2 = moment("2024-02-29");
  const m3 = moment("2023-02-29");
  res.json({
    m1: m1.format(fm),
    m2: m2.format(fm),

    m3: m3.format(fm),
    m1v: m1.isValid(),
    m2v: m2.isValid(),
    m3v: m3.isValid(),
    m1z: m1.tz("Europe/London").format(fm),
    m2z: m2.tz("Europe/London").format(fm),
  });
});

//由 bcrypt 產生雜湊碼
app.get("/bcrypt1", async (req, res) => {
  //hash
  const pw = "123456";
  const hash = await bcrypt.hash(pw, 12);

  res.send(hash);
});

//檢查雜湊碼與原始密碼是否相符
app.get("/bcrypt2", async (req, res) => {
  const hash = "$2b$12$KlMtvrHMPRlAUp28FtNCSuje02VQKlM6aRA4uh7gk0M8Z1INSa0oO";
  const pw = "123456";
  const result = await bcrypt.compare(pw, hash);

  res.json({ result });
});

app.get("/login", (req, res) => {
  res.render("login");
});

// 登入 暫時註解 11.07 (資料存在localStorage)
// app.post("/login", upload.none(), async (req, res) => {
//   const output = {
//     success: false,
//     code: 0,
//     error: "",
//     bodyData: req.body, // 傳給用戶端, 存到 localStorage
//   };
//   let { email, password } = req.body;
//   email = email ? email.trim() : "";
//   password = password ? password.trim() : "";

//   console.log(email, password);

//   // 0. 兩者若有一個沒有值就結束
//   if (!email || !password) {
//     return res.json(output);
//   }
//   // 1. 先確定帳號是不是對的
//   const sql = `SELECT * FROM m_member WHERE m_account=?`;
//   const [rows] = await db.query(sql, [email]);
//   if (!rows.length) {
//     // 帳號是錯的
//     output.code = 400; //錯誤代碼自行設定
//     output.error = "帳號或密碼錯誤";
//     return res.json(output);
//   }
//   const row = rows[0];
//   // 2. 確定密碼是不是對的
//   const result = await password === row.m_password
//   console.log('password',result);

//   // const result = await bcrypt.compare(password, row.password_hash);
//   if (!result) {
//     // 密碼是錯的
//     output.code = 450;
//     output.error = "帳號或密碼錯誤";
//     return res.json(output);
//   }

//   // 前端的output資料
//   output.bodyData = {
//     id: row.m_member_id,
//     account: row.m_account,
//     nickname: row.m_nickname,
//   }

//   // 帳密是對的, 要儲存登入的狀態到 session
//   req.session.admin = {
//     id: row.m_member_id,
//     account: row.m_account,
//     nickname: row.m_nickname,

//   };
//   output.success = true;
//   console.log('output',output);

//   res.json(output);
// });

// 登入 暫時新增 11.07 (資料從localStorage改存到session)
// 假設在 /login 路由處理函數中
app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const output = {
    success: false,
    code: 0,
    error: "",
  };

  // 驗證 email 和 password 的存在性
  if (!email || !password) {
    output.error = "請提供有效的帳號和密碼";
    return res.json(output);
  }

  // 查詢資料庫並確保找到使用者
  const sql = `SELECT * FROM m_member WHERE m_account = ? OR m_email = ?`;
  const [rows] = await memDB.query(sql, [email, email]);
  if (!rows.length) {
    output.code = 401;
    output.error = "帳號或密碼錯誤";
    return res.json(output);
  }

  const row = rows[0];
  const isPasswordCorrect = await bcrypt.compare(password, row.m_password);

  // 確認密碼是否正確
  if (!isPasswordCorrect) {
    output.code = 403;
    output.error = "帳號或密碼錯誤";
    return res.json(output);
  }

  // 登入成功，返回包含 `account` 的資料
  output.success = true;
  output.data = {
    id: row.m_member_id,
    account: row.m_account, // 確保這裡返回 account
    nickname: row.m_nickname,
    email: row.m_email,
  };

  res.json(output); // 確保這裡正確返回包含 `account` 的 response
});

app.get("/api/check-login", (req, res) => {
  if (req.session.admin) {
    res.json({
      loggedIn: true,
      memberInfo: req.session.admin,
    });
  } else {
    res.json({
      loggedIn: false,
      message: "尚未登入",
    });
  }
});
//登出
app.get("/logout", (req, res) => {
  delete req.session.admin;
  res.redirect("http://localhost:3000");
});

//token加密
app.get("/jwt01", (req, res) => {
  //自訂的密碼置於dev.env
  const key = process.env.JWT_KEY;
  // console.log({ key });
  //要傳送的資料
  const payload = {
    id: 26,
    account: "shinder",
  };
  //sign簽章加密
  const token = jwt.sign(payload, key);
  res.json({ token });
});
//token解密
app.get("/jwt02", (req, res) => {
  //從dev.env自訂的密碼
  const key = process.env.JWT_KEY;
  console.log({ key });
  //verify解密
  const token =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MjYsImFjY291bnQiOiJzaGluZGVyIiwiaWF0IjoxNzI4NDQzNTIzfQ.cbBYn-S0l2SsBAGvuAci__TUUdrLXI-J2-Wao0MHF1w";
  const payload = jwt.verify(token, key);
  res.json(payload);
});

app.post("/login-jwt", upload.none(), async (req, res) => {
  const output = {
    success: false,
    code: 0,
    error: "",
    bodyData: req.body,
    data: {}, // 傳給用戶端, 存到 localStorage
  };
  let { email, password } = req.body;
  email = email ? email.trim() : "";
  password = password ? password.trim() : "";
  // 0. 兩者若有一個沒有值就結束
  if (!email || !password) {
    return res.json(output);
  }
  // 1. 先確定帳號是不是對的
  const sql = `SELECT * FROM members WHERE email=?`;
  const [rows] = await db.query(sql, [email]);
  if (!rows.length) {
    // 帳號是錯的
    output.code = 400; //錯誤代碼自行設定
    output.error = "帳號或密碼錯誤";
    return res.json(output);
  }
  const row = rows[0];
  // 2. 確定密碼是不是對的

  const result = await bcrypt.compare(password, row.password_hash);
  if (!result) {
    // 密碼是錯的
    output.code = 450;
    output.error = "帳號或密碼錯誤";
    return res.json(output);
  }
  const payload = {
    id: row.member_id,
    email,
  };
  const token = jwt.sign(payload, process.env.JWT_KEY);
  //整包資料輸出
  output.data = {
    id: row.member_id,
    email,
    nickname: row.nickname,
    token, // 返回 token
  };
  output.success = true;
  res.json(output);
});

//測試token用
app.get("/jwt-data", (req, res) => {
  res.json(req.my_jwt);
});

//論壇用
app.use("/api/forum", forumRouter);



// ********** 靜態內容資料夾 **************************
app.use(express.static("public"));
app.use("/bootstrap", express.static("node_modules/bootstrap/dist"));
app.use(
  "/member-images",
  express.static(path.join(__dirname, "public/member-images"))
);
app.use(
  "/project-images",
  express.static(path.join(__dirname, "public/project-images"))
);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use("/api", albumsRouter);

// ******* 404 頁面要在所有的路由後面 **************************
// 404 頁面
app.use((req, res) => {
  res.status(404).send("<h1>走錯路了</h1>");
});



const port = process.env.WEB_PORT || 3002;
// console.log("JWT_KEY is:", process.env.JWT_KEY);

app.listen(port, () => {
  console.log(`Server 啟動於 ${port}`);
});
