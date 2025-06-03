// Configuração do Tailwind CSS
tailwind.config = {
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                primary: {
                    50: '#f0fdf4',
                    500: '#22c55e',
                    600: '#16a34a',
                    700: '#15803d',
                }
            }
        }
    }
}

// Variáveis globais
let favoriteBooks = [];
let filteredBooks = [];
let currentSearchTerm = '';
let isSearchActive = false;
let loadingBooks = false;

// Elementos DOM
const searchInput = document.getElementById('searchInput');
const clearSearchBtn = document.getElementById('clearSearch');
const searchBtn = document.getElementById('searchBtn');
const searchStatus = document.getElementById('searchStatus');
const booksGrid = document.getElementById('booksGrid');
const favoritesCount = document.getElementById('favoritesCount');
const sortBtn = document.getElementById('sortBtn');

// Dark Mode Functions - VERSÃO MELHORADA
function detectSystemTheme() {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function applyDarkMode(isDark) {
    if (isDark) {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }
}

function toggleDarkMode() {
    const currentlyDark = document.documentElement.classList.contains('dark');
    const newMode = !currentlyDark;
    
    applyDarkMode(newMode);
    
    // Salva a preferência do usuário (override do sistema)
    localStorage.setItem('darkModeOverride', newMode ? 'dark' : 'light');
    
    console.log('Dark mode toggled:', newMode ? 'dark' : 'light');
}

function loadDarkModePreference() {
    const userOverride = localStorage.getItem('darkModeOverride');
    
    if (userOverride) {
        // Se o usuário já fez uma escolha manual, usa essa preferência
        applyDarkMode(userOverride === 'dark');
        console.log('Aplicando preferência do usuário:', userOverride);
    } else {
        // Se não há preferência manual, usa a do sistema
        const systemPrefersDark = detectSystemTheme();
        applyDarkMode(systemPrefersDark);
        console.log('Aplicando preferência do sistema:', systemPrefersDark ? 'dark' : 'light');
    }
}

function setupSystemThemeListener() {
    // Monitora mudanças na preferência do sistema
    if (window.matchMedia) {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        
        mediaQuery.addEventListener('change', (e) => {
            const userOverride = localStorage.getItem('darkModeOverride');
            
            // Só aplica mudança do sistema se usuário não tiver override ativo
            if (!userOverride) {
                applyDarkMode(e.matches);
                console.log('Sistema mudou para:', e.matches ? 'dark' : 'light');
            }
        });
    }
}

function resetToSystemTheme() {
    // Função para resetar para preferência do sistema (opcional)
    localStorage.removeItem('darkModeOverride');
    const systemPrefersDark = detectSystemTheme();
    applyDarkMode(systemPrefersDark);
    console.log('Resetado para preferência do sistema:', systemPrefersDark ? 'dark' : 'light');
}

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM carregado, iniciando aplicação...');
    
    // NOVA ORDEM: Primeiro configura o dark mode
    loadDarkModePreference();
    setupSystemThemeListener();
    
    // Adicionar event listener ao botão de dark mode
    const darkModeToggle = document.getElementById('darkModeToggle');
    if (darkModeToggle) {
        darkModeToggle.addEventListener('click', toggleDarkMode);
        
        // Opcional: Double click para resetar para sistema
        darkModeToggle.addEventListener('dblclick', resetToSystemTheme);
    }
    
    // Carregar favoritos
    setTimeout(() => {
        loadFavorites();
    }, 100);
});

// Atualiza quando localStorage muda
window.addEventListener('storage', function(e) {
    if (e.key && e.key.startsWith('favorite-')) {
        console.log('Favorito alterado em outra aba, recarregando...');
        setTimeout(() => {
            reloadFavorites();
        }, 500);
    }
});

// Verifica periodicamente por mudanças
let lastFavoriteCount = 0;
setInterval(() => {
    let localStorageFavoriteCount = 0;
    
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('favorite-') && localStorage.getItem(key) === 'true') {
            localStorageFavoriteCount++;
        }
    }
    
    if (localStorageFavoriteCount !== lastFavoriteCount) {
        console.log('Detectada mudança nos favoritos, recarregando...');
        lastFavoriteCount = localStorageFavoriteCount;
        setTimeout(() => {
            reloadFavorites();
        }, 500);
    }
}, 3000);

// Função de debug
function debugLocalStorage() {
    console.log('=== DEBUG LOCALSTORAGE ===');
    console.log('Total de itens:', localStorage.length);
    
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        const value = localStorage.getItem(key);
        if (key && key.startsWith('favorite-')) {
            console.log(`${key}: ${value}`);
        }
    }
    
    console.log('Favoritos carregados na memória:', favoriteBooks.length);
    console.log('Dark mode override:', localStorage.getItem('darkModeOverride'));
    console.log('Sistema prefere dark:', detectSystemTheme());
    console.log('========================');
}

window.debugLocalStorage = debugLocalStorage;

// Função para carregar favoritos do localStorage
async function loadFavorites() {
    try {
        console.log('Iniciando carregamento de favoritos...');
        favoriteBooks = [];
        loadingBooks = true;
        
        // Mostra indicador de carregamento
        if (booksGrid) {
            booksGrid.innerHTML = `
                <div class="col-span-full flex flex-col items-center justify-center py-16 text-center">
                    <div class="text-6xl mb-4">⏳</div>
                    <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">Carregando seus livros favoritos...</h3>
                    <p class="text-gray-600 dark:text-gray-400">Aguarde um momento.</p>
                </div>
            `;
        }
        
        // Array para armazenar as promessas de busca
        const fetchPromises = [];
        
        // Percorre todas as chaves do localStorage procurando por favoritos
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('favorite-') && localStorage.getItem(key) === 'true') {
                const volumeId = key.replace('favorite-', '');
                console.log('Encontrado favorito:', volumeId);
                
                // Adiciona a promessa de busca ao array
                fetchPromises.push(fetchBookData(volumeId));
            }
        }
        
        console.log(`Encontrados ${fetchPromises.length} favoritos para carregar`);
        
        // Aguarda todas as buscas serem concluídas
        if (fetchPromises.length > 0) {
            await Promise.all(fetchPromises);
        }
        
        loadingBooks = false;
        filteredBooks = [...favoriteBooks];
        
        console.log('Favoritos carregados:', favoriteBooks);
        
        // Renderiza os livros após carregar todos
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

// Função para buscar dados do livro na API
async function fetchBookData(volumeId) {
    try {
        console.log('Buscando dados do livro:', volumeId);
        const response = await fetch(`https://www.googleapis.com/books/v1/volumes/${volumeId}`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        const info = data.volumeInfo;
        
        if (!info) {
            console.warn('Informações do livro não encontradas:', volumeId);
            return;
        }
        
        const book = {
            id: volumeId,
            title: info.title || "Título não disponível",
            author: info.authors?.join(", ") || "Autor desconhecido",
            cover: info.imageLinks?.thumbnail || info.imageLinks?.smallThumbnail || "https://via.placeholder.com/150x220?text=Sem+Capa",
            description: info.description || "Descrição indisponível",
            publisher: info.publisher || "Desconhecida",
            publishedDate: info.publishedDate || "Desconhecida",
            pageCount: info.pageCount || "?",
            isbn: info.industryIdentifiers?.[0]?.identifier || "Indisponível",
            language: info.language?.toUpperCase() || "Desconhecido",
            categories: info.categories || []
        };
        
        // Verifica se o livro já não foi adicionado
        const exists = favoriteBooks.some(fav => fav.id === volumeId);
        if (!exists) {
            favoriteBooks.push(book);
            console.log('Livro adicionado:', book.title);
        }
        
    } catch (error) {
        console.error('Erro ao buscar dados do livro:', volumeId, error);
        
        // Remove o favorito inválido do localStorage
        localStorage.removeItem(`favorite-${volumeId}`);
    }
}

// Função para destacar texto de busca
function highlightText(text, searchTerm) {
    if (!searchTerm) return text;
    
    const regex = new RegExp(`(${searchTerm})`, 'gi');
    return text.replace(regex, '<span class="bg-yellow-200 dark:bg-yellow-600 text-yellow-900 dark:text-yellow-100 px-1 rounded font-semibold">$1</span>');
}

// Função para filtrar livros
function filterBooks(searchTerm) {
    if (!searchTerm.trim()) {
        filteredBooks = [...favoriteBooks];
        isSearchActive = false;
        updateSearchStatus();
        return;
    }

    isSearchActive = true;
    currentSearchTerm = searchTerm.toLowerCase();
    
    filteredBooks = favoriteBooks.filter(book => 
        book.title.toLowerCase().includes(currentSearchTerm) ||
        book.author.toLowerCase().includes(currentSearchTerm)
    );

    updateSearchStatus();
}

// Função para atualizar status da busca
function updateSearchStatus() {
    if (!searchStatus) return;
    
    if (!isSearchActive) {
        searchStatus.classList.add('hidden');
        if (clearSearchBtn) clearSearchBtn.classList.add('hidden');
        return;
    }

    if (clearSearchBtn) clearSearchBtn.classList.remove('hidden');
    searchStatus.classList.remove('hidden');
    
    if (filteredBooks.length === 0) {
        searchStatus.innerHTML = `Nenhum resultado encontrado para "<strong>${searchInput.value}</strong>"`;
    } else {
        const resultText = filteredBooks.length === 1 ? 'resultado encontrado' : 'resultados encontrados';
        searchStatus.innerHTML = `${filteredBooks.length} ${resultText} para "<strong>${searchInput.value}</strong>"`;
    }
}

// Função para renderizar livros
function renderBooks() {
    if (!booksGrid) {
        console.warn('Elemento booksGrid não encontrado');
        return;
    }
    
    if (loadingBooks) {
        return; // Não renderiza enquanto está carregando
    }
    
    if (favoriteBooks.length === 0) {
        booksGrid.innerHTML = `
            <div class="col-span-full flex flex-col items-center justify-center py-16 text-center">
                <div class="text-6xl mb-4">📚</div>
                <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">Nenhum livro favorito ainda</h3>
                <p class="text-gray-600 dark:text-gray-400">Explore nossa coleção e adicione seus livros favoritos!</p>
            </div>
        `;
        return;
    }

    if (isSearchActive && filteredBooks.length === 0) {
        booksGrid.innerHTML = `
            <div class="col-span-full flex flex-col items-center justify-center py-16 text-center">
                <div class="text-6xl mb-4">🔍</div>
                <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">Nenhum resultado encontrado</h3>
                <p class="text-gray-600 dark:text-gray-400">Tente buscar por outro termo ou limpe a busca para ver todos os livros.</p>
            </div>
        `;
        return;
    }

    const booksToShow = isSearchActive ? filteredBooks : favoriteBooks;
    
    booksGrid.innerHTML = booksToShow.map((book, index) => {
        const originalIndex = favoriteBooks.indexOf(book);
        const highlightedTitle = isSearchActive ? highlightText(book.title, searchInput?.value || '') : book.title;
        const highlightedAuthor = isSearchActive ? highlightText(book.author, searchInput?.value || '') : book.author;
        
        return `
            <div class="group bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 p-4 hover:shadow-lg hover:scale-105 transition-all duration-200 cursor-pointer ${isSearchActive ? 'ring-2 ring-blue-200 dark:ring-blue-700' : ''}" onclick="openBook(${originalIndex})">
                <div class="aspect-[3/4] bg-gray-200 dark:bg-gray-600 rounded-lg mb-3 overflow-hidden">
                    <img src="${book.cover}" alt="${book.title}" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-200" onerror="this.src='https://via.placeholder.com/150x220/6B7280/FFFFFF?text=Sem+Capa'">
                </div>
                <h3 class="font-semibold text-gray-900 dark:text-white text-sm line-clamp-2 mb-1">${highlightedTitle}</h3>
                <p class="text-gray-600 dark:text-gray-400 text-xs mb-3">por ${highlightedAuthor}</p>
                <div class="flex gap-2">
                    <button class="flex-1 px-3 py-1.5 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded text-xs font-medium hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors" onclick="event.stopPropagation(); viewBook(${originalIndex})">
                        Ver detalhes
                    </button>
                    <button class="px-3 py-1.5 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded text-xs font-medium hover:bg-red-200 dark:hover:bg-red-800 transition-colors" onclick="event.stopPropagation(); removeBook(${originalIndex})">
                        Remover
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

// Função para atualizar contador
function updateCount() {
    if (!favoritesCount) return;
    
    const totalBooks = favoriteBooks.length;
    const displayedBooks = isSearchActive ? filteredBooks.length : totalBooks;
    
    if (isSearchActive && filteredBooks.length > 0) {
        favoritesCount.textContent = `${displayedBooks} de ${totalBooks} livros`;
    } else {
        const bookText = totalBooks === 1 ? 'livro salvo' : 'livros salvos';
        favoritesCount.textContent = `${totalBooks} ${bookText}`;
    }
}

// Função para limpar busca
function clearSearch() {
    if (searchInput) searchInput.value = '';
    currentSearchTerm = '';
    isSearchActive = false;
    filteredBooks = [...favoriteBooks];
    if (clearSearchBtn) clearSearchBtn.classList.add('hidden');
    if (searchStatus) searchStatus.classList.add('hidden');
    renderBooks();
    updateCount();
    if (searchInput) searchInput.focus();
}

// Event listeners para busca
if (searchInput) {
    searchInput.addEventListener('input', function() {
        filterBooks(this.value);
        renderBooks();
        updateCount();
    });

    searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            filterBooks(this.value);
            renderBooks();
            updateCount();
        }
    });

    searchInput.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            clearSearch();
        }
    });
}

if (searchBtn) {
    searchBtn.addEventListener('click', function() {
        filterBooks(searchInput?.value || '');
        renderBooks();
        updateCount();
    });
}

if (clearSearchBtn) {
    clearSearchBtn.addEventListener('click', clearSearch);
}

// Funções dos livros
function openBook(index) {
    const book = favoriteBooks[index];
    if (!book) return;
    
    window.location.href = `index.html?id=${book.id}`;
}

function viewBook(index) {
    const book = favoriteBooks[index];
    if (!book) return;
    
    window.location.href = `../TelaIndividual/index.html?id=${book.id}`;
}

function removeBook(index) {
    const book = favoriteBooks[index];
    if (!book) return;
    
    if (confirm(`Remover "${book.title}" dos favoritos?`)) {
        localStorage.removeItem(`favorite-${book.id}`);
        favoriteBooks.splice(index, 1);
        
        if (isSearchActive) {
            filterBooks(searchInput?.value || '');
        } else {
            filteredBooks = [...favoriteBooks];
        }
        
        renderBooks();
        updateCount();
        
        console.log('Livro removido dos favoritos:', book.title);
    }
}

// Botão de ordenação
if (sortBtn) {
    sortBtn.addEventListener('click', function() {
        const isAscending = this.textContent.includes('↕') || this.textContent.includes('↓');
        
        if (isAscending) {
            favoriteBooks.sort((a, b) => a.title.localeCompare(b.title));
            this.textContent = 'Ordenar por título ↑';
        } else {
            favoriteBooks.sort((a, b) => b.title.localeCompare(a.title));
            this.textContent = 'Ordenar por título ↓';
        }
        
        if (isSearchActive) {
            filterBooks(searchInput?.value || '');
        } else {
            filteredBooks = [...favoriteBooks];
        }
        
        renderBooks();
    });
}

// Funções públicas
function addToFavorites(book) {
    const exists = favoriteBooks.some(fav => 
        fav.id === book.id || (fav.title === book.title && fav.author === book.author)
    );
    
    if (!exists) {
        favoriteBooks.push(book);
        localStorage.setItem(`favorite-${book.id}`, 'true');
        console.log('Livro adicionado aos favoritos:', book);
        
        if (!isSearchActive) {
            filteredBooks = [...favoriteBooks];
        }
        
        renderBooks();
        updateCount();
        return true;
    }
    
    console.log('Livro já está nos favoritos:', book);
    return false;
}

function isInFavorites(book) {
    return favoriteBooks.some(fav => 
        fav.id === book.id || (fav.title === book.title && fav.author === book.author)
    );
}

function getFavorites() {
    return [...favoriteBooks];
}

async function reloadFavorites() {
    console.log('Recarregando favoritos...');
    await loadFavorites();
}

// Torna as funções disponíveis globalmente
window.addToFavorites = addToFavorites;
window.isInFavorites = isInFavorites;
window.getFavorites = getFavorites;
window.reloadFavorites = reloadFavorites;
window.resetToSystemTheme = resetToSystemTheme; // Função extra para debug