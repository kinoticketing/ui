<script lang="ts">
	export let data: { movie: any }; // Der Film wird vom Server geladen
</script>

<main>
	<h1 class="text-3xl font-bold mb-4">{data.movie.Title}</h1>
	<div class="flex flex-col lg:flex-row gap-4">
		<img
			src={data.movie.Poster !== 'N/A' ? data.movie.Poster : '/fallback-image.jpg'}
			alt={data.movie.Title}
			class="w-full lg:w-1/3 h-auto rounded-md shadow-md"
		/>
		<div class="flex-1">
			<p><strong>Year:</strong> {data.movie.Year}</p>
			<p><strong>Genre:</strong> {data.movie.Genre}</p>
			<p><strong>Director:</strong> {data.movie.Director}</p>
			<p><strong>Actors:</strong> {data.movie.Actors}</p>
			<p><strong>Plot:</strong> {data.movie.Plot}</p>
			<p><strong>IMDb Rating:</strong> {data.movie.imdbRating}</p>
			<p><strong>Runtime:</strong> {data.movie.Runtime}</p>
			<p><strong>Language:</strong> {data.movie.Language}</p>
			<p><strong>Country:</strong> {data.movie.Country}</p>
			<p><strong>Awards:</strong> {data.movie.Awards}</p>
			<a
				href={`https://www.imdb.com/title/${data.movie.imdbID}/`}
				target="_blank"
				rel="noopener noreferrer"
			>
				Schau den Trailer auf IMDb
			</a>
		</div>
	</div>
</main>

<style>
	main {
		padding: 2rem;
	}
</style>
