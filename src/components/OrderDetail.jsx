import React, { useEffect, useState } from "react";
import { useParams, useLocation, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import api from "../api";
import { localized } from "../i18n/localize";

const STEPS = ["pending", "confirmed", "ready_for_pickup", "delivered"];

export default function OrderDetail() {
    const { t, i18n } = useTranslation();
    const { id } = useParams();
    const location = useLocation();
    const justPlaced = location.state?.justPlaced;
    const orderData = location.state?.orderData;

    const STEP_LABELS = [
        t("order_detail.step_placed"),
        t("order_detail.step_confirmed"),
        t("order_detail.step_ready"),
        t("order_detail.step_delivered"),
    ];

    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [cancelling, setCancelling] = useState(false);
    const [cancelReason, setCancelReason] = useState("");
    const [showCancel, setShowCancel] = useState(false);
    const [message, setMessage] = useState(justPlaced ? "✅ " + t("order_detail.placed_success") : "");

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
            setMessage(t("order_detail.cancel_success"));
            setShowCancel(false);
            const r = await api.get(`/api/orders/${id}`);
            setOrder(r.data.order);
        } catch (err) {
            alert(err.response?.data?.error || "Could not cancel order.");
        } finally { setCancelling(false); }
    };

    if (loading) return <div style={{ padding: 48, color: "#636e72" }}>{t("profile.loading")}</div>;
    if (!order) return <div className="alert alert-error">{t("orders.none")}</div>;

    const stepIdx = STEPS.indexOf(order.order_status);
    const pending_amount = Math.max(0,
        parseFloat(order.total_amount) - parseFloat(order.advance_paid) - parseFloat(order.final_paid || 0)
    );

    return (
        <div>
            <Link to="/orders" style={{ color: "#636e72", textDecoration: "none", fontSize: 13, display: "inline-block", marginBottom: 16 }}>
                ← {t("order_detail.back")}
            </Link>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
                <h1 style={{ fontSize: 22, fontWeight: 700 }}>{t("order_detail.order")} #{order.id}</h1>
                <span className={`badge badge-${order.order_status === "ready_for_pickup" ? "ready" : order.order_status}`} style={{ fontSize: 13, padding: "6px 14px" }}>
                    {t(`order_status.${order.order_status}`)}
                </span>
            </div>

            {message && <div className="alert alert-success">{message}</div>}

            {justPlaced && orderData && (
                <div className="card" style={{ background: "#e8f5e9", border: "1px solid #c8e6c9" }}>
                    <h2 style={{ color: "#2e7d32" }}>🎉 {t("order_detail.confirmed_title")}</h2>
                    <p style={{ fontSize: 14, color: "#388e3c" }}>
                        {orderData.all_items_available
                            ? t("order_detail.ready_today_msg")
                            : t("order_detail.preorder_msg", { date: orderData.delivery_date })}
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
                    <strong>{t("order_detail.cancelled_title")}</strong>
                    {order.cancellation_reason && ` — ${order.cancellation_reason}`}
                    {order.payment_status !== "refunded" && (
                        <div style={{ marginTop: 6 }}>💵 {t("order_detail.refund_pending", { amount: `₹${parseFloat(order.advance_paid).toFixed(2)}` })}</div>
                    )}
                    {order.payment_status === "refunded" && (
                        <div style={{ marginTop: 6 }}>✅ {t("order_detail.refund_issued", { amount: `₹${parseFloat(order.advance_paid).toFixed(2)}` })}</div>
                    )}
                </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                {/* Delivery */}
                <div className="card">
                    <h2>{t("order_detail.delivery_info")}</h2>
                    <table style={{ width: "100%", fontSize: 14 }}>
                        <tbody>
                            <tr>
                                <td style={{ color: "#636e72", padding: "4px 0" }}>{t("order_detail.all_available")}</td>
                                <td style={{ textAlign: "right", fontWeight: 600 }}>
                                    {order.all_items_available ? `${t("order_detail.yes")} ✓` : t("order_detail.no_preorder")}
                                </td>
                            </tr>
                            {order.tentative_delivery_date && (
                                <tr>
                                    <td style={{ color: "#636e72", padding: "4px 0" }}>{t("order_detail.tentative_date")}</td>
                                    <td style={{ textAlign: "right", color: "#f57f17" }}>~{fmt(order.tentative_delivery_date)}</td>
                                </tr>
                            )}
                            {order.final_delivery_date && (
                                <tr>
                                    <td style={{ color: "#636e72", padding: "4px 0" }}>{t("order_detail.final_pickup_date")}</td>
                                    <td style={{ textAlign: "right", fontWeight: 700, color: "#00b894" }}>{fmt(order.final_delivery_date)}</td>
                                </tr>
                            )}
                            {order.actual_delivery_date && (
                                <tr>
                                    <td style={{ color: "#636e72", padding: "4px 0" }}>{t("order_detail.collected_on")}</td>
                                    <td style={{ textAlign: "right", fontWeight: 600 }}>{new Date(order.actual_delivery_date).toLocaleDateString("en-IN")}</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                    {order.order_status === "ready_for_pickup" && (
                        <div className="delivery-box today" style={{ marginTop: 12 }}>
                            🚀 {t("order_detail.ready_msg")}
                        </div>
                    )}
                    {["pending", "confirmed"].includes(order.order_status) && !order.all_items_available && !order.final_delivery_date && (
                        <div className="delivery-box preorder" style={{ marginTop: 12 }}>
                            ⏳ {t("order_detail.waiting_admin")}
                        </div>
                    )}
                </div>

                {/* Payment */}
                <div className="card">
                    <h2>{t("order_detail.payment")}</h2>
                    <table style={{ width: "100%", fontSize: 14 }}>
                        <tbody>
                            <tr><td style={{ color: "#636e72", padding: "4px 0" }}>{t("order_detail.total")}</td><td style={{ textAlign: "right", fontWeight: 700 }}>₹{parseFloat(order.total_amount).toFixed(2)}</td></tr>
                            <tr><td style={{ color: "#636e72", padding: "4px 0" }}>{t("order_detail.advance_paid")}</td><td style={{ textAlign: "right", color: "#00b894", fontWeight: 600 }}>₹{parseFloat(order.advance_paid).toFixed(2)}</td></tr>
                            {parseFloat(order.final_paid) > 0 && (
                                <tr><td style={{ color: "#636e72", padding: "4px 0" }}>{t("order_detail.paid_at_pickup")}</td><td style={{ textAlign: "right", color: "#00b894", fontWeight: 600 }}>₹{parseFloat(order.final_paid).toFixed(2)}</td></tr>
                            )}
                            <tr style={{ borderTop: "1px solid #f5f6fa" }}>
                                <td style={{ padding: "8px 0 4px", fontWeight: 700 }}>{t("order_detail.balance_due")}</td>
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
                <h2>{t("order_detail.items_in_order")}</h2>
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
                                <div style={{ fontWeight: 600 }}>{localized(item.product, "name", i18n.language)}</div>
                                {item.variant && <div style={{ fontSize: 12, color: "#636e72" }}>{item.variant.variant_name}</div>}
                                <div style={{ fontSize: 13, color: "#636e72" }}>₹{effective.toFixed(2)} × {item.quantity}</div>
                                {!item.was_available_at_order && <span className="badge badge-pending" style={{ fontSize: 10 }}>{t("order_detail.preorder")}</span>}
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
                            {t("order_detail.cancel_order")}
                        </button>
                    ) : (
                        <div className="card" style={{ textAlign: "left" }}>
                            <h2 style={{ color: "#d63031" }}>{t("order_detail.cancel_confirm")}</h2>
                            <div className="alert alert-error">
                                {t("order_detail.cancel_refund_note", { amount: `₹${parseFloat(order.advance_paid).toFixed(2)}` })}
                            </div>
                            <div className="form-group">
                                <label>{t("order_detail.reason_optional")}</label>
                                <input value={cancelReason} onChange={(e) => setCancelReason(e.target.value)}
                                    placeholder={t("order_detail.reason_placeholder")} />
                            </div>
                            <div style={{ display: "flex", gap: 10 }}>
                                <button className="btn btn-outline" onClick={() => setShowCancel(false)}>{t("order_detail.keep_order")}</button>
                                <button className="btn btn-danger" onClick={handleCancel} disabled={cancelling}>
                                    {cancelling ? t("order_detail.cancelling") : t("order_detail.yes_cancel")}
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
