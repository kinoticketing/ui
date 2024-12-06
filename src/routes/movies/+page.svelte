<script lang="ts">
	export let data: { movies: Array<{ Title: string; Year: string; Poster: string }> };
</script>

<main>
	<h1 class="text-2xl font-bold mb-4">Movies</h1>
	<div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
		{#each data.movies as movie}
			<div class="bg-white shadow-md rounded-md overflow-hidden">
				<img
					src={movie.Poster !== 'N/A' ? movie.Poster : '/fallback-image.jpg'}
					alt={movie.Title}
					class="w-full h-64 object-cover"
				/>
				<div class="p-4">
					<h2 class="text-lg font-semibold">{movie.Title}</h2>
					<p class="text-gray-500">{movie.Year}</p>
				</div>
			</div>
		{/each}
	</div>
</main>

<style>
	h1 {
		text-align: center;
	}

    .grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
        gap: 1rem;
    }

    .bg-white {
        background-color: white;
    }

    .shadow-md {
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }

    .rounded-md {
        border-radius: 0.375rem;
    }

    .overflow-hidden {
        overflow: hidden;
    }

    .w-full {
        width: 100%;
    }

    .h-64 {
        height: 16rem;
    }

    .object-cover {
        object-fit: cover;
    }

    .p-4 {
        padding: 1rem;
    }

    .text-lg {
        font-size: 1.125rem;
    }

    .font-semibold {
        font-weight: 600;
    }

    .text-gray-500 {
        color: #6b7280;
    }
</style>
