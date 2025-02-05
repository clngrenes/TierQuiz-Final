<script>
  let showMenu = false;

  function toggleMenu() {
    showMenu = !showMenu;
  }
</script>

<nav class="navbar">
  <div class="nav-brand">
    <a href="#/">Tier-Quiz – Enes Cilingir</a>
  </div>
  <button class="nav-toggle" on:click={toggleMenu} aria-label="Menü umschalten" type="button">
    <span class="bar"></span>
    <span class="bar"></span>
    <span class="bar"></span>
  </button>
  <ul class="nav-links {showMenu ? 'active' : ''}">
    <li><a href="#/">Home</a></li>
    <li><a href="#/quiz">Quiz</a></li>
    <li><a href="#/database">Datenbank</a></li>
    <li><a href="#/highscores">Highscores</a></li>
  </ul>
</nav>

<style>
  .navbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: #023047;
    padding: 1rem 2rem;
    color: #fff;
    position: sticky;
    top: 0;
    z-index: 100;
    box-shadow: 0 2px 8px rgba(0,0,0,0.15);
  }
  .nav-brand a {
    font-size: 1.8rem;
    font-weight: bold;
    color: #ffb703;
    text-decoration: none;
    transition: color 0.3s;
  }
  .nav-brand a:hover {
    color: #fb8500;
  }
  .nav-links {
    list-style: none;
    display: flex;
    gap: 1.5rem;
    transition: transform 0.3s ease, opacity 0.3s ease;
  }
  .nav-links li a {
    color: #fff;
    text-decoration: none;
    font-size: 1.1rem;
    font-weight: 500;
    transition: color 0.3s;
  }
  .nav-links li a:hover {
    color: #ffb703;
  }
  .nav-toggle {
    display: none;
    flex-direction: column;
    cursor: pointer;
    gap: 4px;
  }
  .nav-toggle .bar {
    height: 3px;
    width: 25px;
    background-color: #fff;
    border-radius: 2px;
    transition: all 0.3s;
  }
  @media (max-width: 768px) {
    .nav-toggle {
      display: flex;
    }
    .nav-links {
      position: absolute;
      top: 100%;
      right: 0;
      background: #023047;
      flex-direction: column;
      width: 200px;
      padding: 1rem;
      gap: 1rem;
      transform: translateY(-150%);
      opacity: 0;
      pointer-events: none;
    }
    .nav-links.active {
      transform: translateY(0);
      opacity: 1;
      pointer-events: auto;
    }
  }
</style>