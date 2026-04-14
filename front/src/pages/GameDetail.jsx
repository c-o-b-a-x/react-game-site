import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import MovieCard from "../components/MovieCard";
import { getGameById } from "../services/api";
import "../css/Home.css";

function GameDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [game, setGame] = useState(null);
  const [similarGames, setSimilarGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const { game, similarGames } = await getGameById(id);
        setGame(game);
        setSimilarGames(similarGames);
      } catch (err) {
        setError("Failed to load game.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error-message">{error}</div>;
  if (!game) return null;

  return (
    <div className="game-detail">
      <button className="back-btn" onClick={() => navigate(-1)}>
        ← Back
      </button>

      <div className="game-detail-hero">
        <img
          className="game-detail-cover"
          src={game.coverImage}
          alt={game.title}
        />

        <div className="game-detail-info">
          <h1>{game.title}</h1>

          <div className="game-detail-chips">
            {game.score && game.score !== "N/A" && (
              <span className="game-chip">{game.score}</span>
            )}
            {game.genre && game.genre !== "Unknown Genre" && (
              <span className="game-chip">{game.genre}</span>
            )}
            {game.platform && game.platform !== "Unknown Platform" && (
              <span className="game-chip">{game.platform}</span>
            )}
            {game.releaseYear && game.releaseYear !== "N/A" && (
              <span className="game-chip">{game.releaseYear}</span>
            )}
          </div>

          <p className="game-detail-summary">{game.description}</p>
        </div>
      </div>

      {similarGames.length > 0 && (
        <section className="similar-games">
          <h2>Similar Games</h2>
          <div className="movies-grid">
            {similarGames.map((g) => (
              <MovieCard game={g} key={g.id} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

export default GameDetail;
