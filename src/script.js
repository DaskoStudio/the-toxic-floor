/* ==========================================================================
   🎓 RÉVISION ORAL : MACHINE À ÉTATS FINIS (Finite State Machine)
   MOT-CLÉ : State Machine
   POURQUOI : Le sol ne peut être que dans UN SEUL ET UNIQUE état à la fois (Safe, Warning, Toxic).
   Une State Machine évite le chaos des conditions if/else imbriquées. L'objet a une propriété 'currentState'
   et la méthode 'transitionState' le fait basculer de manière rigide d'un rail à l'autre selon des timers.
   ========================================================================== */
class FloorManager { // Déclaration (POO) de la machine à états qui gère la dangerosité et le rendu du sol.
    constructor(mode = 'Classic') { // Fonction constructeur exécutée lors du `new FloorManager(...)`, avec un paramètre par défaut.
        this.mode = mode; // Enregistre le mode de jeu actuel en tant que propriété d'instance.
        this.floorIsToxic = false; // Initialise le flag booléen global qui déterminera les impacts avec le joueur.
        this.floorColor = '#00ff00'; // Attribue la couleur initiale (Vert Hex) à la propriété visuelle.
        this.currentState = 'SAFE'; // Instancie l'état courant de la FSM (Finite State Machine) sous la forme d'un String.
        this.timer = 0; // Initialise l'accumulateur arithmétique de temps d'état à zéro millisecondes.
        this.lastTime = Date.now(); // Initialise le marqueur temporel (Timestamp Date) pour anticiper les calculs DeltaTime.
        this.durations = { // Crée un objet littéral agissant comme dictionnaire de constantes pour les phases de temps.
            SAFE: mode === 'Hardcore' ? 1500 : 3000, // Opérateur Ternaire : raccourcit la phase paisible si mode Hardcore identifié.
            WARNING: mode === 'Hardcore' ? 0 : 1000, // Opérateur Ternaire : annule totalement la phase de clignotement (0ms) en Hardcore.
            TOXIC: mode === 'Hardcore' ? 3000 : 2000 // Opérateur Ternaire : augmente la durée d'état létal dans les modes avancés.
        }; // Fin du dictionnaire (objet) des durées d'état d'automate.
        this.floorHeight = 50; // Constante spatiale définissant en "dur" (hardcoded) la taille de la section de mort sur le repère Y.
        this.particles = []; // Déclare le tableau (Array) vide destiné à l'allocation dynamique d'objets particules (lave).
        this.targetDuration = 3000; // Paramètre initial par défaut de la durée de l'objectif courant, muté plus bas.
    } // Fin d'initialisation de l'instance.

    /* 🎓 CONCEPT CLÉ : LE DELTATIME
       POURQUOI : Au lieu d'incrémenter le timer de `+1` par frame (ce qui irait plus vite sur un écran 144Hz que sur un écran 60Hz),
       on calcule le temps RÉEL écoulé (`Date.now() - this.lastTime`) en millisecondes. 
       Le jeu tourne ainsi à la vitesse exacte prévue sur toutes les machines. */
    update(difficultyMultiplier = 1) { // L'injection de la logique de boucle principale (paramètre par défaut de protection).
        const currentTime = Date.now(); // Récupère un entier de temps immédiat via l'API Date native.
        const deltaTime = currentTime - this.lastTime; // Temps écoulé depuis la dernière boucle (Frame) calculé par simple soustraction.
        this.lastTime = currentTime; // Assigne la valeur temporelle nouvelle au repère précédent (mise à jour d'horloge absolue).
        this.timer += deltaTime; // Adjonction de l'écart ms (Delta) à l'accumulateur temporel d'état de l'objet.

        const currentSafeDuration = Math.max(1000, this.durations.SAFE / difficultyMultiplier); // API Math (Max) : assure une durée de sécurité minimale de 1sec quelle que soit l'accélération de difficulté imposée.
        this.targetDuration = this.currentState === 'SAFE' ? currentSafeDuration : this.durations[this.currentState]; // Opérateur Ternaire mutant la durée cible selon qu'elle soit altérée par la difficulté (Safe) ou fixe (Toxic/Warning).

        // Si le timer dépasse la durée prévue pour l'état actuel, on passe à l'état suivant
        if (this.timer >= this.targetDuration) { // Opérateur de comparaison conditionnelle contrôlant le cycle de vie temporel d'un sous-état logique.
            this.transitionState(); // Appel de la fonction de mutation d'état enclenchée par l'expiration de la consigne (timer).
        } // Fin du bloc de contrôle timer.

        if (this.currentState === 'TOXIC') { // Contrôle de branchement testant la validité booléenne stricte (===) du pointeur d'état.
            // --- DENSE LAVA EFFECT ---
            // Spawn multiple bubbles per frame for a boiling toxic effect
            let bubblesToSpawn = Math.floor(Math.random() * 3) + 2; // 2 to 4 bubbles per frame par usage conjoint de Random() et Floor().
            for (let i = 0; i < bubblesToSpawn; i++) { // Implémentation d'une structure itérative for(...) exécutant N fois la génération particulaire.
                this.particles.push({ // Manipulation d'Array (push) empilant un objet littéral JS anonyme.
                    x: Math.random() * canvas.width, // Adapted to actual canvas dimensions (dispersion horizontale totale).
                    y: canvas.height - this.floorHeight + (Math.random() * 15), // Spawning restreint à une ligne Y à l'intérieur du volume toxique.
                    speed: Math.random() * 3 + 2, // Faster rise, calculant la vitesse d'ascension stochastique propre à la bulle.
                    size: Math.random() * 6 + 4, // Varying bubble sizes pour l'inégalité asymétrique organique du flot.
                    alpha: 0.9 // Opacité pseudo-complète à la frame d'apparition.
                }); // Fin de la déclaration d'Objet Anonyme.
                // Limite stricte des particules à 50
                if (this.particles.length > 50) { // Limitation d'O(n) : Protège l'utilisation de mémoire en cas de sur-invocation.
                    this.particles.shift(); // Retire la plus ancienne (premier Index du Tableau) via mutation de liste (shift).
                } // Clôture du contrôle mémoire.
            } // Clôture de la boucle For.
        } // Clôture de l'exécution alternative d'état d'écran toxique.

        this.particles.forEach(p => { // Déclaration fonctionnelle sur Array, émulant une boucle sur chaque particule 'p' via fonction flèche.
            p.y -= p.speed; // Translation animant la montée Y de l'itération 'p'.
            p.alpha -= 0.015; // Phénomène d'évaporation implémenté par soustraction graduelle du canal alpha (opacité).
        }); // Fin du passage itératif (ForEach).
        this.particles = this.particles.filter(p => p.alpha > 0); // Ré-affectation (Nettoyage) supprimant les instances transparentes de l'espace alloué.
    } // Fin formelle de la méthode logicielle d'update.

    // Gère la logique de passage d'un état à l'autre : SAFE -> WARNING -> TOXIC -> SAFE...
    transitionState() { // L'aiguilleur (Switchboard) interne changeant les variables d'automate quand targetDuration est battu.
        this.timer = 0; // La FSM est remise à 0 avant la prochaine fenêtre de temps logicielle.
        switch (this.currentState) { // Démarre la lecture évaluative Switch sur le champ currentState défini comme texte.
            case 'SAFE': // Point de chute si l'état actif précédant le Switch est le vecteur SAFE.
                if (this.mode === 'Hardcore') { // Branchement testant l'existence du mode discriminant 'Hardcore'.
                    this.currentState = 'TOXIC'; // Mutation forcée, court-circuitant le WARNING, déclarant la dangerosité instantanée.
                    this.floorColor = '#ff0000'; // Transition de la palette graphique hexadécimale associée (Rouge vif).
                    this.floorIsToxic = true; // Actuateur booléen déterminant le changement de comportement (Gameplay létal).
                    showRadioMessage("DANGER INSTANTANÉ !"); // Fonction externe globale poussant la variable "alerte radio" vers le DOM/Canvas.
                } else { // Voie conditionnelle d'échappement (Mode classique ou Autre).
                    this.currentState = 'WARNING'; // Affectation de l'état charnière au moteur de la FSM.
                    this.floorColor = '#ff9900'; // Teinte la palette visuelle d'orange d'avertissement.
                    this.floorIsToxic = false; // Protège formellement (Bool) contre un déclenchement de Hitbox.
                } // Clôture du sous-branchement du module Safe.
                break; // Cassure de flux logique empêchant le passage au point 'WARNING' par ruissellement.
            case 'WARNING': // Point de passage logique si le système a fini le timer de sa phase de prélude.
                this.currentState = 'TOXIC'; // Transition implacable vers la chaîne String d'état létal.
                this.floorColor = '#ff0000'; // Ajustement de la valeur esthétique (Rouge poison).
                this.floorIsToxic = true; // Affectation logique activant concrètement les Damage Hitboxes de la lave en Update().
                showRadioMessage("Attention, pic de toxicité détecté !"); // Signal externe (Lore) enchaîné aux variables du Canvas.
                break; // Fermeture de la condition Warning.
            case 'TOXIC': // Branche FSM appelée au moment précis où le Sol arrête de nuire.
                this.currentState = 'SAFE'; // L'automate d'état boucle sur son nœud de répit fondamental.
                this.floorColor = '#00ff00'; // Renvoi d'état visuel positif (Vert) encodé via couleur string.
                this.floorIsToxic = false; // Extinction du danger absolu repassant la balise de collision au statut Faux.
                showRadioMessage("Le sol est redevenu stable... pour l'instant."); // Message d'interaction.
                break; // Rupture formelle et terminale du segment d'instruction conditionnel.
        } // Fin de l'encapsulation de type Switch().
    } // Fin logique de la méthode transitionState.

    draw(ctx, canvas) { // Appel de méthode Render déléguée, acceptant les instances Context et Viewport.
        ctx.save(); // Préservation saine du pointeur Context pour appliquer des alpha/glow limités à l'objet FSM.
        
        let alpha = 1; // Initialisation du Float alpha régissant le canal de transparence locale au dessin (1=opaque).
        if (this.currentState === 'WARNING') { // Prédicat d'évaluation : L'état signale-t-il une alarme visuelle ?
            alpha = Math.floor(Date.now() / 150) % 2 === 0 ? 0.3 : 1; // Algorithme d'Horloge (Math) retournant un clignotement strict par le biais d'un Modulo % 2, instaurant l'alpha à 0.3 ou 1.
        } // Fin de bloc conditionnel modulant le canal alpha local.
        
        ctx.globalAlpha = alpha; // Injection de la variable d'opacité calculée au contexte API HTML5 Canvas.
        ctx.fillStyle = this.floorColor; // Affectation du code Hex (String) au buffer 'pinceau' de remplissage interne du Ctx.
        ctx.shadowBlur = this.currentState === 'TOXIC' ? 10 : 5; // Optimisation : shadowBlur strictement limité à 10 max par calcul booléen ternaire.
        ctx.shadowColor = this.floorColor; // Clonage logique de la couleur (fill) dans la valeur CSS de la projection d'ombre (glow).
        
        ctx.fillRect(0, canvas.height - this.floorHeight, canvas.width, this.floorHeight); // Appelle la commande primitive Canvas de traçage de plan (X=0, Y=max-50, W=100%, H=50).
        
        if (this.currentState === 'TOXIC' || this.particles.length > 0) { // Porte d'exécution conjonctive booléenne (||) ordonnant le calcul des particules existantes, même en cas de changement d'état.
            ctx.save(); // Isolation stricte des particules (empile un état Graphic Ctx vierge d'effets néons).
            ctx.shadowBlur = 0; // Optimisation : pas de flou pour les particules individuelles, effaçant le lag dû au filtrage multiple.
            ctx.fillStyle = this.floorColor; // Confirmation du style de peinture du tampon avant itération.
            this.particles.forEach(p => { // Lancement de callback séquentiel (forEach) ciblant formellement chaque élément p.
                ctx.globalAlpha = p.alpha; // Traduction au buffer du Canvas de l'alpha mathématique déclinant de la bulle p.
                ctx.beginPath(); // Initialisation API pour le tracé d'un chemin radial clos (Cercles de bulles).
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); // Placement spatial et trigonométrique de l'orbite (2*PI Rad = 360 Deg) de la bulle.
                ctx.fill(); // Remplissage final instanciant la matérialité de l'arc en pixels écran.
            }); // Fin de la séquence itérative asynchrone Array.
            ctx.restore(); // Dépilement libérant l'état "Sans Ombre" qui avait cours durant les bulles.
        } // Fin du bloc if validant le traçage des Particules.
        ctx.restore(); // Restauration du Contexte parent, le FloorManager est graphiquement clos et pur.
    } // Fin d'enveloppe de la procédure de rendu Draw.

    // INTERCONNEXION : Cette méthode est appelée depuis la boucle update() principale avec l'objet joueur en argument.
    checkDanger(player, canvas) { // Signature appelant l'injection de dépendances (Player Objet et Canvas Node).
        if (!this.floorIsToxic) return false; // Négation Booléenne avec Return direct ; optimisation évitant des calculs collisionnels inutiles si l'état est Sûr.
        
        // Collision sur un seul Axe (Axe Y vertical) pour savoir si les "pieds" du joueur touchent le bord de la lave.
        const playerBottom = player.y + player.size; // Somme évaluant mathématiquement la limite Y inférieure AABB du sprite Player.
        const floorTop = canvas.height - this.floorHeight; // Différentielle évaluant la coordonnée absolue de surface mortelle du Canvas.

        if (playerBottom >= floorTop) { // Analyse conditionnelle vectorielle pour déterminer le dépassement (Chevauchement Y).
            return true; // Exécution renvoyant un état positif (Collision avérée) au moteur principal.
        } // Clôture if.
        return false; // Renvoi Fallback sécurisé en l'absence stricte de chevauchement d'axes.
    } // Fin d'encapsulation structurelle FSM pour checkDanger.
} // Clôture déclarative formelle de la classe (OOP) FSM FloorManager.

const canvas = document.getElementById('game'); // Manipulation du DOM : Constante référençant statiquement le nœud (Tag) HTML <canvas> identifié par 'game'.
const ctx = canvas.getContext('2d'); // Extraction via la balise d'objet de l'interface API HTML5 (CanvasRenderingContext2D), stockée dans le pointeur usuel 'ctx'.

let gameState = 'START'; // Instanciation variable globale String pilotant le routeur principal (Machine à États du Game State).
let floorManager = new FloorManager(); // Instanciation persistante globale d'une FSM orientée objet pilotant l'entité décor (Sol).

let enemies = []; // Tableau natif dynamique (Array) servant de conteneur d'agrégation itératif pour les objets ennemis.
let enemyTimer = 0; // Float ou Int global agissant comme buffer asynchrone (horloge relative) pour ordonner la génération.
let enemyInterval = 1500; // Constante modulable en ms (ici 1.5s) dictant la fenêtre minimale pour la fonction spawn().
let projectiles = []; // Tableau tampon destiné à recevoir (Push) le flot particulaire d'objets "Projectile" du décor toxique.

let powerUps = []; // Espace list (Array) isolant la mémoire des bonus générés et collectables de la map.
let floatingTexts = []; // Tableau tampon listant chaque instance d'effet d'interface utilisateur flottant à supprimer (VFX).
let powerUpTimer = 0; // Variable de boucle Game Loop agrégeant le timing d'invocation d'un item PowerUp.

let player = new Player(canvas.width / 2 - 20, canvas.height / 2 - 20); // Instanciation (new) d'un objet Joueur pré-centré selon un calcul vectoriel dimensionnel sur l'objet Canvas abstrait.

let screenShake = 0; // Compteur numérique définissant une intensité de translation chaotique du Viewport (Juiciness effect).
let fadeAlpha = 0; // Variable flottante pilotant l'opacité CSS du rectangle écran chargé d'effectuer un Game Transition (fondu au noir).
let fadeDirection = 0; // Marqueur d'état mathématique signifiant un comportement ascendant (1), descendant (-1) ou nul (0) du fondu.
let nextState = null; // Buffer mémoire attendant l'assignation de la future étape FSM post-transition (Null type).

// --- ICON / CHARACTER MANAGEMENT ---
// We store the selected character's icon and base speed in a global object.
// When the player starts the game, a new Player instance is created using these values.
let selectedCharacter = { icon: "👻", speed: 8 }; // Dictionnaire de paramètres initiaux (Objet JSON/Littéral) définissant les attributs par défaut.
let gameMode = 'Classic'; // Flag constant gérant le paramétrage des FSM secondaires au moment du Start de partie.
let nickname = ""; // Chaîne de caractères nulle attendant l'affectation du flux de données DOM (Input Utilisateur).
let highScore = 0; // Variable Integer recevant la plus haute valeur chiffrée jamais sauvegardée localement.
let isMuted = false; // Booléen d'application limitant ou autorisant le buffer audio via Keybinding Mute.

// --- INTERACTIVE LORE & CHAOS EVENT ---
let radioMessageFullText = "";      // The complete message to be displayed. (Chaîne tampon globale attendant le chargement texte).
let radioMessageDisplayLength = 0;  // How many characters are currently visible. (Entier pointant l'index courant du Sous-String).
let radioMessageCharTimer = 0;      // A timer to control the speed of the typewriter effect. (Compteur cyclique d'incrémentation).
let radioMessageTimer = 0;          // How long the message stays on screen after being typed. (Buffer TTL pour purge de variable texte).
let chaosEventTimer = 0;            // A timer for the "Invert Colors" chaos event. (Compteur décroissant activant la globalCompositeOperation FSM).

// --- AUDIO SETUP ---
// We create a simple beat manager to sync visual effects with the music's rhythm.
// For a game jam, assuming a fixed BPM is a robust and simple solution.
// For more complex projects, the Web Audio API's AnalyserNode would be used for real-time beat detection.
const BPM = 125; // Set this to your music's Beats Per Minute. (Constante pure modulant le temps de pulse visuel).
let lastBeatTime = 0; // Stockage de référence chronométrique de la boucle Beat (Delta mathématique Audio).
let visualPulse = 0; // A value from 0 to 1 representing the beat's intensity. (Flottant pour interpolations visuelles multiples).
let bgMusic = new Audio('assets/Instru by dasss.m4a'); // Instanciation asynchrone (objet DOM Audio natif) du flux sonore .m4a.
bgMusic.loop = true; // Forçage en mode répété continu (Propriété DOM d'attribut d'objet Audio).

// Setup HTML Input for Nickname
let nicknameInput = document.createElement('input'); // Appel à l'API DOM pour générer dynamiquement un nœud (tag) vierge <input>.
nicknameInput.type = 'text'; // Modification d'attribut HTML strict forçant l'input à n'accepter que du format texte standard.
nicknameInput.id = 'nicknameInput'; // Affectation d'ID (Identifier HTML) pour faciliter les requêtes ciblées de scripts extérieurs potentiels.
nicknameInput.placeholder = 'Enter Pseudo...'; // Assignation du texte temporaire explicatif (Ghost text) au sein de la balise input.
nicknameInput.style.position = 'absolute'; // Appel direct à l'API DOM CSSOM : Sépare la balise du flux de rendu de la page (superposition relative).
nicknameInput.style.left = '-9999px'; // Caché hors écran au lancement avant calcul par soustraction grossière (Hide logic CSS).
nicknameInput.style.top = '-9999px'; // Relégation Y extra-muros de la balise HTML pour éviter un flickering esthétique au boot.
nicknameInput.style.transform = 'translate(-50%, -50%)'; // Modificateur géométrique CSS centrant exactement l'ancre X/Y au milieu du bloc form.
nicknameInput.style.fontSize = '20px'; // Style inline DOM dictant la hauteur matérielle de la police web en pixels.
nicknameInput.style.textAlign = 'center'; // Règle d'alignement formel CSS typographique à l'intérieur de l'input box.
nicknameInput.style.padding = '5px'; // Instruction DOM ajoutant un volume tampon (espace intérieur) de 5px au bloc.
nicknameInput.style.zIndex = '100'; // Déclaration de contrainte de profondeur de couche CSS assurant le positionnement "au-dessus" du canevas natif.
nicknameInput.style.borderRadius = '5px'; // Injonction cosmétique altérant le rayon des angles formels d'affichage web (Coins arrondis).
nicknameInput.style.border = '2px solid #00ffcc'; // Règle de design combinée DOM dictant (épaisseur, type, codage hex) de la bordure input.
nicknameInput.style.backgroundColor = 'rgba(0, 0, 0, 0.7)'; // Affectation de fond CSS exploitant l'argument canal alpha RGBA de transparence logicielle.
nicknameInput.style.color = '#ffffff'; // Détermination du format hexadécimal pur Blanc de la typographie insérée (couleur texte tapé).
document.body.appendChild(nicknameInput); // Exécution de routine DOM (appendChild) injectant formellement l'élément fraîchement paramétré dans la structure nœud racine body.

nicknameInput.addEventListener('input', (e) => { // Souscription d'écouteur asynchrone DOM sur l'évènement de frappe typographique (Key Input Event) de cet élément.
    nickname = e.target.value; // Déréférencement : on capture le contenu tapé via l'objet évènement (e), cible (target), et le stocke dans le buffer système string (nickname).
    highScore = loadHighScore(nickname); // Appel d'action conditionnelle : Requête asynchrone le profil (LocalStorage) fraîchement modifié pour rafraîchir son top.
}); // Fin logique du Listener Input.

/* ==========================================================================
   🎓 RÉVISION ORAL : L'API WEB STORAGE (LocalStorage)
   COMMENT ÇA MARCHE : C'est une mémoire clé-valeur intégrée au navigateur web du joueur (côté Client). 
   POURQUOI LES JSON ? Le LocalStorage est limité : il n'accepte *que* des chaînes de caractères (String). 
   On utilise JSON.stringify() pour transformer notre Objet de scores en texte afin de le stocker, 
   et JSON.parse() pour retransformer ce texte en véritable Objet JS quand on relance le jeu.
   ========================================================================== */

function loadHighScore(name) { // Définition de procédure fonctionnelle de Lecture, extrayant dynamiquement les valeurs du store.
    if (!name) return 0; // Négation de validité (Truthy check) : court-circuite la lecture si la chaîne nom est vide pour prévenir une erreur.
    // `|| {}` est un Fallback (solution de secours) : Si JSON.parse renvoie 'null' (premier lancement de la partie), on renvoie un objet vide pour éviter un plantage fatal.
    const scores = JSON.parse(localStorage.getItem('toxicFloorScores')) || {}; // Chaînage : Désérialisation (Parse) de l'objet natif Browser LocalStorage vers objet littéral JavaScript, plus l'opérateur de fallback Ou.
    return scores[name] || 0; // Réponse : accède à la clé via indexation par chaîne (Objet dictionnaire) et retourne le score, ou 0 s'il est inexistant (Fallback).
} // Fin de la boucle lecture de score.

function saveHighScore(name, score) { // Déclaration formelle d'une fonction de Sérialisation/Écriture acceptant une paire Clé/Valeur.
    if (!name) return; // Point de sauvegarde (Guard clause) bloquant toute action inattendue au cas où le joueur n'a pas tapé de nom.
    const scores = JSON.parse(localStorage.getItem('toxicFloorScores')) || {}; // Opération Parse miroir (Fetch JSON de la Db LocalBrowser), réassemblage en structure objet ou Null Object Array par sécurité.
    if (!scores[name] || score > scores[name]) { // Condition composite : Le profil n'a pas d'entrée OU bien la valeur de score argument est purement supérieure au record passé.
        scores[name] = score; // Opération de mise à jour indexée : Assignation stricte (Overwrite) ou création d'une entrée dict/objet avec sa valeur correspondante.
        localStorage.setItem('toxicFloorScores', JSON.stringify(scores)); // Appel de méthode API Web : Sérialisation (Stringify) inversée encodant l'intégralité du Dictionnaire modifié vers le navigateur web local.
    } // Fin d'enveloppe conditionnelle de Validation de record.
} // Terminaison stricte de la méthode Sauvegarde.

// 🎓 LOGIQUE DE TRI : L'objet des scores est d'abord converti en un tableau Array `[{name:"A", score: 10}]`.
// Ensuite, on utilise la méthode Array.sort() avec une fonction fléchée mathématique pour ordonner du plus grand au plus petit.
function getTopScores() { // Fonction procédurale analytique listant les informations sérialisées et créant un rendu top/triage.
    const scores = JSON.parse(localStorage.getItem('toxicFloorScores')) || {}; // Moteur de Parse convertissant la chaîne système brute du DOM Storage en objet.
    let scoreArray = []; // Instance d'une liste JavaScript typée (Array) vide, destinée à recevoir le push d'objets sérialisés.
    for (let name in scores) { // Boucle itérative logicielle (For...In) parcourant de manière exhaustive toutes les Keys string d'un objet indexé.
        scoreArray.push({name: name, score: scores[name]}); // Mutateur pushant un nouvel objet anonyme combinant le nom (Clé) et la perf (Valeur indexée) dans le conteneur list.
    } // Fin du parcourt cyclique (For In).
    scoreArray.sort((a, b) => b.score - a.score); // Utilisation d'algorithme mathématique fonctionnel : compare l'objet A et B, le calcul différentiel classant le tout par ordre descendant.
    return scoreArray.slice(0, 3); // Retourne le Top 3 par usage de l'API de slicing Array, qui tronque formellement la liste aux trois premières cellules.
} // Fin logique de la méthode GetTopScores.
// --------------------------- // Commentaire de structuration visuelle du développeur

function showRadioMessage(msg) { // Routine paramétrée (Fonction simple) exécutant l'altération simultanée de plusieurs variables liées.
    radioMessageFullText = msg; // Réassigne la chaîne (String Argument msg) à la variable tampon (Buffer) de contenu complet.
    radioMessageDisplayLength = 0; // Reset the typewriter. (Bascule la tête de lecture d'écriture pseudo-machine à zéro).
    radioMessageCharTimer = 0; // Remise à l'état nul du délai chronométrique (Frames) gérant la pulsation d'apparition machine.
    radioMessageTimer = 300; // Time the message stays on screen. (Définition d'un délai fixe - frames - garantissant la vision claire du message avant disparition).
} // Conclusion syntaxique de la fonction Radio Message.

function changeGameState(newState) { // Moteur formel de Machine à État FSM, conditionnant les transitions GameMode avec sécurité écran.
    if (fadeDirection === 0) { // Condition de blocage (Lock) s'assurant mathématiquement que la transition/fondu actuelle est bien inactive (nulle).
        nextState = newState; // Enregistre en file d'attente système la consigne String ciblant le Game State à initialiser à l'achèvement du fondu.
        fadeDirection = 1; // Modifie l'impulsion mathématique de la variable du fondu, passant en mode ascendant (Fade To Black en cours).
        if (newState !== 'START') { // Évaluation asynchrone comparant le futur State avec la chaîne littérale de l'écran d'Accueil.
            nicknameInput.style.display = 'none'; // DOM CSS Manipulation : force la disparition abrupte de la balise HTML de saisi de nom si l'on quitte le Menu.
        } // Fin de condition de Nettoyage DOM.
    } // Fin d'encapsulation de validation de Fade.
} // Validation et clôture de fonction de transition (Changement d'État de Jeu).

let keys = {}; // Dictionnaire JSON (Objet) recevant de manière dynamique (Key/Value Booléenne) l'état de chaque touche pressée.
window.addEventListener('keydown', (e) => { // Souscription globale d'écouteur DOM (Objet Window) interceptant la frappe au clavier (keydown event).
    keys[e.code] = true; // Mutation d'index asynchrone : crée ou écrase une entrée dans le dictionnaire keys, certifiant que sa valeur est "pressée".
    
    // Lance la musique à la première touche pressée (si le son n'est pas coupé)
    if (bgMusic.paused && !isMuted && e.code !== 'KeyV') { // Opérande conditionnelle complexe de vérification d'API Audio (Is paused ?) et booléens locaux, excluant volontairement le binding du Mute (V).
        bgMusic.play().catch(err => console.log("Attente d'interaction pour l'audio")); // Commande Audio Play(), gérée en flux de Promesse (Catch) afin de bypass les règles strictes d'autoplay des navigateurs.
    } // Clôture d'intervention audio.

    // Désactive les raccourcis clavier quand on écrit dans le champ de texte
    if (document.activeElement === nicknameInput) { // Vérification de Node strict (API DOM) s'assurant que le curseur utilisateur (focus) est présent dans la barre input de pseudo.
        if (e.code === 'Enter' && nickname.trim() !== '') { // Action booléenne vérifiant la frappe de l'Entrée, additionnée d'une vérification Trim() contre les pseudonymes formés uniquement d'espaces vides.
            changeGameState('INTRO'); // Signal asynchrone ordonnant la validation du formulaire et l'activation du State Intro FSM.
        } // Fin d'évaluation touche entrée.
        return; // Clause Return de blocage : Interrompt prématurément (Early Return) la lecture de l'évènement clavier pour éviter que ZQSD ne déplace le joueur pendant l'écriture.
    } // Clôture de protection de frappe d'interface.

    // Toggle pour le Son
    if (e.code === 'KeyV') { // Branche conditionnelle classique scrutant l'action ciblée de la KeyCode V (Mute).
        isMuted = !isMuted; // Algorithme de Toggle basique (bascule True/False) manipulant la valeur du drapeau de son isMuted.
        bgMusic.muted = isMuted; // Affectation de l'état système du booléen local vers la propriété DOM absolue de l'objet natif Audio HTML5.
    } // Clôture de l'embranchement du Toggle Son.

    if (fadeDirection !== 0) return; // Sécurité de Flux : Early return bloquant les commandes clavier durant l'animation de transition pour empêcher les glitchs FSM d'écrans superposés.

    if (gameState === 'START') { // Chemin conditionnel FSM interceptant l'action du joueur s'il réside dans la phase d'état Menu Départ.
        if (e.code === 'KeyH') { // Sous-condition scrutant le mappage clavier spécifique de la touche H pour lancer la section Tutoriel.
            changeGameState('HOW_TO_PLAY'); // Injection de l'instruction FSM "Comment Jouer" vers le routeur de changement d'état.
        } else if (e.code === 'KeyC') { // Alternative de sous-condition scrutant le mappage clavier (touche C) concernant le module de Roster.
            changeGameState('CHARACTER_SELECT'); // Injection de commande String ciblant la page de sélection des personnages.
        } else if (e.code === 'Space' && nickname.trim() !== '') { // Condition hybride finale du Node exigeant l'appui Space combiné à l'assurance (trim) d'un pseudo renseigné sans blanc.
            changeGameState('INTRO'); // Autorisation FSM de basculement vers la cinématique d'introduction de la partie.
        } // Clôture de l'arbre conditionnel du module START.
    } else if (gameState === 'HOW_TO_PLAY' || gameState === 'CHARACTER_SELECT' || gameState === 'GAMEOVER') { // Node conditionnel hybride évaluant la multiplicité des menus secondaires à comportement partagé par OU logique (||).
        if (gameState === 'CHARACTER_SELECT') { // Branchement asymétrique exclusif s'exécutant uniquement dans l'interface de Rosters.
            if (e.code === 'Digit1' || e.code === 'Numpad1') selectedCharacter = { icon: "👻", speed: 8 }; // Paramétrage JSON de l'objet dictant le skin Ghost, lié aux Event Code des touches "1".
            if (e.code === 'Digit2' || e.code === 'Numpad2') selectedCharacter = { icon: "🤖", speed: 6 }; // Paramétrage d'objet dictant le profil robot, lourd, lié aux input code "2".
            if (e.code === 'Digit3' || e.code === 'Numpad3') selectedCharacter = { icon: "👽", speed: 10 }; // Paramétrage rapide assignant l'Alien, sous impulsion des touches code "3".
            if (e.code === 'KeyM') gameMode = gameMode === 'Classic' ? 'Hardcore' : 'Classic'; // Structure Booléenne Ternaire réalisant un basculement (Toggle) du format GameMode sous appui M.
        } // Fermeture logicielle de la branche de Roster.
        if (e.code === 'Space') { // Instruction de retour, universelle aux divers menus partagés, écoutant la frappe d'une Spacebar.
            changeGameState('START'); // Renvoi de commande FSM ramenant le pointeur d'état du programme à la racine du Menu.
        } // Clôture du sous-bloc.
    } else if (gameState === 'INTRO') { // Point FSM interceptant l'exécution asynchrone si la cinématique texte d'introduction est affichée.
        if (e.code === 'Space') { // Détecteur simple d'avancement par la touche Space (skip logic).
            changeGameState('PLAYING'); // Injection formelle de la commande déclenchant définitivement la boucle d'action principale du Game.
        } // Fin d'analyse Skip.
    } // Fin complète et structurelle de l'arbre Listener FSM.
}); // Fin et fermeture de l'inscription asynchrone à l'AddEventListener Keyboard (Keydown).
window.addEventListener('keyup', (e) => keys[e.code] = false); // AddEventListener (Hook) natif inversé : Enregistre le relâchement de touche pour repasser le booléen Dictionary (keys) à Faux, stopper la persistance de l'action.

/* ==========================================================================
   BOUCLES PRINCIPALES : UPDATE & DRAW (LE MOTEUR DE JEU)
   ========================================================================== */
function updateTransitions() { // Fonctionnalité de Loop calculant frame par frame la constante d'état du rideau transitoire.
    if (fadeDirection === 1) { // L'orientation mathématique de variable pointe vers une opacité montante (Lancement du Fade-Out).
        fadeAlpha += 0.05; // Application de flottant ascendant augmentant l'Alpha du cadre graphique de 5% par Update.
        if (fadeAlpha >= 1) { // Sécurité mathématique vérifiant que le fondu plein écran a bien atteint 100% visuel.
            fadeAlpha = 1; // Clamp (Forçage mathématique) ramenant stricto sensu l'alpha à sa limite supérieure absolue de valeur 1.
            gameState = nextState; // Instant zéro (Coupure de flux) : Intervertit enfin l'état cible (FSM) pour l'appliquer formellement à la machine.
            
            if (gameState === 'START') { // Si le module appelé correspond à l'interface primaire du site web.
                nicknameInput.style.display = 'block'; // Ordonne au DOM CSS de la page de réintroduire visuellement la boîte Input textuelle.
            } // Fin de condition DOM form.

            if (gameState === 'PLAYING') { // Méta-condition d'initialisation de partie : l'état s'apprête à passer en jeu actif.
                player = new Player(canvas.width / 2 - 20, canvas.height / 2 - 20, selectedCharacter.icon, selectedCharacter.speed); // Instanciation POO neuve de la FSM Joueur : le centre de l'écran accueille l'avatar configuré.
                enemies = []; // Opération Garbage Memory de nettoyage, réinitialisant sauvagement le tampon d'ennemis d'une éventuelle partie précédente.
                projectiles = []; // Destruction d'Array asynchrone : purge de tous les objets de tir résiduels.
                enemyTimer = 0; // Remise à zéro de l'horloge temporelle d'invocation des adversaires de faction.
                powerUps = []; // Écrasement mémoire absolu instanciant un Set vide de bonus curatifs/invincibilité.
                floatingTexts = []; // Écrasement mémoire de formatage d'interface (Dégâts/Heal visuels résiduels).
                powerUpTimer = 0; // Extermination de la constance chrono des Items bonus.
                floorManager = new FloorManager(gameMode); // Reboot POO total : Instanciation brute de Machine à État Floor calquée sur le Game Mode String.
                gameLogic.start(); // Invocation formelle du cerveau singleton : démarre l'enregistrement du Score par le Temps.
                showRadioMessage("Début de la survie. Bonne chance."); // Lancement cosmétique du String de lore d'entrée pour alerter le Player.
            } // Clôture absolue de la routine de lancement PLAYING.
            fadeDirection = -1; // Modification du pointeur mathématique déclenchant la seconde phase de l'animation d'UI (Apparition/Fade-In).
        } // Fermeture de condition Clamp Alpha 1.
    } else if (fadeDirection === -1) { // Phase asymétrique opposée scrutée lorsque le Flag signale une décroissance programmée de l'interface obscure.
        fadeAlpha -= 0.05; // Application du différentiel scalaire diminuant la transparence pour laisser paraître la frame FSM de jeu.
        if (fadeAlpha <= 0) { // Clamp d'extinction vérifiant la transparence absolue (visibilité absolue du Game State).
            fadeAlpha = 0; // Forçage de garde de variable interdisant le passage en nombre négatif de la caractéristique Alpha API Canvas.
            fadeDirection = 0; // Annulation définitive du système directionnel remettant la FSM transitionnelle en phase de Repos (Idle).
        } // Clôture du sous-processus Fade-In.
    } // Fin d'encapsulation de la FSM Transitoire globale.
} // Terminaison stricte de la déclaration procédurale UpdateTransitions.

let lastBoxShadow = ""; // Buffer mémoriel (Cache) destiné à éviter le repeint continu CSS (DOM Repaint issue) concernant l'ombre portée (Glow).
let lastBorderColor = ""; // Buffer mémoriel parallèle destiné à préserver les performances en limitant la réécriture du DOM de bordure.

function playBeep(floorMgr) { // Fonction d'injection esthétique globale chargeant d'adapter l'HTML (hors Canvas) aux effets sonores et FSM.
    // --- AUDIO SYNC VISUALS ---
    // Simplification : 2 intensités fixes (fort/faible) pour éviter les recalculs CSS constants
    const pulseIntensity = visualPulse > 0.5 ? 40 : 20; // Algorithme conditionnel ternaire : calcule un rayonnement (Blur size) fort ou faible selon le tick du BPM audio.

    let newBorderColor = ''; // Chaîne de caractères de portée locale préparant le transit de l'information hexadécimale bordure.
    let newBoxShadow = ''; // Variable locale recevant l'interpolation complète de la nouvelle String d'Ombrage CSS.

    if (floorMgr.currentState === 'SAFE') { // Chemin de contrôle logique vérifiant le statut 'Sécuritaire' imposé par la FSM sol en paramètre.
        newBorderColor = '#00ffcc'; // Assignation explicite de teinte (Hex) vert/cyan marquant l'absence de danger.
        newBoxShadow = `0 0 ${pulseIntensity}px #00ffcc, inset 0 0 ${pulseIntensity}px #00ffcc`; // Interpolation String CSS (Template Literal) calculant doublement le glow externe et interne en utilisant la taille pulsee.
    } else { // Voie conditionnelle d'échappatoire si le Terrain ne correspond plus à l'état de sécurité et demande des mathématiques complexes (Clignotements).
        let progress = floorMgr.timer / floorMgr.targetDuration; // Fonction rationnelle retournant un Float entre 0 et 1 : symbolise le Taux (%) d'avancement de la jauge temporelle de l'état actuel FSM.
        let blinkRate = floorMgr.currentState === 'WARNING' ? 400 - (progress * 300) : 100; // Calcule la frénésie du clignotement : En Warning, il accélère mathématiquement de 400ms à 100ms grâce au coefficient progressif, sinon Toxic est bloqué à un spasme constant de 100ms.
        let isBlinkOn = Math.floor(Date.now() / blinkRate) % 2 === 0; // Formule absolue booléenne d'horloge : produit de manière constante une scission (Vrai/Faux) dépendante du facteur 'blinkRate' instancié précédemment.

        if (floorMgr.currentState === 'WARNING') { // Cas restrictif si la FSM réside actuellement en période intermédiaire ou d'alerte.
            if (isBlinkOn) { // Lecture pure du module de clignotement qui évalue le temps : L'écran doit-il allumer ou éteindre ses néons à cet instant T ?
                newBorderColor = '#ff9900'; // Transmission de la couleur hexadécimale orangée de l'alerte à la bordure physique.
                newBoxShadow = `0 0 ${pulseIntensity}px #ff9900, inset 0 0 ${pulseIntensity}px #ff9900`; // Transmission calculée de la directive Shadow pour un Glow orange synchronisé au beat (BPM) global.
            } else { // Phase d'extinction de l'horloge : la lumière orange doit se tasser d'un coup visuellement.
                newBorderColor = '#333'; // Gris sourd, évoquant une perte d'énergie drastique.
                newBoxShadow = 'none'; // Efface violemment et instantanément toute composante BoxShadow (instruction CSS explicite).
            } // Clôture d'instruction Blink Warning.
        } else if (floorMgr.currentState === 'TOXIC') { // Autre pan conditionnel exclusif, propre à la FSM Sol passée en Létale (Toxique).
            if (isBlinkOn) { // Réinterrogation du chronomètre horloge absolu calculant l'état d'animation Blink.
                newBorderColor = '#ff0000'; // Allumage Rouge Sang : codage d'agressivité hexadécimale transmis à l'API Canvas Node.
                newBoxShadow = `0 0 ${pulseIntensity * 1.5}px #ff0000, inset 0 0 ${pulseIntensity * 1.5}px #ff0000`; // Génération d'un ombrage majoré mathématiquement (x1.5) provoquant un Halo rouge très intense sur la page entière.
            } else { // Bascule éteinte du battement stroboscopique du péril rouge.
                newBorderColor = '#550000'; // Mutation de teinte, écrasant la bordure d'un rouge assombri, lourd (sang caillé).
                newBoxShadow = '0 0 10px #550000'; // Maintien d'une tension résiduelle mineure (10px glow sombre) pour ne jamais relâcher l'alerte visuelle (UX).
            } // Terminaison des options de bascule Toxic.
        } // Clôture d'analyse de sous-routines de la FSM sur les effets d'Interface visuelle de Danger.
    } // Fin complète de l'algorithmique FSM/Interface DOM.

    // Optimisation MAJEURE : On applique au DOM uniquement s'il y a un vrai changement !
    if (lastBorderColor !== newBorderColor) { // Clause asynchrone comparant les valeurs calculées à la string mémorisée. (Objectif : réduire de 60 appels DOM CSS/sec à seulement 2 ou 3 utiles).
        canvas.style.borderColor = newBorderColor; // Injection frontale manipulant le CSSOM natif d'objet HTMLCanvas via JS, mutant physiquement sa propriété visuelle frame par frame si justifiée.
        lastBorderColor = newBorderColor; // Rafraîchissement direct de cache mémoriel garantissant le statu quo à la frame suivante.
    } // Clôture d'optimisation Border.
    if (lastBoxShadow !== newBoxShadow) { // Processus d'optimisation jumeau de validation de changement Shadow, crucial pour la mémoire vidéo.
        canvas.style.boxShadow = newBoxShadow; // Transfert coûteux en ressource (Reflow CSS) uniquement si l'horloge ordonne une nouvelle string.
        lastBoxShadow = newBoxShadow; // Mise à jour de la string de prévention de cache Shadow.
    } // Clôture d'optimisation Shadow.
} // Terminaison de l'injection d'expérience audio/visuelle sur l'IHM du navigateur.

function update() { // Fonction reine : Le cerveau asynchrone principal d'orchestration (Game Logic Math Update) exécuté à haute fréquence en boucle de jeu infinie.
    updateTransitions(); // Appel systémique imposant la gestion prioritaire des éventuels fondus visuels masquant l'action mathématique FSM sous-jacente.

    if (screenShake > 0) screenShake--; // Opérateur inhérent au Game Feel diminuant unitairement l'intensité de tremblement de la caméra par appel frame jusqu'à amortissement zéro.

    // --- UPDATE TIMERS & MANAGERS ---
    const beatInterval = 60000 / BPM; // Constante physique globale calculant la période séparant deux percussions sonores via l'équation 60 secondes divisées par le nombre de battements.
    const now = Date.now(); // Récupération instantanée du marqueur de temps universel (Timestamp int) stockée localement pour économiser des appels système (Optimisation O(1)).
    if (now - lastBeatTime > beatInterval) { // Logique d'évaluation temporelle confirmant qu'une pulsation musicale complète s'est écoulée selon le Delta Time analysé.
        lastBeatTime = now - ((now - lastBeatTime) % beatInterval); // Sync with the beat. Équation asynchrone soustrayant le reste superflu (modulo) pour garantir une perfection mathématique et empêcher la dérive du rythme.
        visualPulse = 1.0; // Max intensity on beat. Assignation brutale de consigne dictant aux entités graphiques un déclenchement explosif.
    } // Fermeture de la mécanique FSM audio-synchronisée.
    if (visualPulse > 0) visualPulse = Math.max(0, visualPulse - 0.05); // Decay pulse. Fonction de chute exponentielle décroissant l'intensité du rayonnement à chaque cycle en la protégeant par la borne native (0).

    if (chaosEventTimer > 0) chaosEventTimer--; // Mutation décroissante élémentaire contrôlant le cycle de vie de l'événement système de "Corrompre/Inverser" les teintes d'écran.

    if (gameState === 'PLAYING' && fadeDirection <= 0) { // Porte booléenne monumentale vérifiant (ET/&&) le statut principal FSM actif ET l'absence du rideau d'interface de transition, bloquant toute simulation d'objets (Pause) le cas échéant.
        // Update typewriter effect
        if (radioMessageDisplayLength < radioMessageFullText.length) { // Comparateur scalaire sondant l'index d'affichage du String visuel versus sa valeur texte théorique cible.
            radioMessageCharTimer++; // Incrémente la fréquence d'attente d'affichage entre les lettres (Timer).
            if (radioMessageCharTimer > 1) { // Change '1' to be faster or slower. Condition autorisant l'ajout de caractère à la machine si N cycles d'horloge ont sonné.
                radioMessageDisplayLength++; // Ajout d'indice : Avance la tête de lecture d'une lettre dans l'encodage du Sous-String de message.
                radioMessageCharTimer = 0; // Remise à zéro pour forcer l'attente algorithmique du prochain caractère (effet tapuscrit/machine à écrire).
            } // Fin de condition temporelle de lettre de String.
        } else if (radioMessageTimer > 0) { // Alternance asymétrique : si le String complet est affiché, déclenchement temporel d'une période de persistance écran.
            radioMessageTimer--; // Altération de la durée de consigne avant effacement du lore sur le HUD canvas.
        } // Bouclage conditionnel de String Lore et Ticker.

        // --- CHAOS EVENT TRIGGER ---
        // A rare random chance to trigger the chaos event during gameplay.
        if (chaosEventTimer <= 0 && Math.random() < 0.0002) { // Expression booléenne évaluant une fonction mathématique pseudo-aléatoire (0.02% de chance par frame d'activation d'anomalie système).
            chaosEventTimer = 300; // Event lasts for 5 seconds (300 frames / 60fps). Injection de 300 cycles (5s d'effets visuels) au compteur.
            showRadioMessage("SYSTEM CORRUPTION DETECTED!"); // Transmission immédiate du string corrupteur vers le composant textuel de HUD.
        } // Validation de condition asynchrone de chaos stochastique.
        
        player.move(keys, canvas.width, canvas.height); // Injection de paramètre (Event List + Vector Box Bounds) ordonnant à l'objet joueur la mise à jour arithmétique de son emplacement absolu.
        player.update(); // Déclenchement de la méthode de boucle interne de l'objet player évaluant compteurs et filtres de garbage particles.
        gameLogic.update(); // Interrogation de la logique racine de l'instance singleton GameLogic (Temps de survie, incrémentation du coefficient affine Wave/Survie).

        const difficulty = gameLogic.getDifficultyMultiplier(); // Affectation par Getter (POO), du coefficient mathématique dictant le rythme futur pour spawn et descente d'ennemis.

        powerUpTimer++; // Altération arithmétique d'horloge (Buffer spawn Items).
        if (powerUpTimer > 300) { // Condition d'itération asynchrone dictant que l'épreuve de génération power-up survient environ toutes les 5 secondes (300 frames à 60Hz).
            if (Math.random() < 0.4 && powerUps.length < 3) { // Combinaison de probabilité de base (40%) ET vérification impérative d'un espace disponible dans le tableau Array des items (Maximum 3 présents).
                powerUps.push(new PowerUp(canvas.width, canvas.height)); // Création par instantiation de classe (POO) PowerUp, empilée dynamiquement à l'Array avec des références de spawn liées aux bordures viewport en argument.
            } // Clôture d'épreuve de spawn aléatoire d'item.
            powerUpTimer = 0; // Remise à zéro obligatoire du cycle d'évaluation pour garantir des boucles équidistantes chronologiquement.
        } // Fin de processus d'injection FSM pour Game Loop des objets Loot.

        powerUps.forEach(pu => { // Opération de type Map (parcours) asynchrone pour la totalité des objets instanciés persistants du jeu, appliquant l'itération fléchée lambda PU.
            pu.update(); // Déclenche pour chaque Objet Loot du cycle sa méthode mathématique d'érosion vitale/mort.
            
            /* 🎓 LOGIQUE MATHÉMATIQUE : COLLISION CIRCULAIRE (Pythagore)
               POURQUOI : Les powerups étant des cercles, utiliser un rectangle de hitbox est imprécis (collision dans les coins du vide).
               On calcule la diagonale (hypoténuse) entre le centre du joueur et le centre du powerup.
               Si la distance est inférieure à (rayonJoueur + rayonPowerUp), c'est qu'ils se touchent. */
            const distX = (player.x + player.size / 2) - pu.x; // Recherche spatiale du différentiel dimensionnel sur l'axe des Abscisses reliant le point central formel du joueur et l'origine du power up.
            const distY = (player.y + player.size / 2) - pu.y; // Recherche de différentiel scalaire géométrique calculant l'équivalent matriciel ordonnées (Axe vertical) séparant l'avatar de l'item Loot.
            const distance = Math.sqrt(distX * distX + distY * distY); // Usage du théorème mathématique universel de calcul d'hypoténuse (Racine de la somme des carrés) identifiant le segment absolu entre les deux points distants.
            
            if (distance < player.size / 2 + pu.size) { // Application asynchrone du contact (Hit) : Le choc est avéré mathématiquement si l'écart est inférieur à la somme des deux rayons volumiques.
                pu.markedForDeletion = true; // Signal d'absorption : Passe l'état intrinsèque de l'Objet PU ciblé à "True" pour destruction, simulant le gain du bonus et l'évaporation de l'entité Loot.
                if (pu.type === 'heal') { // Inspection Conditionnelle : La méthode évalue le String dictant la nature du bonus capturé, recherchant sa forme attributaire originelle (Heal).
                    player.heal(20); // Action (POO) d'appel de méthode curatrice sur l'objet Player, octroyant numériquement vingt points int au total.
                    floatingTexts.push(new FloatingText('+20 HP', player.x + player.size / 2, player.y, '#00ff00')); // Création locale d'objet (FloatingText) pour VFX et UI asynchrone à l'emplacement précis du choc, coloré d'un vert Hex signifiant la régénération.
                } else if (pu.type === 'invincible') { // Évaluation asymétrique contraire du String analysant si l'état intrinsèque est classé 'invincible' (Item rare de Protection Absolue).
                    player.makeInvincible(180); // Lancement de méthode de la classe Player mutante l'état de vulnérabilité interne avec un argument d'une durée (Frame) égale à trois secondes.
                    floatingTexts.push(new FloatingText('INVINCIBLE', player.x + player.size / 2, player.y, '#ffff00')); // Lancement d'effets Floating Text dédiés signalant la force divine avec colorisation Or/Jaune (ffff00).
                } // Clôture analytique asynchrone de la sélection d'effet Item.
            } // Clôture booléenne de l'Hitbox Hit Event Circulaire de Power-Up.
        }); // Terminaison de la méthode fonctionnelle pour l'inspection de hit Loot sur Array.
        powerUps = powerUps.filter(pu => !pu.markedForDeletion); // Collecte de RAM : Opération Array destructrice ré-allouant l'espace Tableau uniquement aux objets n'arborant pas de fanion de purge.

        floatingTexts.forEach(ft => { // Examen (mapping) itératif de l'ensemble d'instances texte d'Interface Graphique flottante contenues.
            ft.update(); // Action standard d'appel pour altérer la logique géométrique (Ascension) de l'Instance ft examinée.
            if (ft.y < -50) ft.markedForDeletion = true; // Cleanup hors-écran. Assignation destructive pour libérer l'Array si le visuel texte s'est élevé totalement en-dehors du Viewport visible (-50px d'Axe Y).
        }); // Interruption de la boucle de gestion asynchrone FloatingText.
        floatingTexts = floatingTexts.filter(ft => !ft.markedForDeletion); // Purge Mémoire Absolue par méthode Filter, évacuant du flux d'objet tout UI éphémère flagué.

        enemyTimer += 16 * difficulty; // Avancement de l'horloge système simulée Enemy Timer par une approximation de DeltaTime (16ms) altérée par le multiplicateur global du singleton GameLogic.
        if (enemyTimer > enemyInterval) { // Détection FSM par évaluation conditionnelle : L'horloge virtuelle de Spawn a rattrapé la contrainte de rythme limite (Interval).
            const types = ['normal', 'normal', 'hunter', 'giant', 'flash']; // Tableau de données statistiques String permettant le balisage probabiliste (taux de spawn), ici 40% de Normal et autres isolés.
            const randomType = types[Math.floor(Math.random() * types.length)]; // Mathématique aléatoire lisant l'Array via index (0..4), affectant l'archétype sélectionné au pointeur de construction de Boss/Ennemi.
            enemies.push(new Enemy(canvas.width, canvas.height, randomType)); // Action asynchrone de Factory (POO) produisant et consignant directement un clone hostile à profil désigné à la liste générale d'Entités en cours.
            
            enemyTimer = 0; // Remise au niveau de l'horloge d'activation d'ennemi, l'épreuve de temps reprenant de zéro.
            if (enemyInterval > 500) enemyInterval -= 10; // Accélération de la logique exponentielle asymétrique FSM d'apparition réduisant chronologiquement le délai de paix de 10ms par ennemi généré, bornée à 500ms (Plafond de spawn max).
        } // Interruption booléenne du générateur (Spawner) hostile.

        enemies.forEach(enemy => { // Action itérative de masse inspectant chaque unité indépendante du tableau Enemies.
            enemy.update(difficulty, player); // Commande de mise à jour FSM de l'Enemy forçant le rafraîchissement d'IA Tracking et de physique vectorielle via transmission de l'état Player.
            
            /* 🎓 LOGIQUE MATHÉMATIQUE : COLLISION AABB (Axis-Aligned Bounding Box)
               POURQUOI : C'est l'algorithme le moins gourmand en performances pour l'ordinateur.
               On vérifie que les 4 côtés de la "boîte" (rectangle) du joueur entrent en contact avec 
               la "boîte" de l'ennemi. Si les 4 conditions sont vraies simultanément, il y a choc. */
            if (player.x < enemy.x + enemy.width && // Algorithme d'intersection cartésienne (Condition Axe X 1) comparant coordonnée abstraite droite adverse contre bordure gauche du sujet central.
                player.x + player.size > enemy.x && // Suite de vérification arithmétique croisée d'Axe X (Condition 2) cernant la réalité matérielle d'une inclusion d'hitbox bilatérale.
                player.y < enemy.y + enemy.height && // Test bilatéral (Axe Y Haut, Condition 3) vérifiant la pénétration vectorielle inférieure et supérieure coordonnée en hauteur de Canvas.
                player.y + player.size > enemy.y) { // Dernière phase confirmant que les 4 axes limitants (AABB) de l'ennemi sont bien violés ou croisés, impliquant un choc matériel indiscutable.
                player.takeDamage(34); // Sanction de méthode (POO) déclenchant la révision drastique à la baisse (34 PV) de l'état système de l'avatar en réponse de pénalité de contact.
                enemy.markedForDeletion = true; // Résolution fatale actant le crash du missile ou PNJ (Ennemi sacrifié en kamikaze), imposant la collecte de l'objet de l'Array asynchrone principal.
                screenShake = 15; // Affectation globale de puissance vibratoire pour secouer optiquement l'appareil visuel de Game Camera du Canvas en récompense UX/Impact d'erreur.
            } // Terminaison booléenne du nœud matriciel AABB d'intersection Entity to Entity.
            
            if (floorManager.currentState === 'TOXIC') { // Contrôle d'état asynchrone pour déclencher le sous-événement de fonte d'ennemi en contact du bain mortel instancié (Toxicité).
                const enemyBottom = enemy.y + enemy.height; // Variable algébrique définissant temporellement la délimitation basse (pieds/socle) spatiale d'un antagoniste présent dans la scène.
                const floorTop = canvas.height - floorManager.floorHeight; // Différentiel analytique extrayant à la volée le point exact (Y absolu) où débute visuellement l'éther mortel rouge.
                if (enemyBottom >= floorTop && !enemy.markedForDeletion && enemy.type !== 'flash') { // Expression mathématique ET asynchrone sondant à la fois le franchissement de seuil cartésien spatial, et le non-mort et la nature ignifugée de type ('Flash' ignore l'évènement de fonte).
                    enemy.markedForDeletion = true; // Acte de mise à mort (Purge flag) signant la disparition définitive du monstre par destruction liée à l'Environnement et pas au joueur (acide).
                    for (let i = 0; i < 5; i++) { // Instruction en boucle définissant mathématiquement l'itération de naissance pour simuler les projections de bulles toxiques.
                        projectiles.push(new Projectile(enemy.x + enemy.width / 2, enemyBottom)); // Apparition POO asynchrone de 5 projectiles mortels de lave explosant de l'impact asymétrique à un axe central défini (W/2).
                    } // Terminaison d'exécution répétitive (Loop For).
                } // Extinction locale de la branche de détection Plongeon Acide Ennemi.
            } // Fin globale d'inspection Environnementale de la Toxine.
            
            // Nettoyage de l'ennemi s'il sort trop de l'écran
            if (enemy.x < -200 || enemy.x > canvas.width + 200 || enemy.y < -200 || enemy.y > canvas.height + 200) { // Or Logique (||) évaluant la transgression extrême hors-cadre (Culling/Garbage Collector limit).
                enemy.markedForDeletion = true; // Validation explicite ordonnant au Garbage Collector local de purger la cellule de mémoire saturée.
            } // Clôture booléenne de limite d'existence physique OOB (Out Of Bounds).
        }); // Achèvement de méthode Iterator Array concernant les Entities.
        enemies = enemies.filter(enemy => !enemy.markedForDeletion); // Collecteur natif réassemblant instantanément la structure mémoire hostile vierge de tout parasite.

        projectiles.forEach(proj => { // Commande de parcours synchrone de boucle appelant l'action logicielle sur les tirs de zone (Particules réactives d'acidité).
            proj.update(); // Moteur de trajectoire déclenché implémentant les lois de gravité de l'instance courante sur le Canvas de contexte.
            const distX = (player.x + player.size / 2) - proj.x; // Évaluation du différentiel d'abscisse centralisé servant à initier l'algorithme suivant Pythagore (Hitbox Circulaire de tir).
            const distY = (player.y + player.size / 2) - proj.y; // Extraction de segment en Ordonnée pour identifier la longueur Y absolue vis-à-vis du projectile local approchant de l'Avatar.
            const distance = Math.sqrt(distX * distX + distY * distY); // Complétion formelle de formule de Théorème (Racine des composantes quadratiques croisées) octroyant le trajet pur asymétrique du projectile sur l'axe visuel absolu.
            if (distance < player.size / 2 + proj.size) { // Résolution mathématique collisionnelle : Intersection certifiée si les composantes volumiques fusionnent la distance minimale requise.
                player.takeDamage(5); // Action POO d'injection punitive soustrayant un pool mineur mais cumulatif de points de vitalité d'instance Avatar.
                proj.markedForDeletion = true; // Oblitération de balle : le Projectile asynchrone subit la marque mortelle requise par l'Array List d'Update (Splash effect/Fin de vol).
                screenShake = 5; // Altération paramétrique modérée ajoutant un bruit sismique bref vis-à-vis de l'agression mineure.
            } // Fermeture fonctionnelle Hit Event Projectile vs Joueur.
            
            // Nettoyage des projectiles qui sortent de l'écran
            if (proj.x < -50 || proj.x > canvas.width + 50 || proj.y < -50 || proj.y > canvas.height + 50) { // Comparateur géométrique OR asynchrone imposant un mur de destruction algorithmique (Culling Out of bounds) au-delà des rebords de la Game Zone visible en pixels.
                proj.markedForDeletion = true; // Flag absolu de nettoyage garantissant qu'aucune balle non-vue ne consomme d'octets d'horloge.
            } // Terminaison booléenne OOB de projectile.
        }); // Clôture d'instruction Array Loop sur le volume des tirs à calculer (Tick).
        projectiles = projectiles.filter(proj => !proj.markedForDeletion); // Opération lourde asynchrone de réaffectation filtrée du buffer vectoriel tir pour optimisation CPU maximale.

        floorManager.update(difficulty); // Commande maîtresse asynchrone déléguant à la FSM environnementale (le sol) la pleine résolution FSM d'Horloge de la Frame avec passage argument paramétré de rythme/vitesse actuelle.
        if (floorManager.checkDanger(player, canvas)) { // Bloc de condition scrutant l'alerte d'environnement transmise par l'AABB unilatérale du sol toxique sur les coordonnées Avatar transmises.
            // --- VISUAL JUICE: VIOLENT SCREEN SHAKE ---
            // If this damage is fatal, trigger a much stronger screen shake.
            if (player.health <= 1 && !player.invincible) { // Contrôle asymétrique croisé interrogeant la condition létale proche (Vie <= 1) et excluant totalement le paramètre d'invulnérabilité FSM pour prévoir une fin inéluctable.
                screenShake = 40; // A big shake for a dramatic death. Augmentation démesurée de la variable vectorielle d'oscilloscope caméra pour impact maximum du trépas dramatique.
            } else { // Branche asymétrique par défaut de pénalité de brûlure chimique résiduelle courante.
                screenShake = 5; // Amortissement partiel conservant un secousse minimale et constante, signant le danger brûlant de l'immersion toxique.
            } // Interruption stricte des paramètres Juice visuels de dangerosité du bain de lave.
            player.takeDamage(1); // Procédure unitaire et répétée (Dégât ponctuel itératif, dit DOT) ponctionnant d'un PV l'objet joueur tant que sa physique est fondue dans la nappe colorimétrique FSM de sol Létal.
        } // Bouclage final de l'Hitbox logic unilatérale du sol toxique sur le Player logic component FSM.

        if (screenShake > 0) screenShake--; // Boucle unitaire asynchrone abaissant inéluctablement le modificateur physique visuel de tremblement d'appareil jusqu'à repos zéro de sa forme Float/Int scalaire (Decay constant).

        if (player.isDead()) { // Procédure boolean (Getter) vitale scrutant l'état abstrait terminal booléen signant un HP négatif.
            saveHighScore(nickname, gameLogic.getScore()); // Ordre asynchrone à la base de données LocalStorage de compiler séquentiellement dans le JSON un dictionnaire liant la chaîne utilisateur passée en valeur String avec le Float mathématique du Singleton Logique Score.
            highScore = loadHighScore(nickname); // Appel asynchrone inverse pour charger immédiatement dans l'entité variable de l'UI la vérité de score validée ou nouvelle du fichier API Navigateur Local Storage (Refresh Local Memory Index).
            changeGameState('GAMEOVER'); // Séquence terminale asynchrone signalant l'effondrement formel des mécanismes Game Loop et basculant l'interface sur la page string d'Échec.
        } // Point de chute d'analyse Terminale (Game Over) d'Instance Joueur.
        
        playBeep(floorManager); // Hook visuel externe lié à l'API Musique injectant les paramètres complexes CSS de bords/Glow, calqués intimement au Tempo Audio FSM, hors DOM du pur Canvas Render.
    } // Bouclage restrictif exclusif (Fermeture Block) concernant uniquement le flux logic Play actif (sans Animation superposée Transition/Ecran Noir de type Fade).
} // Achèvement formel déclaratif (Fin d'enveloppe de définition Function JS) de la Boucle Maîtresse Logique et Analytique d'État et de Physique de Mouvement Update() de l'entièreté de la mécanique du Logiciel HTML Web.

function drawNeonText(ctx, text, x, y, size, color) { // Procédure Helper asynchrone utilitaire (Wrapper) standardisant la lourde charge de variables Canvas nécessaires pour produire l'Esthétique Typographique Spécifique Glowing.
    ctx.save(); // Préservation saine et incontournable du flux pointeur Context pour appliquer des alpha/glow limités localement à l'objet Texte, évitant de baver/corrompre les futurs affichages UI ou particules.
    ctx.fillStyle = color; // Affectation du pinceau Context à la String de code colorimétrique passée en argument fonctionnel, typant l'Intérieur plein (Fill) de la lettre affichée.
    ctx.font = `bold ${size}px 'Courier New', Courier, monospace`; // String CSSOM injecté formatant intrinsèquement la balise typographique (Taille dynamique px, Poids gras, Polices alternatives Fallback API HTML5 natif).
    ctx.textAlign = "center"; // Alignement sémantique du rendu de vecteur par rapport à ses propres coordonnées de pivot (Ancrage central strict et non aligné Gauche X = 0).
    ctx.shadowBlur = 15; // Limite de l'éclat global pour les textes. Forçage volontaire constant d'un rayonnement Halo lumineux de valeur 15 par application d'une BoxShadow Native de la toile Canvas via Ctx Engine d'Interface.
    ctx.shadowColor = color; // Clonage logique de couleur (Fill Color Argument String) copiant rigoureusement sa valeur dans l'ombre projetée générée (Shadow API HTML5).
    ctx.fillText(text, x, y); // Ordre Final Matériel produisant numériquement un amas vectoriel typographique de paramètres Context sur la fenêtre écran aux points cibles stricts (X,Y) définis dans les variables.
    ctx.restore(); // Annulation asynchrone Pop() remettant virtuellement le Buffer graphique Context (CTX) au point Zéro d'initialisation pour purger la RAM des pollutions de Blur, Glow, Color ou Opacité du système Font.
} // Terminaison stricte de la fonction Wrapper d'Interface d'Aide Graphique "Texte Fluorescent/Néon".

function draw() { // Déclaration formelle du Render Pipeline ou de L'Engine Graphique "Draw", se contentant *d'afficher aveuglément* sans aucune analyse logique de position ou collision, les mathématiques pures traitées durant l'Update().
    ctx.clearRect(0, 0, canvas.width, canvas.height); // Instruction capitale (Void Canvas Effect) écrasant la trame d'écran matriciel 2D, traçant un cube transparent parfait sur l'ancienne frame d'animation afin d'éviter d'obtenir un "étalement fantôme" des mouvements.

    // Reset complet du Canvas pour éviter la saturation blanche et les bugs de perfs
    ctx.globalAlpha = 1.0; // Restauration en dur forçant le retour matériel Opacité de 100% de couche du Canvas (Règle la fuite de mémoire ou superposition de bugs de transitions State/Ecran Menu).
    ctx.shadowBlur = 0; // Oblitération de toute variable résiduelle d'effet Halo (Blur Ombre) protégeant la fréquence d'Image par Seconde de lenteurs (Chute Framerate 60 FPS) dûes à des cumuls de glow.

    ctx.save(); // Stockage de sécurité de Frame (Enregistrement d'Etat Global Pinceau Ctx) constituant une fondation solide pour exécuter les altérations matricielles d'Interface (Ecran Caméra) Shake ou Rotate, indépendants du DOM CSS Global.
    
    if (gameState === 'PLAYING' && floorManager.currentState === 'TOXIC') { // Filtre Asynchrone FSM évaluant le passage dans la boucle de rendu en situation asymétrique 'Toxique', déclenchant l'anomalie caméra de la mort du sol.
        // L'effet de pulsation de la lave implique une traduction complexe de la caméra (Translation puis Rotation/Échelle puis Annulation de Translation).
        const angle = Math.sin(Date.now() / 100) * 0.02; // Génération trigonométrique d'un Float (Math.Sin émet une vague entre -1 et 1) modulé chronométriquement pour simuler un balancement visuel doux et régulier de l'écran (Angle Radian de Camera d'une Matrice).
        const scale = 1 + Math.sin(Date.now() / 150) * 0.02; // Génération trigonométrique d'échelle (Zoom Vectoriel 2D) oscillant entre une base de 1x et un grossissement mineur rythmé organiquement pour figurer un effet d'asphyxie gazeuse FSM (Juice VFX FSM).
        ctx.translate(canvas.width / 2, canvas.height / 2); // Instruction API matrice complexe de translation forçant le point nodal 0,0 graphique à se déporter au centre absolu du cadre visible pour permettre une rotation purement centrale au lieu du coin de cadre.
        ctx.rotate(angle); // Commande asynchrone inclinant toute la matrice de l'écran du Float Radians mathématique (Angle). Tous les tracés suivants seront biaisés par ce Twist Caméra Asymétrique Asynchrone.
        ctx.scale(scale, scale); // Redimensionnement Vectoriel asymétrique grossissant visuellement le contexte et ses acteurs/pixels subséquents de manière symétrique en X et Y, accentuant le zoom palpitant toxique FSM.
        ctx.translate(-canvas.width / 2, -canvas.height / 2); // Annulation Inverse et symétrique de la translation originelle, rétablissant le point Zero originel sur l'écran et clôturant le mécanisme mathématique matriciel complexe VFX.
    } // Fin d'encapsulation de filtre graphique d'Alerte Toxique FSM.

    if (screenShake > 0) { // Logique d'évaluation temporelle de présence d'activité vibratoire (Secousse). Un Float supérieur à zéro justifie un offset aléatoire caméra pour la matérialiser.
        const dx = (Math.random() - 0.5) * screenShake; // Dislocation X asynchrone : crée un delta de pixel (Positif ou Négatif grâce au -0.5) encadré par le coefficient décroissant mathématique secousse (ScreenShake Int Buffer Timer).
        const dy = (Math.random() - 0.5) * screenShake; // Dislocation Y mathématique produisant un soubresaut de translation vertical violent dépendant exponentiellement du choc ou de la brûlure.
        ctx.translate(dx, dy); // Action d'altération de Matrice Ctx Canvas HTML5 décale littéralement en Float vectoriel (dx,dy) le "Projecteur/Caméra" pour brouiller instantanément l'affichage du Frame actuel.
    } // Clôture booléenne logicielle d'évènement de Caméra Asynchrone.

    // --- CHAOS EVENT RENDER ---
    // If the chaos event is active, we apply a 'difference' composite operation.
    // Drawing a white rectangle over the screen with this mode inverts all the colors.
    if (chaosEventTimer > 0) { // Surveillance Booléenne FSM validant le déclenchement d'un filtre logiciel post-processing global.
        ctx.save(); // Isolation stricte de l'effet d'inversion pour ne pas le transmettre en boucle infinie (empilement de Pile de Contexte Graphique).
        ctx.globalCompositeOperation = 'difference'; // Modificateur absolu HTML5 Canvas (Mode de Fusion/Blend Mode) : Extrait la soustraction mathématique de couleurs, inversant littéralement le spectre affiché sous l'opération (Bleu -> Jaune etc).
        ctx.fillStyle = 'white'; // Pinceau de Remplissage absolu "Blanc" permettant la soustraction parfaite RGB(255) du Blend Mode ciblé.
        ctx.fillRect(0, 0, canvas.width, canvas.height); // Action asynchrone forçant le coulage d'un énorme rectangle géométrique sur 100% de la fenêtre. Sous le Blend Mode 'difference', agit comme filtre d'inversion totale.
        ctx.restore(); // Annulation d'isolation : Restaure la FSM graphique (Pop contextuel) dans l'état originel normal pour ne pas altérer le tour de calcul de matrice à la frame d'après.
    } // Fermeture logicielle de l'Altération d'Ecran Glitch/Chaos d'horloge asynchrone.

    if (gameState === 'START') { // Entame d'arbre décisionnel d'affichage de scène, lisant le Switch Router principal pour définir quelle partie de l'UI est à produire.
        // On force le placement d'une vraie balise HTML <input> en "position: absolute" en calculant ses coordonnées par rapport au <canvas>.
        const rect = canvas.getBoundingClientRect(); // Appel lourd d'API DOM inspectant la fenêtre du navigateur physique pour extraire la localisation x/y absolue et dynamique (BoundingBox) de l'élément Canvas, réagissant aux redimensionnements de taille CSS ou scroll.
        nicknameInput.style.left = (rect.left + rect.width / 2 + window.scrollX) + 'px'; // Opération arithmétique CSS inline déportant l'Input DOM (Moitié du Canvas + Ecart Scroll utilisateur) pour simuler un calque HUD intégré au jeu JS pur.
        nicknameInput.style.top = (rect.top + rect.height / 2 + 65 + window.scrollY) + 'px'; // Application identique pour Y avec adjonction (65px) d'offset pour descendre visuellement le curseur sous le Leaderboard abstrait typographique du Canvas.

        drawNeonText(ctx, "THE TOXIC FLOOR", canvas.width / 2, canvas.height / 2 - 160, 60, "#00ffcc"); // Exécution logicielle de la fonction de convenance (Wrapper) asynchrone pour imprimer un Logo Titre à l'écran.
        
        // LEADERBOARD
        drawNeonText(ctx, "🏆 LEADERBOARD 🏆", canvas.width / 2, canvas.height / 2 - 100, 22, "#ffff00"); // Appel Wrapper peignant l'en-tête graphique listant les HighScores.
        let topScores = getTopScores(); // Stockage de tampon récupérant localement l'objet asynchrone renvoyé par la désérialisation du Web Storage local navigateur de l'utilisateur (3 Objets JSON {name/score}).
        if (topScores.length === 0) { // Prédicat d'évaluation validant que le Store a retourné un tableau stochastique vide (zéro historique stocké sur l'IP).
            drawNeonText(ctx, "Aucun score pour le moment", canvas.width / 2, canvas.height / 2 - 70, 18, "#aaaaaa"); // Affichage alternatif (Fallback text) grisé en cas de virginité du LocalStorage navigateur.
        } else { // Branche asymétrique s'il y a un objet/dictionnaire à itérer.
            topScores.forEach((entry, index) => { // Boucle fonctionnelle Array (Map) passant chaque entité entry et générant implicitement un entier index (0 à 2).
                let colors = ["#ffd700", "#c0c0c0", "#cd7f32"]; // Or, Argent, Bronze. Tableau littéral (Array statique) dictant les Hex de teintes hiérarchiques de podium associées mathématiquement aux 3 entiers indexés (0, 1, 2).
                drawNeonText(ctx, `${index + 1}. ${entry.name} - ${entry.score}s`, canvas.width / 2, canvas.height / 2 - 70 + (index * 25), 20, colors[index] || "#ffffff"); // Appel dynamique asynchrone combinant calcul string asymétrique (1. Name - 150s), offset géométrique vertical en Y par index et recherche Array d'Hex de médaille couleur.
            }); // Fin de boucle itérative d'impression de l'historique Leaderboard.
        } // Clôture Booléenne de vérification conditionnelle asymétrique Store Data existant.
        
        drawNeonText(ctx, "▼ Enter Pseudo below ▼", canvas.width / 2, canvas.height / 2 + 20, 18, "#aaaaaa"); // Appel statique Wrapper ajoutant un appel à l'action typographique (CTA) pour pointer vers l'Input Element DOM CSS Absolu (Hors Canvas).
        
        drawNeonText(ctx, "[H] How to Play  |  [C] Character & Mode", canvas.width / 2, canvas.height / 2 + 115, 20, "#cccccc"); // Affichage vectoriel d'un String servant de Keymapping visuel de raccourcis Menu utilisateur.
        if (nickname.trim() !== '') { // Action conditionnelle d'assurance Trim (Trim asynchrone : coupe les vides au bord de la chaîne string) confirmant que le tampon mémoriel Nickname lié par événement DOM possède bien une syntaxe littérale tapée valide.
            drawNeonText(ctx, "► Press ENTER or SPACE to Continue ◄", canvas.width / 2, canvas.height / 2 + 165, 25, Math.floor(Date.now() / 500) % 2 === 0 ? "#ffffff" : "#00ffcc"); // Ordre asynchrone asymétrique dictant l'impression du texte de Validation, incluant un algorithme Ternaire horloger (Modulo Math Date.Now) clignotant alternativement de couleur Blanc ou Cyan.
        } else { // Branche d'échappatoire d'invalidation (Pseudo illégal/inexistant).
            drawNeonText(ctx, "Enter Pseudo to Start", canvas.width / 2, canvas.height / 2 + 165, 25, "#aa0000"); // Ordre asynchrone peignant un texte coercitif bloquant, encodé en teinte Rouge Sombre coercitive.
        } // Fin logique d'évaluation de la légitimité du formulaire d'entrée DOM et des instructions de Game Loop attenantes.
    } // Extinction asymétrique d'Arbre de branche conditionnelle Switch du Routeur START Menu de Game State local FSM.
    else if (gameState === 'HOW_TO_PLAY') { // Chaînage conditionnel Else-If d'arbre Node évaluant l'assignation de l'automate à l'interface abstraite Tutorielle ("Tuto" State).
        drawNeonText(ctx, "TUTORIAL", canvas.width / 2, 100, 40, "#00ffcc"); // Inscription Wrapper d'UI Titre de la page de manuel.
        drawNeonText(ctx, "Controls: ZQSD or Arrows to move. SHIFT to Dash.", canvas.width / 2, 200, 20, "#ffffff"); // Appel string asynchrone explicitant le binding de mapping directionnel du jeu.
        drawNeonText(ctx, "Colors:", canvas.width / 2, 250, 25, "#ffffff"); // Appel string statique formatant un bloc "Légende".
        drawNeonText(ctx, "GREEN = Safe", canvas.width / 2, 290, 20, "#00ff00"); // Légende asynchrone colorée via String Hex vert.
        drawNeonText(ctx, "ORANGE = Warning! Get ready.", canvas.width / 2, 330, 20, "#ff9900"); // Légende visuelle colorée via argument d'hexadécimal Orange d'Alerte FSM.
        drawNeonText(ctx, "RED = Instant Death! Don't touch.", canvas.width / 2, 370, 20, "#ff0000"); // Légende statique colorée via argument Hex de Rouge pur pour indiquer FSM mortel Fausse Sécurité.
        drawNeonText(ctx, "Press SPACE to Go Back", canvas.width / 2, 500, 20, "#cccccc"); // Renseignement UI visuelle pour informer d'une méthode de sortie du nœud FSM asynchrone.
    } // Fermeture fonctionnelle Else-if de Routeur 'HOW TO PLAY' FSM.
    else if (gameState === 'CHARACTER_SELECT') { // Chaînage conditionnel Else-If de l'arbre Switch Node validant asynchronement si la String Pointer pointe l'interface de choix de Skin (Options Profilage).
        drawNeonText(ctx, "SETTINGS", canvas.width / 2, 100, 40, "#00ffcc"); // Ordre de Wrapper asynchrone inscrivant l'identification d'en-tête de page FSM Menu.
        
        drawNeonText(ctx, "Choose Character:", canvas.width / 2, 180, 25, "#ffffff"); // Inscription d'En-tête de section HUD listant des Options d'Objets Avatar.
        drawNeonText(ctx, `[1] 👻 Ghost (Normal) ${selectedCharacter.icon === '👻' ? '<--' : ''}`, canvas.width / 2, 230, 20, selectedCharacter.icon === '👻' ? '#00ff00' : '#cccccc'); // Interpolation complexe String (Backticks) intégrant condition ternaire dynamique incluant un Curseur '<--' et un codage Hexadécimal de sélection ('#00ff00') validant asynchronement l'objet Player par défaut FSM (Avatar Ghost).
        drawNeonText(ctx, `[2] 🤖 Robot (Slow)   ${selectedCharacter.icon === '🤖' ? '<--' : ''}`, canvas.width / 2, 270, 20, selectedCharacter.icon === '🤖' ? '#00ff00' : '#cccccc'); // Logique Ternaire asymétrique de surlignage d'UI et insertion de Curseur String vérifiant si l'avatar est l'alternative asynchrone (Robot).
        drawNeonText(ctx, `[3] 👽 Alien (Fast)   ${selectedCharacter.icon === '👽' ? '<--' : ''}`, canvas.width / 2, 310, 20, selectedCharacter.icon === '👽' ? '#00ff00' : '#cccccc'); // Évaluation ternaire dynamique similaire (Curseur/Couleur UI) statuant si l'objet sélectionné asynchronement est l'avatar de vitesse supérieure (Alien).
        
        drawNeonText(ctx, "Game Mode: Press [M] to toggle", canvas.width / 2, 380, 25, "#ffffff"); // Appel Wrapper textuel abstrait d'identification de section pour basculement binaire FSM globale (Game Loop Classique vs Hardcore).
        drawNeonText(ctx, `Current Mode: ${gameMode}`, canvas.width / 2, 420, 30, gameMode === 'Classic' ? '#00ffcc' : '#ff0000'); // Argument Interpolé (Template Literal JS) exposant en direct la propriété mémorielle String du flag 'gameMode', avec ternaire de couleur Hexadécimale associée Cyan/Rouge.
        
        drawNeonText(ctx, "Press SPACE to Go Back", canvas.width / 2, 520, 20, "#cccccc"); // Retour visuel de consigne UI Exit node State.
    } // Fermeture fonctionnelle conditionnelle de l'Arborescence FSM de l'état Settings / CHARACTER_SELECT.
    else if (gameState === 'INTRO') { // Chaînage conditionnel Else-If d'arbre Routeur interceptant la logique asynchrone de Transition de Cinématique de Prélude (Lore Intro textuel).
        drawNeonText(ctx, "TRANSMISSION ENTRANTE...", canvas.width / 2, 100, 30, "#00ff00"); // Opération d'écriture asynchrone formatée d'en-tête diégétique radio, teinté vert de terminal militaire informatique.
        drawNeonText(ctx, "L'usine chimique X-10 a explosé.", canvas.width / 2, 250, 20, "#ffffff"); // Première Inscription de scénario d'Univers asynchrone inscrite via API textuelle Context HTML5.
        drawNeonText(ctx, "Le sol est devenu instable et toxique.", canvas.width / 2, 290, 20, "#ffffff"); // Seconde ligne d'Histoire asynchrone instanciée typographiquement dans l'espace Vectoriel HUD de scène.
        drawNeonText(ctx, "Tu es le dernier survivant.", canvas.width / 2, 330, 20, "#ffffff"); // Troisième ligne diégétique explicitée via Wrapper FSM asynchrone textuel sur le Canvas.
        drawNeonText(ctx, "Fuis avant que les radiations ne t'emportent.", canvas.width / 2, 370, 20, "#ff5555"); // Quatrième clause textuelle scénaristique colorée (Alerte Rouge/Saumon) dictant un péril asynchrone.
        
        drawNeonText(ctx, "Press SPACE to Survive", canvas.width / 2, 500, 25, "#00ffcc"); // String d'interface (UI CTA Action) asynchrone pour engager le State Routeur vers la Phase Jouable Actuelle.
    } // Terminaison booléenne conditionnelle de l'état Intro Cinématique FSM Routeur principal.
    else if (gameState === 'PLAYING') { // Bouclage final conditionnel Else-if, point névralgique de toute l'architecture de jeu, s'assurant mathématiquement d'ordonner le rendu Graphique Game Loop de toute entité asynchrone si la partie "En Ligne" s'exécute localement.
        floorManager.draw(ctx, canvas); // Requête POO d'appel asynchrone de rendu Graphique interne de l'objet Floor Manager localisé (FSM Environnement), transférant par injection de dépendances les variables Pinceau Ctx et Fenêtre Canvas.
        
        player.draw(ctx); // Exécution hiérarchique POO de l'Avatar : Dessine le sprite (caractère typographique et hitboxes d'animation particules Dash / Bulle Invincibilité) via délégation de sa fonction membre draw(ctx) en contexte.

        enemies.forEach(enemy => { // Méthode algorithmique List (ForEach Lambda Arrow) forçant mathématiquement et tour à tour les N objets Instances du Array enemies localisé à s'inscrire par-dessus l'avatar dans la matrice de pixel visuelle (Z-Ordering d'interface).
            enemy.draw(ctx); // Action déléguée individuelle et isolée de tracé par bloc FillRect propre à l'Instance Asynchrone Ennemi lue.
        }); // Conclusion formelle de l'instruction de boucle de rendu sur les listes d'adversaires POO.
        
        projectiles.forEach(proj => { // Itération de boucle asynchrone de balayage d'Array lambda forçant à postériori le traçage superposé des gouttes de menace projetées par l'acide, pour garantir une priorité de calque Z-Index au-dessus des acteurs.
            proj.draw(ctx); // Injection de requête POO unitaire pour tracer le cercle natif de composante Projet instanciée (Draw asynchrone).
        }); // Coupure d'instruction formelle d'itération Array.

        powerUps.forEach(pu => pu.draw(ctx)); // Syntaxe Arrow Function raccourcie inline d'itération Array déléguant la commande de tracé UI asynchrone au Pool des Objets ramassables.
        floatingTexts.forEach(ft => ft.draw(ctx)); // Seconde syntaxe inline Arrow d'itération Array ordonnant de graver en tout dernier plan de sur-couche d'Interface (Z-Index maximal local) les chaînes String flottantes des Dégâts ou des Soins de la FSM.

        ctx.save(); // Injection de sécurité de Pinceau (Save contextuel) pour isoler asynchronement le HUD fixe (Affichages en dur Score, Wave) des transformations asymétriques précédentes FSM.
        ctx.fillStyle = "white"; // Restauration du pot de Peinture (Buffer Color) HTML5 du contexte graphique à valeur d'opacité neutre String Color "white".
        ctx.font = "bold 20px 'Courier New'"; // Typographie asynchrone (Gras 20 pixels) instanciée de manière globale pour le tracé UI des constantes métriques de HUD FSM.
        ctx.shadowBlur = 10; // Instanciation asynchrone d'un Rayonnement vectoriel (Ombre interne API) à 10 px de diffusion pour UI.
        ctx.shadowColor = "white"; // Affectation globale (String Value Color) asynchrone de la composante Ombre au code clair afin d'irradier l'UI de texte informatif.
        ctx.fillText("Survival: " + gameLogic.getScore() + "s", 20, 30); // Action mathématique formelle superposant via concaténation String et l'Accesseur (Getter) dynamique du POO Singleton du temps de Survie (x, y fixes asynchrones d'UI supérieur Gauche).
        
        // --- NEW RECORD FEEDBACK ---
        if (highScore > 0 && gameLogic.getScore() > highScore) { // Porte Logique Booléenne complexe analysant et s'assurant asynchronement que la partie actuelle n'a pas seulement dépassé 0 ms de jeu, mais a dépassé le seuil mémoriel sérialisé (Local Storage) global via le Getter Singleton de l'instance d'horloge.
            // Clignotement du texte "NEW RECORD" (Math.floor(Date.now() / 300) % 2 === 0 permet de basculer l'état selon le temps)
            if (Math.floor(Date.now() / 300) % 2 === 0) { // Blinking effect. Application conditionnelle stricte (Modulo asynchrone de l'Horloge absolue Native Date.Now) déclenchant à intervalles réguliers d'état 0 une instruction isolée.
                ctx.fillStyle = "#ffff00"; // Yellow text. Mutation contextuelle de Buffer couleur (Or Hexadécimal) asynchrone pour exacerber la félicitation d'UI positive.
                ctx.shadowColor = "#ffff00"; // Duplication couleur de l'Ombre pour cohérence de Halo d'Interface visuelle asynchrone.
                ctx.fillText("NEW RECORD!", 250, 30); // Impulsion d'API native dessinant le message asynchrone récompensant à des coordonnées précises et immuables au bord de la fenêtre visuelle logicielle Canvas.
            } // Terminaison stricte Booléenne asynchrone conditionnant le Clignotement (Blink Effect) temporel de la mention UI.
        } // Clôture analytique asynchrone de la condition Booléenne du Succès de battre son propre Record (LocalStorage Comparaison Logic Math).
        
        ctx.fillStyle = "#ff0055"; // Affectation FSM Contextuelle changeant la palette de tampon couleur en un Magenta Rosé/Rouge asynchrone.
        ctx.shadowColor = "#ff0055"; // Transmission parallèle et répliquée de l'attribut d'ombrage coloré pour créer une lisibilité optimale sur fond toxique noir asynchrone.
        ctx.fillText("Wave: " + gameLogic.getWave(), 20, 60); // Concaténation de méthode String native appelant asynchronement l'Accesseur Wave du Singleton GameLogic(Object Memory) au sein de la balise FillText de l'API graphique.
        ctx.restore(); // Purge asynchrone de la pile mémorielle d'Etat (Context Render) rétablissant l'Opacité originelle ou la Couleur, garantissant une UI non-corrompue pour les calques suivants (Z-Ordering de Barre de vie FSM).

        ctx.save(); // Isolation stricte pour ne pas faire fuiter les styles de l'interface (Barres de progression Asynchrones et Colorées UI / HUD).
        const barWidth = 200; // Constante scalaire asynchrone imposant une architecture fixe et universelle de longueur d'interface UI Gauge de 200 Pixels d'encombrement global matériel.
        ctx.fillStyle = '#222'; // Application asynchrone d'une couleur d'arrière-plan sourde (Charbon/Gris profond) pour simuler la zone vidée (dépression) de la barre de points de vie.
        ctx.fillRect(20, 80, barWidth, 20); // Traçage asynchrone direct primitif rectangulaire d'un fond d'Interface d'Axe X20, Y80 de taille Longueur 200px sur une Épaisseur 20px (Fond de Barre).
        
        const healthGradient = ctx.createLinearGradient(20, 80, 20 + barWidth, 80); // Invocation asynchrone matérielle d'Objet Dégradé (LinearGradient) de l'API HTML5 Canvas, liant la coordonnée de départ vectorielle à l'exacte étendue de la Constante de Barre 200px.
        healthGradient.addColorStop(0, "red"); // Affectation paramétrique asynchrone de la Couleur Rouge Pure (0% du Gradient) au commencement de l'Objet de Dégradé.
        healthGradient.addColorStop(0.5, "orange"); // Échelon asynchrone de Couleur Orangée dictée à mi-parcours (50% de Ratio/Float) mathématique du vecteur dégradé (Transition Visuelle).
        healthGradient.addColorStop(1, "lime"); // Atterrissage asynchrone final fixant la Peinture Vert Clair (100% de Ratio d'Extrusion) à l'extrémité originelle et finale du Gradient de Barre FSM Player Health UI.
        
        ctx.fillStyle = healthGradient; // Incorporation FSM asynchrone de l'Objet paramétré dégradé (LinearGradient Object) complexe dans la balise Buffer de l'état matériel du Pinceau (FillStyle de couleur).
        const currentHealthWidth = Math.max(0, (player.health / 100) * barWidth); // Algorithme FSM Ratio (Produit en Croix asynchrone) évaluant formellement le Produit Proportionnel mathématique des PV Avatar (X/100) rapporté à l'emprise physique pixel de 200px, couplé à une sécurité de calcul (Math.max) empêchant un rectangle ou variable Float Négatif qui buggerait le DOM CSS Renderer.
        ctx.fillRect(20, 80, currentHealthWidth, 20); // Tracé paramétrique d'Élément Primitive Rectangulaire du Buffer Couleurs asynchrone par-dessus l'ancien Noir, borné asynchronement à la taille calculée de proportion FSM de Vitalité Player.
        
        ctx.strokeStyle = 'white'; // Déclaration et mutation d'Instance Asynchrone API affectant la Couleur Blanc absolue pour la construction filaire d'un contour HUD d'interface abstrait vectoriel Stroke.
        ctx.lineWidth = 2; // Forçage Mathématique Asynchrone de paramètre d'Épaisseur de tracé d'API Canvas (Gras 2 pixels d'emprise) limitant et dessinant avec clarté le réceptacle géométrique jauge FSM UI.
        ctx.strokeRect(20, 80, barWidth, 20); // Tracé asynchrone formel filaire Rectangulaire de bordures emboîtant parfaitement le volume global statique de Constante (barWidth) de 200px et épaisseur 20px (Outline UI FSM).
        
        ctx.fillStyle = '#222'; // Rétrogradation d'état asynchrone de Tampon de couleur repassant le Buffer au modèle sombre Charbon/Gris (Fond de barre FSM).
        ctx.fillRect(20, 110, barWidth / 2, 10); // Construction FSM asynchrone (Moitié de paramètre barWidth = 100px mathématique pur) de Réceptacle graphique de Jauge (Fond de Cooldown Dash Player UI Frame).
        ctx.fillStyle = player.dashCooldown === 0 ? '#00ffff' : '#555'; // Conditionnelle Logique Ternaire asynchrone attribuant au Buffer Cyan vif si l'attribut d'Instance Objet Avatar 'dashCooldown' (Variable Compteur frames FSM) est de stricte équivalence absolue avec Zéro (0 = Dash Ready), Sinon Gris pâle #555.
        const dashWidth = Math.max(0, (1 - player.dashCooldown / 60) * (barWidth / 2)); // Calcul analytique asynchrone inverse : Évalue un ratio scalaire progressif par inversion numérique complexe et ratio de base, forcé positif (Math.Max) et mis à l'échelle (Float) de la longueur réduite en Pixels absolus de la Sous-Barre UI.
        ctx.fillRect(20, 110, dashWidth, 10); // Lancement de méthode Asynchrone Rect Primitive HTML5 de traçage de Jauge pleine ou partielle du paramètre asynchrone défini.
        ctx.strokeStyle = 'white'; // Injonction asynchrone redéfinissant la commande Stroke d'encadrement à la teinte absolue Blanche (Code standard FSM Canvas UI).
        ctx.lineWidth = 1; // Limitation asynchrone de tracé d'interface à Un pixel pour raffiner visuellement l'accessoire visuel (Strokewidth).
        ctx.strokeRect(20, 110, barWidth / 2, 10); // Incrustation asynchrone Vectorielle contournant la géométrie absolue du Réceptacle 100px.
        
        ctx.fillStyle = 'white'; // Redéfinition du Buffer graphique de remplissage FSM à une norme Blanche afin d'écrire la balise UI sous-jacente du Cooldown d'Input.
        ctx.font = "bold 10px 'Courier New'"; // Paramétrage FSM natif d'API fixant les variables de taille (10px) et profil esthétique du Pinceau Font CSS interne au rendu.
        ctx.textAlign = "center"; // Action asynchrone imposant un point d'alignement relatif central au vecteur de traçage Textuel FSM.
        ctx.textBaseline = "middle"; // Ancrage vertical asynchrone au milieu logique de la ligne FSM.
        ctx.fillText("DASH (SHIFT)", 20 + barWidth / 4, 115); // Calcul formel de géométrie spatiale (BarWidth/4 = Centre de la Sous-Barre) pour centrer parfaitement la String informative "Dash" au milieu du module visuel jauge.
        ctx.restore(); // Annulation terminale asynchrone d'API de pile effaçant l'historique Contextuel FSM des filtres complexes UI Barres pour ne pas polluer l'exécution d'une méthode ultérieure de rendu.
        
        // Draw typewriter radio message
        if (radioMessageTimer > 0 && radioMessageFullText) { // Bloc conditionnel de FSM asynchrone double ET (&&) : Validation stricte asynchrone qu'il subsiste bien des cycles d'Horloges de Persistance Ticker et de la valeur non nulle dans la Mémoire Tampon globale du String Narratif.
            let textToDraw = radioMessageFullText.substring(0, Math.floor(radioMessageDisplayLength)); // Extraction asynchrone (Sous-chaîne/Substring DOM JS) générant dynamiquement un tronçon du Message FSM global calqué sur la variable Index Flottant (Arrondie nativement Floor) asynchrone d'Affichage Machine à Écrire.
            // Add a blinking cursor for style
            if (radioMessageDisplayLength < radioMessageFullText.length && Math.floor(Date.now() / 300) % 2 === 0) textToDraw += '_'; // Méthodologie booléenne asynchrone vérifiant que le texte n'a pas conclu son traçage global FSM (Taille < Taille Absolue String) ET que le Modulo temporel régulier valide, déclenchant une addition mathématique Asynchrone de Concatenation (+) greffant le caractère _ (Cursor Console UI).
            drawNeonText(ctx, `📻 ${textToDraw}`, canvas.width / 2, 50, 20, "#00ff00"); // Appel Asynchrone du Wrapper Visuel UI transmettant la variable String dynamique (TextToDraw asynchrone incluant Cursor de fonction) et l'assortiment de constantes X/Y/Color.
        } // Clôture booléenne asynchrone du Rendu textuel asynchrone (Narrative Lore Interface FSM).
    } // Extinction complète asynchrone du bloc if/else-if principal d'Arborescence Conditionnelle du "PLAYING" Root Game State de Boucle Game Loop Canvas Render Engine JS Asynchrone.
    else if (gameState === 'GAMEOVER') { // Node final conditionnel de repli d'Arborescence évaluant l'état de string d'extinction d'Avatar ('GAMEOVER').
        drawNeonText(ctx, "GAME OVER", canvas.width / 2, canvas.height / 2 - 40, 60, "#ff0000"); // Ordre asynchrone de Wrapper textuel imprimant en grand format rouge sang (60px) l'échec de FSM Finitude.
        drawNeonText(ctx, "Score: " + gameLogic.getScore() + "s", canvas.width / 2, canvas.height / 2 + 20, 30, "#ffffff"); // Appel asynchrone dynamique récupérant le paramètre POO Accesseur (getScore) FSM, formaté en secondes, pour informer le joueur de sa consigne d'état final abstrait.
        drawNeonText(ctx, "Wave Reached: " + gameLogic.getWave(), canvas.width / 2, canvas.height / 2 + 60, 25, "#ff9900"); // Injection conditionnelle asynchrone dynamique de l'état POO de l'Objet Singleton GameLogic Accesseur Vague, couplée au Wrapper Néon de Canvas API.
        drawNeonText(ctx, "Press SPACE to Restart", canvas.width / 2, canvas.height / 2 + 120, 20, "#cccccc"); // Instructions Call to Action UX signalant l'implémentation Binding de clavier pour sortir d'interface de mort (Réinitialisation FSM Asynchrone Globale).
    } // Clôture Booléenne Asymétrique du Branchement terminal de l'Arbre Switch FSM global du Draw Engine asynchrone de Game Loop Logic Render.

    ctx.restore(); // Ultima restauration asynchrone de l'API Canvas : Purge complète de pile (Pop Absolute) annihilant les translations matricielles d'Alerte Toxique, les Vibrations Asynchrones de Caméra (Shake OOB), ou les Blend Mode Chaos FSM passés, remettant le buffer à l'état virginal pur.

    // UI pour le Son (Affiché en permanence en bas du jeu)
    drawNeonText(ctx, "♪ Sound: " + (isMuted ? "OFF" : "ON") + " [Press V]", canvas.width / 2, canvas.height - 15, 16, isMuted ? "#ff5555" : "#00ff00"); // Impression Asynchrone Absolue asymétrique au-dessus de tout le Z-Index Canvas, incluant double logique Ternaire asynchrone interpolée pour altérer dynamiquement le String Texte et l'Hex Couleur en réactivité absolue à l'Horloge d'État Booléen Mute de Player Object Interaction Native JS.

    if (fadeAlpha > 0) { // Porte asynchrone finale évaluant la non-nullité Float d'un cycle de Transition Visuelle de FSM d'écran (Blackout Fade Effect UX Engine).
        ctx.save(); // Isolation pour ne pas altérer les styles de la frame suivante. Opération stricte de Push de Contexte protégeant la pile de rendu.
        ctx.fillStyle = `rgba(0, 0, 0, ${fadeAlpha})`; // Altération Colorimétrique Absolue du Pinceau HTML5, utilisant l'interpolation du canal Alpha d'Opacité Transparente Dynamique d'Horloge Asynchrone dans un tampon RGBA de Noir Pur.
        ctx.fillRect(0, 0, canvas.width, canvas.height); // Forçage Asynchrone Extrême de traçage de primitive matérielle Rectangle couvrant 100% (X=0/Y=0 à Max/Max) du point de vue d'écran du Navigateur.
        ctx.restore(); // Rétablissement Contextuel Asynchrone de Fin d'Opération Purge.
    } // Extinction Booléenne de Boucle Logique de Transition FX Render asynchrone Globale FSM de Navigateur.

    // APPEL DE L'UPDATE AVANT LE PROCHAIN DRAW POUR AVOIR LES BONNES COORDONNÉES MATHÉMATIQUES
    update(); // Invocation procédurale absolue de l'Engine Logique FSM "Update", enchaînant dans l'horloge la pré-compilation algorithmique des forces mathématiques de la frame asynchrone qui succèdera immanquablement (Pattern Fixe de Game Loop Update -> Draw).
    
    /* 🎓 CONCEPT CLÉ : LA BOUCLE GAME LOOP (requestAnimationFrame)
       C'est le moteur de notre jeu. Elle demande au navigateur d'exécuter cette même fonction "draw" 
       à la prochaine frame disponible de l'écran (généralement à 60 FPS / 60Hz).
       Elle est supérieure à un setInterval car elle se met en pause automatiquement si l'utilisateur change d'onglet web (économisant de la batterie). */
    requestAnimationFrame(draw); // Injonction d'API Navigateur Window Asynchrone récursive d'Appel Callback de la fonction Render, délégant au processeur hôte (Browser Engine Timing O(1)) la charge d'allouer de manière asynchrone optimale la boucle infinie vitale à l'Application.
} // Terminaison stricte, structurelle, globale et syntaxique de l'Enveloppe de Procédure de la Game Loop Principale Render FSM Draw().

draw(); // Acte Fondateur du Script : Lancement asynchrone (First Boot Call) unique et nécessaire initialisant le cycle récursif infini de l'Engine (Bootstrap function execution).

    // APPEL DE L'UPDATE AVANT LE PROCHAIN DRAW POUR AVOIR LES BONNES COORDONNÉES MATHÉMATIQUES
    update();
    
    /* 🎓 CONCEPT CLÉ : LA BOUCLE GAME LOOP (requestAnimationFrame)
       C'est le moteur de notre jeu. Elle demande au navigateur d'exécuter cette même fonction "draw" 
       à la prochaine frame disponible de l'écran (généralement à 60 FPS / 60Hz).
       Elle est supérieure à un setInterval car elle se met en pause automatiquement si l'utilisateur change d'onglet web (économisant de la batterie). */
    requestAnimationFrame(draw);
}

draw();