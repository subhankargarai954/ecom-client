import React, { useEffect, useState } from "react";
import { useParams, useLocation, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import api from "../api";
import { localized } from "../i18n/localize";
import { payWithGateway } from "../payment";

export default function OrderDetail() {
    const { t, i18n } = useTranslation();
    const { id } = useParams();
    const location = useLocation();
    const justPlaced = location.state?.justPlaced;
    const placedMode = location.state?.mode;
    const user = JSON.parse(localStorage.getItem("customerUser") || "null");

    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [cancelling, setCancelling] = useState(false);
    const [cancelReason, setCancelReason] = useState("");
    const [showCancel, setShowCancel] = useState(false);
    const [paying, setPaying] = useState(false);
    const [message, setMessage] = useState(
        justPlaced ? (placedMode === "cash" ? "⏳ " + t("pay.awaiting_admin") : "🎉 " + t("pay.online_confirmed")) : ""
    );

    const reload = async () => {
        const r = await api.get(`/api/orders/${id}`);
        setOrder(r.data.order);
    };

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
            await reload();
        } catch (err) {
            alert(err.response?.data?.error || "Could not cancel order.");
        } finally { setCancelling(false); }
    };

    // Complete the advance payment for an order still awaiting payment.
    const completeAdvance = async () => {
        setPaying(true);
        try {
            const { data } = await api.post(`/api/orders/${id}/pay-advance/online`);
            const result = await payWithGateway(data, {
                description: `Advance for order #${id}`,
                prefill: { name: user?.name, contact: user?.phone, email: user?.email },
            });
            await api.post(`/api/orders/${id}/verify-payment`, {
                payment_id: data.payment_id,
                gateway_payment_id: result.gateway_payment_id,
                signature: result.signature,
            });
            setMessage("🎉 " + t("pay.online_confirmed"));
            await reload();
        } catch (err) {
            alert(err.response?.data?.error || err.message || "Payment failed.");
        } finally { setPaying(false); }
    };

    // Pay the remaining balance online.
    const payBalance = async () => {
        setPaying(true);
        try {
            const { data } = await api.post(`/api/orders/${id}/pay-final/online`);
            const result = await payWithGateway(data, {
                description: `Balance for order #${id}`,
                prefill: { name: user?.name, contact: user?.phone, email: user?.email },
            });
            await api.post(`/api/orders/${id}/verify-final-payment`, {
                payment_id: data.payment_id,
                gateway_payment_id: result.gateway_payment_id,
                signature: result.signature,
            });
            setMessage("✅ " + t("pay.balance_paid"));
            await reload();
        } catch (err) {
            alert(err.response?.data?.error || err.message || "Payment failed.");
        } finally { setPaying(false); }
    };

    // Request to pay the balance in cash → needs admin confirmation.
    const requestCash = async () => {
        setPaying(true);
        try {
            await api.post(`/api/orders/${id}/pay-final/cash`);
            setMessage("💵 " + t("pay.cash_request_sent"));
            await reload();
        } catch (err) {
            alert(err.response?.data?.error || "Could not request cash payment.");
        } finally { setPaying(false); }
    };

    const downloadInvoice = async () => {
        try {
            const res = await api.get(`/api/orders/${id}/invoice.pdf`, { responseType: "blob" });
            const url = window.URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
            const a = document.createElement("a");
            a.href = url; a.download = `invoice-${order.invoice_no || order.id}.pdf`;
            a.click(); window.URL.revokeObjectURL(url);
        } catch { alert("Could not download invoice."); }
    };

    if (loading) return <div style={{ padding: 48, color: "var(--text-muted)" }}>{t("profile.loading")}</div>;
    if (!order) return <div className="alert alert-error">{t("orders.none")}</div>;

    // Full lifecycle timeline: Placed → Confirmed → [In Production] → Ready →
    // Delivered → Fully Paid. Completed steps are green; the first incomplete
    // step is the current one. A delivered-with-due order shows Delivered done
    // and Fully Paid as the pending step.
    const { steps: tlSteps } = buildTimeline(order);
    const preConfirm = ["awaiting_payment", "pending"].includes(order.order_status);
    const pending_amount = Math.max(0,
        parseFloat(order.total_amount) - parseFloat(order.advance_paid) - parseFloat(order.final_paid || 0)
    );
    // Customer can clear the balance online any time after confirmation, including
    // a pending due after delivery. Online payments are auto-confirmed (no admin
    // approval); cash dues are collected & approved by the admin.
    const canPayBalance = pending_amount > 0 && ["confirmed", "in_production", "ready_for_pickup", "delivered"].includes(order.order_status);
    // A cash due request already raised and awaiting admin confirmation.
    const cashRequested = (order.payments || []).find(
        (p) => p.payment_type === "final" && p.status === "pending" && p.method === "cash"
    );
    const canPayOnline = pending_amount >= 1; // gateway minimum is ₹1
    // Advance committed but not yet confirmed (cash awaiting admin / online awaiting pay).
    const pendingAdvance = (order.payments || []).find(
        (p) => p.payment_type === "advance" && p.status === "pending"
    );
    const advanceConfirmed = parseFloat(order.advance_paid) > 0;

    return (
        <div>
            <Link to="/orders" style={{ color: "var(--text-muted)", textDecoration: "none", fontSize: 13, display: "inline-block", marginBottom: 16 }}>
                ← {t("order_detail.back")}
            </Link>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
                <h1 style={{ fontSize: 22, fontWeight: 700 }}>{t("order_detail.order")} #{order.id}</h1>
                <span className={`badge badge-${order.order_status === "ready_for_pickup" ? "ready" : order.order_status}`} style={{ fontSize: 13, padding: "6px 14px" }}>
                    {t(`order_status.${order.order_status}`)}
                </span>
            </div>

            {message && <div className={`alert ${order.order_status === "pending" ? "alert-warning" : "alert-success"}`}>{message}</div>}

            {/* Pre-confirmation banner (awaiting payment / cash confirmation) */}
            {preConfirm && (
                <div className="card" style={{ background: "var(--alert-warning-bg)" }}>
                    <p style={{ fontSize: 14, color: "var(--alert-warning-text)", fontWeight: 500 }}>
                        {order.order_status === "pending" ? "⏳ " + t("pay.awaiting_admin") : "💳 " + t("pay.complete_payment")}
                    </p>
                    {order.order_status === "awaiting_payment" && (
                        <button className="btn btn-primary" style={{ marginTop: 12 }} onClick={completeAdvance} disabled={paying}>
                            {paying ? "…" : "📲 " + t("pay.complete_payment")}
                        </button>
                    )}
                </div>
            )}

            {/* Timeline — full lifecycle; completed steps are green */}
            {order.order_status !== "cancelled" && (
                <div className="card">
                    <div style={{ display: "flex", gap: 0 }}>
                        {tlSteps.map((st, i) => {
                            const done = st.done;
                            const active = st.active;
                            return (
                                <div key={st.key} style={{ flex: 1, textAlign: "center", position: "relative" }}>
                                    {i < tlSteps.length - 1 && (
                                        <div style={{
                                            position: "absolute", top: 16, left: "50%", right: "-50%",
                                            height: 2, background: done ? "var(--ok)" : "var(--border)", zIndex: 0,
                                        }} />
                                    )}
                                    <div style={{
                                        width: 32, height: 32, borderRadius: "50%",
                                        background: done ? "var(--ok)" : active ? "var(--accent)" : "var(--border)",
                                        color: done || active ? "#fff" : "var(--text-muted)",
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                        margin: "0 auto 8px", position: "relative", zIndex: 1,
                                        fontWeight: 700, fontSize: 14, border: "2px solid",
                                        borderColor: done ? "var(--ok)" : active ? "var(--accent)" : "var(--border)",
                                    }}>
                                        {done ? "✓" : i + 1}
                                    </div>
                                    <div style={{ fontSize: 11, color: active ? "var(--accent)" : done ? "var(--ok)" : "var(--text-muted)", fontWeight: active ? 700 : 400 }}>
                                        {t(`timeline.${st.key}`)}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Payment & invoice actions */}
            {(canPayBalance || order.order_status === "delivered") && (
                <div className="card" style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                    {canPayBalance && (cashRequested ? (
                        <div className="alert alert-warning" style={{ margin: 0, flex: "1 1 100%" }}>
                            💵 {t("pay.cash_requested", { amount: `₹${pending_amount.toFixed(2)}` })}
                        </div>
                    ) : (
                        <>
                            {canPayOnline && (
                                <button className="btn btn-primary" onClick={payBalance} disabled={paying}>
                                    {paying ? "…" : "📲 " + (order.order_status === "delivered" ? t("pay.pay_due_online") : t("pay.pay_balance_online")) + ` (₹${pending_amount.toFixed(2)})`}
                                </button>
                            )}
                            <button className="btn btn-outline" onClick={requestCash} disabled={paying}>
                                💵 {t("pay.request_cash")} (₹{pending_amount.toFixed(2)})
                            </button>
                        </>
                    ))}
                    {order.order_status === "delivered" && (
                        <>
                            <Link to={`/invoice/${order.id}`} className="btn btn-outline">🧾 {t("pay.view_invoice")}</Link>
                            <button className="btn btn-outline" onClick={downloadInvoice}>⬇ PDF</button>
                        </>
                    )}
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
                                <td style={{ color: "var(--text-muted)", padding: "4px 0" }}>{t("order_detail.all_available")}</td>
                                <td style={{ textAlign: "right", fontWeight: 600 }}>
                                    {order.all_items_available ? `${t("order_detail.yes")} ✓` : t("order_detail.no_preorder")}
                                </td>
                            </tr>
                            {order.tentative_delivery_date && (
                                <tr>
                                    <td style={{ color: "var(--text-muted)", padding: "4px 0" }}>{t("order_detail.tentative_date")}</td>
                                    <td style={{ textAlign: "right", color: "var(--alert-warning-text)" }}>~{fmt(order.tentative_delivery_date)}</td>
                                </tr>
                            )}
                            {order.final_delivery_date && (
                                <tr>
                                    <td style={{ color: "var(--text-muted)", padding: "4px 0" }}>{t("order_detail.final_pickup_date")}</td>
                                    <td style={{ textAlign: "right", fontWeight: 700, color: "var(--ok)" }}>{fmt(order.final_delivery_date)}</td>
                                </tr>
                            )}
                            {order.actual_delivery_date && (
                                <tr>
                                    <td style={{ color: "var(--text-muted)", padding: "4px 0" }}>{t("order_detail.collected_on")}</td>
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
                            <tr><td style={{ color: "var(--text-muted)", padding: "4px 0" }}>{t("order_detail.total")}</td><td style={{ textAlign: "right", fontWeight: 700 }}>₹{parseFloat(order.total_amount).toFixed(2)}</td></tr>
                            {advanceConfirmed ? (
                                <tr><td style={{ color: "var(--text-muted)", padding: "4px 0" }}>{t("order_detail.advance_paid")}</td><td style={{ textAlign: "right", color: "var(--ok)", fontWeight: 600 }}>₹{parseFloat(order.advance_paid).toFixed(2)}</td></tr>
                            ) : pendingAdvance ? (
                                <tr><td style={{ color: "var(--warn)", padding: "4px 0" }}>{t("order_detail.advance_to_pay")}</td><td style={{ textAlign: "right", color: "var(--warn)", fontWeight: 700 }}>₹{parseFloat(pendingAdvance.amount).toFixed(2)}</td></tr>
                            ) : (
                                <tr><td style={{ color: "var(--text-muted)", padding: "4px 0" }}>{t("order_detail.advance_paid")}</td><td style={{ textAlign: "right", color: "var(--text-muted)", fontWeight: 600 }}>₹0.00</td></tr>
                            )}
                            {parseFloat(order.final_paid) > 0 && (
                                <tr><td style={{ color: "var(--text-muted)", padding: "4px 0" }}>{t("order_detail.paid_at_pickup")}</td><td style={{ textAlign: "right", color: "var(--ok)", fontWeight: 600 }}>₹{parseFloat(order.final_paid).toFixed(2)}</td></tr>
                            )}
                            <tr style={{ borderTop: "1px solid var(--border)" }}>
                                <td style={{ padding: "8px 0 4px", fontWeight: 700 }}>{t("order_detail.balance_due")}</td>
                                <td style={{ textAlign: "right", fontWeight: 700, color: pending_amount > 0 ? "var(--warn)" : "var(--ok)" }}>
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
                        <div key={item.id} style={{ display: "flex", gap: 12, alignItems: "center", padding: "12px 0", borderBottom: "1px solid var(--border)" }}>
                            {cover ? (
                                <img src={cover.image_url} alt="" style={{ width: 60, height: 60, borderRadius: 8, objectFit: "cover" }} />
                            ) : (
                                <div style={{ width: 60, height: 60, borderRadius: 8, background: "var(--surface-2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28 }}>📦</div>
                            )}
                            <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: 600 }}>{localized(item.product, "name", i18n.language)}</div>
                                {item.variant && <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{item.variant.variant_name}</div>}
                                <div style={{ fontSize: 13, color: "var(--text-muted)" }}>₹{effective.toFixed(2)} × {item.quantity}</div>
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
                            <h2 style={{ color: "var(--bad)" }}>{t("order_detail.cancel_confirm")}</h2>
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

// Full order lifecycle for the timeline. The step matching the CURRENT status is
// `active` (amber); steps the order has moved PAST are `done` (green ✓); later
// steps are pending (grey). "delivered" is done on handover; the final
// "fully_paid" step is active while a balance remains.
function buildTimeline(order) {
    const balance = parseFloat(order.total_amount) - parseFloat(order.advance_paid) - parseFloat(order.final_paid || 0);
    const s = order.order_status;
    const keys = ["placed", "confirmed", ...(order.is_made_to_order ? ["in_production"] : []), "ready_for_pickup", "delivered", "fully_paid"];
    let activeKey;
    if (s === "awaiting_payment" || s === "pending") activeKey = "placed";
    else if (s === "confirmed") activeKey = "confirmed";
    else if (s === "in_production") activeKey = "in_production";
    else if (s === "ready_for_pickup") activeKey = "ready_for_pickup";
    else if (s === "delivered") activeKey = balance > 0.01 ? "fully_paid" : null; // null = fully complete
    else activeKey = "placed";
    const activeIndex = activeKey ? keys.indexOf(activeKey) : keys.length;
    const steps = keys.map((key, i) => ({ key, done: i < activeIndex, active: i === activeIndex }));
    return { steps };
}
