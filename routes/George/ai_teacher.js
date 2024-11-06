// // 假設資料庫中的專輯資料使用 MySQL
// // Step 1: 建立一個 Node.js 後端服務器來連接資料庫並提供 API
// // 檔案名稱：server.js

// const express = require('express');
// const mysql = require('mysql');
// const cors = require('cors');

// const app = express();
// const port = 5000;

// app.use(cors());
// app.use(express.json());

// // 創建 MySQL 連接
// const db = mysql.createConnection({
//   host: 'localhost',
//   user: 'root',
//   password: '',
//   database: 'album_sales', // 資料庫名稱
// });

// // 連接資料庫
// db.connect((err) => {
//   if (err) {
//     console.error('資料庫連接失敗：', err);
//     return;
//   }
//   console.log('資料庫連接成功');
// });

// // 定義一個 API 來獲取所有專輯資料
// app.get('/api/albums', (req, res) => {
//   const sql = 'SELECT * FROM albums';
//   db.query(sql, (err, result) => {
//     if (err) {
//       res.status(500).send('無法獲取專輯資料');
//       return;
//     }
//     res.json(result);
//   });
// });

// // 啟動服務器
// app.listen(port, () => {
//   console.log(`Server running at http://localhost:${port}`);
// });

// // Step 2: 前端 React.js 撈取後端 API 的資料並顯示在畫面上
// // 檔案名稱：src/components/AlbumsList.js

// import React, { useEffect, useState } from 'react';
// import axios from 'axios';
// import './AlbumsList.module.css';

// export default function AlbumsList() {
//   const [albums, setAlbums] = useState([]);

//   useEffect(() => {
//     // 撈取 Node.js 提供的 API 資料
//     axios.get('http://localhost:5000/api/albums')
//       .then(response => {
//         setAlbums(response.data);
//       })
//       .catch(error => {
//         console.error('無法撈取專輯資料：', error);
//       });
//   }, []);

//   return (
//     <div className="albums-container">
//       <h2>專輯列表</h2>
//       <ul>
//         {albums.map(album => (
//           <li key={album.id}>
//             <h3>{album.title}</h3>
//             <p>演唱者: {album.artist}</p>
//             <p>價格: ${album.price}</p>
//           </li>
//         ))}
//       </ul>
//     </div>
//   );
// }

// // Step 3: 在主畫面中使用 AlbumsList 組件來顯示專輯資料
// // 檔案名稱：src/App.js

// import React from 'react';
// import AlbumsList from './components/AlbumsList';

// function App() {
//   return (
//     <div className="App">
//       <AlbumsList />
//     </div>
//   );
// }

// export default App;

// // 步驟總結：
// // 1. 在 server.js 中建立 Node.js 伺服器，提供 API 來撈取資料庫中的專輯資料。
// // 2. 使用 React 組件 AlbumsList，從 API 撈取資料並顯示在頁面上。
// // 3. 在主畫面 App.js 中引用 AlbumsList 組件。
