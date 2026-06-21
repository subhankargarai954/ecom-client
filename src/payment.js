// Loads Razorpay Checkout and opens it (UPI / QR / cards / netbanking).
// In simulation mode (no keys on the server) it resolves instantly so the
// whole flow is testable without a gateway account.

let scriptPromise = null;
function loadRazorpay() {
    if (window.Razorpay) return Promise.resolve(true);
    if (scriptPromise) return scriptPromise;
    scriptPromise = new Promise((resolve) => {
        const s = document.createElement("script");
        s.src = "https://checkout.razorpay.com/v1/checkout.js";
        s.onload = () => resolve(true);
        s.onerror = () => resolve(false);
        document.body.appendChild(s);
    });
    return scriptPromise;
}

// Resolves with { gateway_payment_id, signature } on success; rejects if cancelled.
export async function payWithGateway(info, { name = "MyStore", description = "", prefill = {} } = {}) {
    if (info.simulated || info.gateway === "simulated") {
        // Simulated success (server auto-verifies simulated payments)
        await new Promise((r) => setTimeout(r, 600));
        return { gateway_payment_id: "sim_pay_" + Date.now(), signature: "simulated" };
    }
    const ok = await loadRazorpay();
    if (!ok) throw new Error("Could not load the payment gateway. Check your connection.");
    return new Promise((resolve, reject) => {
        const rzp = new window.Razorpay({
            key: info.key_id,
            amount: info.amount,
            currency: "INR",
            name,
            description,
            order_id: info.gateway_order_id,
            prefill,
            theme: { color: "#0a74d1" },
            handler: (resp) =>
                resolve({
                    gateway_payment_id: resp.razorpay_payment_id,
                    signature: resp.razorpay_signature,
                }),
            modal: { ondismiss: () => reject(new Error("Payment cancelled.")) },
        });
        rzp.open();
    });
}
