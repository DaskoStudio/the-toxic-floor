/* ==========================================================================
   🎓 RÉVISION ORAL : POO & SÉPARATION DES RESPONSABILITÉS
   MOT-CLÉ : Architecture POO, Singleton.
   POURQUOI : Plutôt que de mettre toutes les variables de score en vrac dans script.js, 
   on les encapsule dans une classe dédiée. Cela rend le code modulaire. Si demain tu 
   veux ajouter un mode multijoueur, la logique de score est isolée et réutilisable.
   ========================================================================== */
class GameLogic { // Déclaration de la classe GameLogic (POO) qui servira de modèle pour notre gestionnaire d'état.

    // Le constructeur est la méthode appelée automatiquement lors du `new GameLogic()`.
    // Il prépare l'état initial de l'objet en mémoire.
    constructor(){ // Déclaration du constructeur, méthode appelée automatiquement lors de l'instanciation (new).
        this.startTime = 0; // Initialise la propriété 'startTime' de l'instance ('this' en POO) à zéro.
        this.score = 0; // Initialise la propriété 'score' de l'instance à zéro.
        this.wave = 1; // Initialise la propriété 'wave' (vague) de l'instance à la valeur entière 1.
        this.difficultyMultiplier = 1; // Initialise la propriété 'difficultyMultiplier' de l'instance à 1.
    } // Fin du bloc du constructeur.

    // INTERCONNEXION : Cette méthode est appelée depuis script.js quand l'état passe à 'PLAYING'.
    start() { // Définition de la méthode start() appartenant à l'instance de GameLogic.
        // Date.now() renvoie le "Timestamp UNIX" (millisecondes depuis le 1er Janvier 1970).
        // C'est notre point de référence absolu pour calculer la durée de survie plus tard.
        this.startTime = Date.now(); // Affecte le timestamp actuel (entier en millisecondes) à this.startTime.
        this.score = 0; // Réinitialise la propriété score de l'instance à zéro.
        this.wave = 1; // Réinitialise la propriété wave de l'instance à un.
        this.difficultyMultiplier = 1; // Réinitialise le multiplicateur de difficulté de l'instance à un.
    } // Fin de la méthode start.

    /* 🎓 LOGIQUE MATHÉMATIQUE : CALCUL DU TEMPS ET DE LA DIFFICULTÉ
       POURQUOI / 1000 ? : Date.now() calcule en millisecondes. Pour avoir des secondes, 
       on divise le temps écoulé par 1000. `Math.floor` coupe les décimales (ex: 5.8s -> 5s).
       INTERCONNEXION : Cette méthode est appelée 60 fois par seconde dans la boucle update() de script.js. */
    update(){ // Définition de la méthode update() qui sera appelée à chaque frame (Game Loop).
        this.score = Math.floor((Date.now() - this.startTime) / 1000); // Calcule le delta de temps en secondes et l'arrondit à l'entier inférieur via l'objet mathématique natif Math.
        
        // Calcule la vague actuelle. Toutes les 10 secondes de survie, la vague augmente de 1.
        this.wave = Math.floor(this.score / 10) + 1; // Divise le score par 10 et ajoute 1 pour créer un système de paliers entiers.
        
        // Calcule le multiplicateur de difficulté. Il augmente de 15% (0.15) à chaque nouvelle vague.
        this.difficultyMultiplier = 1 + ((this.wave - 1) * 0.15); // Expression arithmétique : augmente la difficulté de 0.15 par vague franchie.
    } // Fin de la méthode update.

    // 🎓 MOT-CLÉ : GETTER (Accesseur)
    // POURQUOI : On empêche le reste du code (comme script.js) de modifier directement `this.score = 9999`. 
    // script.js a seulement le droit de *lire* le score via cette méthode. C'est le principe d'Encapsulation en POO.
    getScore(){ // Définition d'une méthode accesseur (Getter) pour lire la donnée encapsulée.
        return this.score; // Retourne la valeur actuelle de la propriété score de l'instance.
    } // Fin de la méthode getScore.

    getWave() { // Définition d'une méthode accesseur (Getter) pour la vague.
        return this.wave; // Retourne la valeur actuelle de la propriété wave de l'instance.
    } // Fin de la méthode getWave.

    getDifficultyMultiplier() { // Définition d'une méthode accesseur (Getter) pour le multiplicateur.
        return this.difficultyMultiplier; // Retourne la valeur actuelle de la propriété difficultyMultiplier.
    } // Fin de la méthode getDifficultyMultiplier.

} // Fin de la déclaration de la classe GameLogic.

/* 🎓 PATRON DE CONCEPTION (DESIGN PATTERN) : LE SINGLETON
   COMMENT : En instanciant directement l'objet ici (`new GameLogic()`) dans une constante, 
   on s'assure que n'importe quel fichier qui lira `gameLogic` parlera exactement du même objet en mémoire.
   Il n'y a qu'un seul "cerveau" pour le jeu. */
const gameLogic = new GameLogic(); // Instancie la classe GameLogic et stocke la référence dans une constante globale.

/* ==========================================================================
   CLASSE POWERUP : OBJETS ÉPHÉMÈRES
   ========================================================================== */
class PowerUp { // Déclaration de la classe PowerUp (POO) gérant les bonus ramassables.
    constructor(canvasWidth, canvasHeight) { // Constructeur avec paramètres locaux correspondant aux dimensions de l'écran.
        this.size = 15; // Initialise la propriété 'size' (rayon visuel et de collision) à 15.
        this.x = Math.random() * (canvasWidth - this.size * 2) + this.size; // Calcule une position horizontale aléatoire en évitant le débordement hors-champ.
        this.y = Math.random() * (canvasHeight - 100 - this.size * 2) + this.size; // Calcule une position verticale aléatoire en évitant la zone de lave (100px du bas).
        this.type = Math.random() < 0.5 ? 'heal' : 'invincible'; // Opérateur ternaire : 50% de probabilité d'assigner la chaîne 'heal', sinon 'invincible'.
        this.markedForDeletion = false; // Initialise le booléen de gestion mémoire (Garbage Collection) à faux.
        // Durée de vie : 400 frames. À 60 FPS, cela représente environ 6.6 secondes avant disparition.
        this.timer = 400; // Initialise la propriété 'timer' à 400 (durée de vie en frames).
    } // Fin du constructeur de PowerUp.

    update() { // Définition de la méthode update() pour le cycle de vie de l'objet.
        this.timer--; // Opérateur de décrémentation : réduit la valeur de this.timer de 1.
        if (this.timer <= 0) { // Structure de contrôle conditionnelle : vérifie si le temps de vie est écoulé.
            this.markedForDeletion = true; // Si vrai, assigne true au marqueur pour ordonner la suppression de l'objet au script principal.
        } // Fin de la condition.
    } // Fin de la méthode update.

    draw(ctx) { // Définition de la méthode draw() acceptant l'objet contexte de l'API Canvas en paramètre.
        ctx.save(); // Sauvegarde l'état actuel du contexte graphique (couleurs, ombres) sur la pile.
        // 🎓 MATHS / UX : Clignotement
        // Date.now() / 100 % 2 === 0 permet de créer un battement vrai/faux régulier basé sur l'horloge système.
        if (this.timer < 60 && Math.floor(Date.now() / 100) % 2 === 0) { // Logique booléenne avec l'opérateur ET (&&) : clignote si la fin de vie est proche.
            ctx.globalAlpha = 0.5; // Modifie la propriété d'opacité globale du contexte à 50%.
        } // Fin de la condition de clignotement.
        
        ctx.shadowBlur = 15; // Modifie la propriété shadowBlur du contexte pour créer un effet de néon/lueur.
        ctx.fillStyle = this.type === 'heal' ? "#00ff00" : "#ffff00"; // Opérateur ternaire attribuant une couleur CSS selon le type de power-up.
        ctx.shadowColor = this.fillStyle; // Copie la valeur de remplissage dans la couleur de l'ombre pour synchroniser la lueur.
        
        ctx.beginPath(); // Ordonne au contexte de commencer un nouveau chemin de tracé (indispensable avant arc).
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2); // Trace un arc de cercle complet (2 * Pi = 360°) aux coordonnées de l'objet.
        ctx.fill(); // Remplit le chemin précédemment tracé avec le fillStyle défini.
        
        // Dessine l'icône à l'intérieur du power-up pour indiquer son type.
        ctx.fillStyle = "black"; // Change le pinceau de remplissage en noir pour le texte.
        ctx.font = "bold 18px Arial"; // Modifie la propriété font du contexte (poids, taille, famille).
        ctx.textAlign = "center"; // Modifie l'alignement horizontal du texte par rapport à son point d'origine.
        ctx.textBaseline = "middle"; // Modifie l'alignement vertical du texte par rapport à son point d'origine.
        ctx.shadowBlur = 0; // Annule le flou d'ombre pour que le texte reste lisible et net.
        ctx.fillText(this.type === 'heal' ? "+" : "★", this.x, this.y + 1); // Opérateur ternaire : dessine le caractère correspondant au centre du cercle (+1px d'ajustement optique).
        ctx.restore(); // Restaure les propriétés du contexte à l'état stocké par le dernier ctx.save().
    } // Fin de la méthode draw.
} // Fin de la déclaration de la classe PowerUp.

// La classe FloatingText gère les textes flottants qui apparaissent (ex: "+20 HP").
class FloatingText { // Déclaration de la classe FloatingText (POO) pour les effets de particules textuelles.
    // Le constructeur initialise le texte, sa position et sa couleur.
    constructor(text, x, y, color) { // Constructeur attendant 4 arguments à l'instanciation.
        this.text = text; // Assigne l'argument texte à la propriété 'text' de l'instance.
        this.x = x; // Assigne l'argument x à la propriété 'x' de l'instance.
        this.y = y; // Assigne l'argument y à la propriété 'y' de l'instance.
        this.color = color; // Assigne l'argument color à la propriété 'color' de l'instance.
        this.alpha = 1; // Initialise la propriété d'opacité 'alpha' à 1 (totalement visible).
        this.markedForDeletion = false; // Initialise le booléen de nettoyage mémoire à faux.
    } // Fin du constructeur FloatingText.

    // Met à jour la position et l'opacité du texte à chaque frame.
    update() { // Définition de la méthode update() pour créer l'animation flottante.
        this.y -= 1; // Soustrait 1 à la coordonnée y, ce qui déplace visuellement le texte vers le haut.
        this.alpha -= 0.02; // Soustrait 0.02 à l'opacité, créant un effet de fondu transparent progressif.
        if (this.alpha <= 0) this.markedForDeletion = true; // Condition simple sur une ligne : si opacité <= 0, marque l'objet pour destruction.
    } // Fin de la méthode update.

    // Dessine le texte flottant sur le canvas.
    draw(ctx) { // Définition de la méthode draw() pour l'affichage via le contexte Canvas.
        ctx.save(); // Sauvegarde l'état actuel du contexte pour isoler les modifications d'opacité.
        ctx.globalAlpha = Math.max(0, this.alpha); // Définit l'opacité globale. Math.max garantit que la valeur ne tombe jamais en dessous de 0 (erreur API).
        ctx.fillStyle = this.color; // Affecte la couleur de l'instance au pinceau de remplissage.
        ctx.font = "bold 20px 'Courier New'"; // Assigne les règles typographiques du contexte.
        ctx.textAlign = "center"; // Centre le point d'ancrage horizontal du texte.
        ctx.shadowBlur = 10; // Ajoute un flou de 10 pixels pour l'ombre portée (effet lueur).
        ctx.shadowColor = this.color; // Définit la couleur de l'ombre portée de manière identique à celle du texte.
        ctx.fillText(this.text, this.x, this.y); // Exécute le rendu du texte sur le Canvas aux coordonnées actuelles de l'objet.
        ctx.restore(); // Restaure les propriétés initiales du contexte graphique (retire l'opacité et l'ombre).
    } // Fin de la méthode draw.
} // Fin de la classe FloatingText.
