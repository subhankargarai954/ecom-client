import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api";

export default function Signup() {
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
                <h1>Create Account</h1>
                <p>Sign up to start shopping</p>
                {error && <div className="alert alert-error">{error}</div>}
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Full Name *</label>
                        <input placeholder="Your name" value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                    </div>
                    <div className="form-group">
                        <label>Phone Number *</label>
                        <input placeholder="10-digit phone" value={form.phone}
                            onChange={(e) => setForm({ ...form, phone: e.target.value })} required />
                    </div>
                    <div className="form-group">
                        <label>Email (optional)</label>
                        <input type="email" placeholder="you@example.com" value={form.email}
                            onChange={(e) => setForm({ ...form, email: e.target.value })} />
                    </div>
                    <div className="form-group">
                        <label>Password *</label>
                        <input type="password" placeholder="Choose a password" value={form.password}
                            onChange={(e) => setForm({ ...form, password: e.target.value })} required />
                    </div>
                    <div className="form-group">
                        <label>Address (optional)</label>
                        <input placeholder="Your address" value={form.address}
                            onChange={(e) => setForm({ ...form, address: e.target.value })} />
                    </div>
                    <button type="submit" className="btn btn-primary" style={{ width: "100%", justifyContent: "center" }} disabled={loading}>
                        {loading ? "Creating account…" : "Create Account"}
                    </button>
                </form>
                <p style={{ textAlign: "center", marginTop: 16, fontSize: 14, color: "#636e72" }}>
                    Already have an account? <Link to="/login" style={{ color: "#0984e3" }}>Sign In</Link>
                </p>
            </div>
        </div>
    );
}
