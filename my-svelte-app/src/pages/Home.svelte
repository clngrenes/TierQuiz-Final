<script>
  import { onMount } from "svelte";
  import { fade, slide, fly } from "svelte/transition";
  import { animals } from "../data.js";
  import { fetchUnsplashImage } from "../utils.js";

  // Lokale reaktive Kopie des animals-Arrays für die Galerie
  let galleryAnimals = [];

  // 1) Initialisiert Galerie-Bilder für alle Tiere und aktualisiert galleryAnimals
  async function initGalleryImages() {
    await Promise.all(
      animals.map(async (a) => {
        if (!a.imageUrl || a.imageUrl.trim() === "") {
          const fetchedImage = await fetchUnsplashImage(a.name);
          console.log(`Fetched image for ${a.name}: ${fetchedImage}`);
          a.imageUrl = fetchedImage;
        }
      })
    );
    // Erstelle eine Kopie, damit Svelte reaktiv reagiert:
    galleryAnimals = [...animals];
  }

  // 2) Floating Animals im Hintergrund (nur für Home)
  const BACKGROUND_ANIMAL_COUNT = 12;
  let backgroundAnimals = [];

  async function createRandomBackgroundAnimal() {
    // Wähle ein zufälliges Tier aus dem (nun aktualisierten) animals-Array
    const randomAnimal = animals[Math.floor(Math.random() * animals.length)];
    return {
      name: randomAnimal.name,
      imageUrl: randomAnimal.imageUrl, // sollte nun gesetzt sein
      x: Math.random() * 100,
      y: Math.random() * 100,
      speedX: (Math.random() - 0.5) * 0.02,
      speedY: (Math.random() - 0.5) * 0.02
    };
  }

  async function initBackgroundAnimals() {
    backgroundAnimals = await Promise.all(
      Array.from({ length: BACKGROUND_ANIMAL_COUNT }).map(() => createRandomBackgroundAnimal())
    );
  }

  function animateBackgroundAnimals() {
    for (const b of backgroundAnimals) {
      b.x += b.speedX;
      b.y += b.speedY;
      // Wrap-around: Wenn außerhalb des Bereichs, wieder von der anderen Seite erscheinen
      if (b.x < -5) b.x = 105;
      if (b.x > 105) b.x = -5;
      if (b.y < -5) b.y = 105;
      if (b.y > 105) b.y = -5;
    }
  }

  // 3) Featured Animal Carousel
  let featuredIndex = 0;
  let featuredAnimal = null; // zunächst null

  function nextFeatured() {
    featuredIndex = (featuredIndex + 1) % animals.length;
    featuredAnimal = animals[featuredIndex];
  }
  function prevFeatured() {
    featuredIndex = (featuredIndex - 1 + animals.length) % animals.length;
    featuredAnimal = animals[featuredIndex];
  }

  // 4) onMount: Initialisierung & Animationen
  let carouselInterval, animInterval;
  onMount(async () => {
    // Zuerst: Alle Galerie-Bilder laden
    await initGalleryImages();
    // Setze featuredAnimal jetzt, nachdem alle Tiere (und ihre Bilder) geladen sind.
    featuredAnimal = animals[featuredIndex];
    // Danach: Initialisiere die Floating Animals
    await initBackgroundAnimals();

    // Starte das Featured Carousel (alle 5 Sekunden wechseln)
    carouselInterval = setInterval(nextFeatured, 5000);
    // Aktualisiere die Floating Animals alle 60ms
    animInterval = setInterval(animateBackgroundAnimals, 60);

    return () => {
      clearInterval(carouselInterval);
      clearInterval(animInterval);
    };
  });
</script>

<!-- Hintergrund-Layer: Dieser Bereich zeigt das Hintergrundbild plus die Floating Animals -->
<div class="background-layer">
  {#each backgroundAnimals as b}
    <img alt={b.name} src={b.imageUrl} class="floating-animal" style="top: {b.y}%; left: {b.x}%;" />
  {/each}
</div>

<!-- Hero-Bereich -->
<section class="hero-section">
  <div class="hero-content">
    <h1 in:fade={{ duration: 800 }}>Erlebe die Magie der Tierwelt</h1>
    <p in:fade={{ delay: 300, duration: 700 }}>
      Tauche ein in eine Welt voller faszinierender Kreaturen, atemberaubender Natur und unvergesslicher Abenteuer.
    </p>
    <div class="hero-buttons" in:fade={{ delay: 600, duration: 700 }}>
      <a href="#/quiz"><button class="cta-button">Quiz starten</button></a>
      <a href="#/database"><button class="cta-button">Datenbank erkunden</button></a>
    </div>
  </div>
</section>

<!-- Featured Animal Carousel -->
<section class="featured-carousel">
  <h2>Tier des Tages</h2>
  <div class="carousel-container">
    <button class="carousel-nav" on:click={prevFeatured}>❮</button>
    <div class="carousel-item" in:slide={{ duration: 600 }}>
      <img
        src={featuredAnimal ? featuredAnimal.imageUrl : "https://via.placeholder.com/800x400?text=Loading..."}
        alt={featuredAnimal ? featuredAnimal.name : "Loading..."}
      />
      <div class="carousel-info">
        <h3>{featuredAnimal ? featuredAnimal.name : ""}</h3>
      </div>
    </div>
    <button class="carousel-nav" on:click={nextFeatured}>❯</button>
  </div>
</section>

<!-- Galerie der Wunder -->
<section class="gallery-section">
  <h2>Galerie der Wunder</h2>
  <div class="gallery-grid">
    {#each galleryAnimals.slice(0, 6) as animal (animal.name)}
      <div class="gallery-card" in:fly={{ x: -50, duration: 500 }}>
        <img src={animal.imageUrl || "https://via.placeholder.com/300?text=Loading..."} alt={animal.name} />
        <div class="card-overlay">
          <h3>{animal.name}</h3>
        </div>
      </div>
    {/each}
  </div>
</section>

<!-- Interaktive Fakten-Sektion -->
<section class="interactive-section">
  <h2>Wusstest du schon?</h2>
  <div class="facts-container">
    <div class="fact-card" in:fade={{ duration: 800 }}>
      <h3>Chamäleons</h3>
      <p>Chamäleons können ihre Farbe ändern, um sich ihrer Umgebung anzupassen.</p>
    </div>
    <div class="fact-card" in:fade={{ duration: 800, delay: 200 }}>
      <h3>Kolibris</h3>
      <p>Kolibris sind die einzigen Vögel, die rückwärts fliegen können.</p>
    </div>
    <div class="fact-card" in:fade={{ duration: 800, delay: 400 }}>
      <h3>Elefanten</h3>
      <p>Elefanten besitzen ein beeindruckendes Gedächtnis und komplexe soziale Strukturen.</p>
    </div>
  </div>
</section>

<!-- Call to Action / Newsletter Signup -->
<section class="cta-section">
  <h2>Bleib auf dem Laufenden!</h2>
  <p>
    Melde dich an, um regelmäßig spannende Fakten, Tipps und Neuigkeiten aus der Tierwelt zu erhalten.
  </p>
  <form class="signup-form" on:submit|preventDefault={() => alert("Danke für deine Anmeldung!")}>
    <input type="email" placeholder="Deine E-Mail-Adresse" required />
    <button type="submit" class="signup-button">Anmelden</button>
  </form>
</section>

<!-- Footer -->
<footer class="main-footer">
  <p>© 2025 Tier-Quiz. Alle Rechte vorbehalten. Erlebe die Natur – Tag für Tag.</p>
</footer>

<style>
  /* RESET */
  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  /* Hintergrund-Layer */
  .background-layer {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: -1;
    overflow: hidden;
    background: url('/images/nature-bg.jpg') center/cover no-repeat,
                linear-gradient(180deg, rgba(255,255,255,0.4) 0%, rgba(170,170,170,0.8) 80%);
  }

  .floating-animal {
    position: absolute;
    width: 60px;
    height: 60px;
    object-fit: cover;
    opacity: 0.5;
    border-radius: 50%;
    transition: transform 0.2s, opacity 0.2s;
    filter: blur(0.3px);
  }
  .floating-animal:hover {
    transform: scale(1.1);
    opacity: 0.8;
    filter: none;
  }

  /* HERO-Bereich */
  .hero-section {
    height: 100vh;
    display: flex;
    justify-content: center;
    align-items: center;
    text-align: center;
    color: #fff;
    padding: 2rem 1rem;
  }
  .hero-content {
    max-width: 700px;
    background: rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(4px);
    padding: 2rem;
    border-radius: 10px;
    box-shadow: 0 4px 10px rgba(0,0,0,0.25);
  }
  .hero-content h1 {
    font-size: 3rem;
    margin-bottom: 1rem;
    text-shadow: 2px 2px 8px rgba(0,0,0,0.7);
  }
  .hero-content p {
    font-size: 1.3rem;
    margin-bottom: 2rem;
    max-width: 600px;
  }
  .hero-buttons {
    display: flex;
    gap: 1rem;
    justify-content: center;
  }
  .cta-button {
    background: #ffb703;
    color: #fff;
    border: none;
    padding: 0.8rem 1.5rem;
    font-size: 1.2rem;
    border-radius: 8px;
    cursor: pointer;
    transition: background 0.3s, transform 0.3s;
  }
  .cta-button:hover {
    background: #fb8500;
    transform: scale(1.05);
  }

  /* Featured Carousel */
  .featured-carousel {
    padding: 3rem 1rem;
    background: #f7f7f7;
    text-align: center;
  }
  .featured-carousel h2 {
    font-size: 2.5rem;
    margin-bottom: 1.5rem;
    color: #023047;
  }
  .carousel-container {
    position: relative;
    max-width: 800px;
    margin: 0 auto;
    overflow: hidden;
    border-radius: 10px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  }
  .carousel-item {
    position: relative;
  }
  .carousel-item img {
    width: 100%;
    display: block;
    border-radius: 10px;
  }
  .carousel-info {
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    background: rgba(0, 0, 0, 0.6);
    color: #fff;
    padding: 1rem;
    text-align: left;
    border-bottom-left-radius: 10px;
    border-bottom-right-radius: 10px;
  }
  .carousel-nav {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    background: rgba(0, 0, 0, 0.4);
    border: none;
    color: #fff;
    font-size: 2rem;
    padding: 0.5rem 1rem;
    cursor: pointer;
    z-index: 2;
    transition: background 0.3s;
  }
  .carousel-nav:hover {
    background: rgba(0, 0, 0, 0.7);
  }
  .carousel-nav:first-of-type {
    left: 10px;
  }
  .carousel-nav:last-of-type {
    right: 10px;
  }

  /* Galerie */
  .gallery-section {
    padding: 3rem 1rem;
    background: #fff;
    text-align: center;
  }
  .gallery-section h2 {
    font-size: 2.5rem;
    margin-bottom: 1.5rem;
    color: #023047;
  }
  .gallery-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 1.5rem;
    max-width: 1200px;
    margin: 0 auto;
  }
  .gallery-card {
    position: relative;
    overflow: hidden;
    border-radius: 10px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.2);
    cursor: pointer;
    transition: transform 0.3s;
  }
  .gallery-card:hover {
    transform: scale(1.03);
  }
  .gallery-card img {
    width: 100%;
    height: 200px;
    object-fit: cover;
    display: block;
  }
  .card-overlay {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    background: linear-gradient(0deg, rgba(0, 0, 0, 0.7), transparent);
    color: #fff;
    padding: 1rem;
    opacity: 0;
    transition: opacity 0.3s;
  }
  .gallery-card:hover .card-overlay {
    opacity: 1;
  }

  /* Interaktive Fakten-Sektion */
  .interactive-section {
    padding: 3rem 1rem;
    background: #f7f7f7;
    text-align: center;
  }
  .interactive-section h2 {
    font-size: 2.5rem;
    margin-bottom: 1.5rem;
    color: #023047;
  }
  .facts-container {
    display: flex;
    flex-wrap: wrap;
    gap: 1.5rem;
    justify-content: center;
    max-width: 1200px;
    margin: 0 auto;
  }
  .fact-card {
    background: #fff;
    border-radius: 10px;
    padding: 1.5rem;
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    flex: 1 1 250px;
    transition: transform 0.3s;
  }
  .fact-card:hover {
    transform: scale(1.05);
  }
  .fact-card h3 {
    margin-bottom: 0.5rem;
    color: #fb8500;
  }

  /* CTA-Sektion */
  .cta-section {
    padding: 3rem 1rem;
    background: #ffb703;
    color: #fff;
    text-align: center;
  }
  .cta-section h2 {
    font-size: 2.5rem;
    margin-bottom: 1rem;
  }
  .signup-form {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    margin-top: 1rem;
  }
  .signup-form input {
    padding: 0.8rem;
    border: none;
    border-radius: 8px;
    width: 300px;
    font-size: 1rem;
  }
  .signup-button {
    background: #023047;
    color: #fff;
    border: none;
    padding: 0.8rem 2rem;
    border-radius: 8px;
    font-size: 1rem;
    cursor: pointer;
    transition: background 0.3s;
  }
  .signup-button:hover {
    background: #fb8500;
  }

  /* Footer */
  .main-footer {
    padding: 2rem 1rem;
    background: #023047;
    color: #fff;
    text-align: center;
  }
  .main-footer p {
    font-size: 1rem;
  }
</style>