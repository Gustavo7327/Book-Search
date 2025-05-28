// Dados dos livros favoritos
const favoriteBooks = [
    { title: "Dom Casmurro", author: "Machado de Assis" },
    { title: "O Cortiço", author: "Aluísio Azevedo" },
    { title: "Memórias Póstumas de Brás Cubas", author: "Machado de Assis" },
    { title: "O Guarani", author: "José de Alencar" },
    { title: "Senhora", author: "José de Alencar" },
    { title: "A Moreninha", author: "Joaquim Manuel de Macedo" },
    { title: "Iracema", author: "José de Alencar" },
    { title: "Helena", author: "Machado de Assis" }
];

function renderBooks() {
    const booksGrid = document.getElementById('booksGrid');
    
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

    booksGrid.innerHTML = favoriteBooks.map((book, index) => `
        <div class="book-card" onclick="openBook(${index})">
            <h3 class="book-title">${book.title}</h3>
            <p class="book-author">por ${book.author}</p>
            <div class="book-actions">
                <button class="action-btn" onclick="event.stopPropagation(); viewBook(${index})">Ver detalhes</button>
                <button class="action-btn remove-btn" onclick="event.stopPropagation(); removeBook(${index})">Remover</button>
            </div>
        </div>
    `).join('');
}

function openBook(index) {
    alert(`Abrindo: ${favoriteBooks[index].title}`);
}

function viewBook(index) {
    alert(`Visualizar detalhes de: ${favoriteBooks[index].title}`);
}

function removeBook(index) {
    if (confirm(`Remover "${favoriteBooks[index].title}" dos favoritos?`)) {
        favoriteBooks.splice(index, 1);
        renderBooks();
        updateCount();
    }
}

function updateCount() {
    const countElement = document.querySelector('.favorites-count');
    countElement.textContent = `${favoriteBooks.length} livros salvos`;
}

// Funcionalidade da barra de busca
document.querySelector('.search-bar').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        alert('Buscar por: ' + this.value);
    }
});

document.querySelector('.search-btn').addEventListener('click', function() {
    const searchTerm = document.querySelector('.search-bar').value;
    alert('Buscar por: ' + searchTerm);
});

// Botão de ordenação
document.querySelector('.sort-btn').addEventListener('click', function() {
    favoriteBooks.sort((a, b) => a.title.localeCompare(b.title));
    renderBooks();
});

// Renderizar livros ao carregar a página
renderBooks();
