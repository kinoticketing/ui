<script lang="ts">
	export let data: { movie: any; showtimes: { id: string; time: string; hall: string }[] };
</script>

<main>
	<div class="container">
		<!-- Header -->
		<h1 class="title">{data.movie.Title}</h1>

		<!-- Movie Details -->
		<div class="movie-details">
			<img
				src={data.movie.Poster !== 'N/A' ? data.movie.Poster : '/fallback-image.jpg'}
				alt={data.movie.Title}
				class="poster"
			/>
			<div class="info">
				<p><strong>Jahr:</strong> {data.movie.Year}</p>
				<p><strong>Genre:</strong> {data.movie.Genre}</p>
				<p><strong>Regisseur:</strong> {data.movie.Director}</p>
				<p><strong>Darsteller:</strong> {data.movie.Actors}</p>
				<p><strong>Handlung:</strong> {data.movie.Plot}</p>
				<p><strong>IMDb-Bewertung:</strong> ⭐ {data.movie.imdbRating}</p>
				<p>
					<strong>IMDb-Eintrag:</strong>
					<a
						href={`https://www.imdb.com/title/${data.movie.imdbID}/`}
						target="_blank"
						rel="noopener noreferrer"
					>
						Schau den Trailer auf IMDb
					</a>
				</p>
			</div>
		</div>

		<!-- Showtimes -->
		<section class="showtimes">
			<h2>Vorstellungen</h2>
			<ul>
				{#each data.showtimes as showtime}
					<li class="showtime-card">
						<a class="showtime-link" href={`/movies/${data.movie.id}/${showtime.id}`}>
							<strong>Zeit:</strong>
							{new Date(showtime.time).toLocaleString('de-DE', {
								weekday: 'short',
								year: 'numeric',
								month: 'short',
								day: 'numeric',
								hour: '2-digit',
								minute: '2-digit'
							})} Uhr | <strong>Saal:</strong>
							{showtime.hall}
							| <strong>Dauer:</strong>
							{data.movie.Runtime}
						</a>
					</li>
				{/each}
			</ul>
		</section>
	</div>
</main>

<style>
	/* Allgemeine Layout-Einstellungen */
	main {
		background-color: #f8f9fa;
		color: #333;
		font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
		padding: 2rem;
	}

	.container {
		max-width: 1200px;
		margin: auto;
	}

	/* Header-Stil */
	.title {
		font-size: 2.5rem;
		font-weight: bold;
		text-align: center;
		margin-bottom: 1rem;
		color: #2c3e50;
	}

	/* Movie-Details */
	.movie-details {
		display: flex;
		flex-wrap: wrap;
		gap: 2rem;
		background: #ffffff;
		border-radius: 12px;
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
		padding: 1.5rem;
		margin-bottom: 2rem;
	}

	.poster {
		width: 100%;
		max-width: 350px;
		height: auto;
		border-radius: 12px;
		box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
	}

	.info {
		flex: 1;
		display: flex;
		flex-direction: column;
		justify-content: center;
		font-size: 1.1rem;
		line-height: 1.6;
	}

	/* Showtimes */
	.showtimes {
		margin-top: 1rem;
	}

	.showtimes h2 {
		font-size: 2rem;
		color: #2c3e50;
		margin-bottom: 1rem;
	}

	.showtime-card {
		background-color: #ffffff;
		border-radius: 8px;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
		padding: 1rem;
		margin-bottom: 1rem;
		transition:
			transform 0.3s ease,
			box-shadow 0.3s ease;
		position: relative; /* falls du damit arbeiten möchtest */
		padding: 0; /* wir überlassen das Padding eher dem Link selbst */
	}

	.showtime-link {
		display: block; 
		text-decoration: none; 
		color: inherit; 
		padding: 1rem; 
		border-radius: 8px; 
		transition: color 0.2s ease; 
	}

	.showtime-card:hover .showtime-link {
		color: #2c3e50; /* z.B. dunkleres Blau beim Hover */
		text-decoration: none; /* sicherstellen, dass nichts unterstrichen wird */
	}
	/* Responsive Design */
	@media (max-width: 768px) {
		.movie-details {
			flex-direction: column;
			align-items: center;
		}

		.poster {
			max-width: 100%;
		}
	}
</style>
