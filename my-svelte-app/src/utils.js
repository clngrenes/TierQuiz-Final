// src/utils.js

export const translationMap = {
  schwein: "pig",
  klapperschlange: "rattlesnake",
  "europäischer falke": "falcon",
  elster: "magpie",
  hund: "dog",
  katze: "cat",
  pferd: "horse",
  kuh: "cow",
  alligator: "alligator",
  bär: "bear",
  buckelwal: "humpback whale",
  elch: "moose",
  elefant: "elephant",
  esel: "donkey",
  fledermaus: "bat",
  frosch: "frog",
  gans: "goose",
  gecko: "gecko",
  giraffe: "giraffe",
  "großer dachs": "badger",
  brachvogel: "curlew",
  hahn: "rooster",
  heuschrecke: "grasshopper",
  hummel: "bumblebee",
  hyäne: "hyena",
  jägerliste: "bird of prey",
  kranich: "crane bird",
  löwe: "lion",
  mantelbrüllaffe: "mantled howler monkey",
  papagei: "parrot",
  reh: "deer",
  schaf: "sheep",
  schlammrutschkuh: "mud cow",
  schwan: "swan",
  "schwarzer rabe": "black raven",
  stieglitz: "goldfinch",
  taube: "pigeon",
  tiger: "tiger",
  truthan: "turkey bird",
  uhu: "owl",
  weißkopfseeadler: "bald eagle",
  wolf: "wolf angry",
  ziege: "goat",
  zikadenchor: "cicada chorus"
};

export function translateToEnglish(name) {
  const lower = name.trim().toLowerCase();
  return translationMap[lower] || name;
}

export function shuffleArray(array) {
  let current = array.length;
  while (current) {
    const rand = Math.floor(Math.random() * current);
    current--;
    [array[current], array[rand]] = [array[rand], array[current]];
  }
  return array;
}

export function getMimeType(url) {
  const lower = url.toLowerCase();
  if (lower.endsWith(".ogg")) return "audio/ogg";
  if (lower.endsWith(".wav")) return "audio/wav";
  if (lower.endsWith(".mp3")) return "audio/mpeg";
  return "audio/mpeg";
}

const UNSPLASH_API_KEY = "uxuvkKzsiw7h7-5VhanfMDYdC_JAFhdPFEJYgyBv_kQ"; // Setze hier deinen gültigen Unsplash API-Key ein

export async function fetchUnsplashImage(query) {
  try {
    const searchTerm = translateToEnglish(query);
    const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(
      searchTerm
    )}&per_page=1&orientation=landscape&client_id=${UNSPLASH_API_KEY}`;
    console.log("Requesting Unsplash URL:", url);
    const resp = await fetch(url);
    const data = await resp.json();
    console.log("Received Unsplash data:", data);
    if (data && data.results && data.results.length > 0) {
      return data.results[0].urls.small;
    }
  } catch (error) {
    console.error("Fehler beim Abrufen des Bildes:", error);
  }
  return "https://via.placeholder.com/300?text=No+Image";
}

export async function fetchAnimalFunFact(name) {
  try {
    let wikiTitle = name;
    if (wikiTitle.toLowerCase() === "bär") {
      wikiTitle = "Bären";
    } else if (wikiTitle.toLowerCase() === "alligator") {
      wikiTitle = "Alligatoren";
    }
    const url = `https://de.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(wikiTitle)}`;
    const resp = await fetch(url);
    if (!resp.ok) {
      throw new Error(`Wikipedia API error: ${resp.status}`);
    }
    const data = await resp.json();
    if (data && data.extract) {
      if (
        data.extract.includes("steht für:") ||
        data.extract.includes("Gattung") ||
        data.extract.includes("Liste von")
      ) {
        return `Wusstest du, dass ${name} ein wirklich faszinierendes Tier ist?`;
      }
      const sentences = data.extract.split(". ");
      if (sentences && sentences.length > 0) {
        const randomIndex = Math.floor(Math.random() * sentences.length);
        let sentence = sentences[randomIndex].trim();
        if (!sentence.endsWith(".")) {
          sentence += ".";
        }
        return sentence;
      }
    }
  } catch (error) {
    console.error("Fehler beim Abrufen des Fun Facts von Wikipedia für", name, error);
  }
  return `Wusstest du, dass ${name} ein wirklich faszinierendes Tier ist?`;
}