// Product.jsx

import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import axios from "axios";

import "../comp_style/Product.css";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";

function Product() {
    const BASE_URL = process.env.REACT_APP_BACKEND_BASE_URL;

    const { id } = useParams();
    const { addToCart } = useCart();
    const { userLogged } = useAuth();

    const [productDetail, setProductDetail] = useState({});
    const [productImages, setProductImages] = useState([]);
    const [selectedImageUrl, setSelectedImageUrl] = useState(
        productDetail.image
    );

    const [prodQty, setProdQty] = useState(1);
    const incCount = () => {
        setProdQty(prodQty + 1);
    };
    const decCount = () => {
        if (prodQty > 1) setProdQty(prodQty - 1);
    };

    useEffect(() => {
        const getProductDetails = async () => {
            try {
                const response = await axios.get(
                    `${BASE_URL}/api/products/product/${id}`
                );
                setProductDetail(response.data);
                setSelectedImageUrl(response.data.image);
            } catch (error) {
                console.log(
                    `product details could not retrieved from backend : ${error}`
                );
            }
        };
        getProductDetails();
    }, [id]);

    useEffect(() => {
        const getProductImages = async () => {
            try {
                const response = await axios.get(
                    `${BASE_URL}/api/products/product/images/${id}`
                );

                const images = response.data;
                images.unshift({ image_url: productDetail.image });
                setProductImages(images);
            } catch (error) {
                console.log(
                    `product images not retrieved from backend : ${error}`
                );
            }
        };

        if (productDetail) {
            getProductImages();
        }
    }, [id, productDetail.image]);

    const handleImageClick = (imageUrl) => setSelectedImageUrl(imageUrl);

    return (
        <div className="product">
            <div className="product-heading">
                {/* {productDetail.name} */}
                <div className="product-heading-nav-button">Back</div>
            </div>

            <div className="product-card">
                {/* product card */}
                <div className="product-images">
                    {/* product images */}
                    <div className="product-image-large">
                        <img src={selectedImageUrl} alt="image-large" />
                    </div>
                    <div className="product-image-array">
                        {productImages.map((image, index) => (
                            <div
                                className="product-image-small"
                                key={index}
                                onClick={() =>
                                    handleImageClick(image.image_url)
                                }
                            >
                                <img src={image.image_url} alt="image-small" />
                            </div>
                        ))}
                    </div>
                </div>
                <div className="product-details">
                    {/* product details */}
                    <div className="product-detail-card product-detail-name">
                        {productDetail.name}
                    </div>
                    <div className="product-detail-card product-detail-price">
                        <span>₹</span> {productDetail.price}
                    </div>
                    <div className="product-detail-card product-detail-info">
                        {productDetail.more_info}
                    </div>
                    <div className="product-detail-card product-detail-qty">
                        {"Qty:"}
                        <div
                            className="product-detail-qty-button"
                            onClick={() => decCount()}
                        >
                            {"-"}
                        </div>
                        <div className="qty-button-text">{prodQty}</div>
                        <div
                            className="product-detail-qty-button"
                            onClick={() => incCount()}
                        >
                            {"+"}
                        </div>
                    </div>

                    <div className="product-detail-button cart-button">
                        {!userLogged ? (
                            <Link to={`/Login`}>
                                <div className="cart-login">Add to Cart</div>
                            </Link>
                        ) : (
                            <div
                                className="cart-login"
                                onClick={() =>
                                    addToCart(productDetail, prodQty)
                                }
                            >
                                Add to Cart
                            </div>
                        )}
                    </div>

                    <div className="product-detail-button buy-button">
                        Buy Now
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Product;
