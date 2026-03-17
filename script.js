const registerServiceWorker = async () => {
  if ("serviceWorker" in navigator) {
    try {
      const registration = await navigator.serviceWorker.register("/sw.js");
    } catch (error) {}
  }
};

registerServiceWorker();
let deferredPrompt;
const installBanner = document.getElementById("install-banner");
const installBtn = document.getElementById("install-btn");

window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();

  deferredPrompt = e;

  if (installBanner) {
    installBanner.style.setProperty("display", "block", "important");
  }
});

if (installBtn) {
  installBtn.addEventListener("click", async () => {
    if (!deferredPrompt) return;

    try {
      deferredPrompt.prompt();

      const { outcome } = await deferredPrompt.userChoice;
      console.log(`User memilih: ${outcome}`);

      deferredPrompt = null;
      if (installBanner) installBanner.style.display = "none";
    } catch (error) {
      console.error("Gagal memicu instalasi:", error);
    }
  });
}

const canvas = document.getElementById("canvas");
let game;

function loadImg(src) {
  const img = new Image();
  img.src = src;
  return img;
}

const bgImg = loadImg("./img/Background.png");
const alienRedImg = loadImg("./img/Alien Red.png");
const alienBlueImg = loadImg("./img/Alien Blue.png");
const alienGreenImg = loadImg("./img/Alien Green.png");
const enemyBulletImg = loadImg("./img/Enemy Bullet.png");
const playerBulletImg = loadImg("./img/Player Bullet.png");
const playerImg = loadImg("./img/Player Space Ship.png");
const exploseImg = loadImg("./img/Explose.png");

const gameFinalSection = document.getElementById("gameFinalSection");
const titleGameFinal = document.getElementById("titleGameFinal");
const bannerGameFinal = document.getElementById("bannerGameFinal");
const finalScore = document.getElementById("finalScore");
const finalWave = document.getElementById("finalWave");
const finalAliens = document.getElementById("finalAliens");
const finalBest = document.getElementById("finalBest");
const messageFinal = document.getElementById("messageFinal");
const btnPlayAgain = document.getElementById("btnPlayAgain");
const btnMenuFinal = document.getElementById("btnMenuFinal");
const btnMenu = document.getElementById("btnMenu");

const gamePauseSection = document.getElementById("gamePauseSection");
const btnResume = document.getElementById("btnResume");
const btnQuit = document.getElementById("btnQuit");

const gameMenu = document.getElementById("gameMenu");
const nameInput = document.getElementById("nameInput");
const btnStartGame = document.getElementById("btnStartGame");
const btnHowToPlay = document.getElementById("btnHowToPlay");
const btnHighScore = document.getElementById("btnHighScore");

const leaderboardContent = document.getElementById("leaderboardContent");
const backMenuLeaderboard = document.getElementById("backMenuLeaderboard");

const gameSection = document.getElementById("gameSection");
const gameLeaderboard = document.getElementById("gameLeaderboard");

const tutorBackToMenu = document.getElementById("tutorBackToMenu");
const gameTutor = document.getElementById("gameTutor");

const containerBestScore = document.getElementById("containerBestScore");

btnHowToPlay.addEventListener("click", (e) => {
  gameTutor.classList.remove("hidden");
  gameMenu.classList.add("hidden");
});
tutorBackToMenu.addEventListener("click", (e) => {
  gameTutor.classList.add("hidden");
  gameMenu.classList.remove("hidden");
});

btnStartGame.addEventListener("click", (e) => {
  gameMenu.classList.add("hidden");
  gameSection.classList.remove("hidden");
  game = new Game(
    nameInput.value.trim() === "" ? "Pilot" : nameInput.value.trim(),
  );
  game.start();
});

btnHighScore.addEventListener("click", (e) => {
  leaderboardContent.innerHTML = ``;
  gameMenu.classList.add("hidden");
  gameLeaderboard.classList.remove("hidden");
  const storage = JSON.parse(localStorage.getItem("leaderboard")) || [];
  const sort = storage.sort((a, b) => b.score - a.score).slice(0, 10);

  sort.forEach((s, i) => {
    leaderboardContent.innerHTML += `<tr>
                        <td>${i + 1}</td>
                        <td>${s.name}</td>
                        <td>${s.score}</td>
                        <td>${s.wave}</td>
                    </tr>`;
  });
});

backMenuLeaderboard.addEventListener("click", (e) => {
  gameMenu.classList.remove("hidden");
  gameLeaderboard.classList.add("hidden");
});

class Player {
  constructor() {
    this.x = canvas.width / 2 - 80;
    this.y = canvas.height - 90;
    this.size = 90;
    this.lastShoot = null;
    this.isHit = false;
    this.lastHit = null;
  }
}

class Shoot {
  constructor(x, y, type, img) {
    this.x = x;
    this.y = y;
    this.type = type;
    this.img = img;
    this.width = 10;
    this.height = 30;
  }
}

class Enemy {
  constructor(x, y, type, img, score) {
    this.x = x;
    this.y = y;
    this.type = type;
    this.img = img;
    this.score = score;
    this.size = 30;
    this.lastShoot = null;
  }
}

class Effect {
  constructor(x, y, initDuration) {
    this.x = x;
    this.y = y;
    this.initDuration = initDuration;
  }
}

class Game {
  constructor(name) {
    this.ctx = canvas.getContext("2d");
    this.frameId = null;
    let leaderboardStorage =
      JSON.parse(localStorage.getItem("leaderboard")) || [];

    this.gameState = "playing";
    this.name = name;
    this.highScore =
      leaderboardStorage.find((hscore) => hscore.name === name) ?? null;
    console.log(this.highScore);
    this.lives = 3;
    this.scores = 0;
    this.aliensDestroyed = 0;
    this.wave = 1;
    this.player = new Player();
    this.keys = [];
    this.enemies = [];
    this.shoots = [];
    this.effects = [];

    this.enemyCountWave = 4;
    this.enemyDirection = 1;
    this.enemyStepDown = 20;
  }

  start() {
    this.initListener();
    this.spawnEnemies();
    this.render();

    console.log("test");
  }

  render() {
    this.ctx.clearRect(0, 0, canvas.width, canvas.height);

    this.drawBg();
    this.drawPlayer();
    this.drawShoots();
    this.drawEnemies();
    this.drawEffects();
    this.shootPlayer();

    if (this.gameState === "playing") {
      this.updateShoot();
      this.updatePlayer();
      this.updateEnemies();
      this.checkCollisions();
      this.clearOverlay();
      this.frameId = requestAnimationFrame(() => this.render());
    } else if (this.gameState === "wave") {
      this.drawChangeWave();
      this.frameId = requestAnimationFrame(() => this.render());
    } else if (this.gameState === "paused") {
      this.drawGamePaused();
      this.frameId = requestAnimationFrame(() => this.render());
    } else if (
      this.gameState === "gamevictory" ||
      this.gameState === "gameover"
    ) {
      this.drawGameFinal();
    }
  }

  drawGameFinal() {
    cancelAnimationFrame(this.frameId);
    gameFinalSection.classList.remove("hidden");
    if (this.highScore && this.scores > this.highScore.score) {
      const storage = JSON.parse(localStorage.getItem("leaderboard")) || [];

      let newStorage = storage.filter((s) => s.name != this.name);
      newStorage.push({ name: this.name, score: this.scores, wave: this.wave });
      localStorage.setItem("leaderboard", JSON.stringify(newStorage));
      finalBest.textContent = `${this.scores} (Wave ${this.wave})`;
      messageFinal.textContent = "New Record";
      messageFinal.style.color = "yellow";
      containerBestScore.style.border = "0.5px solid yellow";
    } else if (this.highScore && this.scores < this.highScore.score) {
      messageFinal.textContent = "Your Best";
      messageFinal.style.color = "gray";
      containerBestScore.style.border = "0.5px solid blue";
      finalBest.textContent = `${this.highScore.score} (Wave ${this.highScore.wave})`;
    }

    if (!this.highScore) {
      const storage = JSON.parse(localStorage.getItem("leaderboard")) || [];

      storage.push({ name: this.name, score: this.scores, wave: this.wave });
      localStorage.setItem("leaderboard", JSON.stringify(storage));
      finalBest.textContent = `${this.scores} (Wave ${this.wave})`;
      messageFinal.textContent = "New Record";
      messageFinal.style.color = "yellow";
      containerBestScore.style.border = "0.5px solid yellow";
    }

    finalScore.textContent = this.scores;
    finalWave.textContent = this.wave;
    finalAliens.textContent = this.aliensDestroyed;

    if (this.gameState === "gamevictory") {
      bannerGameFinal.src = "./img/Victory Banner.png";
      titleGameFinal.textContent = "Victory";
    } else {
      bannerGameFinal.src = "./img/GameOver Banner.png";
      titleGameFinal.textContent = "Game Over";
    }
  }

  drawGamePaused() {
    gamePauseSection.classList.remove("hidden");
  }

  clearOverlay() {
    gamePauseSection.classList.add("hidden");
    gameFinalSection.classList.add("hidden");
  }

  drawBg() {
    this.ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);

    this.ctx.fillStyle = "white";
    this.ctx.font = "15px sans-serif";
    this.ctx.fillText("SCORE", 30, 30);
    this.ctx.fillStyle = "white";
    this.ctx.font = "40px sans-serif";
    this.ctx.fillText(this.scores, 50, 70);

    this.ctx.fillStyle = "white";
    this.ctx.font = "15px sans-serif";
    this.ctx.fillText("LIVES", canvas.width - 200, 30);
    this.ctx.fillStyle = "white";
    this.ctx.font = "25px sans-serif";
    for (let i = 1; i <= this.lives; i++) {
      this.ctx.fillText("❤️", i * 25 + canvas.width - 240, 60);
    }

    this.ctx.fillStyle = "white";
    this.ctx.font = "15px sans-serif";
    this.ctx.fillText("HI-SCORE", canvas.width - 100, 30);
    this.ctx.fillStyle = "white";
    this.ctx.font = "40px sans-serif";
    this.ctx.fillText(this.highScore?.score || 0, canvas.width - 100, 70);
  }

  drawPlayer() {
    this.ctx.save();
    if (this.player.isHit) {
      const now = Date.now();
      let opacity;
      opacity = now % 2 === 0 ? 0.2 : 0.8;
      this.ctx.globalAlpha = opacity;
    }
    this.ctx.drawImage(
      playerImg,
      this.player.x,
      this.player.y,
      this.player.size,
      this.player.size,
    );
    this.ctx.restore();
  }

  updatePlayer() {
    if (this.keys["KeyA"] || this.keys["ArrowLeft"]) {
      this.player.x -= 10;
    }
    if (this.keys["KeyD"] || this.keys["ArrowRight"]) {
      this.player.x += 10;
    }
    const now = Date.now();
    if (this.player.lastHit && now - this.player.lastHit > 1000) {
      this.player.lastHit = null;
      this.player.isHit = false;
    }

    if (this.player.x + this.player.size > canvas.width) {
      this.player.x = canvas.width - this.player.size;
    }
    if (this.player.x <= 0) {
      this.player.x = 0;
    }
  }

  drawEffects() {
    for (let i = 0; i < this.effects.length; i++) {
      const effect = this.effects[i];
      this.ctx.drawImage(exploseImg, effect.x, effect.y, 30, 30);

      if (Date.now() - effect.initDuration > 500) {
        this.effects.splice(i, 1);
      }
    }
  }

  shootPlayer() {
    if (this.keys["Space"]) {
      const now = Date.now();
      if (!this.player.lastShoot || now - this.player.lastShoot > 100) {
        this.shoots.push(
          new Shoot(
            this.player.x + 35,
            this.player.y - 10,
            "player",
            playerBulletImg,
          ),
        );

        this.player.lastShoot = now;
      }
    }
  }

  updateShoot() {
    for (let i = 0; i < this.shoots.length; i++) {
      const shoot = this.shoots[i];

      if (shoot.type === "player") {
        shoot.y -= 10;
      }

      if (shoot.type === "enemy") {
        shoot.y += this.wave < 5 ? 5 : 2;
      }
    }
  }

  drawShoots() {
    for (let i = 0; i < this.shoots.length; i++) {
      const shoot = this.shoots[i];

      this.ctx.drawImage(
        shoot.img,
        shoot.x,
        shoot.y,
        shoot.width,
        shoot.height,
      );
    }
  }

  spawnEnemies() {
    const MAX_COLS = 2 * this.wave;
    const size = 30;
    const gap = 10;
    const totalEnemy = this.enemyCountWave * 3 * this.wave;
    const totalWidth = MAX_COLS * size + (MAX_COLS - 1) * gap;
    const MAX_ROWS = Math.ceil(totalEnemy / MAX_COLS);

    const startX = (canvas.width - totalWidth) / 2;

    for (let row = 0; row < MAX_ROWS; row++) {
      for (let col = 0; col < MAX_COLS; col++) {
        const currentIndex = row * MAX_COLS + col;

        if (currentIndex >= totalEnemy) break;

        let type, img, score;

        if (row % 3 === 0) {
          type = "red";
          img = alienRedImg;
          score = 30;
        } else if (row % 2 === 0) {
          type = "blue";
          img = alienBlueImg;
          score = 20;
        } else {
          type = "green";
          img = alienGreenImg;
          score = 10;
        }

        this.enemies.push(
          new Enemy(
            col * (size + gap) + startX,
            row * (size + gap) + 20,
            type,
            img,
            score,
          ),
        );
      }
    }
  }

  drawEnemies() {
    this.enemies.forEach((enemy) => {
      this.ctx.drawImage(enemy.img, enemy.x, enemy.y, enemy.size, enemy.size);
    });
  }
  updateEnemies() {
    if (this.enemies.length === 0) return;

    let hitWall = false;
    const now = Date.now();

    for (let enemy of this.enemies) {
      if (this.enemyDirection === 1 && enemy.x + enemy.size >= canvas.width) {
        hitWall = true;
        break;
      }
      if (this.enemyDirection === -1 && enemy.x <= 0) {
        hitWall = true;
        break;
      }
    }

    const avgX =
      this.enemies.reduce((sum, a) => sum + a.x, 0) / this.enemies.length;

    const dirX = this.player.x > avgX ? 1 : -1;

    if (!hitWall) {
      this.enemies.forEach((enemy) => {
        enemy.x += dirX;
      });
    }
    this.enemies.forEach((enemy) => {
      if (!enemy.lastShoot || now - enemy.lastShoot > 2000) {
        if (Math.random() > 0.5) {
          this.shoots.push(
            new Shoot(enemy.x + 10, enemy.y + 10, "enemy", enemyBulletImg),
          );
        }
        enemy.lastShoot = now;
      }
    });
  }

  drawChangeWave() {
    this.ctx.fillStyle = "black";
    this.ctx.fillRect(0, 0, canvas.width, canvas.height);

    this.ctx.textAlign = "center";
    this.ctx.fillStyle = "white";
    this.ctx.font = "35px sans-serif";
    this.ctx.fillText(
      `WAVE: ${this.wave}`,
      canvas.width / 2,
      canvas.height / 2,
    );

    this.ctx.font = "15px sans-serif";
    this.ctx.fillStyle = "gray";
    this.ctx.fillText(
      `They're Coming`,
      canvas.width / 2,
      canvas.height / 2 + 20,
    );

    setTimeout(() => {
      this.gameState = "playing";
    }, 2000);
  }

  checkCollisions() {
    for (let i = 0; i < this.shoots.length; i++) {
      const shoot = this.shoots[i];
      if (shoot.type === "player") {
        for (let j = 0; j < this.enemies.length; j++) {
          const enemy = this.enemies[j];

          if (
            shoot.x + shoot.width > enemy.x &&
            shoot.x < enemy.x + enemy.size &&
            shoot.y + shoot.height > enemy.y &&
            shoot.y < enemy.y + enemy.size
          ) {
            this.scores += enemy.score;
            this.effects.push(new Effect(enemy.x, enemy.y, Date.now()));
            this.shoots.splice(i, 1);
            this.enemies.splice(j, 1);
            this.aliensDestroyed++;

            if (this.enemies.length <= 0) {
              if (this.wave > 9) {
                this.gameState = "gamevictory";
              } else {
                this.spawnEnemies();
                this.gameState = "wave";
                this.shoots = [];
                this.wave++;
              }
            }
          }
        }
      }

      if (shoot.type === "enemy") {
        if (
          shoot.x + shoot.width > this.player.x &&
          shoot.x < this.player.x + this.player.size &&
          shoot.y + shoot.height > this.player.y &&
          shoot.y < this.player.y + this.player.size &&
          !this.player.isHit
        ) {
          this.lives--;
          this.player.isHit = true;
          this.player.lastHit = Date.now();

          if (this.lives <= 0) {
            gameFinalSection.classList.remove("hidden");

            this.gameState = "gameover";
          }
        }
      }
    }
  }

  initListener() {
    const mobileLeft = document.getElementById("btnLeft");
    const mobileRight = document.getElementById("btnRight");
    const mobileShoot = document.getElementById("btnShoot");

    const handleTouch = (btn, keyCode) => {
      btn.addEventListener("touchstart", (e) => {
        e.preventDefault();
        this.keys[keyCode] = true;
      });
      btn.addEventListener("touchend", (e) => {
        e.preventDefault();
        this.keys[keyCode] = false;
      });
    };

    handleTouch(mobileLeft, "ArrowLeft");
    handleTouch(mobileRight, "ArrowRight");
    handleTouch(mobileShoot, "Space");
    window.addEventListener("keydown", (e) => {
      this.keys[e.code] = true;

      if (e.code === "KeyP" && this.gameState === "playing") {
        this.gameState = "paused";
      } else if (e.code === "KeyP" && this.gameState === "paused") {
        this.gameState = "playing";
      }
    });

    window.addEventListener("keyup", (e) => {
      this.keys[e.code] = false;
    });

    btnPlayAgain.addEventListener("click", (e) => {
      let leaderboardStorage =
        JSON.parse(localStorage.getItem("leaderboard")) || [];

      this.gameState = "playing";
      this.highScore =
        leaderboardStorage.find((hscore) => hscore.name === this.name) ?? null;
      console.log(this.highScore);
      this.lives = 3;
      this.scores = 0;
      this.aliensDestroyed = 0;
      this.wave = 1;
      this.player = new Player();
      this.keys = [];
      this.enemies = [];
      this.shoots = [];
      this.start();
    });

    btnResume.addEventListener("click", (e) => {
      this.gameState = "playing";
    });

    btnQuit.addEventListener("click", (e) => {
      cancelAnimationFrame(this.frameId);
      gameMenu.classList.remove("hidden");
      gamePauseSection.classList.add("hidden");
      gameSection.classList.add("hidden");
    });

    btnMenuFinal.addEventListener("click", (e) => {
      gameFinalSection.classList.add("hidden");
      gameSection.classList.add("hidden");
      gameMenu.classList.remove("hidden");
    });
  }
}
