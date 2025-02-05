<script>
  import { onMount, tick } from "svelte";
  import { fade, scale, fly, slide } from "svelte/transition";
  import { animals } from "../data.js";
  import {
    fetchUnsplashImage,
    fetchAnimalFunFact,
    shuffleArray,
    getMimeType,
    translateToEnglish
  } from "../utils.js";

  let playerName = "";
  let showNameInput = true;
  let localHighscore = 0;
  let round = 1;
  let score = 0;
  let gameOver = false;
  let loading = false;
  let currentQuestion = null;

  let isPlaying = false;
  let audioElement = null;

  // Timer-Variablen
  let timeLeft = 15;
  let timer;

  // Joker, Fun Fact etc. wie in deinem klassischen Quiz
  let usedFiftyFifty = false;
  let usedSkip = false;
  let usedHint = false;
  let hintMessage = "";
  let showFunFact = false;
  let currentFunFact = "";
  let streak = 0;
  let showStreakBonus = false;
  let showCorrectAnimation = false;
  let showWrongAnimation = false;
  let showPowerUpAnimation = false;

  const funFactsMap = {
    katze: "Katzen können bis zu 100 verschiedene Lautvariationen erzeugen.",
    hund: "Hunde haben etwa 40-mal mehr Geruchsrezeptoren als Menschen!",
    kuh: "Kühe haben beste Freundinnen und fühlen sich ruhiger, wenn sie zusammenstehen.",
    elefant: "Elefanten zeigen Trauer, Mitgefühl und Altruismus.",
    löwe: "Löwen schlafen bis zu 20 Stunden am Tag!"
  };

  function startGame() {
    if (!playerName.trim()) return;
    showNameInput = false;
    localHighscore = parseInt(localStorage.getItem(`highscore_${playerName}`) || "0");
    round = 1;
    score = 0;
    streak = 0;
    gameOver = false;
    usedFiftyFifty = false;
    usedSkip = false;
    usedHint = false;
    hintMessage = "";
    showFunFact = false;
    currentFunFact = "";
    timeLeft = 15;
    startTimer();
    loadNewQuestion();
  }

  function updateHighscore() {
    if (score > localHighscore) {
      localHighscore = score;
      localStorage.setItem(`highscore_${playerName}`, localHighscore.toString());
    }
  }

  onMount(() => {
    audioElement = document.createElement("audio");
    audioElement.crossOrigin = "anonymous";
  });

  async function loadNewQuestion() {
    try {
      loading = true;
      showFunFact = false;
      hintMessage = "";
      stopAudio();
      clearInterval(timer); // alten Timer stoppen

      const correctAnimal = animals[Math.floor(Math.random() * animals.length)];
      const correctName = correctAnimal.name.toLowerCase();
      const possibleFunFact = funFactsMap[correctName] ? funFactsMap[correctName] : "";

      let wrongOptions = animals.filter(a => a.name !== correctAnimal.name);
      wrongOptions = shuffleArray(wrongOptions).slice(0, 3);
      const options = shuffleArray([correctAnimal, ...wrongOptions]);
      const loadedOptions = await fetchImageOptions(options);

      currentQuestion = {
        correctSpecies: correctAnimal.name,
        soundUrl: correctAnimal.soundUrl,
        speciesImages: loadedOptions,
        funFact: possibleFunFact
      };

      timeLeft = 15;
      startTimer();
    } catch (error) {
      console.error(error);
      currentQuestion = null;
    } finally {
      loading = false;
      await tick();
    }
  }

  async function fetchImageOptions(opts) {
    const results = [];
    for (const o of opts) {
      let img = o.imageUrl;
      if (!img) {
        img = await fetchUnsplashImage(o.name);
        const found = animals.find(a => a.name === o.name);
        if (found) found.imageUrl = img;
      }
      results.push({ name: o.name, soundUrl: o.soundUrl, imageUrl: img || "" });
    }
    return results;
  }

  async function togglePlay() {
    if (!currentQuestion || !audioElement) return;
    if (!isPlaying) {
      try {
        audioElement.src = currentQuestion.soundUrl;
        audioElement.crossOrigin = "anonymous";
        await audioElement.play();
        isPlaying = true;
      } catch (e) {
        console.error("Audio konnte nicht abgespielt werden", e);
      }
    } else {
      audioElement.pause();
      audioElement.currentTime = 0;
      isPlaying = false;
    }
  }

  function stopAudio() {
    if (audioElement) {
      audioElement.pause();
      audioElement.currentTime = 0;
    }
    isPlaying = false;
  }

  // Timer-Funktion: Startet einen Countdown
  function startTimer() {
    clearInterval(timer);
    timer = setInterval(() => {
      timeLeft--;
      if (timeLeft <= 0) {
        clearInterval(timer);
        handleTimeOut();
      }
    }, 1000);
  }

  // Wird aufgerufen, wenn die Zeit abläuft
  function handleTimeOut() {
    // Behandle es als falsche Antwort:
    showWrongAnimation = true;
    setTimeout(() => {
      showWrongAnimation = false;
      gameOver = true;
      stopAudio();
      updateHighscore();
      streak = 0;
    }, 800);
  }

  async function handleAnswer(name) {
    if (!currentQuestion) return;
    clearInterval(timer); // Timer stoppen, wenn eine Antwort erfolgt
    if (name === currentQuestion.correctSpecies) {
      showCorrectAnimation = true;
      setTimeout(() => {
        showCorrectAnimation = false;
      }, 800);
      score++;
      streak++;
      if (streak % 3 === 0) {
        score += 1;
        showStreakBonus = true;
        setTimeout(() => {
          showStreakBonus = false;
        }, 1500);
      }
      if (currentQuestion.funFact) {
        currentFunFact = currentQuestion.funFact;
        showFunFact = true;
      }
      round++;
      setTimeout(loadNewQuestion, 1500);
    } else {
      showWrongAnimation = true;
      setTimeout(() => {
        showWrongAnimation = false;
        gameOver = true;
        stopAudio();
        updateHighscore();
        streak = 0;
      }, 800);
    }
  }

  function restartGame() {
    round = 1;
    score = 0;
    streak = 0;
    gameOver = false;
    currentQuestion = null;
    stopAudio();
    usedFiftyFifty = false;
    usedSkip = false;
    usedHint = false;
    hintMessage = "";
    showFunFact = false;
    currentFunFact = "";
    clearInterval(timer);
    loadNewQuestion();
  }

  // Joker-Funktionen bleiben unverändert
  function useFiftyFifty() {
    if (!currentQuestion || usedFiftyFifty) return;
    usedFiftyFifty = true;
    const { correctSpecies, speciesImages } = currentQuestion;
    const correctOption = speciesImages.find(o => o.name === correctSpecies);
    const wrongs = speciesImages.filter(o => o.name !== correctSpecies);
    if (wrongs.length && correctOption) {
      const oneWrong = wrongs[Math.floor(Math.random() * wrongs.length)];
      currentQuestion.speciesImages = shuffleArray([correctOption, oneWrong]);
    }
  }

  function useSkip() {
    if (usedSkip) return;
    usedSkip = true;
    round++;
    stopAudio();
    streak = 0;
    clearInterval(timer);
    setTimeout(loadNewQuestion, 500);
  }

  function useHint() {
    if (!currentQuestion || usedHint) return;
    usedHint = true;
    const c = currentQuestion.correctSpecies;
    hintMessage = `Hinweis: ${c.length} Buchstaben, beginnt mit "${c[0]}" und endet mit "${c[c.length - 1]}".`;
  }
</script>

<div class="container">
  {#if showNameInput}
    <h2>Wie heißt du?</h2>
    <div class="name-input">
      <input
        type="text"
        bind:value={playerName}
        placeholder="Dein Name"
        on:keydown={(e) => e.key === "Enter" && startGame()}
      />
      <button on:click={startGame}>Start</button>
    </div>
  {:else if gameOver}
    <div class="game-over-screen">
      <h2>Falsche Antwort!</h2>
      <p>Dein Score: {score}</p>
      <p>Dein Highscore: {localHighscore}</p>
      <button on:click={restartGame}>Nochmal spielen</button>
    </div>
  {:else if loading}
    <div class="container">
      <h2>Lädt Daten ...</h2>
    </div>
  {:else if currentQuestion}
    <h2>Runde {round}</h2>
    <p>Score: {score} | Highscore: {localHighscore} | Streak: {streak} | Zeit: {timeLeft}s</p>

    <div class="joker-buttons">
      <button on:click={useFiftyFifty} disabled={usedFiftyFifty}>🔪 50:50</button>
      <button on:click={useSkip} disabled={usedSkip}>⏭ Skip</button>
      <button on:click={useHint} disabled={usedHint}>💡 Hint</button>
    </div>

    {#if hintMessage}
      <div class="hint-message" transition:fly={{ y: 20 }}>
        {hintMessage}
      </div>
    {/if}

    <div class="audio-container" transition:fade>
      <button class="play-button" on:click={togglePlay} transition:scale>
        {#if isPlaying} ⏸ {:else} ▶ {/if}
      </button>
    </div>

    <div class="options-grid" transition:fade>
      {#each currentQuestion.speciesImages as opt}
        <button class="option-card" on:click={() => handleAnswer(opt.name)}>
          <img class="option-image" src={opt.imageUrl} alt={opt.name} />
          <div class="option-overlay">
            <div class="option-title">{opt.name}</div>
          </div>
        </button>
      {/each}
    </div>

    {#if showFunFact && currentFunFact}
      <div class="fun-fact-popup" transition:scale>
        <strong>Fun Fact:</strong> {currentFunFact}
      </div>
    {/if}
  {:else}
    <h2>Keine Frage geladen.</h2>
  {/if}
</div>

{#if showPowerUpAnimation}
  <div class="powerup-animation">
    🔥 Power-Ups erneuert!
  </div>
{/if}
{#if showStreakBonus}
  <div class="streak-bonus">
    +1 Streak-Bonus!
  </div>
{/if}
{#if showCorrectAnimation}
  <div class="correct-animation">✔</div>
{/if}
{#if showWrongAnimation}
  <div class="wrong-animation">✖</div>
{/if}

<style>
  .container {
    margin: 2rem auto;
    max-width: 800px;
    padding: 2rem;
    background: #fff;
    border-radius: 14px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  }
  .name-input {
    text-align: center;
    margin: 1rem 0;
  }
  .name-input input {
    padding: 0.7rem;
    border: 2px solid #ddd;
    border-radius: 8px;
    width: 250px;
    font-size: 1rem;
  }
  .name-input button {
    margin-left: 1rem;
    padding: 0.7rem 1.2rem;
    background: #8ecae6;
    color: #fff;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    transition: background 0.2s, transform 0.2s;
  }
  .name-input button:hover {
    background: #219ebc;
    transform: scale(1.05);
  }
  .joker-buttons {
    display: flex;
    gap: 1rem;
    justify-content: center;
    margin: 1.5rem 0;
  }
  .joker-buttons button {
    padding: 0.7rem 1rem;
    border: none;
    background: #8ecae6;
    color: #fff;
    font-weight: bold;
    cursor: pointer;
    border-radius: 8px;
    transition: background 0.2s, transform 0.2s;
  }
  .joker-buttons button:hover:enabled {
    background: #219ebc;
    transform: scale(1.05);
  }
  .joker-buttons button:disabled {
    background: #ccc;
    cursor: not-allowed;
    transform: none;
  }
  .audio-container {
    text-align: center;
    margin: 1rem 0;
  }
  .play-button {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    border: none;
    background: #219ebc;
    font-size: 2rem;
    color: #fff;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    transition: background 0.3s, transform 0.3s;
    box-shadow: 0 2px 6px rgba(0,0,0,0.3);
  }
  .play-button:hover {
    background: #023047;
    transform: scale(1.1);
  }
  .hint-message {
    margin-top: 1rem;
    color: #d62828;
    font-style: italic;
    text-align: center;
  }
  .game-over-screen {
    text-align: center;
  }
  .game-over-screen button {
    margin-top: 1rem;
    padding: 0.7rem 1.2rem;
    background: #fb8500;
    border: none;
    color: #fff;
    border-radius: 8px;
    transition: background 0.3s, transform 0.3s;
    cursor: pointer;
  }
  .game-over-screen button:hover {
    background: #f3722c;
    transform: scale(1.05);
  }
  .options-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(200px, 1fr));
    gap: 1.5rem;
    margin: 2rem auto;
    max-width: 800px;
    justify-items: center;
  }
  .option-card {
    background: none;
    border: none;
    padding: 0;
    text-align: inherit;
    cursor: pointer;
    border-radius: 14px;
    display: block;
    box-shadow: 0 2px 8px rgba(0,0,0,0.2);
    transition: transform 0.3s;
    overflow: hidden;
    position: relative;
    max-width: 300px;
  }
  .option-card:hover {
    transform: scale(1.03);
  }
  .option-image {
    width: 100%;
    height: 200px;
    object-fit: cover;
    display: block;
  }
  .option-overlay {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    background: linear-gradient(0deg, rgba(0,0,0,0.5), transparent);
    color: #fff;
    padding: 0.7rem;
    text-align: center;
    transform: translateY(100%);
    transition: transform 0.3s;
  }
  .option-card:hover .option-overlay {
    transform: translateY(0);
  }
  .option-title {
    font-weight: 700;
    font-size: 1.1rem;
  }
  .fun-fact-popup {
    margin-top: 1rem;
    background: #f0f0f0;
    padding: 1rem;
    border-radius: 8px;
    text-align: center;
  }
  .powerup-animation {
    position: fixed;
    top: 100px;
    right: 20px;
    background: #ffb703;
    color: #fff;
    padding: 1rem;
    border-radius: 10px;
    box-shadow: 0 2px 6px rgba(0,0,0,0.3);
    animation: popIn 0.5s forwards;
    z-index: 9999;
    font-size: 1rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  @keyframes popIn {
    from { opacity: 0; transform: scale(0.8) translateY(-20px); }
    to { opacity: 1; transform: scale(1) translateY(0); }
  }
  .streak-bonus {
    position: fixed;
    bottom: 80px;
    left: 50%;
    transform: translateX(-50%);
    background: #06d6a0;
    color: #fff;
    padding: 1rem 1.5rem;
    border-radius: 8px;
    box-shadow: 0 2px 6px rgba(0,0,0,0.3);
    animation: fadeOutUp 1.5s forwards;
    font-weight: bold;
    z-index: 99999;
  }
  @keyframes fadeOutUp {
    0% { opacity: 1; transform: translate(-50%, 0); }
    80% { opacity: 1; }
    100% { opacity: 0; transform: translate(-50%, -30px); }
  }
  .correct-animation,
  .wrong-animation {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-size: 4rem;
    z-index: 99999;
    opacity: 0.9;
    animation: scalePop 0.8s forwards;
  }
  .correct-animation { color: #06d6a0; }
  .wrong-animation { color: #ef476f; }
  @keyframes scalePop {
    0% { transform: translate(-50%, -50%) scale(0.6); opacity: 0; }
    50% { opacity: 1; transform: translate(-50%, -50%) scale(1.1); }
    100% { transform: translate(-50%, -50%) scale(1); opacity: 0; }
  }
</style>