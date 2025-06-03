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

// Função para carregar favoritos do localStorage (agora compatível com o Código 1)
async function loadFavorites() {
    try {
        console.log('Iniciando carregamento de favoritos...');
        favoriteBooks = [];
        loadingBooks = true;
        
        // Mostra indicador de carregamento
        if (booksGrid) {
            booksGrid.innerHTML = `
                <div class="loading-state">
                    <div class="empty-icon">⏳</div>
                    <h3>Carregando seus livros favoritos...</h3>
                    <p>Aguarde um momento.</p>
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
    return text.replace(regex, '<span class="highlight-text">$1</span>');
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
        searchStatus.classList.remove('active');
        if (clearSearchBtn) clearSearchBtn.style.display = 'none';
        return;
    }

    if (clearSearchBtn) clearSearchBtn.style.display = 'block';
    searchStatus.classList.add('active');
    
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
            <div class="empty-state">
                <div class="empty-icon">📚</div>
                <h3>Nenhum livro favorito ainda</h3>
                <p>Explore nossa coleção e adicione seus livros favoritos!</p>
            </div>
        `;
        return;
    }

    if (isSearchActive && filteredBooks.length === 0) {
        booksGrid.innerHTML = `
            <div class="no-results">
                <div class="empty-icon">🔍</div>
                <h3>Nenhum resultado encontrado</h3>
                <p>Tente buscar por outro termo ou limpe a busca para ver todos os livros.</p>
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
            <div class="book-card ${isSearchActive ? 'highlight' : ''}" onclick="openBook(${originalIndex})">
                <img src="${book.cover}" alt="${book.title}" class="book-cover-img" style="width: 100px; height: 150px; object-fit: cover; margin-bottom: 10px;" onerror="this.src='https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRQjJ5mHArWKZohio_f2pwq1MmrqC0_T3TYug&s'">
                <h3 class="book-title">${highlightedTitle}</h3>
                <p class="book-author">por ${highlightedAuthor}</p>
                <div class="book-actions">
                    <button class="action-btn" onclick="event.stopPropagation(); viewBook(${originalIndex})">Ver detalhes</button>
                    <button class="action-btn remove-btn" onclick="event.stopPropagation(); removeBook(${originalIndex})">Remover</button>
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
    if (clearSearchBtn) clearSearchBtn.style.display = 'none';
    if (searchStatus) searchStatus.classList.remove('active');
    renderBooks();
    updateCount();
    if (searchInput) searchInput.focus();
}

// Event listeners para busca (com verificação de existência dos elementos)
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

    // Atalho para limpar busca com Escape
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
    
    // Redireciona para a página de detalhes do livro
    window.location.href = `index.html?id=${book.id}`;
}

function viewBook(index) {
    const book = favoriteBooks[index];
    if (!book) return;
    
    // Redireciona para a página de detalhes do livro
    window.location.href = `../TelaIndividual/index.html?id=${book.id}`;
}

function removeBook(index) {
    const book = favoriteBooks[index];
    if (!book) return;
    
    if (confirm(`Remover "${book.title}" dos favoritos?`)) {
        // Remove do localStorage usando o mesmo padrão do Código 1
        localStorage.removeItem(`favorite-${book.id}`);
        
        // Remove do array local
        favoriteBooks.splice(index, 1);
        
        // Atualizar busca se estiver ativa
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
        
        // Reaplica filtro se busca estiver ativa
        if (isSearchActive) {
            filterBooks(searchInput?.value || '');
        } else {
            filteredBooks = [...favoriteBooks];
        }
        
        renderBooks();
    });
}

// Função pública para adicionar livro aos favoritos (compatível com outras páginas)
function addToFavorites(book) {
    // Verifica se o livro já está nos favoritos
    const exists = favoriteBooks.some(fav => 
        fav.id === book.id || (fav.title === book.title && fav.author === book.author)
    );
    
    if (!exists) {
        favoriteBooks.push(book);
        // Salva no localStorage usando o padrão do Código 1
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

// Função para verificar se um livro está nos favoritos
function isInFavorites(book) {
    return favoriteBooks.some(fav => 
        fav.id === book.id || (fav.title === book.title && fav.author === book.author)
    );
}

// Função para obter todos os favoritos
function getFavorites() {
    return [...favoriteBooks];
}

// Função para recarregar favoritos (útil quando chamada de outras páginas)
async function reloadFavorites() {
    console.log('Recarregando favoritos...');
    await loadFavorites();
}

// Torna as funções disponíveis globalmente para outras páginas
window.addToFavorites = addToFavorites;
window.isInFavorites = isInFavorites;
window.getFavorites = getFavorites;
window.reloadFavorites = reloadFavorites;

// Inicialização quando a página carrega
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM carregado, iniciando aplicação...');
    
    // Pequeno delay para garantir que todos os elementos estão prontos
    setTimeout(() => {
        loadFavorites();
    }, 100);
});

// Atualiza a página quando o localStorage muda (ex: em outra aba)
window.addEventListener('storage', function(e) {
    if (e.key && e.key.startsWith('favorite-')) {
        console.log('Favorito alterado em outra aba, recarregando...');
        setTimeout(() => {
            reloadFavorites();
        }, 500);
    }
});

// Verifica periodicamente por mudanças nos favoritos
let lastFavoriteCount = 0;
setInterval(() => {
    let localStorageFavoriteCount = 0;
    
    // Conta quantos favoritos existem no localStorage
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('favorite-') && localStorage.getItem(key) === 'true') {
            localStorageFavoriteCount++;
        }
    }
    
    // Se a quantidade for diferente da última verificação, recarrega
    if (localStorageFavoriteCount !== lastFavoriteCount) {
        console.log('Detectada mudança nos favoritos, recarregando...');
        lastFavoriteCount = localStorageFavoriteCount;
        setTimeout(() => {
            reloadFavorites();
        }, 500);
    }
}, 3000); // Verifica a cada 3 segundos

// Função de debug para verificar localStorage
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
    console.log('========================');
}

// Torna a função de debug disponível globalmente
window.debugLocalStorage = debugLocalStorage;

// ========================================
// DARK MODE FUNCTIONALITY
// ========================================

// Função para alternar dark mode
function toggleDarkMode() {
    const body = document.body;
    const isDarkMode = body.classList.contains('dark-mode');
    
    if (isDarkMode) {
        body.classList.remove('dark-mode');
        localStorage.setItem('darkMode', 'false');
    } else {
        body.classList.add('dark-mode');
        localStorage.setItem('darkMode', 'true');
    }
}

// Função para carregar preferência salva
function loadDarkModePreference() {
    const savedMode = localStorage.getItem('darkMode');
    
    if (savedMode === 'true') {
        document.body.classList.add('dark-mode');
    }
}

// Inicializar dark mode quando a página carregar
document.addEventListener('DOMContentLoaded', function() {
    // Carregar preferência salva
    loadDarkModePreference();
    
    // Adicionar event listener ao botão
    const darkModeToggle = document.getElementById('darkModeToggle');
    if (darkModeToggle) {
        darkModeToggle.addEventListener('click', toggleDarkMode);
    }
});