const form = document.getElementById('searchForm');
const results = document.getElementById('results');
const titleInput = document.getElementById('title');
const suggestionsList = document.getElementById('suggestions');

//Debounce function to avoid firing too often
function debounce(func, delay) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => func.apply(this, args), delay);
  };
}

//Fetching TMDb banner data
async function fetchTMDbData(title, type) {
  const mediaType = (type && type.toLowerCase().includes('tv')) ? 'tv' : 'movie';
  const url = `${TMDB_BASE_URL}/search/${mediaType}?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(title)}&page=1`;

  try {
    const response = await fetch(url);
    const data = await response.json();
    if (data.results && data.results.length > 0) {
      return data.results[0];
    }
  } catch (err) {
    console.error('TMDb fetch error:', err);
  }
  return null;
}

//Handling form submission
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  results.innerHTML = '';
  suggestionsList.innerHTML = '';
  currentSuggestions = [];

  const data = {
    title: titleInput.value,
    filters: {
      genre: document.getElementById('genre').value,
      year: document.getElementById('year').value,
      type: document.getElementById('type').value,
      age_group: document.getElementById('age_group').value
    }
  };

  const res = await fetch('/recommend', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });

  const response = await res.json();

  if (response.error) {
    results.innerHTML = `<li>${response.error}</li>`;
    return;
  }

  const moviesWithTMDb = await Promise.all(response.map(async movie => {
    const tmdbData = await fetchTMDbData(movie.title, movie.type);
    return { ...movie, tmdbData };
  }));

  results.innerHTML = '';
  results.className = 'movies-grid';

  moviesWithTMDb.forEach(movie => {
    const posterPath = movie.tmdbData && movie.tmdbData.poster_path ? TMDB_IMG_BASE + movie.tmdbData.poster_path : '';
    const overview = movie.tmdbData?.overview || 'No description available';

    const div = document.createElement('div');
    div.className = 'movie-card';

    div.innerHTML = `
      <div class="poster-container">
        ${posterPath ? `<img src="${posterPath}" alt="${movie.title} poster" />` : `<div class="no-poster">No Image</div>`}
        <div class="overlay">
          <p><strong>Type:</strong> ${movie.type || 'N/A'}</p>
          <p><strong>Director:</strong> ${movie.director || 'N/A'}</p>
          <p><strong>Release Year:</strong> ${movie.release_year || 'N/A'}</p>
          <p><strong>Cast:</strong> ${movie.cast || 'N/A'}</p>
          <p><strong>Rating:</strong> ${movie.rating || 'N/A'}</p>
          <p><strong>Duration:</strong> ${movie.duration ? `${movie.duration} ${movie.type === 'Movie'? 'mins': movie.duration == '1'? 'season': 'seasons'}`: 'N/A'}</p>
          <p><strong>Genre:</strong> ${movie.listed_in || 'N/A'}</p>
          <p><strong>Description:</strong> ${overview}</p>
        </div>
      </div>
      <div class="title">${movie.title}</div>
    `;

    results.appendChild(div);
  });
});

//Suggestion logic
let lastQuery = '';
let currentSuggestions = [];

const handleSuggestions = debounce(async () => {
  const query = titleInput.value.trim();

  if (query.length < 2) {
    suggestionsList.innerHTML = '';
    currentSuggestions = [];
    return;
  }

  if (query === lastQuery) return;
  lastQuery = query;

  try {
    const res = await fetch(`/suggest?q=${encodeURIComponent(query)}`);
    const suggestions = await res.json();

    if (JSON.stringify(suggestions) === JSON.stringify(currentSuggestions)) return;

    currentSuggestions = suggestions;
    suggestionsList.innerHTML = '';

    suggestions.forEach(suggestion => {
      const li = document.createElement('li');
      li.textContent = suggestion;
      li.className = 'suggestion-item';
      li.addEventListener('click', () => {
        titleInput.value = suggestion;
        suggestionsList.innerHTML = '';
        currentSuggestions = [];
      });
      suggestionsList.appendChild(li);
    });

  } catch (err) {
    console.error('Suggestion fetch error:', err);
  }
}, 200);

titleInput.addEventListener('input', handleSuggestions);

//Hiding suggestions when clicking outside
document.addEventListener('click', (e) => {
  if (e.target !== titleInput) {
    suggestionsList.innerHTML = '';
    currentSuggestions = [];
  }
});
