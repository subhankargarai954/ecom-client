// Products.jsx

import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import axios from "axios";

import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";

import "../comp_style/Products.css";
import Cart from "./Cart";

function Products() {
    const BASE_URL = process.env.REACT_APP_BACKEND_BASE_URL;

    const { id } = useParams();
    const { addToCart } = useCart();
    const { userLogged } = useAuth();

    const [allProducts, setAllProducts] = useState([]);
    const [categoryName, setCategoryName] = useState({});

    useEffect(() => {
        const getAllProducts = async () => {
            try {
                let response = await axios.get(
                    `${BASE_URL}/api/products/categories/${id}`
                );

                // console.log("response.data", response.data);

                setAllProducts(response.data);
            } catch (error) {
                console.log(
                    `problem retrieving allProduct details from backend : ${error}`
                );
            }
        };
        const getCategoryName = async () => {
            try {
                let response = await axios.get(
                    `${BASE_URL}/api/products/categoryname/${id}`
                );
                // console.log(response.data);
                setCategoryName(response.data[0]);
            } catch (error) {
                console.log(error);
            }
        };

        getAllProducts();
        getCategoryName();
        // console.log(`end of useEffect, getAllProducts is executed`);
    }, [id]);

    return (
        <div className="products">
            <div className="products-heading">
                <Link to={"/"}>
                    <div className="products-heading-nav-button">
                        All Category
                    </div>
                </Link>

                <div className="products-category-title">
                    Category: {categoryName.name}
                </div>

                <Link to={"/"}>
                    <div className="products-heading-nav-button">Link</div>
                </Link>
            </div>
            <div className="products-list">
                {allProducts.length > 0 ? (
                    allProducts.map((product) => (
                        <div className="products-card" key={product.id}>
                            <Link to={`/product/${product.id}`}>
                                <img
                                    className="products-image"
                                    src={product.image}
                                    alt={product.name}
                                />
                            </Link>
                            <div className="products-info">
                                <div className="products-name">
                                    {product.name}
                                </div>

                                <div className="products-price-curr">
                                    Price: <sup>₹</sup>
                                    <span>{product.price} </span>
                                </div>
                                <div className="products-price-next">
                                    Next Price: <sup> ₹</sup>
                                    <span>
                                        {product.price + product.price * 0.1}
                                    </span>
                                </div>

                                <div className="products-add-to-cart-div">
                                    {!userLogged ? (
                                        <Link to={`/Login`}>
                                            <div
                                                className="products-addtocart-button"
                                                onClick={() =>
                                                    addToCart(product, 1)
                                                }
                                            >
                                                Add to Cart
                                            </div>
                                        </Link>
                                    ) : (
                                        <div
                                            className="products-addtocart-button"
                                            onClick={() =>
                                                addToCart(product, 1)
                                            }
                                        >
                                            Add to Cart
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <>
                        <div className="loading"> Loading products... </div>
                    </>
                )}
            </div>
            {userLogged && <Cart />}
        </div>
    );
}

export default Products;
