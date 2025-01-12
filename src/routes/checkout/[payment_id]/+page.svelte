<script lang="ts">
    import { onMount } from 'svelte';
	import type { PageData } from './types';
    import Icon from '@iconify/svelte';
    
    export let data: PageData;
    
    const { payment, tickets, movie, screening } = data;
    let loading = false;
    let error = '';

    async function handlePayment() {
        loading = true;
        error = '';
        
        try {
            const response = await fetch(`/api/payments/${payment.id}/process`, {
                method: 'POST'
            });
            
            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Payment failed');
            }

            window.location.href = `/checkout/${payment.id}/success`;
        } catch (error) {
            console.error('Payment error:', error);
            error = 'Payment failed. Please try again.'; // NEED TO GIVE OUT MESSAGE HERE
        } finally {
            loading = false;
        }
    }

    function formatDateTime(date: string) {
        return new Date(date).toLocaleString();
    }

    function formatPrice(price: number) {
        return price.toFixed(2);
    }

    // Start countdown timer for reservation expiration
    let timeLeft = 900; // 15 minutes in seconds
    let timer: ReturnType<typeof setInterval>;

    onMount(() => {
        timer = setInterval(() => {
            timeLeft--;
            if (timeLeft <= 0) {
                clearInterval(timer);
                window.location.href = '/expired';
            }
        }, 1000);

        return () => clearInterval(timer);
    });

    $: minutes = Math.floor(timeLeft / 60);
    $: seconds = timeLeft % 60;
</script>

<main>
    <div class="container">
        <h1 class="movie-title">Checkout</h1>

        <!-- Timer -->
        <div class="timer-container">
            <p class="timer-text">
                Your seats are reserved for {minutes}:{seconds.toString().padStart(2, '0')}
            </p>
        </div>

        <!-- Movie and Screening Info -->
        <div class="info-container">
            <h2 class="text-xl font-semibold mb-4">{movie.title}</h2>
            <p class="screening-time">Screening: {formatDateTime(screening.start_time)}</p>
        </div>

        <!-- Tickets Summary -->
        <div class="tickets-container">
            <h3 class="section-title">Selected Tickets</h3>
            
            {#each tickets as ticket}
                <div class="ticket-item">
                    <div class="ticket-info">
                        <p class="seat-label">Seat {ticket.seat_label}</p>
                        <p class="seat-details">Row {ticket.row}, Column {ticket.column}</p>
                        <p class="ticket-price">${formatPrice(ticket.price)}</p>
                    </div>
                </div>
            {/each}

            <div class="total-price">
                <span>Total:</span>
                <span>${formatPrice(payment.amount)}</span>
            </div>
        </div>

        {#if error}
            <div class="error-message">
                {error}
            </div>
        {/if}

        <!-- Payment Buttons -->
        <div class="payment-buttons">
            <button
                class="checkout-button"
                on:click={handlePayment}
                disabled={loading}
            >
                {#if loading}
                    <Icon icon="mdi:loading" class="spinner" />
                {/if}
                Pay ${formatPrice(payment.amount)}
            </button>

            <button
                class="paypal-button"
                disabled={loading}
            >
                <Icon icon="mdi:paypal" />
                Pay with PayPal
            </button>
        </div>
    </div>
</main>

<style>
    .container {
        max-width: 1200px;
        margin: 0 auto;
        padding: 2rem 1rem;
    }

    .movie-title {
        font-size: 2rem;
        font-weight: 600;
        margin-bottom: 2rem;
        text-align: center;
    }

    .timer-container {
        background-color: #fff3cd;
        border: 1px solid #ffeeba;
        padding: 1rem;
        margin-bottom: 1.5rem;
        border-radius: 0.5rem;
        text-align: center;
    }

    .timer-text {
        color: #856404;
    }

    .info-container,
    .tickets-container {
        background: white;
        padding: 1.5rem;
        border-radius: 0.5rem;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        margin-bottom: 1.5rem;
    }

    .section-title {
        font-size: 1.25rem;
        font-weight: 600;
        margin-bottom: 1rem;
        padding-bottom: 1rem;
        border-bottom: 1px solid #e5e7eb;
    }

    .ticket-item {
        padding: 1rem;
        border-bottom: 1px solid #e5e7eb;
    }

    .ticket-item:last-child {
        border-bottom: none;
    }

    .seat-label {
        font-weight: 600;
        margin-bottom: 0.25rem;
    }

    .seat-details {
        font-size: 0.875rem;
        color: #666;
        margin-bottom: 0.25rem;
    }

    .ticket-price {
        color: #2563eb;
        font-weight: 500;
    }

    .total-price {
        display: flex;
        justify-content: space-between;
        font-size: 1.25rem;
        font-weight: 600;
        margin-top: 1.5rem;
        padding-top: 1.5rem;
        border-top: 1px solid #e5e7eb;
    }

    .error-message {
        background-color: #fee2e2;
        border: 1px solid #fecaca;
        color: #dc2626;
        padding: 1rem;
        border-radius: 0.5rem;
        margin-bottom: 1.5rem;
    }

    .payment-buttons {
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }

    .checkout-button,
    .paypal-button {
        width: 100%;
        padding: 0.875rem;
        border: none;
        border-radius: 0.5rem;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
    }

    .checkout-button {
        background-color: #2563eb;
        color: white;
    }

    .checkout-button:hover:not(:disabled) {
        background-color: #1d4ed8;
    }

    .paypal-button {
        background-color: #fcd34d;
        color: #1a1a1a;
    }

    .paypal-button:hover:not(:disabled) {
        background-color: #fbbf24;
    }

    .checkout-button:disabled,
    .paypal-button:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
    }
</style>