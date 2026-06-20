import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import api from "../api";
import { localized } from "../i18n/localize";
import { payWithGateway } from "../payment";

export default function Checkout() {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const [cart, setCart] = useState([]);
    const [loading, setLoading] = useState(true);
    const [placing, setPlacing] = useState(false);
    const [error, setError] = useState("");
    const [form, setForm] = useState({ advance_paid: "", payment_method: "cash" });
    const user = JSON.parse(localStorage.getItem("customerUser") || "null");

    useEffect(() => {
        api.get("/api/cart")
            .then((r) => { setCart(r.data.cart || []); })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    const getPrice = (item) => {
        let price = parseFloat(item.product?.base_price || 0);
        if (item.variant?.price_override != null) price = parseFloat(item.variant.price_override);
        const discount = parseFloat(item.product?.discount_percent || 0);
        return price * (1 - discount / 100);
    };

    const total = cart.reduce((s, i) => s + getPrice(i) * i.quantity, 0);
    const minAdvance = total * 0.2;
    const allAvailable = cart.every((item) => {
        const qty = item.variant ? item.variant.available_quantity : item.product?.available_quantity;
        return qty >= item.quantity;
    });

    const today = new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
    const tomorrow = new Date(Date.now() + 86400000).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

    const payFull = () => setForm((f) => ({ ...f, advance_paid: total.toFixed(2) }));

    const handlePlaceOrder = async () => {
        const advance = parseFloat(form.advance_paid);
        if (isNaN(advance) || advance < minAdvance) {
            setError(t("checkout.min_advance_error", { amount: `₹${minAdvance.toFixed(2)}`, total: `₹${total.toFixed(2)}` }));
            return;
        }

        setError(""); setPlacing(true);
        try {
            const { data } = await api.post("/api/orders/checkout", {
                advance_paid: advance,
                payment_method: form.payment_method,
            });

            if (data.mode === "cash") {
                // Order placed; waiting for admin to confirm the cash advance.
                navigate(`/orders/${data.order_id}`, { state: { justPlaced: true, mode: "cash" } });
                return;
            }

            // Online: open the gateway (or simulation), then verify.
            const result = await payWithGateway(data, {
                name: "MyStore",
                description: `Advance for order #${data.order_id}`,
                prefill: { name: user?.name, contact: user?.phone, email: user?.email },
            });
            await api.post(`/api/orders/${data.order_id}/verify-payment`, {
                payment_id: data.payment_id,
                gateway_payment_id: result.gateway_payment_id,
                signature: result.signature,
            });
            navigate(`/orders/${data.order_id}`, { state: { justPlaced: true, mode: "online" } });
        } catch (err) {
            setError(err.response?.data?.error || err.message || "Failed to place order. Please try again.");
        } finally { setPlacing(false); }
    };

    if (loading) return <div style={{ padding: 48, color: "var(--text-muted)" }}>{t("profile.loading")}</div>;

    if (cart.length === 0) {
        navigate("/cart");
        return null;
    }

    return (
        <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 20 }}>{t("checkout.title")}</h1>

            <div className="checkout-grid">
                {/* Left: Payment Form */}
                <div>
                    {/* Delivery Info */}
                    <div className="card">
                        <h2>{t("checkout.delivery_info")}</h2>
                        <div style={{ fontSize: 14, color: "var(--text-muted)", lineHeight: 1.7 }}>
                            <p>📍 {t("checkout.pickup_only")}</p>
                            {allAvailable ? (
                                <div className="delivery-box today" style={{ marginTop: 12 }}>
                                    🚀 {t("checkout.all_in_stock", { date: today })}
                                </div>
                            ) : (
                                <div className="delivery-box preorder" style={{ marginTop: 12 }}>
                                    ⚡ {t("checkout.some_preorder", { date: tomorrow })}
                                    <br /><small>{t("checkout.admin_confirm_note")}</small>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Payment */}
                    <div className="card">
                        <h2>{t("checkout.advance_payment")}</h2>
                        <div className="alert alert-info" style={{ marginBottom: 16 }}>
                            💳 {t("checkout.min_advance_required", { amount: `₹${minAdvance.toFixed(2)}`, remaining: `₹${(total - minAdvance).toFixed(2)}` })}
                        </div>

                        {error && <div className="alert alert-error">{error}</div>}

                        <div className="form-group">
                            <label>{t("checkout.advance_amount")} (₹) *</label>
                            <div style={{ display: "flex", gap: 8 }}>
                                <input
                                    type="number"
                                    step="0.01"
                                    min={minAdvance.toFixed(2)}
                                    max={total.toFixed(2)}
                                    value={form.advance_paid}
                                    onChange={(e) => setForm({ ...form, advance_paid: e.target.value })}
                                    placeholder={t("checkout.advance_min_placeholder", { amount: `₹${minAdvance.toFixed(2)}` })}
                                />
                                <button type="button" className="btn btn-outline btn-sm" style={{ whiteSpace: "nowrap" }} onClick={payFull}>
                                    {t("checkout.pay_full")}
                                </button>
                            </div>
                            <small style={{ color: "var(--text-muted)", fontSize: 12 }}>
                                {t("checkout.enter_between", { min: `₹${minAdvance.toFixed(2)}`, max: `₹${total.toFixed(2)}` })}
                            </small>
                        </div>

                        <div className="form-group">
                            <label>{t("checkout.payment_mode")}</label>
                            <div className="pay-method-grid">
                                <button type="button"
                                    className={`pay-method ${form.payment_method === "online" ? "selected" : ""}`}
                                    onClick={() => setForm({ ...form, payment_method: "online" })}>
                                    <span className="pm-icon">📲</span>
                                    <span className="pm-title">{t("checkout.pay_online")}</span>
                                    <span className="pm-sub">{t("checkout.online_sub")}</span>
                                </button>
                                <button type="button"
                                    className={`pay-method ${form.payment_method === "cash" ? "selected" : ""}`}
                                    onClick={() => setForm({ ...form, payment_method: "cash" })}>
                                    <span className="pm-icon">💵</span>
                                    <span className="pm-title">{t("checkout.cash")}</span>
                                    <span className="pm-sub">{t("checkout.cash_sub")}</span>
                                </button>
                            </div>
                        </div>

                        {form.payment_method === "cash" && (
                            <div className="alert alert-warning" style={{ fontSize: 13 }}>
                                ⏳ {t("checkout.cash_note")}
                            </div>
                        )}

                        <button className="btn btn-primary" style={{ width: "100%", justifyContent: "center", marginTop: 8 }}
                            onClick={handlePlaceOrder} disabled={placing}>
                            {placing ? t("checkout.placing")
                                : form.payment_method === "online"
                                    ? t("checkout.pay_and_place", { amount: `₹${parseFloat(form.advance_paid || 0).toFixed(2)}` })
                                    : t("checkout.place_order", { amount: `₹${parseFloat(form.advance_paid || 0).toFixed(2)}` })}
                        </button>
                    </div>
                </div>

                {/* Right: Order Summary */}
                <div className="cart-summary">
                    <h2>{t("checkout.order_summary")}</h2>
                    {cart.map((item) => {
                        const price = getPrice(item);
                        const cover = item.product?.images?.find((i) => i.is_cover) || item.product?.images?.[0];
                        return (
                            <div key={item.id} style={{ display: "flex", gap: 12, alignItems: "center", padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
                                {cover ? (
                                    <img src={cover.image_url} alt="" style={{ width: 50, height: 50, borderRadius: 6, objectFit: "cover" }} />
                                ) : (
                                    <div style={{ width: 50, height: 50, borderRadius: 6, background: "var(--surface-2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>📦</div>
                                )}
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: 13, fontWeight: 500 }}>{localized(item.product, "name", i18n.language)}</div>
                                    {item.variant && <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{item.variant.variant_name}</div>}
                                    <div style={{ fontSize: 12, color: "var(--text-muted)" }}>× {item.quantity}</div>
                                </div>
                                <div style={{ fontWeight: 600, fontSize: 13 }}>₹{(price * item.quantity).toFixed(2)}</div>
                            </div>
                        );
                    })}
                    <div className="summary-row" style={{ marginTop: 12 }}>
                        <span>{t("checkout.total")}</span><strong>₹{total.toFixed(2)}</strong>
                    </div>
                    <div className="summary-row" style={{ color: "var(--ok)" }}>
                        <span>{t("checkout.advance_minimum")}</span><span>₹{minAdvance.toFixed(2)}</span>
                    </div>
                    <div className="summary-row" style={{ color: "var(--warn)" }}>
                        <span>{t("checkout.remaining_pickup")}</span><span>₹{(total - minAdvance).toFixed(2)}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
