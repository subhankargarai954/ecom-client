import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import api from "../api";

export default function Signup() {
    const { t } = useTranslation();
    const [form, setForm] = useState({ name: "", phone: "", email: "", password: "", address: "" });
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(""); setLoading(true);
        try {
            const { data } = await api.post("/api/auth/signup", form);
            localStorage.setItem("customerToken", data.token);
            localStorage.setItem("customerUser", JSON.stringify(data.user));
            navigate("/");
        } catch (err) {
            setError(err.response?.data?.error || "Signup failed.");
        } finally { setLoading(false); }
    };

    return (
        <div className="auth-page">
            <div className="auth-box">
                <h1>{t("auth.create_account")}</h1>
                <p>{t("auth.signup_subtitle")}</p>
                {error && <div className="alert alert-error">{error}</div>}
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>{t("auth.full_name")} *</label>
                        <input placeholder={t("auth.name_placeholder")} value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                    </div>
                    <div className="form-group">
                        <label>{t("auth.phone")} *</label>
                        <input placeholder={t("auth.phone_placeholder")} value={form.phone}
                            onChange={(e) => setForm({ ...form, phone: e.target.value })} required />
                    </div>
                    <div className="form-group">
                        <label>{t("auth.email_optional")}</label>
                        <input type="email" placeholder={t("auth.email_placeholder")} value={form.email}
                            onChange={(e) => setForm({ ...form, email: e.target.value })} />
                    </div>
                    <div className="form-group">
                        <label>{t("auth.password")} *</label>
                        <input type="password" placeholder={t("auth.choose_password")} value={form.password}
                            onChange={(e) => setForm({ ...form, password: e.target.value })} required />
                    </div>
                    <div className="form-group">
                        <label>{t("auth.address_optional")}</label>
                        <input placeholder={t("auth.address_placeholder")} value={form.address}
                            onChange={(e) => setForm({ ...form, address: e.target.value })} />
                    </div>
                    <button type="submit" className="btn btn-primary" style={{ width: "100%", justifyContent: "center" }} disabled={loading}>
                        {loading ? t("auth.creating") : t("auth.create_account")}
                    </button>
                </form>
                <p style={{ textAlign: "center", marginTop: 16, fontSize: 14, color: "var(--text-muted)" }}>
                    {t("auth.have_account")} <Link to="/login" style={{ color: "var(--accent)" }}>{t("auth.signin")}</Link>
                </p>
            </div>
        </div>
    );
}
