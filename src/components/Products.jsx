import React, { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import api from "../api";
import { localized } from "../i18n/localize";

export default function Products() {
    const { t, i18n } = useTranslation();
    const [searchParams, setSearchParams] = useSearchParams();
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);

    const search = searchParams.get("search") || "";
    const category_id = searchParams.get("category_id") || "";
    const page = parseInt(searchParams.get("page") || "1");

    useEffect(() => {
        api.get("/api/products/categories").then((r) => setCategories(r.data.categories || []));
    }, []);

    useEffect(() => {
        setLoading(true);
        const params = new URLSearchParams({ page, limit: 20 });
        if (search) params.set("search", search);
        if (category_id) params.set("category_id", category_id);

        api.get(`/api/products?${params}`)
            .then((r) => { setProducts(r.data.products || []); setTotal(r.data.total || 0); })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [search, category_id, page]);

    const setParam = (key, val) => {
        const p = new URLSearchParams(searchParams);
        if (val) p.set(key, val); else p.delete(key);
        p.delete("page");
        setSearchParams(p);
    };

    return (
        <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 20 }}>
                {category_id ? (localized(categories.find((c) => String(c.id) === String(category_id)), "name", i18n.language) || t("products.all_products")) : t("products.all_products")}
            </h1>

            <div className="search-bar">
                <input
                    placeholder={t("products.search_placeholder")}
                    value={search}
                    onChange={(e) => setParam("search", e.target.value)}
                />
                <select value={category_id} onChange={(e) => setParam("category_id", e.target.value)}>
                    <option value="">{t("products.all_categories")}</option>
                    {categories.map((c) => <option key={c.id} value={c.id}>{localized(c, "name", i18n.language)}</option>)}
                </select>
            </div>

            {loading ? (
                <div style={{ textAlign: "center", padding: 48, color: "var(--text-muted)" }}>{t("products.loading")}</div>
            ) : products.length === 0 ? (
                <div className="empty-state">
                    <div className="icon">🔍</div>
                    <h2>{t("products.none_found")}</h2>
                    <p>{t("products.none_found_hint")}</p>
                </div>
            ) : (
                <>
                    <div style={{ color: "var(--text-muted)", fontSize: 13, marginBottom: 16 }}>{t("products.count", { count: total })}</div>
                    <div className="products-grid">
                        {products.map((p) => <ProductCard key={p.id} product={p} t={t} />)}
                    </div>
                    {total > 20 && (
                        <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 20 }}>
                            {page > 1 && (
                                <button className="btn btn-outline btn-sm" onClick={() => setParam("page", page - 1)}>‹ {t("products.prev")}</button>
                            )}
                            <span style={{ padding: "6px 12px", fontSize: 13, color: "var(--text-muted)" }}>{t("products.page", { page })}</span>
                            {page * 20 < total && (
                                <button className="btn btn-outline btn-sm" onClick={() => setParam("page", page + 1)}>{t("products.next")} ›</button>
                            )}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

function ProductCard({ product, t }) {
    const { i18n } = useTranslation();
    const [imgError, setImgError] = useState(false);
    const cover = product.images?.find((i) => i.is_cover) || product.images?.[0];
    const showImage = cover && !imgError;
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
            {showImage ? (
                <img src={cover.image_url} alt={product.name} className="product-card-image"
                    onError={() => setImgError(true)} />
            ) : (
                <div className="product-card-img-placeholder">
                    <span className="placeholder-icon">🖼️</span>
                    <span className="placeholder-text">No image</span>
                </div>
            )}
            <div className="product-card-body">
                <div className="product-card-category">{localized(product.category, "name", i18n.language)}</div>
                <div className="product-card-name">{localized(product, "name", i18n.language)}</div>
                <div className="product-card-price">
                    ₹{effectivePrice.toFixed(2)}
                    {parseFloat(product.discount_percent) > 0 && (
                        <span className="original">₹{parseFloat(product.base_price).toFixed(2)}</span>
                    )}
                </div>
                <div className={`product-card-stock ${inStock ? "in" : "out"}`}>
                    {inStock ? `✓ ${t("product_card.in_stock", { count: totalQty })}` : `⚡ ${t("product_card.preorder")}`}
                </div>
            </div>
        </Link>
    );
}
