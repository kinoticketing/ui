// src/lib/utils/index.ts
export function formatDateTime(dateString: string): string {
	return new Date(dateString).toLocaleString('en-US', {
		weekday: 'short',
		month: 'short',
		day: 'numeric',
		hour: '2-digit',
		minute: '2-digit'
	});
}

export function formatPrice(price: number): string {
	return price.toFixed(2);
}

export function formatSeatLabel(row: number, col: number): string {
	return `${String.fromCharCode(64 + row)}${col}`;
}
