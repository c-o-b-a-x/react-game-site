import { useState, useEffect } from "react";
import MovieCard from "../components/MovieCard";
import { searchGames, getFeaturedGames } from "../services/api";
import "../css/Home.css";

function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const [games, setGames] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadFeaturedGames = async () => {
      try {
        const featuredGames = await getFeaturedGames();
        setGames(featuredGames);
        setError(null);
      } catch (err) {
        console.log(err);
        setError("Failed to load games.");
      } finally {
        setLoading(false);
      }
    };

    loadFeaturedGames();
  }, []);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (loading) return;

    const query = searchQuery.trim();
    setLoading(true);

    try {
      const results = query
        ? await searchGames(query)
        : await getFeaturedGames();
      setGames(results);
      setError(null);
    } catch (err) {
      console.log(err);
      setError("Failed to search games.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="home">
      <section className="hero-section">
        <p className="eyebrow">Game API</p>
        <h1>Discover your next favorite game</h1>
        <p className="hero-copy">
          Browse featured releases, search by title, and save standout picks to
          your favorites list.
        </p>
      </section>

      <form onSubmit={handleSearch} className="search-form">
        <input
          type="text"
          placeholder="Search for games..."
          className="search-input"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <button type="submit" className="search-button">
          Find Games
        </button>
      </form>

      {error && <div className="error-message">{error}</div>}

      {loading ? (
        <div className="loading">Loading games...</div>
      ) : (
        <div className="movies-grid">
          {games.length > 0 ? (
            games.map((game) => <MovieCard game={game} key={game.id} />)
          ) : (
            <div className="empty-state">
              No games matched your search. Try a different title.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default Home;
