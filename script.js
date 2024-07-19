const apiKey = '8d595551f86c5ed63a30f17469f09f1a';
const popularMoviesUrl = `https://api.themoviedb.org/3/movie/popular?api_key=${apiKey}`;
const genresUrl = `https://api.themoviedb.org/3/genre/movie/list?api_key=${apiKey}`;

const main = document.getElementById('main');
const searchContainer = document.getElementById('search-container');
const searchInput = document.getElementById('search-input');
const searchButton = document.getElementById('search-button');
const autocompleteResults = document.getElementById('autocomplete-results');
const moviesContainer = document.getElementById('movies-container');
const homeButton = document.getElementById('home-button');
const loadingSpinner = document.getElementById('loading-spinner');
const errorContainer = document.getElementById('error-container');
const paginationContainer = document.getElementById('pagination-container');
const genreFilter = document.getElementById('genre-filter');
const sortSelect = document.getElementById('sort-select');

let currentPage = 1;
let totalPages = 1;
let currentUrl = popularMoviesUrl;
let genres = {};

// Load popular movies and genres on page load
window.addEventListener('DOMContentLoaded', () => {
  fetchGenres();
  fetchMovies(currentUrl);
});

// Home button click event
homeButton.addEventListener('click', () => {
  currentUrl = popularMoviesUrl;
  currentPage = 1;
  fetchMovies(currentUrl);
});

// Search button click event
searchButton.addEventListener('click', () => {
  const searchTerm = searchInput.value;
  if (searchTerm) {
    currentUrl = `https://api.themoviedb.org/3/search/movie?api_key=${apiKey}&query=${encodeURIComponent(searchTerm)}`;
    currentPage = 1;
    fetchMovies(currentUrl);
  }
});

// Genre filter change event
genreFilter.addEventListener('change', () => {
  const selectedGenre = genreFilter.value;
  if (selectedGenre) {
    currentUrl = `https://api.themoviedb.org/3/discover/movie?api_key=${apiKey}&with_genres=${selectedGenre}`;
  } else {
    currentUrl = popularMoviesUrl;
  }
  currentPage = 1;
  fetchMovies(currentUrl);
});

// Sort select change event
sortSelect.addEventListener('change', () => {
  const sortBy = sortSelect.value;
  currentUrl = `${currentUrl}&sort_by=${sortBy}`;
  currentPage = 1;
  fetchMovies(currentUrl);
});

// Fetch genres
function fetchGenres() {
  fetch(genresUrl)
    .then(response => response.json())
    .then(data => {
      genres = Object.fromEntries(data.genres.map(genre => [genre.id, genre.name]));
      populateGenreFilter(data.genres);
    })
    .catch(error => {
      console.log('Error fetching genres:', error);
    });
}

// Populate genre filter
function populateGenreFilter(genresList) {
  genreFilter.innerHTML = '<option value="">All Genres</option>';
  genresList.forEach(genre => {
    const option = document.createElement('option');
    option.value = genre.id;
    option.textContent = genre.name;
    genreFilter.appendChild(option);
  });
}

// Fetch movies
function fetchMovies(url) {
  showLoadingSpinner();
  hideError();

  fetch(`${url}&page=${currentPage}`)
    .then(response => response.json())
    .then(data => {
      const movies = data.results;
      totalPages = data.total_pages;
      displayMovies(movies);
      displayPagination();
    })
    .catch(error => {
      displayError('An error occurred while fetching movies.');
      console.log(error);
    })
    .finally(() => {
      hideLoadingSpinner();
    });
}

// Display movies
function displayMovies(movies) {
  moviesContainer.innerHTML = '';
  movies.forEach((movie, index) => {
    const { id, title, poster_path, overview, genre_ids, vote_average, release_date } = movie;
    const movieCard = createMovieCard(id, title, poster_path, overview, genre_ids, vote_average, release_date, index);
    moviesContainer.appendChild(movieCard);
  });
}

// Create movie card
function createMovieCard(id, title, poster_path, overview, genre_ids, vote_average, release_date, index) {
  const movieCard = document.createElement('div');
  movieCard.classList.add('movie-card');
  movieCard.style.animationDelay = `${index * 0.1}s`;

  const posterUrl = poster_path
    ? `https://image.tmdb.org/t/p/w500${poster_path}`
    : 'no-image.jpg';

  const genreNames = genre_ids.map(id => genres[id]).join(', ');
  const releaseYear = new Date(release_date).getFullYear();

  movieCard.innerHTML = `
    <img src="${posterUrl}" alt="${title}" loading="lazy">
    <div class="movie-info">
      <h2>${title}</h2>
      <p class="movie-meta">
        <span class="release-year">${releaseYear}</span>
        <span class="rating">⭐ ${vote_average.toFixed(1)}</span>
      </p>
      <p class="genres">${genreNames}</p>
      <p class="overview">${overview}</p>
    </div>
    <button class="details-button">View Details</button>
  `;

  const detailsButton = movieCard.querySelector('.details-button');
  detailsButton.addEventListener('click', () => {
    displayMovieDetails(id);
  });

  return movieCard;
}

// Display movie details
function displayMovieDetails(movieId) {
  showLoadingSpinner();
  const movieDetailsUrl = `https://api.themoviedb.org/3/movie/${movieId}?api_key=${apiKey}&append_to_response=credits,videos`;

  fetch(movieDetailsUrl)
    .then(response => response.json())
    .then(movie => {
      const movieDetailsContainer = createMovieDetails(movie);
      main.innerHTML = '';
      main.appendChild(movieDetailsContainer);
      hideLoadingSpinner();
    })
    .catch(error => {
      displayError('An error occurred while fetching movie details.');
      console.log(error);
      hideLoadingSpinner();
    });
}

// Create movie details
function createMovieDetails(movie) {
  const { title, poster_path, overview, genres, vote_average, release_date, runtime, credits, videos } = movie;
  const movieDetailsContainer = document.createElement('div');
  movieDetailsContainer.classList.add('movie-details');

  const posterUrl = poster_path
    ? `https://image.tmdb.org/t/p/w500${poster_path}`
    : 'no-image.jpg';

  const director = credits.crew.find(person => person.job === 'Director')?.name || 'N/A';
  const cast = credits.cast.slice(0, 5).map(actor => actor.name).join(', ');
  const trailer = videos.results.find(video => video.type === 'Trailer');

  movieDetailsContainer.innerHTML = `
    <div class="details-content">
      <img src="${posterUrl}" alt="${title}">
      <div class="details-info">
        <h2>${title}</h2>
        <p><strong>Release Date:</strong> ${release_date}</p>
        <p><strong>Runtime:</strong> ${runtime} minutes</p>
        <p><strong>Rating:</strong> ⭐ ${vote_average.toFixed(1)}</p>
        <p><strong>Genres:</strong> ${genres.map(genre => genre.name).join(', ')}</p>
        <p><strong>Director:</strong> ${director}</p>
        <p><strong>Cast:</strong> ${cast}</p>
        <p><strong>Overview:</strong> ${overview}</p>
        ${trailer ? `
          <div class="trailer-container">
            <h3>Trailer</h3>
            <iframe width="560" height="315" src="https://www.youtube.com/embed/${trailer.key}" frameborder="0" allowfullscreen></iframe>
          </div>
        ` : ''}
      </div>
    </div>
    <button id="back-button" class="back-button">Back to Movies</button>
  `;

  const backButton = movieDetailsContainer.querySelector('#back-button');
  backButton.addEventListener('click', () => {
    fetchMovies(currentUrl);
  });

  return movieDetailsContainer;
}

// Display pagination
function displayPagination() {
  paginationContainer.innerHTML = '';
  const maxButtons = 5;
  const startPage = Math.max(1, currentPage - Math.floor(maxButtons / 2));
  const endPage = Math.min(totalPages, startPage + maxButtons - 1);

  if (currentPage > 1) {
    addPaginationButton('Previous', currentPage - 1);
  }

  for (let i = startPage; i <= endPage; i++) {
    addPaginationButton(i, i, i === currentPage);
  }

  if (currentPage < totalPages) {
    addPaginationButton('Next', currentPage + 1);
  }
}

// Add pagination button
function addPaginationButton(text, page, isActive = false) {
  const button = document.createElement('button');
  button.textContent = text;
  button.classList.add('pagination-button');
  if (isActive) {
    button.classList.add('active');
  }
  button.addEventListener('click', () => {
    currentPage = page;
    fetchMovies(currentUrl);
  });
  paginationContainer.appendChild(button);
}

// Show loading spinner
function showLoadingSpinner() {
  loadingSpinner.style.display = 'block';
}

// Hide loading spinner
function hideLoadingSpinner() {
  loadingSpinner.style.display = 'none';
}

// Display error message
function displayError(message) {
  errorContainer.textContent = message;
  errorContainer.style.display = 'block';
}

// Hide error message
function hideError() {
  errorContainer.style.display = 'none';
}

// Autocomplete search
searchInput.addEventListener('input', () => {
  const searchTerm = searchInput.value;

  if (searchTerm) {
    const autocompleteUrl = `https://api.themoviedb.org/3/search/movie?api_key=${apiKey}&query=${encodeURIComponent(searchTerm)}`;

    fetch(autocompleteUrl)
      .then(response => response.json())
      .then(data => {
        const movies = data.results.slice(0, 5);
        const autocompleteResultsHtml = movies
          .map(movie => `<li>${movie.title}</li>`)
          .join('');
        autocompleteResults.innerHTML = autocompleteResultsHtml;
        autocompleteResults.style.display = 'block';

        const autocompleteItems = autocompleteResults.querySelectorAll('li');
        autocompleteItems.forEach(item => {
          item.addEventListener('click', () => {
            searchInput.value = item.textContent;
            autocompleteResults.style.display = 'none';
            searchButton.click();
          });
        });
      })
      .catch(error => {
        console.log(error);
      });
  } else {
    autocompleteResults.style.display = 'none';
  }
});

// Close autocomplete results when clicking outside
document.addEventListener('click', (event) => {
  if (!searchContainer.contains(event.target)) {
    autocompleteResults.style.display = 'none';
  }
});

// Infinite scroll
window.addEventListener('scroll', () => {
  const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
  if (scrollTop + clientHeight >= scrollHeight - 5 && currentPage < totalPages) {
    currentPage++;
    fetchMovies(currentUrl);
  }
});