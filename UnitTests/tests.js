const https = require('https');

// Simulação do localStorage no Node.js
const localStorageMock = (() => {
  let store = {};
  return {
    getItem(key) {
      return store[key] || null;
    },
    setItem(key, value) {
      store[key] = value.toString();
    },
    removeItem(key) {
      delete store[key];
    },
    clear() {
      store = {};
    },
    key(i) {
      return Object.keys(store)[i] || null;
    },
    get length() {
      return Object.keys(store).length;
    },
    getStore() {
      return store;
    }
  };
})();

// Função para fazer requisição GET e retornar Promise com JSON parseado
function httpsGetJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';

      res.on('data', chunk => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve(json);
        } catch (e) {
          reject(new Error('Erro ao parsear JSON: ' + e.message));
        }
      });

    }).on('error', (err) => {
      reject(err);
    });
  });
}

// Busca dados do livro pelo volumeId
async function fetchBookData(volumeId) {
  const url = `https://www.googleapis.com/books/v1/volumes/${volumeId}`;
  try {
    const data = await httpsGetJson(url);
    favoriteBooks.push(data);
    console.log(`Livro carregado: ${data.volumeInfo.title}`);
  } catch (err) {
    console.error(`Erro ao buscar dados do livro ${volumeId}:`, err.message);
  }
}

// Simula renderização e atualização
function renderBooks() {
  console.log(`Renderizando ${filteredBooks.length} livros:`);
  filteredBooks.forEach(book => {
    console.log(' -', book.volumeInfo.title);
  });
}
function updateCount() {
  console.log(`Total de livros exibidos: ${filteredBooks.length}`);
}

// Variáveis globais
let favoriteBooks = [];
let filteredBooks = [];
let loadingBooks = false;

// Carrega favoritos do "localStorage"
async function loadFavorites() {
  try {
    console.log('Iniciando carregamento de favoritos...');
    favoriteBooks = [];
    loadingBooks = true;

    const fetchPromises = [];

    for (let i = 0; i < localStorageMock.length; i++) {
      const key = localStorageMock.key(i);
      if (key && key.startsWith('favorite-') && localStorageMock.getItem(key) === 'true') {
        const volumeId = key.replace('favorite-', '');
        console.log('Encontrado favorito:', volumeId);
        fetchPromises.push(fetchBookData(volumeId));
      }
    }

    console.log(`Encontrados ${fetchPromises.length} favoritos para carregar`);

    if (fetchPromises.length > 0) {
      await Promise.all(fetchPromises);
    }

    loadingBooks = false;
    filteredBooks = [...favoriteBooks];

    console.log('Favoritos carregados:', filteredBooks.map(b => b.volumeInfo.title));

    renderBooks();
    updateCount();

  } catch (error) {
    console.error('Erro ao carregar favoritos do localStorage:', error);
    favoriteBooks = [];
    filteredBooks = [];
    loadingBooks = false;
    renderBooks();
    updateCount();
  }
}

// Alterna favorito no localStorage mock
function testFavoriteStorage(volumeId) {
  const favoriteKey = `favorite-${volumeId}`;

  let isFavorited = localStorageMock.getItem(favoriteKey) === "true";
  console.log(`Antes: Favorito de ${volumeId} =`, isFavorited);

  isFavorited = !isFavorited;

  localStorageMock.setItem(favoriteKey, isFavorited);
  console.log(`Depois: Favorito de ${volumeId} =`, isFavorited);

  return isFavorited;
}

// Testa busca de livros na API Google Books
async function testSearchBooks() {
  const baseUrl = 'https://www.googleapis.com/books/v1/volumes';
  let currentQuery = 'javascript';
  let currentGenre = 'programming';
  let startIndex = 0;
  let maxResults = 5;

  try {
    let searchQuery = currentQuery;
    if (currentGenre) {
      searchQuery += `+subject:${currentGenre}`;
    }

    const url = `${baseUrl}?q=${encodeURIComponent(searchQuery)}&startIndex=${startIndex}&maxResults=${maxResults}&orderBy=relevance`;
    console.log('URL de requisição:', url);

    const data = await httpsGetJson(url);

    if (data.items && data.items.length > 0) {
      console.log(`Total de livros encontrados: ${data.totalItems}`);
      console.log('Alguns livros:', data.items.map(item => item.volumeInfo.title));
    } else {
      console.log('Nenhum livro encontrado para essa consulta.');
    }
  } catch (error) {
    console.error('Erro ao buscar livros:', error);
  }
}

// Execução sequencial
(async () => {
  await testSearchBooks();

  console.log('\n=== Teste de favoritos no localStorage mock ===');
  const testVolumeId = 'zyTCAlFPjgYC'; // Exemplo volumeId do Google Books

  testFavoriteStorage(testVolumeId);
  testFavoriteStorage(testVolumeId);
  testFavoriteStorage(testVolumeId);

  console.log('\n=== Carregando favoritos (só os marcados como true) ===');
  await loadFavorites();

  console.log('\nEstado final do armazenamento simulado:', localStorageMock.getStore());
})();
