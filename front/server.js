import express from "express";
import mysql from "mysql2/promise";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

// ✅ MySQL pool (auto reconnects)
const db = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "password",
  database: "igdb",
});

// ✅ Test DB connection on startup
async function testDB() {
  try {
    const conn = await db.getConnection();
    console.log("✅ Database connected");
    conn.release();
  } catch (err) {
    console.error("❌ Database connection failed:", err.message);
  }
}

// ------------------ ROUTES ------------------

// GET featured games
app.get("/api/games/featured", async (req, res) => {
  try {
    const [rows] = await db.query(`
  SELECT g.game_id, g.name, g.summary,
         (SELECT url FROM game_covers WHERE game_id = g.game_id LIMIT 1) AS cover_url,
         (SELECT r.description
          FROM game_age_ratings gar
          JOIN age_ratings ar ON gar.age_rating_id = ar.id
          JOIN ratings r ON ar.rating_id = r.id
          WHERE gar.game_id = g.game_id
          LIMIT 1) AS age_rating,
         (SELECT GROUP_CONCAT(DISTINCT ge.name SEPARATOR ', ')
          FROM game_genre gg
          JOIN genres ge ON gg.genre_id = ge.genre_id
          WHERE gg.game_id = g.game_id) AS genres,
         (SELECT GROUP_CONCAT(DISTINCT p.name SEPARATOR ', ')
          FROM game_platform gp
          JOIN platforms p ON gp.platform_id = p.platform_id
          WHERE gp.game_id = g.game_id) AS platforms
  FROM games g
  LIMIT 20
`);

    const seen = new Set();
    const games = rows.filter((row) => {
      if (seen.has(row.game_id)) return false;
      seen.add(row.game_id);
      return true;
    });

    res.json({ games });
  } catch (err) {
    console.error("❌ Featured error:", err);
    res.status(500).json({ error: "Database error" });
  }
});

// SEARCH
app.get("/api/games/search", async (req, res) => {
  const q = req.query.q || "";
  try {
    const [rows] = await db.query(
      `SELECT * FROM games WHERE name LIKE ? LIMIT 20`,
      [`%${q}%`],
    );
    res.json({ games: rows });
  } catch (err) {
    console.error("❌ Search error:", err);
    res.status(500).json({ error: "Search failed" });
  }
});

// GET BY ID
app.get("/api/games/:id", async (req, res) => {
  try {
    const [rows] = await db.query(
      `
      SELECT g.game_id, g.name, g.summary,
             (SELECT url FROM game_covers WHERE game_id = g.game_id LIMIT 1) AS cover_url,
             (SELECT r.description
              FROM game_age_ratings gar
              JOIN age_ratings ar ON gar.age_rating_id = ar.id
              JOIN ratings r ON ar.rating_id = r.id
              WHERE gar.game_id = g.game_id LIMIT 1) AS age_rating,
             (SELECT GROUP_CONCAT(DISTINCT ge.name SEPARATOR ', ')
              FROM game_genre gg
              JOIN genres ge ON gg.genre_id = ge.genre_id
              WHERE gg.game_id = g.game_id) AS genres,
             (SELECT GROUP_CONCAT(DISTINCT p.name SEPARATOR ', ')
              FROM game_platform gp
              JOIN platforms p ON gp.platform_id = p.platform_id
              WHERE gp.game_id = g.game_id) AS platforms
      FROM games g
      WHERE g.game_id = ?
    `,
      [req.params.id],
    );

    const [similarRows] = await db.query(
      `
      SELECT g.game_id, g.name, g.summary,
             (SELECT url FROM game_covers WHERE game_id = g.game_id LIMIT 1) AS cover_url,
             (SELECT r.description
              FROM game_age_ratings gar
              JOIN age_ratings ar ON gar.age_rating_id = ar.id
              JOIN ratings r ON ar.rating_id = r.id
              WHERE gar.game_id = g.game_id LIMIT 1) AS age_rating,
             (SELECT GROUP_CONCAT(DISTINCT ge.name SEPARATOR ', ')
              FROM game_genre gg
              JOIN genres ge ON gg.genre_id = ge.genre_id
              WHERE gg.game_id = g.game_id) AS genres,
             (SELECT GROUP_CONCAT(DISTINCT p.name SEPARATOR ', ')
              FROM game_platform gp
              JOIN platforms p ON gp.platform_id = p.platform_id
              WHERE gp.game_id = g.game_id) AS platforms
      FROM game_similar gs
      JOIN games g ON gs.similar_game_id = g.game_id
      WHERE gs.game_id = ?
      LIMIT 6
    `,
      [req.params.id],
    );

    res.json({ game: rows[0], similarGames: similarRows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Fetch failed" });
  }
});

// CREATE
app.post("/api/games", async (req, res) => {
  try {
    const { name, summary } = req.body;
    const [result] = await db.query(
      `INSERT INTO games (name, summary) VALUES (?, ?)`,
      [name, summary],
    );
    res.json({ game: { game_id: result.insertId, name, summary } });
  } catch (err) {
    console.error("❌ Create error:", err);
    res.status(500).json({ error: "Create failed" });
  }
});

// UPDATE
app.put("/api/games/:id", async (req, res) => {
  try {
    const { name, summary } = req.body;
    await db.query(`UPDATE games SET name=?, summary=? WHERE game_id=?`, [
      name,
      summary,
      req.params.id,
    ]);
    res.json({ game: { game_id: req.params.id, name, summary } });
  } catch (err) {
    console.error("❌ Update error:", err);
    res.status(500).json({ error: "Update failed" });
  }
});

// DELETE
app.delete("/api/games/:id", async (req, res) => {
  try {
    await db.query(`DELETE FROM games WHERE game_id=?`, [req.params.id]);
    res.sendStatus(204);
  } catch (err) {
    console.error("❌ Delete error:", err);
    res.status(500).json({ error: "Delete failed" });
  }
});

// ------------------ START SERVER ------------------

const PORT = 3000;

async function startServer() {
  try {
    await testDB(); // test connection first

    app.listen(PORT, () => {
      console.log(`🚀 API running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("❌ Server failed to start:", err);
  }
}

startServer();
