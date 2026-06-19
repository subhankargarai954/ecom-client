import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api";

const STATUS_LABELS = {
    pending: "Pending", confirmed: "Confirmed",
    ready_for_pickup: "Ready for Pickup 🎉", delivered: "Delivered ✓", cancelled: "Cancelled",
};

const STATUS_BADGE = {
    pending: "badge-pending", confirmed: "badge-confirmed",
    ready_for_pickup: "badge-ready", delivered: "badge-delivered", cancelled: "badge-cancelled",
};

export default function MyOrders() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get("/api/orders")
            .then((r) => setOrders(r.data.orders || []))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <div style={{ padding: 48, color: "#636e72" }}>Loading orders…</div>;

    if (orders.length === 0) {
        return (
            <div className="empty-state">
                <div className="icon">📋</div>
                <h2>No orders yet</h2>
                <p>Your placed orders will appear here.</p>
                <Link to="/products" className="btn btn-primary" style={{ marginTop: 16 }}>Start Shopping</Link>
            </div>
        );
    }

    return (
        <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 20 }}>My Orders</h1>
            {orders.map((order) => {
                const pending_amount = Math.max(0,
                    parseFloat(order.total_amount) - parseFloat(order.advance_paid) - parseFloat(order.final_paid || 0)
                );
                return (
                    <Link to={`/orders/${order.id}`} key={order.id} className="order-card">
                        <div className="order-card-header">
                            <div>
                                <div className="order-number">
                                    Order <strong>#{order.id}</strong>
                                </div>
                                <div style={{ fontSize: 12, color: "#636e72", marginTop: 2 }}>
                                    {new Date(order.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
                                </div>
                            </div>
                            <div style={{ textAlign: "right" }}>
                                <span className={`badge ${STATUS_BADGE[order.order_status]}`}>
                                    {STATUS_LABELS[order.order_status]}
                                </span>
                            </div>
                        </div>

                        <div style={{ display: "flex", gap: 24, fontSize: 13, color: "#636e72", flexWrap: "wrap" }}>
                            <span>
                                {order.items?.length || 0} item(s)
                            </span>
                            <span>Total: <strong style={{ color: "#2d3436" }}>₹{parseFloat(order.total_amount).toFixed(2)}</strong></span>
                            <span>Advance: <strong style={{ color: "#00b894" }}>₹{parseFloat(order.advance_paid).toFixed(2)}</strong></span>
                            {pending_amount > 0 && (
                                <span>Due at pickup: <strong style={{ color: "#e17055" }}>₹{pending_amount.toFixed(2)}</strong></span>
                            )}
                        </div>

                        {/* Delivery date */}
                        {order.order_status !== "cancelled" && (
                            <div style={{ marginTop: 10, fontSize: 13 }}>
                                {order.order_status === "ready_for_pickup" && order.final_delivery_date && (
                                    <span style={{ background: "#e8f5e9", color: "#2e7d32", padding: "3px 10px", borderRadius: 12, fontWeight: 600 }}>
                                        🚀 Ready since {new Date(order.final_delivery_date).toLocaleDateString("en-IN")}
                                    </span>
                                )}
                                {["pending", "confirmed"].includes(order.order_status) && !order.all_items_available && (
                                    <span style={{ background: "#fff8e1", color: "#f57f17", padding: "3px 10px", borderRadius: 12 }}>
                                        📅 Tentative: {order.tentative_delivery_date
                                            ? new Date(order.tentative_delivery_date).toLocaleDateString("en-IN")
                                            : "Pending admin confirmation"}
                                    </span>
                                )}
                            </div>
                        )}
                    </Link>
                );
            })}
        </div>
    );
}
