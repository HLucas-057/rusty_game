/* ================================================================
   RUSTY - SCRIPT PRINCIPAL
   Gère toute la logique du jeu et des animations
   
   Organisation du fichier :
   1. Variables globales
   2. Écran de chargement
   3. Système de notification
   4. Logique du jeu
   5. Gestion du scroll
   6. Initialisation
   ================================================================ */


/* ================================================================
   1. VARIABLES GLOBALES
   ================================================================ */

let animation; // Instance de l'animation Lottie
let currentEnergy = 10; // Énergie de départ de Rusty (10%)
const mainHeader = document.querySelector('header'); // Référence au header

// Variables pour la notification de scroll
let scrollNotification = null; // Élément DOM de la notification
let notificationTimeout = null; // Timer pour masquer la notification
let lastScrollAttempt = 0; // Timestamp de la dernière tentative de scroll
let isScrollBlocked = false; // Indique si on est dans la zone bloquée


/* ================================================================
   2. ÉCRAN DE CHARGEMENT
   ================================================================ */

/**
 * Initialise l'animation Lottie de chargement
 * Charge le fichier JSON et démarre l'animation en boucle
 */
function initLoaderAnimation() {
    animation = lottie.loadAnimation({
        container: document.getElementById('lottie-rusty'), // Container HTML
        renderer: 'canvas', // Type de rendu (canvas ou svg)
        loop: true, // Animation en boucle
        autoplay: true, // Démarre automatiquement
        path: 'json/rusty_pompe_chargement.json' // Chemin du fichier JSON
    });
}

/**
 * Gère la progression de la barre de chargement
 * Remplit la barre de 0 à 100% sur 5 secondes
 * Accélère l'animation Lottie progressivement
 * Affiche le bouton d'entrée à la fin
 */
function startLoadingProgress() {
    // Récupération des éléments du DOM
    const progressBar = document.getElementById('progress-bar');
    const percentText = document.getElementById('percent');
    const btn = document.getElementById('enter-btn');
    const progressContainer = document.querySelector('.progress-container');
    const loadingText = document.querySelector('.loading-text');
    
    const duration = 5000; // Durée totale : 5 secondes
    const minSpeed = 10.0; // Vitesse de départ de l'animation
    const maxSpeed = 25.0; // Vitesse finale de l'animation
    let start = null; // Timestamp de départ
    
    /**
     * Fonction d'animation appelée à chaque frame
     * Utilise requestAnimationFrame pour une animation fluide (60 FPS)
     */
    function animate(timestamp) {
        // Initialise le timestamp de départ
        if (!start) start = timestamp;
        
        // Calcule le temps écoulé
        const progress = timestamp - start;
        
        // Calcule le pourcentage (entre 0 et 1)
        const percent = Math.min(progress / duration, 1);
        
        // Met à jour la largeur de la barre de progression
        if (progressBar) progressBar.style.width = (percent * 100) + "%";
        
        // Met à jour le texte du pourcentage
        if (percentText) percentText.innerText = Math.floor(percent * 100);
        
        // Accélération progressive de l'animation Lottie
        const currentSpeed = minSpeed + (percent * (maxSpeed - minSpeed));
        animation.setSpeed(currentSpeed);
        
        // Continue l'animation si pas encore terminé
        if (progress < duration) {
            window.requestAnimationFrame(animate);
        } else {
            // À 100% : masque la barre et affiche le bouton
            if (progressContainer) progressContainer.classList.add('hidden');
            if (loadingText) loadingText.classList.add('hidden');
            if (btn) {
                btn.classList.remove('hidden');
                btn.style.opacity = "1";
            }
        }
    }
    
    // Lance l'animation
    window.requestAnimationFrame(animate);
}

/**
 * Gère le clic sur le bouton "Initialiser l'interface"
 * Fait la transition du loader vers le site principal
 */
function initEnterButton() {
    const btn = document.getElementById('enter-btn');
    
    // Sécurité : vérifie que le bouton existe
    if (!btn) return;
    
    btn.addEventListener('click', function() {
        // Récupération des éléments
        const dashboard = document.getElementById('dashboard-content');
        const loader = document.getElementById('loader-wrapper');
        const rustyDiv = document.getElementById('lottie-rusty');
        const targetContainer = document.getElementById('lottie-rusty-container');
        
        // 1. Affiche le dashboard avec animation
        if (dashboard) {
            dashboard.classList.remove('hidden'); // Rend visible
            setTimeout(() => {
                dashboard.classList.add('active'); // Déclenche l'animation d'entrée
            }, 10); // Petit délai pour que la transition CSS fonctionne
        }
        
        // 2. Déplace l'animation Rusty dans le header
        if (targetContainer && rustyDiv) {
            targetContainer.appendChild(rustyDiv); // Déplace l'élément dans le DOM
            rustyDiv.classList.add('in-header');
        }
        
        // 3. Change l'animation pour "Rusty essoufflé"
        animation.destroy(); // Détruit l'ancienne animation
        animation = lottie.loadAnimation({
            container: rustyDiv,
            renderer: 'canvas',
            loop: true,
            autoplay: true,
            path: 'json/essouflement.json' // Nouvelle animation
        });
        animation.setSpeed(10); // Vitesse de l'essoufflement
        
        // 4. Masque le loader avec fade out
        if (loader) {
            loader.style.opacity = "0";
            setTimeout(() => {
                loader.style.display = "none"; // Enlève du DOM après l'animation
            }, 800);
        }
        
        // 5. Masque le bouton
        this.classList.add('hidden');
    });
}


/* ================================================================
   3. SYSTÈME DE NOTIFICATION DE SCROLL
   ================================================================ */

/**
 * Crée l'élément de notification au chargement
 * La notification est créée invisible et n'apparaît que si nécessaire
 */
function createScrollNotification() {
    // Crée un nouvel élément div
    scrollNotification = document.createElement('div');
    scrollNotification.className = 'scroll-notification';
    
    // Contenu HTML de la notification
    scrollNotification.innerHTML = `
        <span class="scroll-notification-icon">🔒</span>
        Collecte tous les objets pour continuer !
        <span class="scroll-notification-counter" id="objects-counter">0/3</span>
    `;
    
    // Ajoute la notification au body (invisible par défaut)
    document.body.appendChild(scrollNotification);
}

/**
 * Met à jour le compteur d'objets dans la notification
 * Ne l'affiche pas, juste met à jour le texte
 */
function updateNotificationCounter() {
    // Sécurité
    if (!scrollNotification) return;
    
    // Compte le nombre total d'objets
    const totalItems = document.querySelectorAll('.collectible').length;
    
    // Compte le nombre d'objets déjà collectés
    const collectedItems = document.querySelectorAll('.collectible.collected').length;
    
    // Met à jour le texte du compteur
    const counter = document.getElementById('objects-counter');
    if (counter) {
        counter.textContent = `${collectedItems}/${totalItems}`;
    }
}

/**
 * Affiche la notification de scroll bloqué
 * Se cache automatiquement après 3 secondes
 */
function showScrollNotification() {
    // Sécurité
    if (!scrollNotification) return;
    
    // Met à jour le compteur avant d'afficher
    updateNotificationCounter();
    
    // Ajoute la classe qui déclenche l'animation d'apparition
    scrollNotification.classList.add('show');
    
    // Masque après 3 secondes
    clearTimeout(notificationTimeout); // Annule le timer précédent si existant
    notificationTimeout = setTimeout(() => {
        scrollNotification.classList.remove('show');
    }, 3000);
}

/**
 * Cache immédiatement la notification
 */
function hideScrollNotification() {
    if (!scrollNotification) return;
    scrollNotification.classList.remove('show');
    clearTimeout(notificationTimeout);
}

/**
 * Détruit complètement la notification
 * Utilisé quand la boutique est débloquée
 */
function destroyScrollNotification() {
    if (scrollNotification) {
        scrollNotification.classList.remove('show');
        scrollNotification.remove(); // Supprime du DOM
        scrollNotification = null; // Libère la variable
    }
}


/* ================================================================
   4. LOGIQUE DU JEU
   ================================================================ */

/**
 * Initialise la collecte d'objets
 * Ajoute un écouteur de clic sur chaque objet
 */
function initCollectibles() {
    // Récupère tous les objets collectibles
    const collectibles = document.querySelectorAll('.collectible');
    const energyFill = document.querySelector('#energy-bar');
    
    // Ajoute un event listener sur chaque objet
    collectibles.forEach(item => {
        item.addEventListener('click', function() {
            // Vérifie que l'objet n'a pas déjà été collecté
            if (!this.classList.contains('collected')) {
                // 1. Marque l'objet comme collecté (déclenche l'animation CSS)
                this.classList.add('collected');
                
                // 2. Récupère le bonus d'énergie de l'objet (data-energy)
                const bonus = parseInt(this.dataset.energy);
                
                // 3. Augmente l'énergie (maximum 100)
                currentEnergy = Math.min(currentEnergy + bonus, 100);
                
                // 4. Met à jour visuellement la barre d'énergie
                if (energyFill) {
                    energyFill.style.width = `${currentEnergy}%`;
                }
                
                // 5. Met à jour le compteur de la notification (silencieusement)
                updateNotificationCounter();
                
                // 6. Vérifie si l'énergie est pleine = VICTOIRE
                if (currentEnergy === 100) {
                    triggerVictory();
                }
            }
        });
    });
}

/**
 * Déclenche l'animation de victoire
 * Change l'animation Rusty, lance les confettis, débloque la boutique
 */
function triggerVictory() {
    const rustyDiv = document.getElementById('lottie-rusty');
    const statusLabel = document.getElementById('status-label');
    
    // 1. Change l'animation de Rusty pour "heureux"
    animation.destroy(); // Détruit l'animation actuelle
    animation = lottie.loadAnimation({
        container: rustyDiv,
        renderer: 'canvas',
        loop: true,
        autoplay: true,
        path: 'json/heureux_rusty.json' // Animation de victoire
    });
    animation.setSpeed(5.3);
    
    // 2. Met à jour le texte de statut
    if (statusLabel) {
        statusLabel.innerText = "EN FORME !";
        statusLabel.style.color = "#98FB98"; // Vert
        statusLabel.style.fontWeight = "bold";
    }
    
    // 3. Effet de flash sur Rusty
    rustyDiv.style.filter = "brightness(5) contrast(2)";
    setTimeout(() => {
        rustyDiv.style.filter = "none"; // Retour à la normale
    }, 150);
    
    // 4. Lancement des confettis depuis les deux coins inférieurs
    // Confettis gauche
    confetti({ 
        particleCount: 100, // Nombre de particules
        angle: 60, // Angle de projection
        spread: 55, // Dispersion
        origin: { x: 0, y: 0.8 }, // Départ en bas à gauche
        colors: ['#98FB98', '#ffffff', '#ffa500'] // Couleurs personnalisées
    });
    
    // Confettis droite
    confetti({ 
        particleCount: 100,
        angle: 120, // Angle inversé
        spread: 55,
        origin: { x: 1, y: 0.8 }, // Départ en bas à droite
        colors: ['#98FB98', '#ffffff', '#ffa500']
    });
    
    // 5. Cache le header avec animation
    if (mainHeader) {
        mainHeader.classList.add('header-hidden');
    }
    
    // 6. Débloque la boutique
    unlockShop();
}

/**
 * Débloque la section boutique
 * Enlève le flou et l'overlay, puis scroll vers la boutique
 */
function unlockShop() {
    // Ajoute la classe qui débloque la boutique
    document.body.classList.add('shop-unlocked');
    
    // Détruit définitivement la notification
    destroyScrollNotification();
    
    // Scroll automatique vers la boutique après un délai
    const boutiqueSection = document.getElementById('boutique');
    setTimeout(() => {
        if (boutiqueSection) {
            // Calcule la position avec offset
            const yOffset = 100;
            const y = boutiqueSection.getBoundingClientRect().top + window.pageYOffset + yOffset;
            
            // Scroll fluide
            window.scrollTo({ top: y, behavior: 'smooth' });
            
            // Rend la boutique visible
            boutiqueSection.style.opacity = '1';
        }
    }, 800);
}


/* ================================================================
   5. GESTION DU SCROLL
   ================================================================ */

/**
 * Gère le comportement du scroll
 * - Affiche/masque le header selon la position
 * - Applique des effets sur la carte d'intro
 * - Bloque le scroll si l'énergie n'est pas à 100%
 * - Affiche la notification si on essaie de scroller au-delà
 */
function handleScroll() {
    const mainHeader = document.querySelector('.rusty-header');
    const introCard = document.querySelector('.intro-card');
    const searchArea = document.querySelector('.search-area');
    const viewportCenter = window.innerHeight / 2; // Centre de l'écran
    
    /* -----------------------------------------------
       BLOCAGE DU SCROLL (Si énergie < 100%)
       ----------------------------------------------- */
    if (currentEnergy < 100 && searchArea) {
        // Calcule la limite de scroll (fin de la zone de jeu)
        const limit = searchArea.offsetTop + searchArea.offsetHeight;
        
        // Position actuelle du bas de l'écran
        const currentScrollBottom = window.scrollY + window.innerHeight;
        
        // Distance restante avant la limite
        const distanceToLimit = limit - currentScrollBottom;
        
        // Si on approche de la limite (moins de 50px)
        if (distanceToLimit < 50 && distanceToLimit > 0) {
            const now = Date.now();
            // Affiche la notification max 1 fois par seconde
            if (now - lastScrollAttempt > 1000) {
                showScrollNotification();
                lastScrollAttempt = now;
            }
            isScrollBlocked = true;
        } 
        // Si on dépasse la limite : BLOQUE LE SCROLL
        else if (currentScrollBottom >= limit) {
            // Force la position de scroll à la limite
            window.scrollTo(0, limit - window.innerHeight);
            
            const now = Date.now();
            if (now - lastScrollAttempt > 1000) {
                showScrollNotification();
                lastScrollAttempt = now;
            }
            isScrollBlocked = true;
            return; // Sort de la fonction
        }
        // Si on remonte ou qu'on est loin : pas de blocage
        else {
            isScrollBlocked = false;
        }
    }
    
    /* -----------------------------------------------
       AFFICHAGE/MASQUAGE DU HEADER
       ----------------------------------------------- */
    if (mainHeader) {
        // Masque le header après 1700px de scroll
        if (window.scrollY <= 1700) {
            mainHeader.classList.remove('header-hidden');
        } else {
            mainHeader.classList.add('header-hidden');
        }
    }
    
    /* -----------------------------------------------
       EFFET DE FOCUS SUR LA CARTE D'INTRO
       ----------------------------------------------- */
    if (introCard) {
        // Récupère les dimensions de la carte
        const rect = introCard.getBoundingClientRect();
        
        // Calcule le centre de la carte
        const elCenter = rect.top + (rect.height / 2);
        
        // Calcule la distance entre le centre de la carte et le centre de l'écran
        const distance = Math.abs(elCenter - viewportCenter);
        
        // Si la carte est centrée (distance < 150px)
        if (distance < 150) {
            introCard.style.opacity = "1"; // Pleine opacité
            introCard.style.transform = "scale(1.05)"; // Légèrement plus grande
            introCard.style.filter = "brightness(1)"; // Luminosité normale
        } else {
            introCard.style.opacity = "0.3"; // Transparente
            introCard.style.transform = "scale(0.95)"; // Légèrement plus petite
            introCard.style.filter = "brightness(0.8)"; // Plus sombre
        }
    }
}


/* ================================================================
   6. INITIALISATION
   Lance toutes les fonctions au chargement de la page
   ================================================================ */

/**
 * Fonction principale d'initialisation
 * Appelée automatiquement au chargement du script
 */
function init() {
    // 1. Initialise l'écran de chargement
    initLoaderAnimation();
    startLoadingProgress();
    initEnterButton();
    
    // 2. Initialise le jeu quand le DOM est chargé
    document.addEventListener('DOMContentLoaded', () => {
        createScrollNotification(); // Crée la notification (invisible)
        initCollectibles(); // Active la collecte d'objets
    });
    
    // 3. Écoute le scroll de la fenêtre
    window.addEventListener('scroll', handleScroll);
}

/* ================================================================
   LANCEMENT AUTOMATIQUE
   ================================================================ */

// Lance l'initialisation dès que le script est chargé
init();