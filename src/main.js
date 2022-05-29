const api = axios.create({
  baseURL: 'https://api.themoviedb.org/3/',
  headers: {
    'Content-Type': 'application/json;charset=utf-8',
  },
  params: {
    'api_key': API_KEY,
  },
});


// Utils

  // todo: Agregando el lazyLoader, para mostrar solo las imagenes en el viewport. 
const lazyLoader = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      const url = entry.target.getAttribute('data-img')
      entry.target.setAttribute('src', url);
    }
  });
});

function createMovies(
  movies, 
  container, 
  {
    lazyLoad = false, 
    clean = true
  } = {}) {         // # = {}, es por si NO mandamos parametros o por si solo mandamos 1 parametro en el objeto

  if (clean) { 
    container.innerHTML = '';
  }

  movies.forEach(movie => {
    const movieContainer = document.createElement('div');
    movieContainer.classList.add('movie-container');
    movieContainer.addEventListener('click', () => {
      location.hash = '#movie=' + movie.id;
    });

    const movieImg = document.createElement('img');
    movieImg.classList.add('movie-img');
    movieImg.setAttribute('alt', movie.title);
    movieImg.setAttribute(
      lazyLoad ? 'data-img' : 'src',
      'https://image.tmdb.org/t/p/w300' + movie.poster_path,
    );
    movieImg.addEventListener('error', () => { 
      movieImg.setAttribute(
        'src',
        'https://http.cat/203.jpg'
      )
    })

      // ? Llamando al lazyLoader

    if (lazyLoad) {
      lazyLoader.observe(movieImg);
    }

    movieContainer.appendChild(movieImg);
    container.appendChild(movieContainer);
  });
}

function createCategories(categories, container) {
  container.innerHTML = "";

  categories.forEach(category => {  
    const categoryContainer = document.createElement('div');
    categoryContainer.classList.add('category-container');

    const categoryTitle = document.createElement('h3');
    categoryTitle.classList.add('category-title');
    categoryTitle.setAttribute('id', 'id' + category.id);
    categoryTitle.addEventListener('click', () => {
      location.hash = `#category=${category.id}-${category.name}`;
    });
    const categoryTitleText = document.createTextNode(category.name);

    categoryTitle.appendChild(categoryTitleText);
    categoryContainer.appendChild(categoryTitle);
    container.appendChild(categoryContainer);
  });
}

// Llamados a la API

async function getTrendingMoviesPreview() {
  const { data } = await api('trending/movie/day');
  const movies = data.results;
  console.log(movies)

  createMovies(movies, trendingMoviesPreviewList, true);
}

async function getCategegoriesPreview() {
  const { data } = await api('genre/movie/list');
  const categories = data.genres;

  createCategories(categories, categoriesPreviewList);
}

async function getMoviesByCategory(id) {
  const { data } = await api('discover/movie', {
    params: {
      with_genres: id,
    },
  });
  const movies = data.results;

  createMovies(movies, genericSection, true);
}

async function getMoviesBySearch(query) {
  const { data } = await api('search/movie', {
    params: {
      query,
    },
  });
  const movies = data.results;

  createMovies(movies, genericSection);
}

async function getTrendingMovies() {
  const { data } = await api('trending/movie/day');
  const movies = data.results;

  createMovies(movies, genericSection, { lazyLoad: true, clean: false});

  const btnLoadMore = document.createElement('button'); 
  btnLoadMore.innerHTML = 'Cargar Mas'; 
  btnLoadMore.addEventListener('click', getPaginatedTrendingMovies); 
  genericSection.appendChild(btnLoadMore)
}

let page = 1; 

const getPaginatedTrendingMovies = async () => { 
  // * El scrollTop, scrollHeight, clientHeight miden los eventos de scroll de la pantalla que esta viendo la app
  // const {} = [] ----> eso es una destructuracion. 
  const { 
    scrollTop,
    scrollHeight,
    clientHeight,
  } = document.documentElement;

  // - 15 , es por si el usuario no ha llegado hasta el fondo y alli le da un margen de error. 
  const scrollIsBotton = (scrollTop, + clientHeight ) >= (scrollHeight - 15);


  page++; 
  const { data } = await api('trending/movie/day', { 
    params: { 
      page: page, 
    }, 
  });
  const movies = data.results;

  createMovies(
    movies, 
    genericSection, 
    { lazyLoad: true, clean: false }); 
  
  const btnLoadMore = document.createElement('button'); 
  btnLoadMore.innerText = 'Cargar mas';
  btnLoadMore.addEventListener('click', getPaginatedTrendingMovies); 
  genericSection.appendChild(btnLoadMore); 
}

async function getMovieById(id) {
  const { data: movie } = await api('movie/' + id);

  const movieImgUrl = 'https://image.tmdb.org/t/p/w500' + movie.poster_path;
  console.log(movieImgUrl)
  headerSection.style.background = `
    linear-gradient(
      180deg,
      rgba(0, 0, 0, 0.35) 19.27%,
      rgba(0, 0, 0, 0) 29.17%
    ),
    url(${movieImgUrl})
  `;
  
  movieDetailTitle.textContent = movie.title;
  movieDetailDescription.textContent = movie.overview;
  movieDetailScore.textContent = movie.vote_average;

  createCategories(movie.genres, movieDetailCategoriesList);

  getRelatedMoviesId(id);
}

async function getRelatedMoviesId(id) {
  const { data } = await api(`movie/${id}/recommendations`);
  const relatedMovies = data.results;

  createMovies(relatedMovies, relatedMoviesContainer);
}