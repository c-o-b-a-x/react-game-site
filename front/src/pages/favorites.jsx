import "../css/Favorites.css";
import { useGameContext } from "../contexts/MovieContext";
import MovieCard from "../components/MovieCard";

function Favorites() {
  const { favorites } = useGameContext();

  if (favorites.length > 0) {
    return (
      <div className="favorites">
        <h2>Your Favorite Games</h2>
        <div className="movies-grid">
          {favorites.map((game) => (
            <MovieCard game={game} key={game.id} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="favorites-empty">
      <h2>No Favorite Games Yet</h2>
      <p>Save a few titles and your shortlist will appear here.</p>
    </div>
  );
}

export default Favorites;
