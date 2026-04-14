import { createContext, useState, useContext, useEffect } from "react";

const GameContext = createContext();
const FAVORITES_STORAGE_KEY = "favoriteGames";

export const useGameContext = () => useContext(GameContext);

export const GameProvider = ({ children }) => {
  const [favorites, setFavorites] = useState([]);

  useEffect(() => {
    const storedFavorites = localStorage.getItem(FAVORITES_STORAGE_KEY);

    if (storedFavorites) {
      setFavorites(JSON.parse(storedFavorites));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favorites));
  }, [favorites]);

  const addToFavorites = (game) => {
    setFavorites((prev) =>
      prev.some((favoriteGame) => favoriteGame.id === game.id)
        ? prev
        : [...prev, game],
    );
  };

  const removeFromFavorites = (gameId) => {
    setFavorites((prev) => prev.filter((game) => game.id !== gameId));
  };

  const isFavorite = (gameId) => {
    return favorites.some((game) => game.id === gameId);
  };

  return (
    <GameContext.Provider
      value={{ favorites, addToFavorites, removeFromFavorites, isFavorite }}
    >
      {children}
    </GameContext.Provider>
  );
};
