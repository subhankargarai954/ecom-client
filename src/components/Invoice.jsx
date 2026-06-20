import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../api";

// Bilingual labels (English / বাংলা) shown together on the bill.
const L = {
    invoice:   ["Tax Invoice", "কর চালান"],
    billTo:    ["Bill To", "গ্রাহক"],
    invoiceNo: ["Invoice No", "চালান নং"],
    orderNo:   ["Order No", "অর্ডার নং"],
    date:      ["Date", "তারিখ"],
    phone:     ["Phone", "ফোন"],
    product:   ["Product", "পণ্য"],
    unit:      ["Unit Price", "একক মূল্য"],
    qty:       ["Qty", "পরিমাণ"],
    amount:    ["Amount", "মোট"],
    subtotal:  ["Subtotal", "সাবটোটাল"],
    total:     ["Grand Total", "সর্বমোট"],
    advance:   ["Advance Paid", "অগ্রিম পরিশোধিত"],
    finalPaid: ["Paid at Delivery", "ডেলিভারিতে পরিশোধিত"],
    balance:   ["Balance Due", "বকেয়া"],
    paidVia:   ["Payment", "পেমেন্ট"],
    deliveredOn: ["Delivered On", "ডেলিভারির তারিখ"],
    thanks:    ["Thank you for your business!", "আপনার সাথে ব্যবসা করার জন্য ধন্যবাদ!"],
    print:     ["Print / Save PDF", "প্রিন্ট / PDF সংরক্ষণ"],
    downloadPdf: ["Download PDF", "PDF ডাউনলোড"],
    back:      ["Back", "ফিরে যান"],
    store:     ["MyStore — Cement Products", "মাইস্টোর — সিমেন্ট পণ্য"],
};
const Bi = ({ k }) => (<span className="bi"><span className="en">{L[k][0]}</span> <span className="bn">{L[k][1]}</span></span>);

export default function Invoice() {
    const { id } = useParams();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get(`/api/orders/${id}`).then((r) => setOrder(r.data.order)).catch(console.error).finally(() => setLoading(false));
    }, [id]);

    const downloadPdf = async () => {
        try {
            const res = await api.get(`/api/orders/${id}/invoice.pdf`, { responseType: "blob" });
            const url = window.URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
            const a = document.createElement("a");
            a.href = url; a.download = `invoice-${order.invoice_no || order.id}.pdf`; a.click();
            window.URL.revokeObjectURL(url);
        } catch { alert("Could not download PDF."); }
    };

    if (loading) return <div style={{ padding: 48, color: "var(--text-muted)" }}>Loading…</div>;
    if (!order) return <div className="alert alert-error">Invoice not found.</div>;

    const inr = (n) => "₹" + Number(n).toFixed(2);
    const total = parseFloat(order.total_amount);
    const advance = parseFloat(order.advance_paid);
    const final = parseFloat(order.final_paid);
    const balance = Math.max(0, total - advance - final);

    return (
        <div className="invoice-wrap">
            <div className="invoice-actions no-print">
                <Link to={`/orders/${order.id}`} className="btn btn-outline btn-sm">← {L.back[0]} / {L.back[1]}</Link>
                <button className="btn btn-outline btn-sm" onClick={downloadPdf}>⬇ {L.downloadPdf[0]}</button>
                <button className="btn btn-primary btn-sm" onClick={() => window.print()}>🖨 {L.print[0]}</button>
            </div>

            <div className="invoice-paper">
                <div className="invoice-head">
                    <div>
                        <div className="invoice-brand">🏭 {L.store[0]}</div>
                        <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{L.store[1]}</div>
                    </div>
                    <div>
                        <div className="invoice-title"><Bi k="invoice" /></div>
                        <div className="invoice-meta">
                            <div>{L.invoiceNo[0]}: <strong>{order.invoice_no || `INV-${order.id}`}</strong></div>
                            <div>{L.orderNo[0]}: #{order.id}</div>
                            <div>{L.date[0]}: {new Date(order.actual_delivery_date || order.created_at).toLocaleDateString("en-IN")}</div>
                        </div>
                    </div>
                </div>

                <div className="invoice-grid">
                    <div>
                        <div className="invoice-section-label"><Bi k="billTo" /></div>
                        <div style={{ fontWeight: 700 }}>{order.user?.name}</div>
                        <div style={{ color: "var(--text-muted)" }}>{L.phone[0]}: {order.user?.phone}</div>
                        {order.user?.address && <div style={{ color: "var(--text-muted)" }}>{order.user.address}</div>}
                    </div>
                    <div style={{ textAlign: "right" }}>
                        <div className="invoice-section-label"><Bi k="paidVia" /></div>
                        <div>{order.advance_payment_mode === "online" ? "Online" : "Cash"} {order.final_payment_mode ? `+ ${order.final_payment_mode}` : ""}</div>
                        {order.actual_delivery_date && <div style={{ color: "var(--text-muted)" }}>{L.deliveredOn[0]}: {new Date(order.actual_delivery_date).toLocaleDateString("en-IN")}</div>}
                    </div>
                </div>

                <table className="invoice-table">
                    <thead>
                        <tr>
                            <th><Bi k="product" /></th>
                            <th style={{ textAlign: "right" }}><Bi k="unit" /></th>
                            <th style={{ textAlign: "right" }}><Bi k="qty" /></th>
                            <th style={{ textAlign: "right" }}><Bi k="amount" /></th>
                        </tr>
                    </thead>
                    <tbody>
                        {order.items?.map((it) => {
                            const unit = parseFloat(it.unit_price);
                            return (
                                <tr key={it.id}>
                                    <td>
                                        <div style={{ fontWeight: 600 }}>{it.product?.name}</div>
                                        {it.product?.name_bn && <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{it.product.name_bn}</div>}
                                        {it.variant && <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{it.variant.variant_name}</div>}
                                    </td>
                                    <td style={{ textAlign: "right" }}>{inr(unit)}</td>
                                    <td style={{ textAlign: "right" }}>{it.quantity}</td>
                                    <td style={{ textAlign: "right" }}>{inr(unit * it.quantity)}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>

                <div className="invoice-totals">
                    <div className="row"><span><Bi k="subtotal" /></span><span>{inr(total)}</span></div>
                    <div className="row"><span><Bi k="advance" /></span><span>{inr(advance)}</span></div>
                    {final > 0 && <div className="row"><span><Bi k="finalPaid" /></span><span>{inr(final)}</span></div>}
                    <div className="row grand"><span><Bi k="balance" /></span><span style={{ color: balance > 0 ? "var(--warn)" : "var(--ok)" }}>{inr(balance)}</span></div>
                </div>

                <div style={{ textAlign: "center", marginTop: 28, color: "var(--text-muted)", fontSize: 13 }}>
                    <Bi k="thanks" />
                </div>
            </div>
        </div>
    );
}
