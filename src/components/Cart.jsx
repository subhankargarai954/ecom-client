import React, { useEffect, useState } from "react";
import { useCart } from "../context/CartContext.jsx";

import "../comp_style/Cart.css";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

function Cart() {
    const {
        getCartItems,
        cartItems,
        totalProducts,
        totalPrice,
        increaseCartItem,
        decreaseCartItem,
        removeFromCart,
    } = useCart();
    const { refresh, userLogged } = useAuth();

    const navigate = useNavigate();

    useEffect(() => {
        const func = async () => {
            getCartItems();
        };
        func();
    }, []);

    return (
        <div className="cart">
            <div className="cart-heading"> Cart </div>
            <div className="cart-body">
                <div className="cart-body-items">
                    {totalProducts ? (
                        cartItems.map((item, index) => (
                            <div className="cart-body-item" key={index}>
                                <div className="cart-item-image">
                                    <img src={item.product.image} alt="" />
                                </div>
                                <div className="cart-item-details">
                                    <div className="cart-item-name cart-item-field">
                                        {item.product.name}
                                    </div>
                                    <div className="cart-item-price cart-item-field">
                                        Price: <sup>₹</sup>
                                        {item.product.price} each
                                    </div>
                                    <div className="cart-item-count cart-item-field">
                                        Qty
                                        <div
                                            className="cart-item-count-button"
                                            onClick={async () =>
                                                decreaseCartItem(item.product)
                                            }
                                        >
                                            -
                                        </div>
                                        {item.quantity}
                                        <div
                                            className="cart-item-count-button"
                                            onClick={async () =>
                                                increaseCartItem(item.product)
                                            }
                                        >
                                            +
                                        </div>
                                        <div
                                            className="cart-item-count-button cart-item-remove-button"
                                            onClick={async () =>
                                                removeFromCart(item.product)
                                            }
                                        >
                                            Remove
                                        </div>
                                    </div>
                                    <div className="cart-item-total-price cart-item-field">
                                        Total Price: <sup> ₹ </sup>
                                        {item.product.price * item.quantity}
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="cart-empty">cart is empty</div>
                    )}
                </div>
                {cartItems.length ? (
                    <div className="cart-body-sum">
                        Total price <br /> <sup> ₹ </sup>
                        {totalPrice}
                    </div>
                ) : (
                    <div></div>
                )}
            </div>
        </div>
    );
}

export default Cart;
