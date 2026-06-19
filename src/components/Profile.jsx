import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";

export default function Profile() {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [form, setForm] = useState({ name: "", email: "", address: "" });
    const [saving, setSaving] = useState(false);
    const [msg, setMsg] = useState("");
    const [pwForm, setPwForm] = useState({ current: "", new: "", confirm: "" });

    useEffect(() => {
        api.get("/api/auth/profile").then((r) => {
            setUser(r.data.user);
            setForm({ name: r.data.user.name || "", email: r.data.user.email || "", address: r.data.user.address || "" });
        });
    }, []);

    const saveProfile = async (e) => {
        e.preventDefault();
        setSaving(true); setMsg("");
        try {
            await api.put("/api/auth/profile", form);
            setMsg("Profile updated!");
            const stored = JSON.parse(localStorage.getItem("customerUser") || "{}");
            localStorage.setItem("customerUser", JSON.stringify({ ...stored, name: form.name }));
        } catch (err) {
            setMsg(err.response?.data?.error || "Update failed.");
        } finally { setSaving(false); }
    };

    const logout = () => {
        localStorage.removeItem("customerToken");
        localStorage.removeItem("customerUser");
        navigate("/login");
    };

    if (!user) return <div style={{ padding: 48, color: "#636e72" }}>Loading…</div>;

    return (
        <div style={{ maxWidth: 520, margin: "0 auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <h1 style={{ fontSize: 22, fontWeight: 700 }}>My Profile</h1>
                <button className="btn btn-outline btn-sm" onClick={logout}>Logout</button>
            </div>

            {msg && <div className={`alert ${msg.includes("Updated") || msg.includes("updated") ? "alert-success" : "alert-error"}`}>{msg}</div>}

            <div className="card">
                <h2>Account Details</h2>
                <div style={{ marginBottom: 16, padding: "10px 14px", background: "#f5f6fa", borderRadius: 8, fontSize: 13, color: "#636e72" }}>
                    📞 Phone: <strong>{user.phone}</strong> (cannot be changed)
                </div>
                <form onSubmit={saveProfile}>
                    <div className="form-group">
                        <label>Full Name</label>
                        <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                    </div>
                    <div className="form-group">
                        <label>Email</label>
                        <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                    </div>
                    <div className="form-group">
                        <label>Address</label>
                        <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
                    </div>
                    <button type="submit" className="btn btn-primary" disabled={saving}>
                        {saving ? "Saving…" : "Save Changes"}
                    </button>
                </form>
            </div>

            <div className="card">
                <h2>Member Since</h2>
                <p style={{ fontSize: 14, color: "#636e72" }}>
                    {new Date(user.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
                </p>
            </div>
        </div>
    );
}
