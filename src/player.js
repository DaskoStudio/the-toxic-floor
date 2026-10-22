/* ==========================================================================
   🎓 RÉVISION ORAL : L'ENTITÉ JOUEUR ET L'ENCAPSULATION
   POURQUOI UNE CLASSE ? Le Joueur a ses propres variables (vie, vitesse) et ses 
   propres actions (move, draw). En encapsulant tout ça ici, le fichier `script.js` 
   reste lisible. Il a juste à dire "player.move()", sans se soucier du fonctionnement interne du dash.
   ========================================================================== */
class Player { // Déclaration de la classe Player (POO), le plan de construction de notre avatar.
    
    // `this` fait référence à l'instance spécifique de l'objet créée en mémoire.
    constructor(x, y, icon = "👻", speed = 8) { // Déclaration du constructeur avec arguments et valeurs par défaut (icon, speed).
        this.x = x; // Assignation de l'argument 'x' à la propriété d'instance correspondante.
        this.y = y; // Assignation de l'argument 'y' à la propriété d'instance correspondante.
        this.size = 50; // Initialise la propriété 'size' (dimension de la hitbox carrée) à 50.
        this.speed = speed; // Assignation de l'argument 'speed' à la propriété d'instance de vitesse.
        this.icon = icon; // Assignation de l'argument 'icon' (chaîne de caractère emoji) à l'instance.
        this.health = 100; // Initialise la propriété 'health' de l'instance à 100 (points de vie complets).
        
        // La vitesse du dash (esquive) est calculée dynamiquement : 3 fois la vitesse de base.
        this.dashSpeed = this.speed * 3; // Expression mathématique : assigne le triple de la vitesse de base à la propriété de dash.
        
        // Gestion de l'état du dash
        this.isDashing = false; // Initialise un booléen d'état indiquant si l'action dash est en cours.
        this.dashDuration = 0; // Initialise le compteur temporel (en frames) de la durée du dash à zéro.
        this.dashCooldown = 0; // Initialise le compteur temporel limitant la réutilisation du dash (cooldown).
        
        // Gestion de l'invincibilité (après un dégât ou via un power-up)
        this.invincible = false; // Initialise un booléen d'état d'immunité aux dégâts à faux.
        this.invincibleTimer = 0; // Initialise le compteur temporel gérant la durée restante d'invincibilité.
        
        // --- DASH PARTICLES ---
        // Un tableau qui va contenir les petits cercles bleus formant la traînée du dash
        this.dashParticles = []; // Initialise une structure de données de type Tableau vide (Array) pour le système de particules.
    } // Fin de la définition du constructeur.

    // Cette fonction ne gère PAS le mouvement lié aux touches. Elle gère la logique asynchrone (les timers de cooldown, de frames d'invincibilité).
    update() { // Définition de la méthode update(), moteur de la logique interne du joueur exécutée à chaque frame.
        if (this.invincibleTimer > 0) { // Structure conditionnelle évaluant si le timer d'invincibilité est actif.
            this.invincibleTimer--; // Décrémentation unitaire (réduit d'une frame la durée restante).
            if (this.invincibleTimer <= 0) this.invincible = false; // Condition imbriquée : si le délai est écoulé, le booléen d'invincibilité repasse à faux.
        } // Fin de la structure conditionnelle d'invincibilité.
        
        // Pour chaque particule du dash, on modifie ses propriétés (Alpha pour la transparence, Size pour le rétrécissement).
        this.dashParticles.forEach(p => { // Appel de la méthode itérative forEach() du Tableau, exécutant une fonction fléchée sur chaque particule 'p'.
            p.alpha -= 0.05; // Opérateur d'assignation après soustraction : diminue l'opacité de la particule de 0.05.
            p.size -= 0.2; // Opérateur d'assignation après soustraction : réduit la taille de la particule de 0.2 pixels.
        }); // Fin du bloc itératif forEach.

        /* 🎓 CONCEPT CLÉ : FILTER ET PERFORMANCES
           COMMENT : La méthode .filter() crée un NOUVEAU tableau en ne gardant que les éléments qui valident la condition.
           POURQUOI : Supprimer du tableau les particules disparues (alpha < 0). Sans ça, 
           le tableau contiendrait des millions de particules invisibles au bout de quelques minutes, ruinant le framerate. */
        this.dashParticles = this.dashParticles.filter(p => p.alpha > 0 && p.size > 0); // Réassigne le tableau en filtrant les éléments morts (opération de nettoyage mémoire vitale).
    } // Fin de la méthode update.

    // INTERCONNEXION : `keys` est un dictionnaire (ex: { "ArrowUp": true }) généré par les event listeners dans `script.js`.
    move(keys, width, height) { // Définition de la méthode move() recevant les inputs clavier et les limites dimensionnelles du Canvas en arguments.
        if (this.dashCooldown > 0) { // Structure de contrôle évaluant si l'action Dash est en période de recharge.
            this.dashCooldown--; // Décrémentation unitaire de la recharge par frame écoulée.
        } // Fin du bloc conditionnel.

        /* 🎓 MOT-CLÉ : BOOLEAN LOGIC (Logique Booléenne)
           `&&` signifie ET. L'action dash ne s'active QUE SI : la touche shift est pressée ET que le cooldown est à zéro ET que je ne suis pas DÉJÀ en train de dasher (`!this.isDashing`). */
        if ((keys['ShiftLeft'] || keys['ShiftRight']) && this.dashCooldown <= 0 && !this.isDashing) { // Évaluation booléenne complexe imbriquant un OU logique (||), deux ET logiques (&&) et une négation (!).
            this.isDashing = true; // Assigne la valeur vrai au booléen d'état, déclenchant l'esquive.
            this.dashDuration = 10; // Configure la fenêtre temporelle de l'action à 10 frames de jeu.
            this.dashCooldown = 60; // Configure le délai de pénalité avant réutilisation à 60 frames (soit ~1 seconde).
        } // Fin du bloc d'activation du dash.

        // Détermine la vitesse à appliquer pour ce frame (vitesse normale ou vitesse de dash).
        let currentSpeed = this.speed; // Déclaration d'une variable locale 'let' initialisée à la vitesse de base de l'instance.
        
        if (this.isDashing) { // Structure conditionnelle qui remplace la physique de mouvement si l'état dashing est avéré.
            currentSpeed = this.dashSpeed; // Mutation de la variable locale, remplaçant la vitesse par la version accélérée.
            this.dashDuration--; // Décrémentation de la fenêtre d'action du dash.
            
            // Math.random() génère une valeur entre 0 et 1. Soustraire 0.5 permet d'obtenir une plage de dispersion de [-0.5, +0.5].
            this.dashParticles.push({ // Méthode push() de l'objet Array, ajoute un nouvel objet litéral représentant une particule.
                x: this.x + this.size / 2 + (Math.random() - 0.5) * 20, // Calcule mathématiquement le point d'origine X de la particule avec un offset pseudo-aléatoire.
                y: this.y + this.size / 2 + (Math.random() - 0.5) * 20, // Calcule l'origine Y avec dispersion pour un rendu organique.
                alpha: 1, // Assigne une opacité maximale (1) à la naissance de la particule.
                size: Math.random() * 8 + 4 // Génère un rayon aléatoire flottant entre 4 et 12 pixels.
            }); // Fin de l'appel de fonction push().
            
            // Si la durée du dash est écoulée...
            if (this.dashDuration <= 0) { // Contrôle de fin d'action temporelle.
                this.isDashing = false; // Mutation d'état : le booléen est remis à faux, stoppant l'esquive.
            } // Fin de la vérification de durée.
        } // Fin du bloc de gestion du dash.

        /* 🎓 COLLISION AVEC LES MURS (Clamping temporel)
           Le déplacement s'additionne ou se soustrait aux coordonnées x/y actuelles.
           La condition `&& this.y > 0` agit comme un mur invisible, bloquant le déplacement si le joueur touche le bord du Canvas. */
        if ((keys['ArrowUp'] || keys['KeyW'] || keys['KeyZ']) && this.y > 0) this.y -= currentSpeed; // Validation d'input multi-touches (Z/W ou Haut) et application du vecteur Y (vers le haut = négatif).
        if ((keys['ArrowDown'] || keys['KeyS']) && this.y < height - this.size) this.y += currentSpeed; // Validation d'input bas et blocage (clamp) mathématique contre la frontière basse du canvas.
        if ((keys['ArrowLeft'] || keys['KeyA'] || keys['KeyQ']) && this.x > 0) this.x -= currentSpeed; // Validation d'input gauche et soustraction du vecteur de vitesse à l'axe des abscisses X.
        if ((keys['ArrowRight'] || keys['KeyD']) && this.x < width - this.size) this.x += currentSpeed; // Validation d'input droite et addition du vecteur de vitesse avec clamp contre la bordure droite.
    } // Fin de la méthode move.

    heal(amount) { // Définition de la méthode heal() mutateur (setter) pour la santé, acceptant un montant en paramètre.
        // Sécurité avec Math.min() : on force la vie à ne jamais dépasser 100.
        this.health = Math.min(100, this.health + amount); // Utilisation d'une fonction mathématique (Math.min) pour plafonner strictement le calcul d'addition à un maximum absolu de 100.
    } // Fin de la méthode heal.

    makeInvincible(durationFrames) { // Définition de la méthode mutatrice pour accorder un statut de protection.
        this.invincible = true; // Modifie l'état du booléen d'instance autorisant le blocage des dégâts.
        this.invincibleTimer = durationFrames; // Affecte le compteur temporel passé en argument à la propriété de l'instance.
    } // Fin de la méthode makeInvincible.

    takeDamage(amount) { // Définition de la méthode de sanction vitale prenant un paramètre de valeur de dégât.
        if (!this.invincible) { // Structure conditionnelle : Négation booléenne (!), le code s'exécute uniquement si invincible est faux.
            this.health -= amount; // Opérateur d'assignation après soustraction : ampute le capital santé de l'instance.
        } // Fin de la condition.
    } // Fin de la méthode takeDamage.

    isDead() { // Définition d'une méthode booléenne renvoyant l'état vital du joueur.
        return this.health <= 0; // Évaluation d'une expression comparative qui retourne un booléen (true si PV <= 0, game over).
    } // Fin de la méthode isDead.

    /* 🎓 L'API HTML5 CANVAS ET LE RENDER (Dessin)
       Le paramètre 'ctx' (contexte 2D) est le pinceau de l'ordinateur. Le Canvas ne se "souvient" de rien,
       c'est un système de pixels redessiné intégralement 60 fois par seconde. */
    draw(ctx) { // Définition de la méthode de rendu graphique prenant le contexte bidimensionnel (ctx) en argument.
        /* 🎓 MOT-CLÉ : ISOLATION DU CONTEXTE GRAPHIQUE
           ctx.save() met en mémoire tous les réglages actuels du pinceau (couleur, épaisseur...).
           À la fin, ctx.restore() les remet. Cela évite que l'ombre du joueur vienne "tacher" les ennemis dessinés après lui. */
        ctx.save(); // Appel de méthode native de l'API Canvas : pousse (push) la matrice d'état sur la pile.
        
        ctx.fillStyle = "#00ccff"; // Modifie la propriété d'état du contexte pour remplir en cyan hexadécimal.
        ctx.shadowBlur = 0; // Annule volontairement tout filtre de flou pour préserver le coût CPU (optimisation rendering).
        ctx.shadowColor = "#00ccff"; // Définit la couleur de l'ombre portée (inactif ici car blur est à 0).
        this.dashParticles.forEach(p => { // Boucle itérative forEach pour dessiner l'intégralité du tableau de particules.
            ctx.globalAlpha = p.alpha; // Affecte au contexte global le canal alpha dynamique propre à l'objet itéré 'p'.
            ctx.beginPath(); // Déclare au contexte la volonté de tracer un chemin vectoriel inédit.
            // Math.PI * 2 est un angle en radians correspondant à 360° (un cercle plein).
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); // Construit mathématiquement la forme circulaire aux coordonnées de la particule.
            ctx.fill(); // Procède au remplissage matériel des pixels délimités par le tracé.
        }); // Fin de la boucle itérative.
        
        // Réinitialise les styles pour dessiner le joueur lui-même.
        ctx.globalAlpha = 1; // Restaure manuellement la pleine opacité pour ne pas dessiner le personnage en transparence.
        ctx.font = `bold ${this.size}px serif`; // Interpolation de variable (Template Literal) pour générer une police typographique adaptée à la taille.
        ctx.textAlign = "center"; // Modifie la propriété d'état du contexte pour centrer typographiquement.
        ctx.textBaseline = "middle"; // Modifie la propriété d'état pour centrer la ligne de base verticale.

        // Dessine un contour noir autour de l'emoji pour améliorer la lisibilité sur tous les fonds.
        ctx.strokeStyle = "black"; // Définit la couleur du pinceau de contour (Stroke) en noir.
        ctx.lineWidth = 4; // Assigne une épaisseur vectorielle de 4 pixels au pinceau de contour.
        ctx.strokeText(this.icon, this.x + this.size / 2, this.y + this.size / 2); // Exécute le rendu filaire (contour) du caractère typographique.

        // Gère les effets visuels (ombre, bulle) en fonction de l'état d'invincibilité.
        if (this.invincible) { // Contrôle de branchement : l'exécution entre ici si le joueur bénéficie du power-up.
            ctx.shadowBlur = 10; // Instancie un effet shader de flou (coûteux en GPU) à 10px.
            ctx.shadowColor = "#ffff00"; // Modifie la teinte du flou en jaune vif hexadécimal.
            ctx.fillStyle = "rgba(255, 255, 0, 0.4)"; // Assigne une teinte de remplissage avec un canal alpha de 40% (RGBA).
            ctx.beginPath(); // Ouvre l'enregistrement d'un nouveau chemin de points.
            ctx.arc(this.x + this.size / 2, this.y + this.size / 2, this.size / 1.3, 0, Math.PI * 2); // Construit un grand cercle englobant l'avatar (divisé par 1.3 pour l'échelle).
            ctx.fill(); // Rend matériellement le polygone délimité, formant une bulle de force visuelle.
        } else { // Clause alternative (si le booléen invincible est évalué à faux).
            ctx.shadowBlur = 10; // Conserve le flou paramétré pour une cohérence visuelle.
            ctx.shadowColor = "white"; // Affecte une teinte d'ombre blanche (par défaut) au contexte.
        } // Fin de la structure alternative de rendu conditionnel.
        
        // Dessine l'emoji principal du joueur par-dessus le contour et la bulle.
        ctx.fillText(this.icon, this.x + this.size / 2, this.y + this.size / 2); // Dessine le corps plein du caractère (l'Emoji) superposé au reste.
        ctx.restore(); // Méthode cruciale (pop) de l'API Canvas : libère la pile et désactive tous les styles appliqués depuis le dernier save().
    } // Fin de la méthode draw.
} // Fin de la déclaration de la classe Player.