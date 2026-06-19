import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import api from "../api";
import { localized } from "../i18n/localize";

export default function Checkout() {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const [cart, setCart] = useState([]);
    const [loading, setLoading] = useState(true);
    const [placing, setPlacing] = useState(false);
    const [error, setError] = useState("");
    const [form, setForm] = useState({ advance_paid: "", advance_payment_mode: "cash" });

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

    const handlePlaceOrder = async () => {
        const advance = parseFloat(form.advance_paid);
        if (isNaN(advance) || advance < minAdvance) {
            setError(t("checkout.min_advance_error", { amount: `₹${minAdvance.toFixed(2)}`, total: `₹${total.toFixed(2)}` }));
            return;
        }

        setError(""); setPlacing(true);
        try {
            const { data } = await api.post("/api/orders", form);
            navigate(`/orders/${data.order_id}`, { state: { justPlaced: true, orderData: data } });
        } catch (err) {
            setError(err.response?.data?.error || "Failed to place order. Please try again.");
        } finally { setPlacing(false); }
    };

    if (loading) return <div style={{ padding: 48, color: "#636e72" }}>{t("profile.loading")}</div>;

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
                        <div style={{ fontSize: 14, color: "#636e72", lineHeight: 1.7 }}>
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
                            <input
                                type="number"
                                step="0.01"
                                min={minAdvance.toFixed(2)}
                                max={total.toFixed(2)}
                                value={form.advance_paid}
                                onChange={(e) => setForm({ ...form, advance_paid: e.target.value })}
                                placeholder={t("checkout.advance_min_placeholder", { amount: `₹${minAdvance.toFixed(2)}` })}
                            />
                            <small style={{ color: "#636e72", fontSize: 12 }}>
                                {t("checkout.enter_between", { min: `₹${minAdvance.toFixed(2)}`, max: `₹${total.toFixed(2)}` })}
                            </small>
                        </div>
                        <div className="form-group">
                            <label>{t("checkout.payment_mode")}</label>
                            <select value={form.advance_payment_mode}
                                onChange={(e) => setForm({ ...form, advance_payment_mode: e.target.value })}>
                                <option value="cash">{t("checkout.cash")}</option>
                                <option value="online">{t("checkout.online")}</option>
                            </select>
                        </div>

                        <button className="btn btn-primary" style={{ width: "100%", justifyContent: "center", marginTop: 8 }}
                            onClick={handlePlaceOrder} disabled={placing}>
                            {placing ? t("checkout.placing") : t("checkout.place_order", { amount: `₹${parseFloat(form.advance_paid || 0).toFixed(2)}` })}
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
                            <div key={item.id} style={{ display: "flex", gap: 12, alignItems: "center", padding: "10px 0", borderBottom: "1px solid #f5f6fa" }}>
                                {cover ? (
                                    <img src={cover.image_url} alt="" style={{ width: 50, height: 50, borderRadius: 6, objectFit: "cover" }} />
                                ) : (
                                    <div style={{ width: 50, height: 50, borderRadius: 6, background: "#f5f6fa", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>📦</div>
                                )}
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: 13, fontWeight: 500 }}>{localized(item.product, "name", i18n.language)}</div>
                                    {item.variant && <div style={{ fontSize: 11, color: "#636e72" }}>{item.variant.variant_name}</div>}
                                    <div style={{ fontSize: 12, color: "#636e72" }}>× {item.quantity}</div>
                                </div>
                                <div style={{ fontWeight: 600, fontSize: 13 }}>₹{(price * item.quantity).toFixed(2)}</div>
                            </div>
                        );
                    })}
                    <div className="summary-row" style={{ marginTop: 12 }}>
                        <span>{t("checkout.total")}</span><strong>₹{total.toFixed(2)}</strong>
                    </div>
                    <div className="summary-row" style={{ color: "#00b894" }}>
                        <span>{t("checkout.advance_minimum")}</span><span>₹{minAdvance.toFixed(2)}</span>
                    </div>
                    <div className="summary-row" style={{ color: "#e17055" }}>
                        <span>{t("checkout.remaining_pickup")}</span><span>₹{(total - minAdvance).toFixed(2)}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
