import React, { useEffect, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import api from "../api";
import LanguageSwitcher from "./LanguageSwitcher";

export default function Navbar() {
    const navigate = useNavigate();
    const { t } = useTranslation();
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
                <Link to="/" className="navbar-brand">🛍️ {t("nav.brand")}</Link>
                <div className="navbar-links">
                    <NavLink to="/products">{t("nav.products")}</NavLink>
                    {user && <NavLink to="/orders">{t("nav.my_orders")}</NavLink>}
                </div>
                <div className="navbar-right">
                    {/* Language switcher — placed just before the cart / auth buttons */}
                    <LanguageSwitcher />
                    {user ? (
                        <>
                            <Link to="/cart" className="cart-icon">
                                🛒{cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
                            </Link>
                            <Link to="/profile" className="btn btn-outline btn-sm">👤 {user.name?.split(" ")[0]}</Link>
                            <button className="btn btn-outline btn-sm" onClick={logout}>{t("nav.logout")}</button>
                        </>
                    ) : (
                        <>
                            <Link to="/login" className="btn btn-outline btn-sm">{t("nav.login")}</Link>
                            <Link to="/signup" className="btn btn-primary btn-sm">{t("nav.signup")}</Link>
                        </>
                    )}
                </div>
            </div>
        </nav>
    );
}
