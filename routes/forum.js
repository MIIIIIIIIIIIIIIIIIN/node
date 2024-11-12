import express from "express";
import mysql2 from "mysql2/promise";
const router = express.Router();

// Create the connection pool
const pool = mysql2.createPool({
  host: process.env.DB_HOST || "127.0.0.1",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASS || "P@ssw0rd",
  database: process.env.DB_NAME || "final-sql",
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Simple connection test
pool
  .getConnection()
  .then((connection) => {
    console.log("Database connected successfully");
    connection.release();
  })
  .catch((err) => {
    console.error("Database connection error:", err);
  });

// GET - Get all forum posts with user and project details
router.get("/posts", async function (req, res) {
  try {
    console.log("Received request for posts");

    // Basic pagination
    const page = Number(req.query.page) || 1;
    const perpage = Number(req.query.perpage) || 10;
    const offset = (page - 1) * perpage;

    // SQL query joining all necessary tables and counting likes and shares
    const [rows] = await pool.query(
      `SELECT 
        f_message.*,
        m_member.m_nickname as username,
        m_member.m_icon as userImage,
        f_project_list.f_project_picture as coverImage,
        COUNT(DISTINCT f_like.f_like_id) as likes_count,
        COUNT(DISTINCT f_share.f_share_id) as shares_count
      FROM f_message
      LEFT JOIN m_member ON f_message.f_member_id = m_member.m_member_id
      LEFT JOIN f_project_list ON f_message.f_project_id = f_project_list.f_project_id
      LEFT JOIN f_like ON f_message.f_message_id = f_like.f_message_id
      LEFT JOIN f_share ON f_message.f_message_id = f_share.f_message_id
      GROUP BY f_message.f_message_id
      ORDER BY f_message_current DESC
      LIMIT ? OFFSET ?`,
      [perpage, offset]
    );

    // Get total count for pagination
    const [countRows] = await pool.query(
      "SELECT COUNT(*) as count FROM f_message"
    );
    const total = countRows[0].count;
    const pageCount = Math.ceil(total / perpage);

    return res.json({
      status: "success",
      data: {
        posts: rows.map((post) => ({
          id: post.f_message_id,
          userImage: post.userImage
            ? `/member-images/${post.userImage}`
            : "/public/default-avatar.jpg",
          username: post.username || "Anonymous",
          title: post.f_message_title || "Untitled",
          content: post.f_message_content || "",
          coverImage: post.coverImage
            ? `/project-images/${post.coverImage}`
            : "/public/default-project.jpg",
          timeStamp: post.f_message_current,
          likes: Number(post.likes_count) || 0,
          shares: Number(post.shares_count) || 0,
        })),
        pagination: {
          total,
          pageCount,
          page,
          perpage,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching forum posts:", error);
    return res.status(500).json({
      status: "error",
      message: "Failed to fetch posts: " + error.message,
    });
  }
});

router.post("/like", async function (req, res) {
  try {
    const { message_id, member_id } = req.body;

    // Check if like already exists
    const [existingLike] = await pool.query(
      "SELECT * FROM f_like WHERE f_message_id = ? AND f_member_id = ?",
      [message_id, member_id]
    );

    if (existingLike.length > 0) {
      // Unlike - remove the existing like
      await pool.query(
        "DELETE FROM f_like WHERE f_message_id = ? AND f_member_id = ?",
        [message_id, member_id]
      );

      // Get updated like count
      const [likeCount] = await pool.query(
        "SELECT COUNT(*) as count FROM f_like WHERE f_message_id = ?",
        [message_id]
      );

      return res.json({
        status: "success",
        action: "unliked",
        likes: likeCount[0].count,
      });
    }

    // Add new like
    await pool.query(
      "INSERT INTO f_like (f_message_id, f_member_id) VALUES (?, ?)",
      [message_id, member_id]
    );

    // Get updated like count
    const [likeCount] = await pool.query(
      "SELECT COUNT(*) as count FROM f_like WHERE f_message_id = ?",
      [message_id]
    );

    res.json({
      status: "success",
      action: "liked",
      likes: likeCount[0].count,
    });
  } catch (error) {
    console.error("Error handling like:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to process like",
    });
  }
});

export default router;
