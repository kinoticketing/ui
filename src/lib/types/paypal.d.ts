// src/lib/types/paypal.d.ts
declare global {
    interface Window {
        paypal: {
            Buttons: (config: {
                style: {
                    layout: string;
                    color: string;
                    shape: string;
                    label: string;
                };
                createOrder: () => Promise<string>;
                onApprove: (data: { orderID: string }) => Promise<void>;
                onError: (err: Error) => void;
                onCancel?: () => void;
            }) => {
                render: (selector: string) => Promise<void>;
            };
        };
    }
}

export {};