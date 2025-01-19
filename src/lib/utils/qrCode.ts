import QRCode from 'qrcode';

export interface TicketInfo {
    showtime: string;
    seats: string[];
    uniqueIdentifier: string;
}

export interface QRCodeOptions {
    width?: number;
    margin?: number;
    darkColor?: string;
    lightColor?: string;
}

export async function generateTicketQRCode(ticketInfo: TicketInfo, options: QRCodeOptions = {}): Promise<string> {
    const {
        width = 300,
        margin = 2,
        darkColor = '#000000',
        lightColor = '#ffffff'
    } = options;

    const qrCodeData = JSON.stringify({
        st: ticketInfo.showtime,
        s: ticketInfo.seats.join(','),
        ui: ticketInfo.uniqueIdentifier
    });

    try {
        return await QRCode.toDataURL(qrCodeData, {
            width,
            margin,
            color: {
                dark: darkColor,
                light: lightColor
            }
        });
    } catch (err) {
        console.error("Error generating QR code:", err);
        throw new Error("Failed to generate QR code");
    }
}