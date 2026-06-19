import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import api from "../api";

export default function Login() {
    const { t } = useTranslation();
    const [form, setForm] = useState({ phone: "", password: "" });
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(""); setLoading(true);
        try {
            const { data } = await api.post("/api/auth/login", form);
            localStorage.setItem("customerToken", data.token);
            localStorage.setItem("customerUser", JSON.stringify(data.user));
            navigate("/");
        } catch (err) {
            setError(err.response?.data?.error || "Login failed.");
        } finally { setLoading(false); }
    };

    return (
        <div className="auth-page">
            <div className="auth-box">
                <h1>{t("auth.welcome_back")}</h1>
                <p>{t("auth.signin_subtitle")}</p>
                {error && <div className="alert alert-error">{error}</div>}
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>{t("auth.phone")}</label>
                        <input type="text" placeholder={t("auth.phone_placeholder")} value={form.phone}
                            onChange={(e) => setForm({ ...form, phone: e.target.value })} required />
                    </div>
                    <div className="form-group">
                        <label>{t("auth.password")}</label>
                        <input type="password" placeholder={t("auth.password_placeholder")} value={form.password}
                            onChange={(e) => setForm({ ...form, password: e.target.value })} required />
                    </div>
                    <button type="submit" className="btn btn-primary" style={{ width: "100%", justifyContent: "center" }} disabled={loading}>
                        {loading ? t("auth.signing_in") : t("auth.signin")}
                    </button>
                </form>
                <p style={{ textAlign: "center", marginTop: 16, fontSize: 14, color: "#636e72" }}>
                    {t("auth.no_account")} <Link to="/signup" style={{ color: "#0984e3" }}>{t("nav.signup")}</Link>
                </p>
            </div>
        </div>
    );
}
