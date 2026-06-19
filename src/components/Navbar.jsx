import React, { useEffect, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import api from "../api";

export default function Navbar() {
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem("customerUser") || "null");
    const [cartCount, setCartCount] = useState(0);

    useEffect(() => {
        if (!user) return;
        api.get("/api/cart").then((r) => {
            setCartCount(r.data.cart?.reduce((s, i) => s + i.quantity, 0) || 0);
        }).catch(() => {});
    }, [user]);

    const logout = () => {
        localStorage.removeItem("customerToken");
        localStorage.removeItem("customerUser");
        navigate("/login");
    };

    return (
        <nav className="navbar">
            <div className="navbar-inner">
                <Link to="/" className="navbar-brand">🛍️ MyStore</Link>
                <div className="navbar-links">
                    <NavLink to="/products">Products</NavLink>
                    {user && <NavLink to="/orders">My Orders</NavLink>}
                </div>
                <div className="navbar-right">
                    {user ? (
                        <>
                            <Link to="/cart" className="cart-icon">
                                🛒{cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
                            </Link>
                            <Link to="/profile" className="btn btn-outline btn-sm">👤 {user.name?.split(" ")[0]}</Link>
                            <button className="btn btn-outline btn-sm" onClick={logout}>Logout</button>
                        </>
                    ) : (
                        <>
                            <Link to="/login" className="btn btn-outline btn-sm">Login</Link>
                            <Link to="/signup" className="btn btn-primary btn-sm">Sign Up</Link>
                        </>
                    )}
                </div>
            </div>
        </nav>
    );
}
