import mysql from "mysql2/promise";
import dotenv from "dotenv";

// 載入環境變數
dotenv.config({ path: "./dev.env" });

// 測試環境變數是否載入
console.log("資料庫配置：", {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
});

// 建立連線池
const memDB = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASS || "",
  database: process.env.DB_NAME || "",
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// 測試連線
(async () => {
  try {
    const connection = await memDB.getConnection();
    console.log("資料庫連線成功");
    const [rows] = await connection.query("SELECT DATABASE()");
    console.log("當前資料庫：", rows[0]["DATABASE()"]);
    connection.release();
  } catch (error) {
    console.error("資料庫連線失敗：", error);
  }
})();

export default memDB;



// const { DB_HOST, DB_USER, DB_PASS, DB_NAME, DB_PORT } = process.env;
// const memDB = mysql.createPool({
//   host: DB_HOST,
//   user: DB_USER,
//   password: DB_PASS,
//   database: DB_NAME,
//   waitForConnections: true,
//   connectionLimit: 10,
//   queueLimit: 0,
//   port: DB_PORT,
// });