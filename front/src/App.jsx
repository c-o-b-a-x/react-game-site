import { Routes, Route } from "react-router-dom";
import "./css/App.css";
import Favorite from "./pages/favorites.jsx";
import Home from "./pages/home.jsx";
import NavBar from "./components/NavBar";
import { GameProvider } from "./contexts/MovieContext.jsx";
import GameDetail from "./pages/GameDetail";
function App() {
  return (
    <GameProvider>
      <NavBar />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/favorites" element={<Favorite />} />
          <Route path="/game/:id" element={<GameDetail />} />
        </Routes>
      </main>
    </GameProvider>
  );
}

export default App;
