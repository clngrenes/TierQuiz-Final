<script>
	import Navigation from "./components/Navigation.svelte";
	import Router from "svelte-spa-router";
	import Home from "./pages/Home.svelte";
	import Quiz from "./pages/Quiz.svelte";
	import Database from "./pages/Database.svelte";
	import Highscores from "./pages/Highscores.svelte";
  
	const routes = {
	  "/": Home,
	  "/quiz": Quiz,
	  "/database": Database,
	  "/highscores": Highscores
	};
  </script>
  
  <Navigation />
  <Router {routes} />
  
  <style>
	/* Globaler Style – falls gewünscht */
	:global(body) {
	  margin: 0;
	  font-family: sans-serif;
	  background: #f8f8f8;
	}
  </style>