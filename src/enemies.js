/* ==========================================================================
   🎓 RÉVISION ORAL : POO ET USINE À OBJETS (Factory)
   Cette classe gère tous les ennemis. On passe 'type' en paramètre pour varier 
   leurs attributs. Au lieu de créer 4 classes différentes (HunterEnemy, GiantEnemy...), 
   on centralise tout ici pour faciliter la gestion dans le script principal.
   ========================================================================== */
class Enemy { // Déclaration de la classe Enemy (POO) agissant comme matrice (Factory) pour toutes les variantes d'ennemis.
    constructor(canvasWidth, canvasHeight, type = 'normal') { // Constructeur avec argument facultatif 'type' pour déterminer le profil de l'objet créé.
        this.type = type; // Affecte le paramètre optionnel 'type' à la propriété propre de l'instance générée.
        this.canvasWidth = canvasWidth; // Assigne la largeur transmise en argument pour anticiper les algorithmes de collision murale.
        this.canvasHeight = canvasHeight; // Assigne la hauteur transmise pour préparer les limites de Garbage Collection.
        this.markedForDeletion = false; // Initialise un booléen flag d'état mémoire garantissant le suivi des instances mortes (true = à effacer).
        
        switch (type) { // Début d'une instruction conditionnelle 'switch', souvent plus performante qu'une suite de if/else pour évaluer une même variable.
            case 'hunter': // Branche (cas) d'exécution activée si la chaîne string évaluée est équivalente à 'hunter'.
                this.width = 20; // Assigne la propriété d'instance width (largeur géométrique) à 20.
                this.height = 20; // Assigne la propriété d'instance height (hauteur géométrique) à 20.
                this.speedY = Math.random() * 1.5 + 2.5; // Calcule dynamiquement une composante vectorielle Y (vitesse de chute) par une multiplication aléatoire.
                this.speedX = 0; // Assigne un vecteur vitesse statique en X (0), car le mouvement horizontal sera piloté par l'IA d'Update.
                this.color = "#ff3300"; // Attribue une chaîne hexadécimale (teinte rouge/orange) identifiant visuellement le sous-type.
                break; // Mot-clé obligatoire rompant la cascade du switch et redirigeant le flux de contrôle hors de la structure.
            case 'giant': // Branche d'exécution pour le sous-type lourd 'giant'.
                this.width = 70; // Assigne une large empreinte spatiale de 70 pixels pour ce type d'ennemi.
                this.height = 70; // Assigne une haute empreinte spatiale de 70 pixels, formant un gros bloc logique AABB.
                this.speedY = Math.random() * 1 + 1; // Produit mathématique générant un faible vecteur de chute compris entre 1 et 2 pixels/frame.
                this.speedX = (Math.random() - 0.5) * 1.5; // Calcul générant une translation latérale lente, incluant des valeurs négatives via la soustraction (-0.5).
                this.color = "#9900ff"; // Affecte une chaîne hexadécimale de teinte violette à la propriété couleur de l'instance.
                break; // Rompt l'exécution en chaîne (Fall-through) et quitte le bloc switch.
            case 'flash': // Branche d'exécution pour l'ennemi en chute rapide.
                this.width = 15; // Définit une hitbox étroite (15px) le rendant plus dur à repérer ou toucher horizontalement.
                this.height = 50; // Définit un long corps vertical (50px) symbolisant le mouvement en trombe.
                this.speedY = Math.random() * 3 + 6; // Assignation du plus haut vecteur Y de la factory (entre 6 et 9 pixels par boucle).
                this.speedX = 0; // Fixe explicitement l'axe de translation horizontal à zéro pour maintenir une ligne droite.
                this.color = "#ffff00"; // Affecte la couleur jaune hexadécimale (évoquant l'éclair) à l'instance courante.
                break; // Stoppe l'évaluation conditionnelle et quitte l'arbre logique.
            default: // Clause de repli (Fallback) : segment de code exécuté si aucune des correspondances strictes précédentes ne s'applique.
                this.width = 30; // Propriété d'instance width par défaut à 30 pixels.
                this.height = 30; // Propriété d'instance height par défaut à 30 pixels, formant une boîte rectangulaire neutre.
                this.speedY = Math.random() * 2 + 2; // Formule pseudo-aléatoire fournissant une vitesse moyenne décente sur Y.
                this.speedX = (Math.random() - 0.5) * 2; // Formule de dispersion axiale générant un vecteur de vitesse X, possiblement inverse (négatif).
                this.color = "#ff00ff"; // Couleur magenta appliquée en guise de variante neutre/par défaut.
                break; // Mot-clé garantissant par sécurité la clôture formelle du bloc switch même s'il est terminal.
        } // Clôture syntaxique de l'instruction globale switch.

        // Limite mathématique pour que le point X de spawn n'aille pas au-delà du bord droit (canvasWidth - largeur).
        this.x = Math.random() * (canvasWidth - this.width); // Génère une coordonnée d'apparition (abscisse). La soustraction de width évite le clipping hors écran.
        // Y négatif : l'ennemi spawn "au-dessus" de l'écran (hors champ) et descend naturellement dans la zone visible.
        this.y = -this.height; // Positionne délibérément l'ordonnée d'initialisation en négatif afin que le rectangle glisse de manière imperceptible dans le viewport.
    } // Fin de déclaration de l'initialiseur constructeur.

    // INTERCONNEXION : Reçoit `difficultyMultiplier` depuis gameLogic et `playerTarget` depuis la variable globale `player` dans script.js.
    update(difficultyMultiplier = 1, playerTarget = null) { // Déclaration de la méthode de boucle de jeu pour l'objet, acceptant des arguments par défaut (Default Parameters).
        if (this.type === 'hunter' && playerTarget) { // Opérateur binaire ET logique (&&) : valide si l'ennemi est de type hunter ET que l'objet playerTarget n'est pas nul.
            // IA BASIQUE : Si l'ennemi est plus à gauche que le joueur, il va à droite, et inversement.
            if (this.x + this.width / 2 < playerTarget.x + playerTarget.size / 2) { // Expression géométrique qui compare les centres respectifs des entités.
                this.x += 1.5 * difficultyMultiplier; // Mutateur : Translate l'objet vers les coordonnées positives de X (la droite) influencé par la difficulté.
            } else { // Bloc d'exécution en cascade alternatif (si le chasseur est positionné à droite du joueur).
                this.x -= 1.5 * difficultyMultiplier; // Mutateur inverse : Soustrait l'équation à la position X, forçant un trajet vers la gauche.
            } // Fin de la condition d'Intelligence Artificielle de pathfinding.
        } else if (this.type !== 'flash') { // Vérification de branchement exclusive si le type ne correspond pas au profil rectiligne 'flash'.
            this.x += this.speedX * difficultyMultiplier; // Opérateur d'assignation additive résolvant le vecteur spatial X de l'objet, modulé par la boucle de difficulté (GameLogic).
            
            /* 🎓 LOGIQUE MATHÉMATIQUE : LE REBOND
               Si la coordonnée X dépasse les limites (0 à gauche, largeur du canvas à droite),
               on multiplie sa vitesse par -1. Un mouvement positif (vers la droite) devient 
               négatif (vers la gauche), ce qui simule un rebond sur les murs. */
            if (this.x < 0 || this.x > this.canvasWidth - this.width) { // Ou logique (||) implémentant un clamp (borne) bi-latéral. Évalue si la boîte AABB enfreint les limites.
                this.speedX *= -1; // Algorithme physique de rebond. L'inversion de signe scalaire retourne l'angle du vecteur X de 180°.
            } // Fin du bloc de physique de collision de bordures.
        } // Fin de la cascade de branchement if/else.

        this.y += this.speedY * difficultyMultiplier; // Moteur physique global de chute : Additionne systématiquement le vecteur vertical Y, modulé par la méta-difficulté actuelle.

        /* 🎓 CONCEPT CLÉ : OPTIMISATION ET GARBAGE COLLECTION
           POURQUOI ? Si on ne détruit pas les ennemis qui sortent de l'écran en bas (y > hauteur),
           la RAM va saturer et le jeu va ralentir jusqu'à crasher (Memory Leak). 
           On les marque ici (`true`), et le tableau dans `script.js` utilisera la méthode `filter()` pour les supprimer définitivement. */
        if (this.y > this.canvasHeight) { // Expression conditionnelle spatiale détectant la disparition totale de la hitbox sous le viewport (écran) visible.
            this.markedForDeletion = true; // Mutation du booléen d'état servant de signaleur (flag) pour la procédure de collecte des déchets de script.js.
        } // Fin de vérification de hors-champ.
    } // Clôture de la méthode de mise à jour logique (Update).

    // La méthode draw est appelée à chaque frame pour dessiner l'ennemi sur le canvas.
    draw(ctx) { // Interface API : Déclaration de la méthode draw acceptant en argument un pointeur vers l'interface de l'API matérielle (le Context 2D).
        ctx.fillStyle = this.color; // Mutateur d'état graphique affectant le tampon couleur (FillStyle) avec l'attribut chromatique de l'instance d'Enemy courante.
        
        // Dessine un rectangle à la position (x, y) avec la taille (width, height) de l'ennemi.
        ctx.fillRect(this.x, this.y, this.width, this.height); // Instruction primitive (primitive polygonale) traçant le corps (plein) selon le volume AABB (X, Y, W, H).
    } // Fin de la procédure de rendu Draw.
} // Fin logique de la balise class Enemy.

class Projectile { // Déclaration de classe annexe (POO) incarnant des entités physiques réactives secondaires (éclaboussures de lave toxique).
    constructor(x, y) { // Constructeur fonctionnel requérant obligatoirement une origine vectorielle (point de spawn initial).
        this.x = x; // Assignation du paramètre X local dans la structure mémorielle de l'objet (this).
        this.y = y; // Affectation du paramètre d'origine Y à la composante abstraite de l'objet nouvellement généré.
        this.size = Math.random() * 3 + 2; // Calcul stochastique garantissant que le rayon visuel de collision (la taille) flotte entre 2 et 5 unités.
        this.speedX = (Math.random() - 0.5) * 8; // Opération de dispersion produisant un vecteur X capable d'aller à reculons ou en avant (entre -4 et +4).
        this.speedY = (Math.random() * -5) - 2; // Formulation d'un vecteur de poussée (Y). Sa nature négative le contraint à se projeter initialement vers le zénith.
        this.color = "#ff0000"; // Codage "en dur" (Hardcoded) de la valeur hexadécimale associée au danger écarlate de la substance.
        this.markedForDeletion = false; // Flag mémoriel indispensable au paradigme de garbage collection des listes JS pour libérer la heap memory.
    } // Validation et clôture formelle de la routine d'initialisation de l'objet (Constructor).

    update() { // Point d'entrée cyclique (hook), déclenché lors du rafraîchissement d'état du navigateur, résolvant la trigonométrie et l'état.
        this.x += this.speedX; // Assignation géométrique transposant spatialement l'entité sur son axe horizontal, frame par frame.
        this.y += this.speedY; // Action d'élévation mathématique, le point Y étant négatif, la particule grimpe visuellement.
        
        // 🎓 PHYSIQUE : SIMULATION DE GRAVITÉ
        // En ajoutant constamment une valeur (0.3) à la vélocité verticale (speedY), on simule l'accélération gravitationnelle.
        // L'objet ralentit en montant, s'arrête, puis accélère en tombant (courbe parabolique).
        this.speedY += 0.3; // Constante physique simulant une attraction terrestre par modification différentielle ascendante du vecteur ascendant (parabole).
        
        // Si le projectile sort de l'écran (avec une marge)...
        if (this.y > 600) { // Comparateur scalaire : 600 étant une limite morte hors matrice d'affichage (le Viewport fait 500).
            this.markedForDeletion = true; // Signal booléen destiné à faire rejeter cet objet de l'Array via fonction `filter()` externe.
        } // Fin d'expression conditionnelle de nettoyage.
    } // Fin d'encapsulation de la routine d'Update.

    // Dessine le projectile sur le canvas.
    draw(ctx) { // Interface d'export graphique du modèle abstrait vers la couche d'accès HTML Canvas passée en paramètre.
        ctx.fillStyle = this.color; // Définit l'état matériel du pinceau de pixel actif sur la couleur pure désignée en mémoire.
        ctx.beginPath(); // Fonction API invoquant une remise à zéro du path-buffer de calcul de pixels, isolant la prochaine forme tracée.
        // Dessine un cercle (arc complet) à la position (x, y) avec la taille (size).
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2); // Exécution de routine mathématique Canvas (x, y, radius, startAngle, endAngle 2*PI rads).
        ctx.fill(); // Ordonne au buffer de l'API de couler sa teinte définie (`fillStyle`) à travers la matrice créée par la routine Arc().
    } // Terminaison stricte de la séquence graphique locale.
} // Terminaison formelle de l'instanciation en classe POO du Projectile.