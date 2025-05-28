class BooksCatalog {
    constructor() {
        this.apiKey = ''; // Deixe vazio para usar sem API key (com limitações)
        this.baseUrl = 'https://www.googleapis.com/books/v1/volumes';
        this.currentQuery = '';
        this.currentGenre = '';
        this.startIndex = 0;
        this.maxResults = 12;
        this.totalItems = 0;
        
        this.initializeElements();
        this.attachEventListeners();
        this.loadInitialBooks();
        this.setupMobileMenu();
    }

    initializeElements() {
        this.searchInput = document.getElementById('searchInput');
        this.genreFilter = document.getElementById('genreFilter');
        this.searchBtn = document.getElementById('searchBtn');
        this.loading = document.getElementById('loading');
        this.resultsInfo = document.getElementById('resultsInfo');
        this.resultCount = document.getElementById('resultCount');
        this.booksGrid = document.getElementById('booksGrid');
        this.loadMoreContainer = document.getElementById('loadMoreContainer');
        this.loadMoreBtn = document.getElementById('loadMoreBtn');
        this.noResults = document.getElementById('noResults');
    }

    setupMobileMenu() {
        const mobileMenuButton = document.getElementById('mobile-menu-button');
        const mobileMenu = document.getElementById('mobile-menu');
        
        mobileMenuButton.addEventListener('click', () => {
            mobileMenu.classList.toggle('hidden');
        });
    }

    attachEventListeners() {
        this.searchBtn.addEventListener('click', () => this.performSearch());
        this.searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.performSearch();
        });
        this.genreFilter.addEventListener('change', () => this.performSearch());
        this.loadMoreBtn.addEventListener('click', () => this.loadMoreBooks());
    }

    async loadInitialBooks() {
        this.currentQuery = 'programming'; // Query inicial
        await this.searchBooks(true);
    }

    async performSearch() {
        const query = this.searchInput.value.trim();
        const genre = this.genreFilter.value;

        if (!query && !genre) {
            alert('Por favor, digite um termo de pesquisa ou selecione um gênero.');
            return;
        }

        this.currentQuery = query || 'bestsellers';
        this.currentGenre = genre;
        this.startIndex = 0;
        
        await this.searchBooks(true);
    }

    async searchBooks(resetResults = false) {
        this.showLoading();
        
        if (resetResults) {
            this.booksGrid.innerHTML = '';
            this.hideElements([this.resultsInfo, this.loadMoreContainer, this.noResults]);
        }

        try {
            let searchQuery = this.currentQuery;
            
            // Adiciona filtro de gênero se selecionado
            if (this.currentGenre) {
                searchQuery += `+subject:${this.currentGenre}`;
            }

            const url = `${this.baseUrl}?q=${encodeURIComponent(searchQuery)}&startIndex=${this.startIndex}&maxResults=${this.maxResults}&orderBy=relevance`;
            
            const response = await fetch(url);
            const data = await response.json();

            this.hideLoading();

            if (data.items && data.items.length > 0) {
                this.totalItems = data.totalItems || 0;
                this.displayBooks(data.items, resetResults);
                this.showResultsInfo();
                this.updateLoadMoreButton();
            } else {
                if (resetResults) {
                    this.showNoResults();
                }
            }
        } catch (error) {
            console.error('Erro ao buscar livros:', error);
            this.hideLoading();
            alert('Erro ao buscar livros. Tente novamente.');
        }
    }

    displayBooks(books, resetResults = false) {
        if (!resetResults) {
            // Append new books
        } else {
            this.booksGrid.innerHTML = '';
        }

        books.forEach(book => {
            const bookCard = this.createBookCard(book);
            this.booksGrid.appendChild(bookCard);
        });
    }

    createBookCard(book) {
        const info = book.volumeInfo;
        const imageUrl = info.imageLinks?.thumbnail || 'https://via.placeholder.com/128x192/e2e8f0/64748b?text=Sem+Capa';
        const title = info.title || 'Título não disponível';
        const authors = info.authors ? info.authors.join(', ') : 'Autor não informado';
        const publishedDate = info.publishedDate ? new Date(info.publishedDate).getFullYear() : 'Data não informada';
        const description = info.description ? this.truncateText(info.description, 120) : 'Descrição não disponível';
        const pageCount = info.pageCount || 'N/A';
        const categories = info.categories ? info.categories.slice(0, 2).join(', ') : 'Categoria não informada';

        const card = document.createElement('div');
        card.className = 'book-card bg-white rounded-lg shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 overflow-hidden';
        
        card.innerHTML = `
            <div class="relative">
                <img 
                    src="${imageUrl}" 
                    alt="${title}"
                    class="w-full h-64 object-cover"
                    onerror="this.src='https://via.placeholder.com/200x300/e2e8f0/64748b?text=Sem+Capa'"
                >
                <div class="absolute top-2 right-2 bg-primary text-white px-2 py-1 rounded-full text-xs">
                    ${pageCount} pág.
                </div>
            </div>
            <div class="p-4">
                <h3 class="font-bold text-lg text-gray-800 mb-2 line-clamp-2" title="${title}">
                    ${title}
                </h3>
                <p class="text-primary font-medium mb-1">${authors}</p>
                <p class="text-gray-500 text-sm mb-2">${publishedDate}</p>
                <div class="mb-3">
                    <span class="inline-block bg-green-100 text-primary text-xs px-2 py-1 rounded-full">
                        ${categories}
                    </span>
                </div>
                <p class="text-gray-600 text-sm leading-relaxed">${description}</p>
                ${info.previewLink ? `
                    <div class="mt-4">
                        <a 
                            href="${info.previewLink}" 
                            target="_blank" 
                            class="inline-block bg-gradient-to-r from-primary to-primary-dark text-white px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition-all duration-200 transform hover:scale-105"
                        >
                            Ver prévia
                        </a>
                    </div>
                ` : ''}
            </div>
        `;

        return card;
    }

    async loadMoreBooks() {
        this.startIndex += this.maxResults;
        await this.searchBooks(false);
    }

    updateLoadMoreButton() {
        const hasMoreResults = (this.startIndex + this.maxResults) < this.totalItems;
        
        if (hasMoreResults) {
            this.loadMoreContainer.classList.remove('hidden');
        } else {
            this.loadMoreContainer.classList.add('hidden');
        }
    }

    showResultsInfo() {
        this.resultCount.textContent = this.totalItems.toLocaleString('pt-BR');
        this.resultsInfo.classList.remove('hidden');
    }

    showLoading() {
        this.loading.classList.remove('hidden');
    }

    hideLoading() {
        this.loading.classList.add('hidden');
    }

    showNoResults() {
        this.noResults.classList.remove('hidden');
    }

    hideElements(elements) {
        elements.forEach(element => element.classList.add('hidden'));
    }

    truncateText(text, maxLength) {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength).trim() + '...';
    }
}

// Initialize the catalog when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new BooksCatalog();
});