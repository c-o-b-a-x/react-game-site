import express from "express";
import cors from "cors";
import { MongoClient } from "mongodb";
import dotenv from "dotenv";
dotenv.config();

console.log("MONGO:", process.env.MONGO_URI);

const app = express();
app.use(cors());
app.use(express.json());

// ------------------ MONGO SETUP ------------------

const client = new MongoClient(process.env.MONGO_URI, {
  serverSelectionTimeoutMS: 5000,
});
await client.connect();

const db = client.db("IGDB");

// collections
const Games = db.collection("games");
const Covers = db.collection("game_covers");
const GameGenre = db.collection("game_genre");
const Genres = db.collection("genres");
const GamePlatform = db.collection("game_platform");
const Platforms = db.collection("platforms");
const GameSimilar = db.collection("game_similar");

// ------------------ HELPERS ------------------
async function enrichGame(game) {
  if (!game) return null;

  const gameId = game.game_id;

  const cover = await Covers.findOne({ game_id: gameId });

  // genres
  const genreLinks = await GameGenre.find({ game_id: gameId }).toArray();
  const genreIds = genreLinks.map((g) => g.genre_id);
  const genres = await Genres.find({
    genre_id: { $in: genreIds },
  }).toArray();

  // platforms
  const platformLinks = await GamePlatform.find({ game_id: gameId }).toArray();
  const platformIds = platformLinks.map((p) => p.platform_id);
  const platforms = await Platforms.find({
    platform_id: { $in: platformIds },
  }).toArray();

  // ⭐ AGE RATINGS (THIS WAS MISSING)
  const ageLinks = await db
    .collection("game_age_ratings")
    .find({ game_id: gameId })
    .toArray();

  const ageIds = ageLinks.map((a) => a.age_rating_id);

  const ageRatings = await db
    .collection("age_ratings")
    .find({ id: { $in: ageIds } })
    .toArray();

  const ratings = await db
    .collection("ratings")
    .find({ id: { $in: ageRatings.map((r) => r.rating_id) } })
    .toArray();

  return {
    game_id: game.game_id,
    name: game.name,
    summary: game.summary,
    cover_url: cover?.url ?? null,

    genres: genres.map((g) => g.name),
    platforms: platforms.map((p) => p.name),

    // ⭐ FIXED AGE RATING
    ageRating: ratings[0]?.description ?? "NR",
  };
}

// ------------------ ROUTES ------------------

// GET featured games
app.get("/api/games/featured", async (req, res) => {
  try {
    const games = await Games.find({}).limit(20).toArray();

    const enriched = await Promise.all(games.map(enrichGame));

    res.json({ games: enriched });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch featured games" });
  }
});

// SEARCH
app.get("/api/games/search", async (req, res) => {
  try {
    const q = req.query.q || "";

    const games = await Games.find({
      name: { $regex: q, $options: "i" },
    })
      .limit(20)
      .toArray();

    const enriched = await Promise.all(games.map(enrichGame));

    res.json({ games: enriched });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Search failed" });
  }
});

// GET BY ID
app.get("/api/games/:id", async (req, res) => {
  try {
    const gameId = Number(req.params.id);

    const game = await Games.findOne({ game_id: gameId });
    const enrichedGame = await enrichGame(game);

    // similar games
    const similarLinks = await GameSimilar.find({ game_id: gameId }).toArray();
    const similarIds = similarLinks.map((s) => s.similar_game_id);

    const similarGamesRaw = await Games.find({
      game_id: { $in: similarIds },
    })
      .limit(6)
      .toArray();

    const similarGames = await Promise.all(similarGamesRaw.map(enrichGame));

    res.json({
      game: enrichedGame,
      similarGames,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Fetch failed" });
  }
});

// CREATE
app.post("/api/games", async (req, res) => {
  try {
    const result = await Games.insertOne(req.body);
    res.json({ game: { ...req.body, _id: result.insertedId } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Create failed" });
  }
});

// UPDATE
app.put("/api/games/:id", async (req, res) => {
  try {
    const gameId = Number(req.params.id);

    await Games.updateOne({ game_id: gameId }, { $set: req.body });

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Update failed" });
  }
});

// DELETE
app.delete("/api/games/:id", async (req, res) => {
  try {
    const gameId = Number(req.params.id);

    await Games.deleteOne({ game_id: gameId });

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Delete failed" });
  }
});

// ------------------ START ------------------

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
