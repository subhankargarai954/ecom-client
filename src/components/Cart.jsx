import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api";

export default function Cart() {
    const [cart, setCart] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const fetchCart = () => {
        api.get("/api/cart")
            .then((r) => setCart(r.data.cart || []))
            .catch(console.error)
            .finally(() => setLoading(false));
    };

    useEffect(() => { fetchCart(); }, []);

    const updateQty = async (itemId, qty) => {
        if (qty < 1) return removeItem(itemId);
        try {
            await api.put(`/api/cart/${itemId}`, { quantity: qty });
            setCart((prev) => prev.map((i) => i.id === itemId ? { ...i, quantity: qty } : i));
        } catch (err) { alert(err.response?.data?.error || "Update failed."); }
    };

    const removeItem = async (itemId) => {
        try {
            await api.delete(`/api/cart/${itemId}`);
            setCart((prev) => prev.filter((i) => i.id !== itemId));
        } catch { }
    };

    const getPrice = (item) => {
        let price = parseFloat(item.product?.base_price || 0);
        if (item.variant?.price_override != null) price = parseFloat(item.variant.price_override);
        const discount = parseFloat(item.product?.discount_percent || 0);
        return price * (1 - discount / 100);
    };

    const subtotal = cart.reduce((s, i) => s + getPrice(i) * i.quantity, 0);
    const minAdvance = subtotal * 0.2;
    const anyOutOfStock = cart.some((item) => {
        const qty = item.variant ? item.variant.available_quantity : item.product?.available_quantity;
        return !qty || qty < item.quantity;
    });

    if (loading) return <div style={{ padding: 48, color: "#636e72" }}>Loading cart…</div>;

    if (cart.length === 0) {
        return (
            <div className="empty-state">
                <div className="icon">🛒</div>
                <h2>Your cart is empty</h2>
                <p>Browse our products and add items to your cart.</p>
                <Link to="/products" className="btn btn-primary" style={{ marginTop: 16 }}>Browse Products</Link>
            </div>
        );
    }

    return (
        <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 20 }}>Your Cart ({cart.length} item{cart.length !== 1 ? "s" : ""})</h1>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 24, alignItems: "start" }}>
                <div>
                    {anyOutOfStock && (
                        <div className="alert alert-warning" style={{ marginBottom: 16 }}>
                            ⚠️ Some items in your cart are out of stock. They will be treated as pre-orders with tentative delivery within 1 day.
                        </div>
                    )}
                    <div className="cart-list">
                        {cart.map((item) => {
                            const price = getPrice(item);
                            const cover = item.product?.images?.find((i) => i.is_cover) || item.product?.images?.[0];
                            const variantQty = item.variant ? item.variant.available_quantity : item.product?.available_quantity;
                            const outOfStock = !variantQty;
                            return (
                                <div key={item.id} className="cart-item">
                                    {cover ? (
                                        <img src={cover.image_url} alt={item.product?.name} className="cart-item-img" />
                                    ) : (
                                        <div className="cart-item-placeholder">📦</div>
                                    )}
                                    <div className="cart-item-info">
                                        <h3>{item.product?.name}</h3>
                                        {item.variant && <div className="variant">{item.variant.variant_name}</div>}
                                        <div className="price">₹{price.toFixed(2)} each</div>
                                        {outOfStock && <div style={{ color: "#e17055", fontSize: 12 }}>⚡ Pre-order (out of stock)</div>}
                                    </div>
                                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                                        <div className="qty-selector" style={{ margin: 0 }}>
                                            <button onClick={() => updateQty(item.id, item.quantity - 1)}>−</button>
                                            <span>{item.quantity}</span>
                                            <button onClick={() => updateQty(item.id, item.quantity + 1)}>+</button>
                                        </div>
                                        <div style={{ fontWeight: 700 }}>₹{(price * item.quantity).toFixed(2)}</div>
                                        <button onClick={() => removeItem(item.id)} style={{ background: "none", border: "none", color: "#d63031", cursor: "pointer", fontSize: 12 }}>Remove</button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Summary */}
                <div className="cart-summary">
                    <h2>Order Summary</h2>
                    <div className="summary-row"><span>Subtotal ({cart.length} items)</span><span>₹{subtotal.toFixed(2)}</span></div>
                    <div className="summary-row total"><span>Total</span><strong>₹{subtotal.toFixed(2)}</strong></div>
                    <div style={{ background: "#e8f5e9", borderRadius: 8, padding: "10px 14px", margin: "16px 0", fontSize: 13, color: "#2e7d32" }}>
                        💳 Minimum advance: <strong>₹{minAdvance.toFixed(2)}</strong> (20% of total)
                    </div>
                    <button className="btn btn-primary" style={{ width: "100%", justifyContent: "center" }}
                        onClick={() => navigate("/checkout")}>
                        Proceed to Checkout →
                    </button>
                    <Link to="/products" className="btn btn-outline" style={{ width: "100%", justifyContent: "center", marginTop: 10 }}>
                        Continue Shopping
                    </Link>
                </div>
            </div>
        </div>
    );
}
