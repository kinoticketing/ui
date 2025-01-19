import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateTicketQRCode, type TicketInfo, type QRCodeOptions } from './qrCode';
import QRCode from 'qrcode';

// Fix the mock to properly type the toDataURL function
vi.mock('qrcode', () => ({
    default: {
        toDataURL: vi.fn().mockImplementation(async () => 'data:image/png;base64,mockQRCode')
    }
}));

describe('QR Code Generator', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should generate QR code with default options', async () => {
        const ticketInfo: TicketInfo = {
            showtime: '2024-02-01T20:00:00Z',
            seats: ['A1', 'A2'],
            uniqueIdentifier: 'TICK123'
        };

        const result = await generateTicketQRCode(ticketInfo);

        expect(result).toBe('data:image/png;base64,mockQRCode');
        expect(QRCode.toDataURL).toHaveBeenCalledWith(
            expect.any(String),
            expect.objectContaining({
                width: 300,
                margin: 2
            })
        );
    });

    it('should handle custom options', async () => {
        const options: QRCodeOptions = {
            width: 400,
            margin: 4,
            darkColor: '#333333',
            lightColor: '#EEEEEE'
        };

        const ticketInfo: TicketInfo = {
            showtime: '2024-02-01T20:00:00Z',
            seats: ['A1'],
            uniqueIdentifier: 'TICK123'
        };

        const result = await generateTicketQRCode(ticketInfo, options);

        expect(result).toBe('data:image/png;base64,mockQRCode');
        expect(QRCode.toDataURL).toHaveBeenCalledWith(
            expect.any(String),
            expect.objectContaining({
                width: 400,
                margin: 4,
                color: {
                    dark: '#333333',
                    light: '#EEEEEE'
                }
            })
        );
    });

    it('should handle QR code generation errors', async () => {
        const mockToDataURL = vi.mocked(QRCode.toDataURL);
        mockToDataURL.mockRejectedValue(new Error('QR Code generation failed'));

        const ticketInfo: TicketInfo = {
            showtime: '2024-02-01T20:00:00Z',
            seats: ['A1'],
            uniqueIdentifier: 'TICK123'
        };

        await expect(generateTicketQRCode(ticketInfo)).rejects.toThrow('Failed to generate QR code');
    });
});
