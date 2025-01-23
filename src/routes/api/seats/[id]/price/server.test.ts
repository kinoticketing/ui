import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from './+server';
import { Pool } from 'pg';

// Mock pg Pool
vi.mock('pg', () => {
    const query = vi.fn();
    return {
        __esModule: true,
        default: {
            Pool: vi.fn(() => ({
                query
            }))
        },
        Pool: vi.fn(() => ({
            query
        }))
    };
});

describe('Seat Price API', () => {
    let mockQuery: any;

    beforeEach(() => {
        vi.clearAllMocks();
        mockQuery = vi.mocked(Pool)().query;
    });

    it('should reject requests without required parameters', async () => {
        const response = await GET({
            params: { id: '1' },
            url: new URL('http://localhost/api/seats/1/price')
        } as any);

        const result = await response.json();
        expect(response.status).toBe(400);
        expect(result).toEqual({ error: 'Missing required parameters' });
    });

    it('should calculate price correctly', async () => {
        const mockPriceData = {
            base_price: 10.00,
            screening_modifier: 2.00,
            category_modifier: 1.50,
            category_name: 'VIP',
            final_price: 13.50
        };

        mockQuery.mockResolvedValueOnce({
            rows: [mockPriceData],
            rowCount: 1
        });

        const response = await GET({
            params: { id: '1' },
            url: new URL('http://localhost/api/seats/1/price?screeningId=123')
        } as any);

        const result = await response.json();
        expect(response.status).toBe(200);
        expect(result).toEqual({
            price: 13.50,
            breakdown: {
                basePrice: 10.00,
                screeningModifier: 2.00,
                categoryModifier: 1.50,
                categoryName: 'VIP'
            }
        });
        expect(mockQuery).toHaveBeenCalledWith(
            expect.stringContaining('WITH seat_info'),
            ['1', '123']
        );
    });

    it('should handle non-existent seat or screening', async () => {
        mockQuery.mockResolvedValueOnce({
            rows: [],
            rowCount: 0
        });

        const response = await GET({
            params: { id: '999' },
            url: new URL('http://localhost/api/seats/999/price?screeningId=999')
        } as any);

        const result = await response.json();
        expect(response.status).toBe(404);
        expect(result).toEqual({ error: 'Seat or screening not found' });
    });

    it('should handle database errors', async () => {
        mockQuery.mockRejectedValueOnce(new Error('Database error'));

        const response = await GET({
            params: { id: '1' },
            url: new URL('http://localhost/api/seats/1/price?screeningId=123')
        } as any);

        const result = await response.json();
        expect(response.status).toBe(500);
        expect(result).toEqual({ error: 'Internal server error' });
    });

    it('should use default base price when screening price is not set', async () => {
        const mockPriceData = {
            base_price: 8.00, // default base price
            screening_modifier: 0,
            category_modifier: 1.00,
            category_name: 'Standard',
            final_price: 9.00
        };

        mockQuery.mockResolvedValueOnce({
            rows: [mockPriceData],
            rowCount: 1
        });

        const response = await GET({
            params: { id: '1' },
            url: new URL('http://localhost/api/seats/1/price?screeningId=123')
        } as any);

        const result = await response.json();
        expect(response.status).toBe(200);
        expect(result.price).toBe(9.00);
        expect(result.breakdown.basePrice).toBe(8.00);
    });

    it('should handle different seat categories', async () => {
        const categories = [
            { name: 'VIP', modifier: 2.00, base: 10.00, final: 12.00 },
            { name: 'Standard', modifier: 0.00, base: 10.00, final: 10.00 },
            { name: 'Disabled', modifier: -2.00, base: 10.00, final: 8.00 }
        ];

        for (const cat of categories) {
            mockQuery.mockResolvedValueOnce({
                rows: [{
                    base_price: cat.base,
                    screening_modifier: 0,
                    category_modifier: cat.modifier,
                    category_name: cat.name,
                    final_price: cat.final
                }],
                rowCount: 1
            });

            const response = await GET({
                params: { id: '1' },
                url: new URL('http://localhost/api/seats/1/price?screeningId=123')
            } as any);

            const result = await response.json();
            expect(result.price).toBe(cat.final);
            expect(result.breakdown.categoryName).toBe(cat.name);
            expect(result.breakdown.categoryModifier).toBe(cat.modifier);
        }
    });
});
