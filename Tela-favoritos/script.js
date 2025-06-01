// Variáveis globais
let favoriteBooks = [];
let filteredBooks = [];
let currentSearchTerm = '';
let isSearchActive = false;

// Elementos DOM
const searchInput = document.getElementById('searchInput');
const clearSearchBtn = document.getElementById('clearSearch');
const searchBtn = document.getElementById('searchBtn');
const searchStatus = document.getElementById('searchStatus');
const booksGrid = document.getElementById('booksGrid');
const favoritesCount = document.getElementById('favoritesCount');
const sortBtn = document.getElementById('sortBtn');

// Função para carregar favoritos do localStorage (agora compatível com o Código 1)
function loadFavorites() {
    try {
        favoriteBooks = [];
        
        // Percorre todas as chaves do localStorage procurando por favoritos
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('favorite-') && localStorage.getItem(key) === 'true') {
                const volumeId = key.replace('favorite-', '');
                
                // Busca os dados do livro na API do Google Books
                fetchBookData(volumeId);
            }
        }
        
        console.log('Favoritos carregados:', favoriteBooks);
    } catch (error) {
        console.error('Erro ao carregar favoritos do localStorage:', error);
        favoriteBooks = [];
        filteredBooks = [];
    }
}

// Função para buscar dados do livro na API
async function fetchBookData(volumeId) {
    try {
        const response = await fetch(`https://www.googleapis.com/books/v1/volumes/${volumeId}`);
        const data = await response.json();
        const info = data.volumeInfo;
        
        const book = {
            id: volumeId,
            title: info.title || "Título não disponível",
            author: info.authors?.join(", ") || "Autor desconhecido",
            cover: info.imageLinks?.thumbnail || "https://via.placeholder.com/150",
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
            filteredBooks = [...favoriteBooks];
            renderBooks();
            updateCount();
        }
    } catch (error) {
        console.error('Erro ao buscar dados do livro:', error);
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
    if (!isSearchActive) {
        searchStatus.classList.remove('active');
        clearSearchBtn.style.display = 'none';
        return;
    }

    clearSearchBtn.style.display = 'block';
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
        const highlightedTitle = isSearchActive ? highlightText(book.title, searchInput.value) : book.title;
        const highlightedAuthor = isSearchActive ? highlightText(book.author, searchInput.value) : book.author;
        
        return `
            <div class="book-card ${isSearchActive ? 'highlight' : ''}" onclick="openBook(${originalIndex})">
                <img src="${book.cover}" alt="${book.title}" class="book-cover-img" style="width: 100px; height: 150px; object-fit: cover; margin-bottom: 10px;">
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
    searchInput.value = '';
    currentSearchTerm = '';
    isSearchActive = false;
    filteredBooks = [...favoriteBooks];
    clearSearchBtn.style.display = 'none';
    searchStatus.classList.remove('active');
    renderBooks();
    updateCount();
    searchInput.focus();
}

// Event listeners para busca
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

searchBtn.addEventListener('click', function() {
    filterBooks(searchInput.value);
    renderBooks();
    updateCount();
});

clearSearchBtn.addEventListener('click', clearSearch);

// Atalho para limpar busca com Escape
searchInput.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        clearSearch();
    }
});

// Funções dos livros
function openBook(index) {
    const book = favoriteBooks[index];
    if (!book) return;
    
    // Redireciona para a página de detalhes do livro
    window.location.href = `detalhes.html?id=${book.id}`;
}

function viewBook(index) {
    const book = favoriteBooks[index];
    if (!book) return;
    
    // Redireciona para a página de detalhes do livro
    window.location.href = `detalhes.html?id=${book.id}`;
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
            filterBooks(searchInput.value);
        }
        
        renderBooks();
        updateCount();
    }
}

// Botão de ordenação
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
        filterBooks(searchInput.value);
    }
    
    renderBooks();
});

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
function reloadFavorites() {
    loadFavorites();
    setTimeout(() => {
        renderBooks();
        updateCount();
    }, 1000); // Delay para permitir que as requisições da API sejam concluídas
}

// Torna as funções disponíveis globalmente para outras páginas
window.addToFavorites = addToFavorites;
window.isInFavorites = isInFavorites;
window.getFavorites = getFavorites;
window.reloadFavorites = reloadFavorites;

// Inicialização quando a página carrega
document.addEventListener('DOMContentLoaded', function() {
    loadFavorites();
    setTimeout(() => {
        renderBooks();
        updateCount();
    }, 500); // Pequeno delay para permitir que as requisições da API sejam feitas
});

// Atualiza a página quando o localStorage muda (ex: em outra aba)
window.addEventListener('storage', function(e) {
    if (e.key && e.key.startsWith('favorite-')) {
        console.log('Favorito alterado em outra aba, recarregando...');
        reloadFavorites();
    }
});

// Verifica periodicamente por mudanças nos favoritos
setInterval(() => {
    const currentFavoriteCount = favoriteBooks.length;
    let localStorageFavoriteCount = 0;
    
    // Conta quantos favoritos existem no localStorage
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('favorite-') && localStorage.getItem(key) === 'true') {
            localStorageFavoriteCount++;
        }
    }
    
    // Se a quantidade for diferente, recarrega
    if (currentFavoriteCount !== localStorageFavoriteCount) {
        console.log('Detectada mudança nos favoritos, recarregando...');
        reloadFavorites();
    }
}, 2000); // Verifica a cada 2 segundos