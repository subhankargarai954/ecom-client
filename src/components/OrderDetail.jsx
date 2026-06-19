import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation, Link } from "react-router-dom";
import api from "../api";

const STEPS = ["pending", "confirmed", "ready_for_pickup", "delivered"];
const STEP_LABELS = ["Order Placed", "Confirmed", "Ready for Pickup", "Delivered"];

export default function OrderDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const justPlaced = location.state?.justPlaced;
    const orderData = location.state?.orderData;

    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [cancelling, setCancelling] = useState(false);
    const [cancelReason, setCancelReason] = useState("");
    const [showCancel, setShowCancel] = useState(false);
    const [message, setMessage] = useState(justPlaced ? "✅ Order placed successfully!" : "");

    useEffect(() => {
        api.get(`/api/orders/${id}`)
            .then((r) => setOrder(r.data.order))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [id]);

    const handleCancel = async () => {
        setCancelling(true);
        try {
            await api.put(`/api/orders/${id}/cancel`, { cancellation_reason: cancelReason });
            setMessage("Order cancelled. Advance refund will be processed by admin.");
            setShowCancel(false);
            const r = await api.get(`/api/orders/${id}`);
            setOrder(r.data.order);
        } catch (err) {
            alert(err.response?.data?.error || "Could not cancel order.");
        } finally { setCancelling(false); }
    };

    if (loading) return <div style={{ padding: 48, color: "#636e72" }}>Loading…</div>;
    if (!order) return <div className="alert alert-error">Order not found.</div>;

    const stepIdx = STEPS.indexOf(order.order_status);
    const pending_amount = Math.max(0,
        parseFloat(order.total_amount) - parseFloat(order.advance_paid) - parseFloat(order.final_paid || 0)
    );

    return (
        <div>
            <Link to="/orders" style={{ color: "#636e72", textDecoration: "none", fontSize: 13, display: "inline-block", marginBottom: 16 }}>
                ← Back to Orders
            </Link>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
                <h1 style={{ fontSize: 22, fontWeight: 700 }}>Order #{order.id}</h1>
                <span className={`badge badge-${order.order_status === "ready_for_pickup" ? "ready" : order.order_status}`} style={{ fontSize: 13, padding: "6px 14px" }}>
                    {order.order_status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                </span>
            </div>

            {message && <div className="alert alert-success">{message}</div>}

            {justPlaced && orderData && (
                <div className="card" style={{ background: "#e8f5e9", border: "1px solid #c8e6c9" }}>
                    <h2 style={{ color: "#2e7d32" }}>🎉 Order Confirmed!</h2>
                    <p style={{ fontSize: 14, color: "#388e3c" }}>
                        {orderData.all_items_available
                            ? `Your order is ready for pickup today! Visit our store to collect your items.`
                            : `Your pre-order is placed. Tentative delivery: ${orderData.delivery_date}. Admin will confirm the exact date — check back here.`}
                    </p>
                </div>
            )}

            {/* Timeline */}
            {order.order_status !== "cancelled" && (
                <div className="card">
                    <div style={{ display: "flex", gap: 0 }}>
                        {STEPS.map((s, i) => (
                            <div key={s} style={{ flex: 1, textAlign: "center", position: "relative" }}>
                                {i < STEPS.length - 1 && (
                                    <div style={{
                                        position: "absolute", top: 16, left: "50%", right: "-50%",
                                        height: 2, background: i < stepIdx ? "#00b894" : "#dfe6e9", zIndex: 0,
                                    }} />
                                )}
                                <div style={{
                                    width: 32, height: 32, borderRadius: "50%",
                                    background: i < stepIdx ? "#00b894" : i === stepIdx ? "#0984e3" : "#dfe6e9",
                                    color: i <= stepIdx ? "#fff" : "#636e72",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    margin: "0 auto 8px", position: "relative", zIndex: 1,
                                    fontWeight: 700, fontSize: 14, border: "2px solid",
                                    borderColor: i < stepIdx ? "#00b894" : i === stepIdx ? "#0984e3" : "#dfe6e9",
                                }}>
                                    {i < stepIdx ? "✓" : i + 1}
                                </div>
                                <div style={{ fontSize: 11, color: i === stepIdx ? "#0984e3" : i < stepIdx ? "#00b894" : "#636e72", fontWeight: i === stepIdx ? 700 : 400 }}>
                                    {STEP_LABELS[i]}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {order.order_status === "cancelled" && (
                <div className="alert alert-error">
                    <strong>Order Cancelled</strong>
                    {order.cancellation_reason && ` — ${order.cancellation_reason}`}
                    {order.payment_status !== "refunded" && (
                        <div style={{ marginTop: 6 }}>💵 Advance refund of ₹{parseFloat(order.advance_paid).toFixed(2)} will be processed by admin.</div>
                    )}
                    {order.payment_status === "refunded" && (
                        <div style={{ marginTop: 6 }}>✅ Advance refund of ₹{parseFloat(order.advance_paid).toFixed(2)} has been issued.</div>
                    )}
                </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                {/* Delivery */}
                <div className="card">
                    <h2>Delivery Info</h2>
                    <table style={{ width: "100%", fontSize: 14 }}>
                        <tbody>
                            <tr>
                                <td style={{ color: "#636e72", padding: "4px 0" }}>All Items Available?</td>
                                <td style={{ textAlign: "right", fontWeight: 600 }}>
                                    {order.all_items_available ? "Yes ✓" : "No (Pre-order)"}
                                </td>
                            </tr>
                            {order.tentative_delivery_date && (
                                <tr>
                                    <td style={{ color: "#636e72", padding: "4px 0" }}>Tentative Date</td>
                                    <td style={{ textAlign: "right", color: "#f57f17" }}>~{fmt(order.tentative_delivery_date)}</td>
                                </tr>
                            )}
                            {order.final_delivery_date && (
                                <tr>
                                    <td style={{ color: "#636e72", padding: "4px 0" }}>Final Pickup Date</td>
                                    <td style={{ textAlign: "right", fontWeight: 700, color: "#00b894" }}>{fmt(order.final_delivery_date)}</td>
                                </tr>
                            )}
                            {order.actual_delivery_date && (
                                <tr>
                                    <td style={{ color: "#636e72", padding: "4px 0" }}>Collected On</td>
                                    <td style={{ textAlign: "right", fontWeight: 600 }}>{new Date(order.actual_delivery_date).toLocaleDateString("en-IN")}</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                    {order.order_status === "ready_for_pickup" && (
                        <div className="delivery-box today" style={{ marginTop: 12 }}>
                            🚀 Your order is ready! Visit our store to collect and pay the balance.
                        </div>
                    )}
                    {["pending", "confirmed"].includes(order.order_status) && !order.all_items_available && !order.final_delivery_date && (
                        <div className="delivery-box preorder" style={{ marginTop: 12 }}>
                            ⏳ Waiting for admin to confirm delivery date. Check back soon.
                        </div>
                    )}
                </div>

                {/* Payment */}
                <div className="card">
                    <h2>Payment</h2>
                    <table style={{ width: "100%", fontSize: 14 }}>
                        <tbody>
                            <tr><td style={{ color: "#636e72", padding: "4px 0" }}>Total</td><td style={{ textAlign: "right", fontWeight: 700 }}>₹{parseFloat(order.total_amount).toFixed(2)}</td></tr>
                            <tr><td style={{ color: "#636e72", padding: "4px 0" }}>Advance Paid</td><td style={{ textAlign: "right", color: "#00b894", fontWeight: 600 }}>₹{parseFloat(order.advance_paid).toFixed(2)}</td></tr>
                            {parseFloat(order.final_paid) > 0 && (
                                <tr><td style={{ color: "#636e72", padding: "4px 0" }}>Paid at Pickup</td><td style={{ textAlign: "right", color: "#00b894", fontWeight: 600 }}>₹{parseFloat(order.final_paid).toFixed(2)}</td></tr>
                            )}
                            <tr style={{ borderTop: "1px solid #f5f6fa" }}>
                                <td style={{ padding: "8px 0 4px", fontWeight: 700 }}>Balance Due</td>
                                <td style={{ textAlign: "right", fontWeight: 700, color: pending_amount > 0 ? "#e17055" : "#00b894" }}>
                                    ₹{pending_amount.toFixed(2)}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Items */}
            <div className="card">
                <h2>Items in this Order</h2>
                {order.items?.map((item) => {
                    const effective = parseFloat(item.unit_price) * (1 - parseFloat(item.discount_percent || 0) / 100);
                    const cover = item.product?.images?.find((i) => i.is_cover) || item.product?.images?.[0];
                    return (
                        <div key={item.id} style={{ display: "flex", gap: 12, alignItems: "center", padding: "12px 0", borderBottom: "1px solid #f5f6fa" }}>
                            {cover ? (
                                <img src={cover.image_url} alt="" style={{ width: 60, height: 60, borderRadius: 8, objectFit: "cover" }} />
                            ) : (
                                <div style={{ width: 60, height: 60, borderRadius: 8, background: "#f5f6fa", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28 }}>📦</div>
                            )}
                            <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: 600 }}>{item.product?.name}</div>
                                {item.variant && <div style={{ fontSize: 12, color: "#636e72" }}>{item.variant.variant_name}</div>}
                                <div style={{ fontSize: 13, color: "#636e72" }}>₹{effective.toFixed(2)} × {item.quantity}</div>
                                {!item.was_available_at_order && <span className="badge badge-pending" style={{ fontSize: 10 }}>Pre-order</span>}
                            </div>
                            <div style={{ fontWeight: 700 }}>₹{(effective * item.quantity).toFixed(2)}</div>
                        </div>
                    );
                })}
            </div>

            {/* Cancel button */}
            {!["delivered", "cancelled"].includes(order.order_status) && (
                <div style={{ textAlign: "right" }}>
                    {!showCancel ? (
                        <button className="btn btn-danger btn-sm" onClick={() => setShowCancel(true)}>
                            Cancel Order
                        </button>
                    ) : (
                        <div className="card" style={{ textAlign: "left" }}>
                            <h2 style={{ color: "#d63031" }}>Cancel Order?</h2>
                            <div className="alert alert-error">
                                Your advance of ₹{parseFloat(order.advance_paid).toFixed(2)} will be refunded.
                            </div>
                            <div className="form-group">
                                <label>Reason (optional)</label>
                                <input value={cancelReason} onChange={(e) => setCancelReason(e.target.value)}
                                    placeholder="e.g. Changed my mind" />
                            </div>
                            <div style={{ display: "flex", gap: 10 }}>
                                <button className="btn btn-outline" onClick={() => setShowCancel(false)}>Keep Order</button>
                                <button className="btn btn-danger" onClick={handleCancel} disabled={cancelling}>
                                    {cancelling ? "Cancelling…" : "Yes, Cancel"}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

function fmt(d) { return d ? new Date(d).toLocaleDateString("en-IN") : "—"; }
