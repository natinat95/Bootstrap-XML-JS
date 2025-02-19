// https://dev.to/feed
// https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml
// https://www.elmundo.es/rss/portada.xml
let allNews = []; // Array para almacenar todas las noticias
let favorites = []; // Array para noticias favoritas
let currentPage = 1; // Página actual
const itemsPerPage = 10; // Noticias por página

// Función para cargar el feed RSS
function loadRSS() {
    const rssUrl = $('#rssUrl').val().trim(); // Obtener y limpiar la URL del feed
    if (!rssUrl) {
        alert('Por favor, ingresa una URL válida.');
        return;
    }

    // Usamos AllOrigins para evitar problemas de CORS
    const proxiedUrl = 'https://api.allorigins.win/raw?url=' + encodeURIComponent(rssUrl);

    $.ajax({
        url: proxiedUrl,  // Usar la URL pasada por AllOrigins
        method: 'GET',
        dataType: 'xml',
        success: function (data) {
            parseRSS(data);
        },
        error: function () {
            alert('No se pudo cargar el feed. Verifica la URL.');
        }
    });
}



// Función para procesar el feed RSS y extraer datos
function parseRSS(data) {
    allNews = []; // Reiniciar noticias

    // Verificar si el feed es ATOM o RSS
    const entries = $(data).find('entry'); // ATOM usa 'entry'
    const items = $(data).find('item');   // RSS usa 'item'

    // Si encontramos 'entry', es ATOM; si encontramos 'item', es RSS
    const feedItems = entries.length > 0 ? entries : items;

    feedItems.each(function () {
        const title = $(this).find('title').text();
        const link = $(this).find('link').attr('href') || $(this).find('link').text().trim();
        const description = $(this).find('summary, description, content\\:encoded').text();
        const pubDate = $(this).find('published, pubDate').text();

        // Buscar la imagen en distintas etiquetas
        let imageUrl = $(this).find('media\\:content, enclosure').attr('url');
        
        // Si no encuentra en media:content o enclosure, intenta en description
        if (!imageUrl) {
            const descHtml = $(this).find('description').text();
            const imgMatch = descHtml.match(/<img.*?src=["'](.*?)["']/); // Extraer la URL de la imagen en HTML
            if (imgMatch) {
                imageUrl = imgMatch[1];
            }
        }

        // Si no encuentra imagen, usa una por defecto
        if (!imageUrl) {
            imageUrl = 'https://placekitten.com/300/200'; // Imagen alternativa de placeholder
        }

        allNews.push({ title, link, description, pubDate, imageUrl });
    });

    currentPage = 1; // Reiniciar página
    renderNews(); // Mostrar noticias
}



// Función para buscar noticias por título
let searchQuery = '';
function searchNews() {
    searchQuery = $('#searchInput').val().toLowerCase();
    currentPage = 1;
    renderNews();
}

// Función para mostrar noticias
function renderNews() {
    const newsContainer = $('#newsContainer');
    newsContainer.empty();

    // Filtrar noticias por búsqueda
    const filteredNews = allNews.filter(news => 
        news.title.toLowerCase().includes(searchQuery)
    );

    // Calcular las noticias para la página actual
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const newsToRender = filteredNews.slice(start, end);

    if (newsToRender.length === 0) {
        newsContainer.html('<p class="text-muted">No hay noticias para mostrar.</p>');
        return;
    }

    // Crear las cards para cada noticia
    newsToRender.forEach((news, index) => {
        const isFavorite = favorites.some(fav => fav.link === news.link);

        // Condicional para incluir la imagen solo si existe una URL y no da error
        const imageHTML = news.imageUrl ? `
            <img src="${news.imageUrl}" alt="${news.title}" class="card-img-top" onerror="this.style.display='none'">
        ` : '';

        newsContainer.append(`
            <div class="col-md-4 mb-3">
                <div class="card h-100">
                    ${imageHTML} <!-- Imagen solo si existe y no da error -->
                    <div class="card-body">
                        <h5 class="card-title">${news.title}</h5>
                        <p class="card-text">${news.description}</p>
                        <a href="${news.link}" target="_blank" class="btn btn-primary">Leer más</a>
                        <button class="btn btn-sm ${isFavorite ? 'btn-warning' : 'btn-outline-warning'} mt-2" 
                                onclick="toggleFavorite(${start + index})">
                            <i class="fas ${isFavorite ? 'fa-heart' : 'fa-heart-o'}"></i> 
                            ${isFavorite ? 'Favorita' : 'Añadir a Favoritas'}
                        </button>
                    </div>
                </div>
            </div>
        `);
    });

    renderPagination();
}


// Función para renderizar la paginación
function renderPagination() {
    const totalPages = Math.ceil(allNews.length / itemsPerPage);
    const pagination = $('#pagination');
    pagination.empty();

    for (let i = 1; i <= totalPages; i++) {
        pagination.append(`
            <li class="page-item ${i === currentPage ? 'active' : ''}">
                <a class="page-link" href="#" onclick="changePage(${i})">${i}</a>
            </li>
        `);
    }
}

// Cambiar página
function changePage(page) {
    currentPage = page;
    renderNews();
}

// Alternar entre agregar/quitar favoritas
function toggleFavorite(index) {
    const news = allNews[index];
    const favoriteIndex = favorites.findIndex(fav => fav.link === news.link);

    if (favoriteIndex === -1) {
        favorites.push(news);
    } else {
        favorites.splice(favoriteIndex, 1);
    }

    renderNews();
}

// Mostrar solo favoritas
function filterFavorites() {
    allNews = favorites;
    currentPage = 1;
    renderNews();
}

// Volver a mostrar todas las noticias
function clearFavorites() {
    loadRSS();
}
