import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async (event) => {
    try {
        const session = await event.locals.auth();
        return {
            session
        };
    } catch (error) {
        console.error('Error loading session:', error);
        return {
            session: null
        };
    }
};