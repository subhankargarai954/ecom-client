import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import api from "../api";

export default function Profile() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [form, setForm] = useState({ name: "", email: "", address: "" });
    const [saving, setSaving] = useState(false);
    const [msg, setMsg] = useState("");
    const [isError, setIsError] = useState(false);

    useEffect(() => {
        api.get("/api/auth/profile").then((r) => {
            setUser(r.data.user);
            setForm({ name: r.data.user.name || "", email: r.data.user.email || "", address: r.data.user.address || "" });
        });
    }, []);

    const saveProfile = async (e) => {
        e.preventDefault();
        setSaving(true); setMsg(""); setIsError(false);
        try {
            await api.put("/api/auth/profile", form);
            setMsg(t("profile.updated"));
            const stored = JSON.parse(localStorage.getItem("customerUser") || "{}");
            localStorage.setItem("customerUser", JSON.stringify({ ...stored, name: form.name }));
        } catch (err) {
            setMsg(err.response?.data?.error || "Update failed.");
            setIsError(true);
        } finally { setSaving(false); }
    };

    const logout = () => {
        localStorage.removeItem("customerToken");
        localStorage.removeItem("customerUser");
        navigate("/login");
    };

    if (!user) return <div style={{ padding: 48, color: "#636e72" }}>{t("profile.loading")}</div>;

    return (
        <div style={{ maxWidth: 520, margin: "0 auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <h1 style={{ fontSize: 22, fontWeight: 700 }}>{t("profile.title")}</h1>
                <button className="btn btn-outline btn-sm" onClick={logout}>{t("nav.logout")}</button>
            </div>

            {msg && <div className={`alert ${isError ? "alert-error" : "alert-success"}`}>{msg}</div>}

            <div className="card">
                <h2>{t("profile.account_details")}</h2>
                <div style={{ marginBottom: 16, padding: "10px 14px", background: "#f5f6fa", borderRadius: 8, fontSize: 13, color: "#636e72" }}>
                    📞 {t("profile.phone_note", { phone: user.phone })}
                </div>
                <form onSubmit={saveProfile}>
                    <div className="form-group">
                        <label>{t("profile.full_name")}</label>
                        <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                    </div>
                    <div className="form-group">
                        <label>{t("profile.email")}</label>
                        <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                    </div>
                    <div className="form-group">
                        <label>{t("profile.address")}</label>
                        <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
                    </div>
                    <button type="submit" className="btn btn-primary" disabled={saving}>
                        {saving ? t("profile.saving") : t("profile.save_changes")}
                    </button>
                </form>
            </div>

            <div className="card">
                <h2>{t("profile.member_since")}</h2>
                <p style={{ fontSize: 14, color: "#636e72" }}>
                    {new Date(user.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
                </p>
            </div>
        </div>
    );
}
