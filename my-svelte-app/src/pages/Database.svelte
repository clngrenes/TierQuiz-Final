<!-- src/pages/Database.svelte -->
<script>
  import { onMount } from "svelte";
  import { fade, scale } from "svelte/transition";
  import { animals } from "../data.js";
  import {
    getMimeType,
    fetchUnsplashImage,
    fetchAnimalFunFact
  } from "../utils.js";

  let searchQuery = "";
  let filteredAnimals = [...animals];
  let displayCount = 3;

  // Bilder beim Seitenaufruf laden
  async function loadDatabaseImages() {
    await Promise.all(
      animals.map(async (a) => {
        if (!a.imageUrl) {
          a.imageUrl = await fetchUnsplashImage(a.name);
        }
        a.isPlaying = false;
        // Wir laden Fun Facts erst bei Klick (toggleFunFact),
        // damit die Seite schneller lädt.
        a.showFunFact = false;
        // a.funFact wird erst bei Klick geladen.
      })
    );
    filterAnimals();
  }

  function filterAnimals() {
    if (!searchQuery.trim()) {
      filteredAnimals = [...animals];
      displayCount = 3;
      return;
    }
    const q = searchQuery.trim().toLowerCase();
    filteredAnimals = animals.filter((a) =>
      a.name.toLowerCase().includes(q)
    );
    displayCount = Math.min(3, filteredAnimals.length);
  }

  async function refreshDatabase() {
    await loadDatabaseImages();
  }

  function handleDbPlay(index) {
    const aud = document.getElementById("db-audio-" + index);
    if (!aud || !filteredAnimals[index].soundUrl) return;

    if (filteredAnimals[index].isPlaying) {
      // bereits spielend -> stop
      aud.pause();
      aud.currentTime = 0;
      filteredAnimals[index].isPlaying = false;
    } else {
      // Stoppe alle anderen Audios
      filteredAnimals.forEach((item, idx) => {
        if (idx !== index && item.isPlaying) {
          const otherAud = document.getElementById("db-audio-" + idx);
          if (otherAud) {
            otherAud.pause();
            otherAud.currentTime = 0;
          }
          item.isPlaying = false;
        }
      });
      aud.play().catch((e) => console.error("Audio-Play error", e));
      filteredAnimals[index].isPlaying = true;
    }
    // Neu zuweisen, damit Svelte reaktiv reagiert
    filteredAnimals = [...filteredAnimals];
  }

  // Beim Klick togglen wir den Fun Fact
  async function toggleFunFact(an) {
    if (an.showFunFact) {
      an.showFunFact = false;
    } else {
      // Beim ersten Klick -> ggf. Wikipedia-Fun Fact laden
      if (!an.funFact) {
        an.funFact = await fetchAnimalFunFact(an.name);
      }
      an.showFunFact = true;
    }
    filteredAnimals = [...filteredAnimals];
  }

  function loadMore() {
    displayCount = Math.min(displayCount + 3, filteredAnimals.length);
  }

  onMount(() => {
    loadDatabaseImages();
  });
</script>

<div class="container">
  <h2>Tier-Datenbank</h2>
  <div class="db-search">
    <input
      type="text"
      bind:value={searchQuery}
      placeholder="Suchbegriff eingeben..."
      on:input={filterAnimals}
    />
    <button on:click={refreshDatabase}>Bilder laden</button>
  </div>

  <div class="db-cards" transition:fade>
    {#each filteredAnimals.slice(0, displayCount) as an, i (an.name)}
      <!-- A11y-Fix: role="button", tabindex="0", und Tastatur-Events -->
      <div
        class="db-card"
        role="button"
        tabindex="0"
        transition:scale
        on:click={() => toggleFunFact(an)}
        on:keydown={(e) => {
          if (e.key === "Enter" || e.key === " ") toggleFunFact(an);
        }}
      >
        <img
          alt={an.name}
          src={an.imageUrl || "https://via.placeholder.com/300?text=loading..."}
        />
        <h4>{an.name}</h4>

        <!-- Audio-Element -->
        <div class="db-audio">
          <audio id={"db-audio-" + i} crossOrigin="anonymous">
            <source src={an.soundUrl} type={getMimeType(an.soundUrl)} />
          </audio>
          <!-- Verhindere Karten-Toggle beim Klick auf den Play-Button mittels stopPropagation -->
          <button on:click|stopPropagation={() => handleDbPlay(i)}>
            {#if an.isPlaying} ⏸ {:else} ▶ {/if}
          </button>
        </div>

        <!-- Fun Fact -->
        {#if an.showFunFact && an.funFact}
          <p class="fun-fact">{an.funFact}</p>
        {/if}
      </div>
    {/each}
  </div>

  {#if displayCount < filteredAnimals.length}
    <div class="load-more-container">
      <button class="load-more-button" on:click={loadMore}>Mehr laden</button>
    </div>
  {/if}
</div>

<style>
  .container {
    margin: 2rem auto;
    max-width: 1000px;
    padding: 2rem;
    background: #fff;
    border-radius: 14px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  }

  .db-search {
    display: flex;
    gap: 1rem;
    margin-bottom: 1rem;
  }

  .db-search input {
    flex: 1;
    padding: 0.6rem;
    border: 2px solid #ccc;
    border-radius: 8px;
    min-width: 120px;
  }

  .db-search button {
    background: #8ecae6;
    color: #fff;
    border: none;
    padding: 0.7rem 1.2rem;
    cursor: pointer;
    border-radius: 8px;
    transition: background 0.2s, transform 0.2s;
  }

  .db-search button:hover {
    background: #219ebc;
    transform: scale(1.05);
  }

  .db-cards {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1.5rem;
  }

  @media (max-width: 768px) {
    .db-cards {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  @media (max-width: 500px) {
    .db-cards {
      grid-template-columns: 1fr;
    }
  }

  .db-card {
    background: #fff;
    border-radius: 8px;
    padding: 1rem;
    text-align: center;
    box-shadow: 0 2px 6px rgba(0,0,0,0.1);
    transition: transform 0.2s;
    cursor: pointer;
    outline: none;  /* wir nutzen role="button" + tabindex="0" */
  }

  /* Beim Fokussieren das Element hervorheben (Accessiblity) */
  .db-card:focus {
    box-shadow: 0 0 0 3px #ffb703;
  }

  .db-card img {
    width: 100%;
    border-radius: 4px;
    object-fit: cover;
  }

  .db-card h4 {
    margin: 0.5rem 0;
    color: #333;
  }

  .db-audio {
    margin-top: 1rem;
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 0.5rem;
  }

  .db-audio button {
    background: #023047;
    border: none;
    border-radius: 50%;
    width: 42px;
    height: 42px;
    font-size: 1.2rem;
    color: #fff;
    cursor: pointer;
    transition: background 0.2s, transform 0.2s;
  }

  .db-audio button:hover {
    background: #ffb703;
    color: #333;
    transform: scale(1.1);
  }

  .fun-fact {
    margin-top: 0.5rem;
    font-size: 0.9rem;
    font-style: italic;
    color: #555;
  }

  .load-more-container {
    text-align: center;
    margin-top: 2rem;
  }

  .load-more-button {
    background: #8ecae6;
    color: #fff;
    border: none;
    padding: 0.8rem 1.5rem;
    border-radius: 8px;
    cursor: pointer;
    transition: background 0.3s, transform 0.3s;
  }

  .load-more-button:hover {
    background: #219ebc;
    transform: scale(1.05);
  }
</style>