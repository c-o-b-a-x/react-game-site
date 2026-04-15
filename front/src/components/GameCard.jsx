import "../css/GameCard.css";
import { useGameContext } from "../contexts/GameContext";
import { useNavigate } from "react-router-dom";

function GameCard({ game }) {
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
    <article className="Game-card" onClick={() => navigate(`/game/${game.id}`)}>
      <div className="Game-poster">
        <img src={game.coverImage} alt={game.title} />
        <div className="Game-overlay">
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

      <div className="Game-info">
        <div className="game-info-header">
          <h3>{game.title}</h3>
          <span className="game-score">{game.ageRating}</span>
        </div>
        <p>{game.description}</p>
      </div>
    </article>
  );
}

export default GameCard;
