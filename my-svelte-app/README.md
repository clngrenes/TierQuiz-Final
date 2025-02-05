# Tier-Quiz – Enes Cilingir

Willkommen beim Tier-Quiz – einem Projekt, das die Vielfalt und Faszination der Tierwelt in den Mittelpunkt stellt. Mit abwechslungsreichen Quizfragen, beeindruckenden Bildern und spannenden Fakten bietet das Projekt eine ideale Gelegenheit, sein Wissen zu testen und mehr über Tiere zu erfahren.

## Überblick

Das Quiz umfasst 41 Tiere aus verschiedenen Kategorien:  
* **Säugetiere:** Schwein, Hund, Elefant und mehr  
* **Vögel:** Papagei, Kranich usw.  
* **Reptilien:** Alligator, Gecko  
* **Insekten:** Heuschrecke, Biene  
* **Meerestiere:** Beispielsweise der Buckelwal  

Diese bunte Mischung sorgt für abwechslungsreiche Quizfragen und eine informative Tier-Datenbank.

Wichtige Bereiche der Anwendung:

* **Home (Landing Page):**
  * Moderner, animierter Hintergrund mit einem „Floating Animals“-Effekt, unterstützt von einem naturinspirierten Bild und dezentem Farbverlauf.
  * Ein Hero-Bereich mit Titel, einladender Beschreibung und Navigations-Buttons.
  * Ein Carousel mit ausgewählten Tieren sowie eine Galerie, in der Bilder über die Unsplash-API dynamisch geladen werden.
  
* **Quiz:**
  * Klassischer Modus, bei dem ein Tiergeräusch abgespielt wird und die Nutzer:innen das passende Tier auswählen müssen.
  * Unterstützung durch Joker (50:50, Skip, Hint) und eine Streak-Mechanik für zusätzliche Spannung.  
* **Datenbank:**
  * Übersicht aller Tiere mit Bildern, Audiodateien und interessanten Fakten, die über die Unsplash- und Wikipedia-APIs geladen werden.
  * Integrierte Suchfunktion und ein Klick-gestütztes Umschalten der Fun Facts.
  
* **Highscores:**
  * Anzeige lokaler Highscores, gespeichert im localStorage.

## Technische Umsetzung

* **Svelte-Komponenten:**
  * Alle Bereiche – Home, Quiz, Datenbank und Highscores – wurden in eigenen, modularen Svelte-Komponenten realisiert.
  * Eine zentrale `Navigation.svelte` sorgt für ein responsives und intuitives Menü.
  
* **Routing:**
  * Mithilfe von `svelte-spa-router` wird die Navigation zwischen den verschiedenen Seiten ermöglicht.
  
* **API-Integration:**
  * **Unsplash-API:** Dynamisches Laden von Tierbildern.
  * **Wikipedia-API:** Abruf kurzer, zufällig ausgewählter Fun Facts zu den Tieren (inklusive spezieller Anpassungen bei mehrdeutigen Begriffen wie "Bär" und "Alligator").
  
* **Responsive Design:**
  * Optimiert für verschiedene Bildschirmgrößen, inklusive eines Hamburger-Menüs für mobile Geräte.
  * Einsatz von CSS Grid und Flexbox für ein ansprechendes Layout.
  
* **Lokale Speicherung:**
  * Die Highscores werden im localStorage gesichert.

## Besondere Herausforderungen & Workarounds

* **API-Integration und Zeitmanagement:**
  * Bei der Anbindung der Wikipedia-API traten Schwierigkeiten beim Abruf und der korrekten Darstellung der Fun Facts auf.
  * Das Laden der Bilder über die Unsplash-API war sehr zeitintensiv, sodass die Audiodateien aus Zeitgründen lokal eingebunden wurden.
  
* **Datenbank-Performance:**
  * Da die Datenbank zeitweise nicht zuverlässig funktionierte, wurden die Daten so optimiert, dass jeweils Informationen zu drei Tieren gleichzeitig geladen werden. Dadurch wird verhindert, dass zu viele Daten auf einmal verarbeitet werden müssen.
  
* **Animation und UI-Design:**
  * Die Umsetzung des „Floating Animals“-Effekts in Kombination mit einem responsiven Hintergrundbild und halbtransparenten Overlays war eine spannende, aber auch anspruchsvolle Herausforderung.
  
* **Interaktivität:**
  * Neben klassischen Klick-Events wurden auch Tastatur-Events (z. B. `on:keydown`) integriert, um die Barrierefreiheit und Benutzerfreundlichkeit zu erhöhen.

## Fazit

Das Tier-Quiz vereint Spaß, Wissensvermittlung und visuelle Highlights zu einem besonderen Erlebnis. Trotz technischer Herausforderungen und notwendiger Workarounds – wie den Problemen mit der Wikipedia- und Unsplash-API sowie der optimierten Datenbankabfrage – ist das Projekt zu einem abwechslungsreichen und lehrreichen Tool geworden. Vielen Dank, dass Du Dir die Zeit genommen hast, einen Blick in dieses Projekt zu werfen. Viel Spaß beim Quizzen und Entdecken der faszinierenden Tierwelt!