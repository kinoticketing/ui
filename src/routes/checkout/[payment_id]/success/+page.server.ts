// src/routes/checkout/success/[payment_id]/+page.server.ts
import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import pkg from 'pg';
import { generateTicketQRCode } from '$lib/utils/qrCode';
import { sendTicketEmail } from './email';
const { Pool } = pkg;

const pool = new Pool({
    user: process.env.PGUSER,
    host: process.env.PGHOST,
    database: process.env.PGDATABASE,
    password: process.env.PGPASSWORD,
    port: 5432,
    ssl: {
        rejectUnauthorized: false
    }
});

export const load = (async ({ params, locals }) => {
    const client = await pool.connect();

    try {
        const session = await locals.getSession();
        if (!session?.user?.id) {
            throw redirect(302, '/login');
        }

        const paymentId = parseInt(params.payment_id);
        if (isNaN(paymentId)) {
            throw error(400, 'Invalid payment ID');
        }

        const result = await client.query(
            `SELECT 
                p.id as payment_id,
                p.amount,
                p.status as payment_status,
                array_agg(DISTINCT 
                    jsonb_build_object(
                        'movie_title', m.title,
                        'screening_time', sc.start_time,
                        'screening_id', sc.id,
                        'tickets', (
                            SELECT jsonb_agg(
                                jsonb_build_object(
                                    'seat_label', s2.seat_label,
                                    'ticket_code', t2.ticket_code
                                )
                            )
                            FROM tickets t2
                            JOIN seats s2 ON s2.id = t2.seat_id
                            WHERE t2.screening_id = sc.id AND t2.payment_id = p.id
                        )
                    )
                ) as screenings
            FROM payments p
            JOIN tickets t ON t.payment_id = p.id
            JOIN seats s ON s.id = t.seat_id
            JOIN screenings sc ON sc.id = t.screening_id
            JOIN movies m ON m.imdb_id = sc.movie_id
            WHERE p.id = $1 AND p.user_id = $2 AND p.status = 'completed'
            GROUP BY p.id, p.amount, p.status`,
            [paymentId, session.user.id]
        );

        if (result.rows.length === 0) {
            throw redirect(302, '/checkout/' + paymentId);
        }

        return {
            payment: result.rows[0]
        };
    } catch (e) {
        if (e instanceof redirect) throw e;
        console.error('Error loading success page:', e);
        throw error(500, 'Error loading payment confirmation');
    } finally {
        client.release();
    }
}) satisfies PageServerLoad;

// Add form action to handle email sending
export const actions = {
    sendEmail: async ({ request, locals }) => {
        const session = await locals.getSession();
        if (!session?.user?.id) {
            throw error(401, 'Unauthorized');
        }

        const formData = await request.formData();
        const paymentData = JSON.parse(formData.get('paymentData') as string);

        try {
            const formatDateTime = (date: string) => new Date(date).toLocaleString();
            const attachments = [];
            
            let htmlMessage = `
                <h1>${session.user.name}, Thank you for your purchase!</h1>
            `;

            htmlMessage += `<div>`;
            for (const screening of paymentData.screenings) {
                htmlMessage += `
                    <h2>${screening.movie_title}</h2>
                    <p><strong>Screening Time:</strong> ${formatDateTime(screening.screening_time)}</p>
                    <ul>
                `;
                for (const ticket of screening.tickets) {
                    htmlMessage += `<li>Seat ${ticket.seat_label}</li>`;

                    const qrCodeDataUrl = await generateTicketQRCode({
                        showtime: screening.screening_time,
                        seats: [ticket.seat_label],
                        uniqueIdentifier: ticket.ticket_code
                    });
                    const base64 = qrCodeDataUrl.split(',')[1];

                    attachments.push({
                        filename: `ticket-${screening.movie_title.split(' ')[0]}-${ticket.seat_label}-${ticket.ticket_code}.png`,
                        name: `ticket-${screening.movie_title.split(' ')[0]}-${ticket.seat_label}.png`,
                        content: base64,
                        contentType: 'image/png'
                    });
                }
				htmlMessage += `</ul>`;
				if (screening !== paymentData.screenings[paymentData.screenings.length - 1]) {
					htmlMessage += `<p>------------------------------------------------------------</p>`;
				}
            }
            htmlMessage += `
                <p>Total Amount:<strong> €${parseFloat(paymentData.amount).toFixed(2)}</strong></p>
            </div>`;

            await sendTicketEmail({
                to: session.user.email!,
                subject: 'Ticket order confirmation!',
                html: htmlMessage,
                attachments
            });

            return { success: true };
        } catch (e) {
            console.error('Error sending email:', e);
            throw error(500, 'Failed to send email');
        }
    }
} satisfies Actions;