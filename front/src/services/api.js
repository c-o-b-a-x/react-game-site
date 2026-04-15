const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "/api";

// placeholder image
const DEFAULT_COVER_IMAGE = "https://via.placeholder.com/300x450?text=No+Image";

function buildCoverUrl(url) {
  if (!url) return DEFAULT_COVER_IMAGE;

  const normalizedUrl = url.startsWith("//") ? `https:${url}` : url;

  if (normalizedUrl.includes("/t_thumb/")) {
    return normalizedUrl.replace("/t_thumb/", "/t_cover_big/");
  }

  return normalizedUrl;
}

function getReleaseYear(row) {
  const directYear =
    row.releaseYear ?? row.release_year ?? row.first_release_year ?? null;

  if (directYear) return Number(directYear);

  const dateValue =
    row.first_release_date ?? row.released_at ?? row.release_date ?? null;

  if (!dateValue) return "N/A";

  const parsedDate = new Date(dateValue);

  return Number.isNaN(parsedDate.getTime())
    ? "N/A"
    : parsedDate.getUTCFullYear();
}

// ⚠️ FIXED: score is NOT age rating
function getScore(row) {
  return row.score ?? "N/A";
}

// ------------------ NORMALIZER ------------------

export function normalizeGame(row) {
  return {
    id: row.id ?? row.game_id,

    title: row.title ?? row.name ?? "Unknown Game",

    // genres (Mongo array → string)
    genre: Array.isArray(row.genres)
      ? row.genres.join(", ")
      : (row.genre ?? "Unknown Genre"),

    // platforms (Mongo array → string)
    platform: Array.isArray(row.platforms)
      ? row.platforms.join(", ")
      : (row.platform ?? "Unknown Platform"),

    releaseYear: getReleaseYear(row),

    publisher: row.publisher ?? row.developer ?? "IGDB",

    score: getScore(row),

    coverImage: buildCoverUrl(row.cover_url ?? row.url),

    description: row.description ?? row.summary ?? "No description available.",

    // ⭐ FIXED: ONLY USE BACKEND FIELD
    ageRating: row.ageRating ?? "NR",

    featured: Boolean(row.featured ?? true),
  };
}

// ------------------ FETCH WRAPPER ------------------

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
    ...options,
  });

  if (!response.ok) {
    throw new Error(`Database request failed: ${response.status}`);
  }

  if (response.status === 204) return null;

  return response.json();
}

// ------------------ API CALLS ------------------

export async function getFeaturedGames() {
  const data = await request("/games/featured");
  const games = data?.games ?? [];
  return games.map(normalizeGame);
}

export async function searchGames(query) {
  const trimmed = query.trim();

  if (!trimmed) return getFeaturedGames();

  const data = await request(`/games/search?q=${encodeURIComponent(trimmed)}`);

  const games = data?.games ?? [];
  return games.map(normalizeGame);
}

export async function getGameById(id) {
  const data = await request(`/games/${id}`);

  return {
    game: data?.game ? normalizeGame(data.game) : null,
    similarGames: (data?.similarGames ?? []).map(normalizeGame),
  };
}

export async function createGame(gamePayload) {
  const data = await request("/games", {
    method: "POST",
    body: JSON.stringify(gamePayload),
  });

  return normalizeGame(data?.game ?? data ?? gamePayload);
}

export async function updateGame(id, updates) {
  const data = await request(`/games/${id}`, {
    method: "PUT",
    body: JSON.stringify(updates),
  });

  return normalizeGame(data?.game ?? data ?? { ...updates, game_id: id });
}

export async function deleteGame(id) {
  await request(`/games/${id}`, { method: "DELETE" });
  return { success: true, id };
}
