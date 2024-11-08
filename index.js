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
import member from "./routes/member.js";

//引入資料庫
import db from "./utils/connect-mysqls.js";
//引入雜湊工具
import bcrypt from "bcrypt";
//引入cors
import cors from "cors";
//引入token
import jwt from "jsonwebtoken";

//建立 web server 物件
const app = express();

//註冊樣板引擎
app.set("view engine", "ejs");

//top-level middleware
const corsOptions = {
  credentials: true,
  origin: (origin, callback) => {
    callback(null, true);
  },
};
app.use(cors(corsOptions));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(
  session({
    saveUninitialized: false,
    resave: false,
    secret: "kdhhkffhifaoi",
    // cookie: {
    //   maxAge: 1200_000, //session 存活時間 (20分鐘)
    //   httpOnly: false,
    // },
  })
);

app.use((req, res, next) => {
  res.locals.title = "光芒萬丈的官方網站";
  res.locals.pageName = "";
  res.locals.session = req.session; //讓ejs可以使用session

  let auth = req.get("Authorization");
  if (auth && auth.indexOf("Bearer") === 0) {
    const token = auth.slice(7);
    try {
      req.my_jwt = jwt.verify(token, process.env.JWT_KEY);
    } catch (ex) {}
  }

  next();
});


app.use("/members", member);
//*********************************路由 *********************************/
// 路由定義, callback 為路由處理器
// 路由的兩個條件: 1. HTTP method; 2. 路徑

//FINAL
//首頁
app.get("/", (req, res) => {
  res.locals.title = "首頁 - " + res.locals.title;
  res.locals.pageName = "home";
  res.render("home", { name: "Balduran" });
});
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
app.post("/login", upload.none(), async (req, res) => {
  const output = {
    success: false,
    code: 0,
    error: "",
  };
  let { email, password } = req.body;
  email = email ? email.trim() : "";
  password = password ? password.trim() : "";

  if (!email || !password) {
    return res.json(output);
  }
  // 1. 先確定帳號是不是對的
  const sql = `SELECT * FROM m_member WHERE m_account=?`;
  const [rows] = await db.query(sql, [email]);
  if (!rows.length) {
    output.code = 400;
    output.error = "帳號或密碼錯誤";
    return res.json(output);
  }
  const row = rows[0];
  const isPasswordCorrect = password === row.m_password;

  if (!isPasswordCorrect) {
    output.code = 450;
    output.error = "帳號或密碼錯誤";
    return res.json(output);
  }

  // 將登入成功的會員資料儲存到 session
  req.session.admin = {
    id: row.m_member_id,
    account: row.m_account,
    nickname: row.m_nickname,
    email: row.m_email,
    birth: row.m_birth,
    gender: row.m_gender,
    location: row.m_location,
    phone: row.m_phone,
    icon: row.m_icon,
  };
  output.success = true;
  res.json(output);
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
  res.redirect("/");
});

//token加密
app.get("/jwt01", (req, res) => {
  //自訂的密碼置於dev.env
  const key = process.env.JWT_KEY;
  console.log({ key });
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
    token,
  };
  output.success = true;
  res.json(output);
});

//測試token用
app.get("/jwt-data", (req, res) => {
  res.json(req.my_jwt);
});


// ********** 靜態內容資料夾 **************************
app.use(express.static("public"));
app.use("/bootstrap", express.static("node_modules/bootstrap/dist"));
// ******* 404 頁面要在所有的路由後面 **************************
app.use((req, res) => {
  res.status(404).send("<h1>走錯路了</h1>");
  // res.status(404).json({ msg: "走錯路了" });
});
const port = process.env.WEB_PORT || 3002;
app.listen(port, () => {
  console.log(`Server 啟動於 ${port}`);
});
