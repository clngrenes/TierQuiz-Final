<script>
    import { onMount } from "svelte";
  
    let highscoreData = [];
  
    onMount(() => {
      loadHighscores();
    });
  
    function loadHighscores() {
      highscoreData = [];
      // Scanne localStorage nach Keys => "highscore_classic_" oder "highscore_timed_"
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith("highscore_")) {
          const score = parseInt(localStorage.getItem(key), 10);
          highscoreData.push({
            mode: key.includes("timed") ? "Zeitmodus" : "Klassik",
            player: key.replace("highscore_classic_", "").replace("highscore_timed_", ""),
            score
          });
        }
      }
      highscoreData.sort((a, b) => b.score - a.score); // Absteigend sortieren
    }
  </script>
  
  <div class="container">
    <h2>Highscores</h2>
    {#if highscoreData.length === 0}
      <p>Noch keine Einträge</p>
    {:else}
      <table>
        <thead>
          <tr>
            <th>Modus</th>
            <th>Spieler</th>
            <th>Punkte</th>
          </tr>
        </thead>
        <tbody>
          {#each highscoreData as entry}
            <tr>
              <td>{entry.mode}</td>
              <td>{entry.player}</td>
              <td>{entry.score}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    {/if}
  </div>
  
  <style>
    .container {
      margin: 2rem auto;
      max-width: 800px;
      padding: 2rem;
      background: #fff;
      border-radius: 10px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
    }
    th, td {
      padding: 0.6rem 1rem;
      border: 1px solid #ccc;
    }
  </style>