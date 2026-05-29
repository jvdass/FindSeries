const moviesContainer = document.getElementById('movies-container');
const statusMessage = document.getElementById('status-message');
const searchForm = document.getElementById('search-form');
const searchInput = document.getElementById('search-input');
const suggestionsList = document.getElementById('suggestions-list');
const btnShowFavorites = document.getElementById('btn-show-favorites'); // global

const movieModal = document.getElementById('movie-modal');
const modalBodyContent = document.getElementById('modal-body-content');
const closeModalBtn = document.querySelector('.close-modal');

const MAX_SUMMARY_LENGTH = 120; // Nombre de caractères max avant de couper la description

const siteTitle = document.querySelector('h1');

let isViewingFavorites = false; // Permet de savoir si l'utilisateur regarde ses favoris
let currentShowsRaw = []; // Stocke les séries brutes pour pouvoir les filtrer

// Initialisation des favoris depuis le localStorage (ou tableau vide s'il n'y a rien)
let favorites = JSON.parse(localStorage.getItem('findseries_favorites')) || [];

// --- 1. FONCTION : Suggestions d'autocomplétion pendant la saisie ---
searchInput.addEventListener('input', async () => {
    const query = searchInput.value.trim();

    if (query.length < 2) {
        suggestionsList.innerHTML = "";
        suggestionsList.style.display = "none";
        return;
    }

    try {
        const API_URL = `https://api.tvmaze.com/search/shows?q=${encodeURIComponent(query)}&embed=seasons`;
        const response = await fetch(API_URL);
        if (!response.ok) return;

        const results = await response.json();
        suggestionsList.innerHTML = "";

        if (results.length > 0) {
            suggestionsList.style.display = "block";
            
            results.slice(0, 5).forEach(result => {
                const show = result.show;
                const div = document.createElement('div');
                div.className = 'suggestion-item';
                
                const year = show.premiered ? `(${show.premiered.split('-')[0]})` : '';
                div.textContent = `${show.name} ${year}`;

                div.addEventListener('click', () => {
                    searchInput.value = show.name;
                    suggestionsList.style.display = "none";
                    searchShows(show.name);
                });

                suggestionsList.appendChild(div);
            });
        } else {
            suggestionsList.style.display = "none";
        }
    } catch (error) {
        console.error("Erreur suggestions :", error);
    }
});

// Fermer les suggestions si on clique n'importe où ailleurs sur l'écran
document.addEventListener('click', (e) => {
    if (e.target !== searchInput) {
        suggestionsList.style.display = "none";
    }
});


// --- 2. FONCTION : Charger des séries aléatoires au démarrage ---
async function fetchRandomShows() {
    const API_URL = 'https://api.tvmaze.com/shows?embed=seasons';
    try {
        showSkeletonLoader();
        statusMessage.textContent = "";

        const response = await fetch(API_URL); // Nettoyé (un seul appel restant)
        if (!response.ok) throw new Error(`Erreur HTTP ! Statut : ${response.status}`);

        const results = await response.json();

        if (results.length === 0) {
            statusMessage.textContent = "Aucune série trouvée.";
            return;
        }

        for (let i = results.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [results[i], results[j]] = [results[j], results[i]];
        }

        const randomSelection = results.slice(0, 20);
        const formattedResults = randomSelection.map(show => ({ show: show }));

        await displayShows(formattedResults);

    } catch (error) {
        console.error("Erreur chargement initial :", error);
        statusMessage.textContent = "Impossible de charger les séries. Veuillez recharger la page.";
    }
}


// --- 3. FONCTION : Rechercher des séries ---
async function searchShows(query) {
    isViewingFavorites = false; // L'utilisateur fait une recherche, il ne regarde plus ses favoris
    resetGenreButtons();        // On remet le filtre des genres sur "Tous"
    const API_URL = `https://api.tvmaze.com/search/shows?q=${encodeURIComponent(query)}&embed=seasons`;
    try {
        showSkeletonLoader();
        statusMessage.textContent = "";

        const response = await fetch(API_URL); // Nettoyé (un seul appel restant)
        if (!response.ok) throw new Error(`Erreur HTTP ! Statut : ${response.status}`);

        const results = await response.json();

        if (results.length === 0) {
            statusMessage.textContent = "Aucune série trouvée pour cette recherche.";
            return;
        }

        await displayShows(results);

    } catch (error) {
        console.error("Erreur recherche :", error);
        statusMessage.textContent = "Erreur de connexion avec l'API.";
    }
}


// --- 4. FONCTION : Afficher les cartes dans le DOM ---
async function displayShows(results) {
    currentShowsRaw = results; 
    moviesContainer.innerHTML = "";
    
    moviesContainer.style.display = "grid";
    moviesContainer.style.gridTemplateColumns = "repeat(auto-fill, minmax(250px, 1fr))";
    moviesContainer.style.gap = "20px";
    moviesContainer.style.padding = "20px 0";

    for (const result of results) {
        const show = result.show;
        const imageUrl = show.image ? show.image.original : 'https://via.placeholder.com/210x295?text=Pas+d%27image';
        
        // --- Vérification si la série est déjà en favori ---
        const isFav = favorites.some(fav => fav.id === show.id);
        const favIcon = isFav ? '❤️' : '🖤';

        // --- Récupération du nombre de saisons ---
        const seasonsCount = show._embedded && show._embedded.seasons ? show._embedded.seasons.length : null;
        const seasonsText = seasonsCount !== null ? ` | 📺 ${seasonsCount} ${seasonsCount > 1 ? 'saisons' : 'saison'}` : '';

        // --- Extraction de l'année de parution ---
        const releaseYear = show.premiered ? show.premiered.split('-')[0] : 'Année inconnue';

        // --- Nettoyage du résumé anglais ---
        const summaryHtml = show.summary || "Aucun résumé disponible.";
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = summaryHtml;
        const cleanSummaryTextEn = tempDiv.textContent || tempDiv.innerText;

        // --- Traduction avec MyMemory ---
        let cleanSummary = cleanSummaryTextEn;
        if (show.summary) {
            try {
                let textToTranslate = cleanSummaryTextEn;
                if (textToTranslate.length > 450) {
                    textToTranslate = textToTranslate.substring(0, 450);
                }
                const translationResponse = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(textToTranslate)}&langpair=en|fr`);
                const translationData = await translationResponse.json();
                
                if (translationData.responseData && translationData.responseData.translatedText) {
                    const translatedText = translationData.responseData.translatedText.toUpperCase();
                    
                    if (translatedText.includes("WARNING") || 
                        translatedText.includes("LIMIT") || 
                        translatedText.includes("QUOTA") || 
                        translatedText.includes("AVAILABLE")) {
                        
                        cleanSummary = cleanSummaryTextEn;
                    } else {
                        cleanSummary = translationData.responseData.translatedText;
                    }
                }
            } catch (error) {
                console.error("Erreur traduction :", error);
                cleanSummary = cleanSummaryTextEn;
            }
        }

        // --- Logique du Voir Plus ---
        let displaySummary = "";
        if (cleanSummary.length > MAX_SUMMARY_LENGTH) {
            const shortText = cleanSummary.substring(0, MAX_SUMMARY_LENGTH) + "...";
            displaySummary = `
                <span class="summary-text">${shortText}</span>
                <button class="btn-see-more" 
                        data-short="${shortText}" 
                        data-full="${cleanSummary}" 
                        data-state="short"
                        style="background: none; border: none; color: #2383e2; padding: 0; margin-left: 5px; font-weight: 500; cursor: pointer; text-decoration: none; font-size: 0.85rem;">Voir plus</button>
            `;
        } else {
            displaySummary = `<span class="summary-text">${cleanSummary}</span>`;
        }

        // --- Lien Où Regarder ---
        const searchStreamingUrl = `https://www.google.com/search?q=ou+regarder+${encodeURIComponent(show.name)}+en+streaming`;

        const card = document.createElement('div');
        card.className = 'show-card fade-in-card';
        // Sauvegarde des genres directement sur la carte HTML
        card.dataset.genres = show.genres ? show.genres.join(',') : '';

        card.style.border = "1px solid #334155"; 
        card.style.borderRadius = "12px"; 
        card.style.padding = "15px";
        card.style.backgroundColor = "rgba(30, 41, 59, 0.7)"; 
        card.style.backdropFilter = "blur(5px)"; 
        card.style.boxShadow = "0 4px 6px rgba(0, 0, 0, 0.3)";
        card.style.transition = "transform 0.2s";
        card.style.position = "relative"; 
        card.style.cursor = "pointer"; // Curseur main pour indiquer que la carte est cliquable

        card.addEventListener('mouseenter', () => card.style.transform = "scale(1.02)");
        card.addEventListener('mouseleave', () => card.style.transform = "scale(1)");

        // Événement au clic sur la carte pour ouvrir la modale détails
        card.addEventListener('click', (e) => {
            // On bloque l'ouverture si le clic cible le bouton favoris ou le bouton "Voir plus"
            if (e.target.closest('.btn-fav') || e.target.classList.contains('btn-see-more')) {
                return;
            }
            openModal(show, cleanSummary, imageUrl, releaseYear, seasonsText);
        });

        card.innerHTML = `
            <button class="btn-fav" data-id="${show.id}" style="position: absolute; top: 20px; right: 20px; background: transparent; border: none; width: 40px; height: 40px; font-size: 1.3rem; cursor: pointer; display: flex; align-items: center; justify-content: center; z-index: 10; transition: transform 0.1s;">
                ${favIcon}
            </button>

            <img src="${imageUrl}" 
                 alt="${show.name}" 
                 onerror="this.onerror=null; this.src='https://via.placeholder.com/210x295/1e293b/ffffff?text=Pas+d%27image';" 
                 style="width: 100%; height: 350px; border-radius: 8px; object-fit: cover;">
            
            <h2 style="font-size: 1.2rem; margin: 12px 0 5px 0; font-weight: bold; color: #ffffff;">${show.name}</h2>
            
            <p style="color: #94a3b8; font-size: 0.9rem; margin: 0 0 5px 0;">Sortie : ${releaseYear}${seasonsText}</p>
            
            <p style="color: #f0ab79; font-weight: bold; font-size: 0.85rem; margin-bottom: 10px;">
                Note : ${show.rating && show.rating.average ? show.rating.average + '/10' : 'Non noté'}
            </p>

            <a href="${searchStreamingUrl}" target="_blank" style="display: inline-block; margin-bottom: 15px; color: #fffcfb; text-decoration: none; font-size: 0.85rem; font-weight: bold;">
                🔍 Où regarder ?
            </a>
            
            <div style="font-size: 0.85rem; line-height: 1.4; color: #cbd5e1;">
                ${displaySummary}
            </div>
        `;

        const favBtn = card.querySelector('.btn-fav');
        favBtn.addEventListener('click', (e) => {
            e.stopPropagation(); 
            toggleFavorite(show, favBtn);
        });

        moviesContainer.appendChild(card);
    }

    initSeeMoreEvents();
}

// --- 5. FONCTION : Gérer l'ajout / suppression des favoris ---
function toggleFavorite(show, button) {
    const index = favorites.findIndex(fav => fav.id === show.id);

    if (index === -1) {
        favorites.push(show);
        button.textContent = '❤️';
    } else {
        favorites.splice(index, 1);
        button.textContent = '🖤';

        if (isViewingFavorites) {
            const cardElement = button.closest('.show-card');
            if (cardElement) {
                cardElement.remove();
            }

            if (favorites.length === 0) {
                statusMessage.textContent = "Vous n'avez pas encore de favoris.";
                moviesContainer.innerHTML = "";
            }
        }
    }

    localStorage.setItem('findseries_favorites', JSON.stringify(favorites));
}

// --- 6. FONCTION : Afficher uniquement la liste des favoris ---
btnShowFavorites.addEventListener('click', () => {
    isViewingFavorites = true; 
    resetGenreButtons();        

    if (favorites.length === 0) {
        statusMessage.textContent = "Vous n'avez pas encore de favoris.";
        statusMessage.style.color = "white";
        moviesContainer.innerHTML = "";
        return;
    }

    statusMessage.textContent = "Vos séries favorites :";
    statusMessage.style.color = "white";
    
    const formattedFavs = favorites.map(show => ({ show: show }));
    displayShows(formattedFavs);

    // On pousse l'état dans l'historique de navigation
    if (history.state !== 'favorites') {
        history.pushState('favorites', '', '#favoris');
    }
});

// --- 7. FONCTION : Activer les actions Voir Plus / Voir Moins ---
function initSeeMoreEvents() {
    const buttons = document.querySelectorAll('.btn-see-more');
    buttons.forEach(button => {
        button.addEventListener('click', function() {
            const textSpan = this.previousElementSibling; 
            const state = this.getAttribute('data-state');

            if (state === 'short') {
                textSpan.textContent = this.getAttribute('data-full');
                this.textContent = 'Voir moins';
                this.setAttribute('data-state', 'full');
            } else {
                textSpan.textContent = this.getAttribute('data-short');
                this.textContent = 'Voir plus';
                this.setAttribute('data-state', 'short');
            }
        });
    });
}

// Écouteur sur la soumission du formulaire
searchForm.addEventListener('submit', (event) => {
    event.preventDefault();
    suggestionsList.style.display = "none"; 
    const query = searchInput.value.trim();
    if (query) {
        searchShows(query);
    }
});


// --- 8. FONCTION : Revenir à l'accueil lors du clic sur le titre ---
siteTitle.addEventListener('click', () => {
    if (isViewingFavorites) {
        // Déclenche l'action de retour arrière gérée par popstate
        history.back();
    } else {
        isViewingFavorites = false; 
        searchInput.value = "";    
        suggestionsList.style.display = "none"; 
        statusMessage.textContent = ""; 
        resetGenreButtons();        
        
        fetchRandomShows();
    }
});

// --- 9. FONCTION : Filtrer les séries par genre ---
document.querySelectorAll('.btn-genre').forEach(button => {
    button.addEventListener('click', function() {
        document.querySelectorAll('.btn-genre').forEach(btn => btn.classList.remove('active'));
        this.classList.add('active');

        const selectedGenre = this.getAttribute('data-genre');
        const cards = document.querySelectorAll('.show-card');

        cards.forEach(card => {
            const cardGenres = card.dataset.genres ? card.dataset.genres.split(',') : [];

            if (selectedGenre === 'all' || cardGenres.includes(selectedGenre)) {
                card.style.display = "block"; 
            } else {
                card.style.display = "none";  
            }
        });
    });
});

// --- 10. FONCTION UTILITAIRE : Réinitialiser les boutons de genres sur "Tous" ---
function resetGenreButtons() {
    document.querySelectorAll('.btn-genre').forEach(btn => btn.classList.remove('active'));
    const allButton = document.querySelector('.btn-genre[data-genre="all"]');
    if (allButton) allButton.classList.add('active');
}

// --- 11. FONCTION : Afficher le Skeleton Screen pendant le chargement ---
function showSkeletonLoader() {
    moviesContainer.innerHTML = ""; 
    
    moviesContainer.style.display = "grid";
    moviesContainer.style.gridTemplateColumns = "repeat(auto-fill, minmax(250px, 1fr))";
    moviesContainer.style.gap = "20px";
    moviesContainer.style.padding = "20px 0";

    for (let i = 0; i < 8; i++) {
        const skeletonCard = document.createElement('div');
        skeletonCard.className = 'skeleton-card';
        
        skeletonCard.innerHTML = `
            <div class="skeleton-box skeleton-img"></div>
            <div class="skeleton-box skeleton-title"></div>
            <div class="skeleton-box skeleton-text"></div>
            <div class="skeleton-box skeleton-text" style="width: 30%; color: #f0ab79;"></div>
            <div class="skeleton-box skeleton-link"></div>
            <div class="skeleton-box skeleton-description"></div>
        `;
        
        moviesContainer.appendChild(skeletonCard);
    }
}

// --- 12. FONCTIONS : Gestion de la Modale de Détails ---
function openModal(show, summaryText, imageUrl, releaseYear, seasonsText) {
    const genresBadges = show.genres && show.genres.length > 0 
        ? show.genres.map(g => `<span class="modal-badge">${g}</span>`).join('') 
        : '<span class="modal-badge">Aucun genre</span>';

    const network = show.network ? show.network.name : (show.webChannel ? show.webChannel.name : 'Inconnu');

    let statusText = show.status;
    if (statusText === 'Running') statusText = '🔴 En cours de production';
    if (statusText === 'Ended') statusText = '⚪ Terminée';

    modalBodyContent.innerHTML = `
        <h2 style="font-size: 1.8rem; font-weight: bold; margin-bottom: 5px; color: #ffffff;">${show.name}</h2>
        <div style="margin-bottom: 15px;">${genresBadges}</div>
        
        <div class="modal-grid">
            <img src="${imageUrl}" alt="${show.name}" class="modal-img">
            <div class="modal-info">
                <p style="font-size: 1rem; margin-bottom: 8px; color: #94a3b8;">
                    <strong>Année de sortie :</strong> ${releaseYear}
                </p>
                <p style="font-size: 1rem; margin-bottom: 8px; color: #f0ab79;">
                    <strong>Note globale :</strong> ${show.rating && show.rating.average ? show.rating.average + '/10' : 'Non notée'}
                </p>
                <p style="font-size: 1rem; margin-bottom: 8px; color: #cbd5e1;">
                    <strong>Statut :</strong> ${statusText}
                </p>
                <p style="font-size: 1rem; margin-bottom: 8px; color: #cbd5e1;">
                    <strong>Diffusé sur :</strong> ${network}
                </p>
                <p style="font-size: 1rem; margin-bottom: 15px; color: #cbd5e1;">
                    <strong>Volume :</strong> ${seasonsText.replace(' | 📺 ', '') || 'Saisons non spécifiées'}
                </p>
                
                <h3 style="font-size: 1.1rem; color: #ffffff; margin-bottom: 8px; border-bottom: 1px solid #334155; padding-bottom: 5px;">Résumé</h3>
                <p style="font-size: 0.9rem; line-height: 1.5; color: #cbd5e1; max-height: 180px; overflow-y: auto; padding-right: 5px;">
                    ${summaryText}
                </p>
            </div>
        </div>
    `;

    movieModal.style.display = "block";
    document.body.style.overflow = "hidden"; 
}

// Événements de fermeture du modal
closeModalBtn.addEventListener('click', closeModal);

window.addEventListener('click', (e) => {
    if (e.target === movieModal) {
        closeModal();
    }
});

function closeModal() {
    movieModal.style.display = "none";
    document.body.style.overflow = "auto"; 
}

// --- 13. ÉCOUTEUR GLOBAL : Bouton Retour du Navigateur---
window.addEventListener('popstate', (event) => {
    if (isViewingFavorites) {
        isViewingFavorites = false; 
        searchInput.value = "";    
        suggestionsList.style.display = "none"; 
        statusMessage.textContent = ""; 
        resetGenreButtons();        
        
        fetchRandomShows();
    }
});

// Lancement au démarrage
fetchRandomShows();