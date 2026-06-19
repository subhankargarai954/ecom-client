import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api";

export default function Login() {
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
                <h1>Welcome back 👋</h1>
                <p>Sign in to your account</p>
                {error && <div className="alert alert-error">{error}</div>}
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Phone Number</label>
                        <input type="text" placeholder="10-digit phone" value={form.phone}
                            onChange={(e) => setForm({ ...form, phone: e.target.value })} required />
                    </div>
                    <div className="form-group">
                        <label>Password</label>
                        <input type="password" placeholder="Password" value={form.password}
                            onChange={(e) => setForm({ ...form, password: e.target.value })} required />
                    </div>
                    <button type="submit" className="btn btn-primary" style={{ width: "100%", justifyContent: "center" }} disabled={loading}>
                        {loading ? "Signing in…" : "Sign In"}
                    </button>
                </form>
                <p style={{ textAlign: "center", marginTop: 16, fontSize: 14, color: "#636e72" }}>
                    Don't have an account? <Link to="/signup" style={{ color: "#0984e3" }}>Sign Up</Link>
                </p>
            </div>
        </div>
    );
}
