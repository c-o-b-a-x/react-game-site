import { Routes, Route } from "react-router-dom";
import "./css/App.css";
import Favorite from "./pages/favorites.jsx";
import Home from "./pages/home.jsx";
import NavBar from "./components/NavBar";
import { MovieProvider } from "./contexts/MovieContext.jsx";

function App() {
  return (
    <MovieProvider>
      <NavBar />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/favorites" element={<Favorite />} />
        </Routes>
      </main>
    </MovieProvider>
  );
}

export default App;
