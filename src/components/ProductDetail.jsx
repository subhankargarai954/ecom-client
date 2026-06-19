import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import api from "../api";

export default function ProductDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeImage, setActiveImage] = useState(0);
    const [selectedVariant, setSelectedVariant] = useState(null);
    const [quantity, setQuantity] = useState(1);
    const [addMsg, setAddMsg] = useState("");

    useEffect(() => {
        api.get(`/api/products/${id}`)
            .then((r) => {
                setProduct(r.data.product);
                // Sort images: cover first
                const imgs = (r.data.product.images || []).sort((a, b) => b.is_cover - a.is_cover);
                r.data.product.images = imgs;
                // Auto-select first available variant
                const firstActive = r.data.product.variants?.find((v) => v.is_active && v.available_quantity > 0);
                if (firstActive) setSelectedVariant(firstActive);
                else if (r.data.product.variants?.length > 0) setSelectedVariant(r.data.product.variants[0]);
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [id]);

    if (loading) return <div style={{ padding: 48, color: "#636e72" }}>Loading product…</div>;
    if (!product) return <div className="alert alert-error">Product not found.</div>;

    const hasVariants = product.variants?.length > 0;
    const currentQty = hasVariants
        ? (selectedVariant?.available_quantity || 0)
        : (product.available_quantity || 0);
    const inStock = currentQty > 0;

    const effectivePrice = () => {
        let price = parseFloat(product.base_price);
        if (selectedVariant?.price_override != null) price = parseFloat(selectedVariant.price_override);
        return price * (1 - parseFloat(product.discount_percent || 0) / 100);
    };

    const handleAddToCart = async () => {
        const token = localStorage.getItem("customerToken");
        if (!token) { navigate("/login"); return; }

        try {
            await api.post("/api/cart", {
                product_id: product.id,
                variant_id: selectedVariant?.id || null,
                quantity,
            });
            setAddMsg("✓ Added to cart!");
            setTimeout(() => setAddMsg(""), 2000);
        } catch (err) {
            setAddMsg(err.response?.data?.error || "Failed to add to cart.");
            setTimeout(() => setAddMsg(""), 3000);
        }
    };

    const today = new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
    const tomorrow = new Date(Date.now() + 86400000).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

    return (
        <div>
            <Link to="/products" style={{ color: "#636e72", textDecoration: "none", fontSize: 13, display: "inline-block", marginBottom: 16 }}>
                ← Back to Products
            </Link>

            <div className="product-detail">
                {/* Images */}
                <div className="product-images">
                    {product.images?.length > 0 ? (
                        <>
                            <img
                                src={product.images[activeImage]?.image_url}
                                alt={product.name}
                                className="product-main-image"
                            />
                            {product.images.length > 1 && (
                                <div className="product-thumbnails">
                                    {product.images.map((img, i) => (
                                        <img
                                            key={img.id}
                                            src={img.image_url}
                                            alt=""
                                            className={`product-thumb ${i === activeImage ? "active" : ""}`}
                                            onClick={() => setActiveImage(i)}
                                        />
                                    ))}
                                </div>
                            )}
                        </>
                    ) : (
                        <div style={{ width: "100%", aspectRatio: "1", background: "#f5f6fa", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 80 }}>
                            📦
                        </div>
                    )}
                </div>

                {/* Info */}
                <div className="product-info">
                    {product.category && (
                        <Link to={`/products?category_id=${product.category.id}`} className="category-tag">
                            🏷️ {product.category.name}
                        </Link>
                    )}
                    <h1>{product.name}</h1>

                    <div style={{ margin: "12px 0" }}>
                        <span className="product-price">₹{effectivePrice().toFixed(2)}</span>
                        {parseFloat(product.discount_percent) > 0 && (
                            <>
                                <span className="product-original"> ₹{parseFloat(selectedVariant?.price_override || product.base_price).toFixed(2)}</span>
                                <span className="product-discount">{product.discount_percent}% OFF</span>
                            </>
                        )}
                    </div>

                    <div className={`product-stock ${inStock ? "in" : "out"}`}>
                        {inStock ? `✓ In Stock (${currentQty} available)` : "⚡ Out of stock — Pre-order available"}
                    </div>

                    {/* Delivery info */}
                    <div className={`delivery-box ${inStock ? "today" : "preorder"}`}>
                        {inStock
                            ? `🚀 Ready for pickup today (${today})`
                            : `📅 Pre-order: tentative delivery by ${tomorrow}. Admin will confirm the exact date.`}
                    </div>

                    {/* Variant Selector */}
                    {hasVariants && (
                        <div style={{ marginTop: 20 }}>
                            <div className="variant-label">Select Variant</div>
                            <div className="variant-grid">
                                {product.variants.filter((v) => v.is_active).map((v) => (
                                    <button
                                        key={v.id}
                                        className={`variant-btn ${selectedVariant?.id === v.id ? "selected" : ""} ${v.available_quantity === 0 ? "out-of-stock" : ""}`}
                                        onClick={() => { setSelectedVariant(v); setQuantity(1); }}
                                    >
                                        {v.variant_name}
                                        {v.price_override && <span style={{ display: "block", fontSize: 11, color: "inherit" }}>₹{parseFloat(v.price_override).toFixed(2)}</span>}
                                        {v.available_quantity === 0 && <span style={{ fontSize: 10, display: "block" }}>Out of stock</span>}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Quantity */}
                    <div style={{ marginTop: 16 }}>
                        <div className="variant-label">Quantity</div>
                        <div className="qty-selector">
                            <button onClick={() => setQuantity((q) => Math.max(1, q - 1))}>−</button>
                            <span>{quantity}</span>
                            <button onClick={() => setQuantity((q) => q + 1)}>+</button>
                        </div>
                    </div>

                    {addMsg && (
                        <div className={`alert ${addMsg.startsWith("✓") ? "alert-success" : "alert-error"}`} style={{ marginTop: 12 }}>
                            {addMsg}
                        </div>
                    )}

                    <div style={{ display: "flex", gap: 12, marginTop: 20, flexWrap: "wrap" }}>
                        <button className="btn btn-primary" onClick={handleAddToCart}
                            style={{ flex: 1 }}
                            disabled={hasVariants && !selectedVariant}>
                            🛒 Add to Cart
                        </button>
                        <Link to="/cart" className="btn btn-outline" style={{ flex: 1, justifyContent: "center" }}>
                            View Cart
                        </Link>
                    </div>

                    {!inStock && (
                        <p style={{ fontSize: 12, color: "#636e72", marginTop: 12 }}>
                            💡 You can still place a pre-order. Pay at least 20% advance and we'll notify you with the confirmed delivery date.
                        </p>
                    )}

                    {/* Description */}
                    {product.description && (
                        <div style={{ marginTop: 24 }}>
                            <div className="variant-label">Description</div>
                            <p className="product-desc">{product.description}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
