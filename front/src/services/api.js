const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "/api";

// ✅ FIX: no more Hollow Knight fallback
const DEFAULT_COVER_IMAGE = "https://via.placeholder.com/300x450?text=No+Image";

function buildCoverUrl(url) {
  if (!url) return DEFAULT_COVER_IMAGE;

  const normalizedUrl = url.startsWith("//") ? `https:${url}` : url;

  // IGDB images usually come as t_thumb → upgrade quality
  if (normalizedUrl.includes("/t_thumb/")) {
    return normalizedUrl.replace("/t_thumb/", "/t_cover_big/");
  }

  return normalizedUrl;
}

function pickFirstValue(value) {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
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

function getScore(row) {
  if (row.age_rating == null || row.age_rating === "") return "N/A";
  return row.age_rating;
}

export function normalizeGame(row) {
  return {
    id: row.id ?? row.game_id,

    title: row.title ?? row.name ?? "Unknown Game",

    // ✅ Mongo returns arrays already
    genre: Array.isArray(row.genres)
      ? row.genres.join(", ")
      : (row.genre ?? "Unknown Genre"),

    platform: Array.isArray(row.platforms)
      ? row.platforms.join(", ")
      : (row.platform ?? "Unknown Platform"),

    releaseYear: getReleaseYear(row),

    publisher: row.publisher ?? row.developer ?? row.developer_name ?? "IGDB",

    score: getScore(row),

    // ✅ Mongo will give cover_url directly
    coverImage: buildCoverUrl(row.cover_url ?? row.url),

    description: row.description ?? row.summary ?? "No description available.",

    ageRating:
      row.ageRating ??
      row.rating_description ??
      (Array.isArray(row.age_ratings) ? row.age_ratings[0] : row.age_ratings) ??
      "NR",

    featured: Boolean(row.featured ?? true),
  };
}

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
  const games = data?.games ?? data ?? [];
  return games.map(normalizeGame);
}

export async function searchGames(query) {
  const trimmedQuery = query.trim();

  if (!trimmedQuery) return getFeaturedGames();

  const data = await request(
    `/games/search?q=${encodeURIComponent(trimmedQuery)}`,
  );

  const games = data?.games ?? data ?? [];

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
