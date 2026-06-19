import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api";

export default function Home() {
    const [featured, setFeatured] = useState([]);
    const [categories, setCategories] = useState([]);

    useEffect(() => {
        api.get("/api/products?limit=8").then((r) => setFeatured(r.data.products || []));
        api.get("/api/products/categories").then((r) => setCategories(r.data.categories || []));
    }, []);

    return (
        <div>
            {/* Hero */}
            <div className="hero">
                <h1>Quality Products, Fast Delivery</h1>
                <p>Browse our collection and place orders with just 20% advance payment.</p>
                <Link to="/products" className="btn btn-primary" style={{ background: "#fff", color: "#0984e3" }}>
                    Shop Now →
                </Link>
            </div>

            {/* Categories */}
            {categories.length > 0 && (
                <div style={{ marginBottom: 32 }}>
                    <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Browse Categories</h2>
                    <div style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 8 }}>
                        {categories.map((cat) => (
                            <Link
                                key={cat.id}
                                to={`/products?category_id=${cat.id}`}
                                style={{
                                    flexShrink: 0, background: "#fff", border: "1px solid #dfe6e9",
                                    borderRadius: 10, padding: "10px 18px", textDecoration: "none",
                                    color: "#2d3436", fontWeight: 500, fontSize: 13, transition: "all 0.2s",
                                }}
                            >
                                🏷️ {cat.name}
                            </Link>
                        ))}
                    </div>
                </div>
            )}

            {/* Featured Products */}
            <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                    <h2 style={{ fontSize: 18, fontWeight: 700 }}>Featured Products</h2>
                    <Link to="/products" style={{ color: "#0984e3", fontSize: 13, textDecoration: "none" }}>View All →</Link>
                </div>
                <div className="products-grid">
                    {featured.map((p) => <ProductCard key={p.id} product={p} />)}
                </div>
            </div>

            {/* How it works */}
            <div className="card" style={{ marginTop: 16 }}>
                <h2>How It Works</h2>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 20, marginTop: 8 }}>
                    {[
                        ["🛒", "Browse & Add to Cart", "Find products and add them to your cart"],
                        ["💳", "Pay 20% Advance", "Pay at least 20% to confirm your order"],
                        ["📅", "Get Delivery Date", "We'll notify you when your order is ready"],
                        ["🏪", "Collect & Pay Balance", "Come to our store and pay the remaining amount"],
                    ].map(([icon, title, desc]) => (
                        <div key={title} style={{ textAlign: "center" }}>
                            <div style={{ fontSize: 36, marginBottom: 8 }}>{icon}</div>
                            <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{title}</div>
                            <div style={{ fontSize: 12, color: "#636e72" }}>{desc}</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

function ProductCard({ product }) {
    const cover = product.images?.find((i) => i.is_cover) || product.images?.[0];
    const hasVariants = product.variants?.length > 0;
    const totalQty = hasVariants
        ? product.variants.reduce((s, v) => s + (v.available_quantity || 0), 0)
        : (product.available_quantity || 0);
    const inStock = totalQty > 0;
    const effectivePrice = parseFloat(product.base_price) * (1 - parseFloat(product.discount_percent || 0) / 100);

    return (
        <Link to={`/products/${product.id}`} className="product-card" style={{ position: "relative" }}>
            {parseFloat(product.discount_percent) > 0 && (
                <div className="product-card-badge">-{product.discount_percent}%</div>
            )}
            {cover ? (
                <img src={cover.image_url} alt={product.name} className="product-card-image" />
            ) : (
                <div className="product-card-img-placeholder">📦</div>
            )}
            <div className="product-card-body">
                <div className="product-card-category">{product.category?.name || ""}</div>
                <div className="product-card-name">{product.name}</div>
                <div className="product-card-price">
                    ₹{effectivePrice.toFixed(2)}
                    {parseFloat(product.discount_percent) > 0 && (
                        <span className="original">₹{parseFloat(product.base_price).toFixed(2)}</span>
                    )}
                </div>
                <div className={`product-card-stock ${inStock ? "in" : "out"}`}>
                    {inStock ? `✓ In Stock (${totalQty})` : "⚡ Available on Pre-order"}
                </div>
            </div>
        </Link>
    );
}
