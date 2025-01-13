import type * as Kit from '@sveltejs/kit';

export type RouteParams = {
    payment_id: string;
}

export type PageServerLoad = Kit.ServerLoad<RouteParams>;