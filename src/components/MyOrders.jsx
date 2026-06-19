import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import api from "../api";

const STATUS_BADGE = {
    pending: "badge-pending", confirmed: "badge-confirmed",
    ready_for_pickup: "badge-ready", delivered: "badge-delivered", cancelled: "badge-cancelled",
};

export default function MyOrders() {
    const { t } = useTranslation();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get("/api/orders")
            .then((r) => setOrders(r.data.orders || []))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <div style={{ padding: 48, color: "#636e72" }}>{t("orders.loading")}</div>;

    if (orders.length === 0) {
        return (
            <div className="empty-state">
                <div className="icon">📋</div>
                <h2>{t("orders.none")}</h2>
                <p>{t("orders.none_hint")}</p>
                <Link to="/products" className="btn btn-primary" style={{ marginTop: 16 }}>{t("orders.start_shopping")}</Link>
            </div>
        );
    }

    return (
        <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 20 }}>{t("orders.title")}</h1>
            {orders.map((order) => {
                const pending_amount = Math.max(0,
                    parseFloat(order.total_amount) - parseFloat(order.advance_paid) - parseFloat(order.final_paid || 0)
                );
                return (
                    <Link to={`/orders/${order.id}`} key={order.id} className="order-card">
                        <div className="order-card-header">
                            <div>
                                <div className="order-number">
                                    {t("orders.order")} <strong>#{order.id}</strong>
                                </div>
                                <div style={{ fontSize: 12, color: "#636e72", marginTop: 2 }}>
                                    {new Date(order.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
                                </div>
                            </div>
                            <div style={{ textAlign: "right" }}>
                                <span className={`badge ${STATUS_BADGE[order.order_status]}`}>
                                    {t(`order_status.${order.order_status}`)}
                                </span>
                            </div>
                        </div>

                        <div style={{ display: "flex", gap: 24, fontSize: 13, color: "#636e72", flexWrap: "wrap" }}>
                            <span>
                                {t("orders.items_count", { count: order.items?.length || 0 })}
                            </span>
                            <span>{t("orders.total")}: <strong style={{ color: "#2d3436" }}>₹{parseFloat(order.total_amount).toFixed(2)}</strong></span>
                            <span>{t("orders.advance")}: <strong style={{ color: "#00b894" }}>₹{parseFloat(order.advance_paid).toFixed(2)}</strong></span>
                            {pending_amount > 0 && (
                                <span>{t("orders.due_at_pickup")}: <strong style={{ color: "#e17055" }}>₹{pending_amount.toFixed(2)}</strong></span>
                            )}
                        </div>

                        {/* Delivery date */}
                        {order.order_status !== "cancelled" && (
                            <div style={{ marginTop: 10, fontSize: 13 }}>
                                {order.order_status === "ready_for_pickup" && order.final_delivery_date && (
                                    <span style={{ background: "#e8f5e9", color: "#2e7d32", padding: "3px 10px", borderRadius: 12, fontWeight: 600 }}>
                                        🚀 {t("orders.ready_since", { date: new Date(order.final_delivery_date).toLocaleDateString("en-IN") })}
                                    </span>
                                )}
                                {["pending", "confirmed"].includes(order.order_status) && !order.all_items_available && (
                                    <span style={{ background: "#fff8e1", color: "#f57f17", padding: "3px 10px", borderRadius: 12 }}>
                                        📅 {order.tentative_delivery_date
                                            ? t("orders.tentative", { date: new Date(order.tentative_delivery_date).toLocaleDateString("en-IN") })
                                            : t("orders.pending_confirmation")}
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
