// src/routes/admin/manage-screenings/[screening_id]/+server.ts
import pkg from 'pg';
import type { RequestHandler } from '@sveltejs/kit';

const { Pool } = pkg;

const pool = new Pool({
	user: process.env.PGUSER,
	host: process.env.PGHOST,
	database: process.env.PGDATABASE,
	password: process.env.PGPASSWORD,
	port: 5432,
	ssl: { rejectUnauthorized: false }
});

// DELETE-Methode für das Löschen einer Vorstellung
export const DELETE: RequestHandler = async ({ params }) => {
	const { screening_id } = params;
	const id = screening_id ? parseInt(screening_id, 10) : NaN;

	try {
		// Evtl. erst seat_reservations löschen, wenn du das nicht per ON DELETE CASCADE geregelt hast
		await pool.query('DELETE FROM seat_reservations WHERE screening_id = $1', [id]);

		// Jetzt die eigentliche Vorstellung löschen
		await pool.query('DELETE FROM screenings WHERE id = $1', [id]);

		return new Response(null, { status: 204 }); // Erfolgreich gelöscht
	} catch (error) {
		console.error('Fehler beim Löschen der Vorstellung:', error);
		return new Response('Fehler beim Löschen der Vorstellung', { status: 500 });
	}
};

export const PUT: RequestHandler = async ({ request, params }) => {
	const { screening_id } = params;
	const id = screening_id ? parseInt(screening_id, 10) : NaN;

	try {
		const { movie_id, hall_id, start_time } = await request.json();

		// Validate input
		if (!movie_id || !hall_id || !start_time) {
			return new Response(
				JSON.stringify({
					success: false,
					error: 'Alle Felder müssen ausgefüllt sein'
				}),
				{ status: 400 }
			);
		}

		// Get movie duration
		const movieResult = await pool.query('SELECT duration FROM movies WHERE imdb_id = $1', [
			movie_id
		]);

		if (movieResult.rowCount === 0) {
			return new Response(
				JSON.stringify({
					success: false,
					error: 'Film nicht gefunden'
				}),
				{ status: 404 }
			);
		}

		const duration = movieResult.rows[0].duration;
		const startDate = new Date(start_time);
		const endDate = new Date(startDate.getTime() + duration * 60000); // Convert minutes to milliseconds

		const result = await pool.query(
			`
            UPDATE screenings 
            SET movie_id = $1, 
                hall_id = $2, 
                start_time = $3::timestamp with time zone, 
                end_time = $4::timestamp with time zone,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $5
            RETURNING id, movie_id, hall_id, 
                     start_time AT TIME ZONE 'UTC' as start_time, 
                     end_time AT TIME ZONE 'UTC' as end_time
        `,
			[movie_id, hall_id, startDate.toISOString(), endDate.toISOString(), id]
		);

		if (result.rowCount === 0) {
			return new Response(
				JSON.stringify({
					success: false,
					error: 'Vorstellung nicht gefunden'
				}),
				{ status: 404 }
			);
		}

		return new Response(
			JSON.stringify({
				success: true,
				screening: result.rows[0]
			}),
			{ status: 200 }
		);
	} catch (error) {
		console.error('Error updating screening:', error);
		return new Response(
			JSON.stringify({
				success: false,
				error: 'Fehler beim Aktualisieren der Vorstellung'
			}),
			{ status: 500 }
		);
	}
};
