import "../css/MovieCard.css";
import { useGameContext } from "../contexts/MovieContext";
import { useNavigate } from "react-router-dom";

function MovieCard({ game }) {
  const { isFavorite, addToFavorites, removeFromFavorites } = useGameContext();
  const favorite = isFavorite(game.id);
  const navigate = useNavigate();

  function onFavoriteClick(e) {
    e.stopPropagation();
    if (favorite) {
      removeFromFavorites(game.id);
    } else {
      addToFavorites(game);
    }
  }

  return (
    <article
      className="movie-card"
      onClick={() => navigate(`/game/${game.id}`)}
    >
      <div className="movie-poster">
        <img src={game.coverImage} alt={game.title} />
        <div className="movie-overlay">
          <div className="game-chip-row">
            <span className="game-chip">{game.genre}</span>
            <span className="game-chip">{game.platform}</span>
          </div>
          <button
            className={`favorite-btn ${favorite ? "active" : ""}`}
            onClick={onFavoriteClick}
            aria-label={favorite ? "Remove from favorites" : "Add to favorites"}
          >
            ♥
          </button>
        </div>
      </div>

      <div className="movie-info">
        <div className="game-info-header">
          <h3>{game.title}</h3>
          <span className="game-score">{game.score}</span>
        </div>
        <p>{game.description}</p>
      </div>
    </article>
  );
}

export default MovieCard;
