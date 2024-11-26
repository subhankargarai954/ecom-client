// CartContext.jsx

import React, { createContext, useContext, useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "./AuthContext";
const CartContext = createContext();

const useCart = () => useContext(CartContext);

const CartProvider = ({ children }) => {
    const { refresh, userLogged } = useAuth();

    const [cartItems, setCartItems] = useState([]);
    const [totalProducts, setTotalProducts] = useState();
    const [totalPrice, setTotalPrice] = useState();

    const getCartItems = async () => {
        console.log(`getCartItems begins`);

        try {
            const token = localStorage.getItem("token");
            const response = await axios.get(
                `http://localhost:5000/api/cart/`,
                { headers: { Authorization: token ? `${token}` : null } }
            );
            console.dir(response.data, { depth: null });

            response.data.error && console.log(`${response.data.error}`);

            if (response.data.error) {
                return response.data.error;
            } else {
                const CartItems = response.data.cartItems;
                const CartItemsFnl = await Promise.all(
                    CartItems &&
                        CartItems.map(async (item) => {
                            let productDetail;
                            let count = item.count;

                            const res = await axios.get(
                                `http://localhost:5000/api/products/product/${item.product_id}`
                            );

                            if (res.data) productDetail = res.data;
                            else
                                console.log(
                                    "could not get product detail from server"
                                );

                            return { product: productDetail, quantity: count };
                        })
                );
                console.dir(CartItemsFnl, { depth: null });
                setCartItems(CartItemsFnl);
            }
        } catch (error) {
            console.log(error);
        }
    };

    useEffect(() => {
        getCartItems();
    }, [refresh]);

    useEffect(() => {
        const itemsOnCart = function () {
            return cartItems.length
                ? cartItems.reduce((acc, item) => acc + item.quantity, 0)
                : 0;
        };

        const totalSum = function () {
            // console.log(`totalPrice()`);
            return cartItems.length
                ? cartItems.reduce(
                      (acc, curr) => acc + curr.product.price * curr.quantity,
                      0
                  )
                : 0;
        };

        setTotalProducts(itemsOnCart());
        setTotalPrice(totalSum());
    }, [cartItems]);

    const printCartItems = () => {
        console.log(`printCartItems() `);
        cartItems
            ? cartItems.map((item, index) => {
                  //   console.log(`___________________________`);
                  console.log(`item index : ${index}`);

                  console.log(`product id : ${item.product.id}`);
                  console.log(`product quantity : ${item.quantity}`);
                  console.log(`total price : ${totalPrice}`);
                  console.log(`total products : ${totalProducts}`);
                  console.log(`\n`);
              })
            : console.log(`no items in cart`);
        console.log(`printCartItems() -------------`);
    };

    const addToCart = async (productDetail, prodCount) => {
        try {
            const token = localStorage.getItem("token");
            const response = await axios.post(
                `http://localhost:5000/api/cart/addToCart`,
                { productId: productDetail.id, count: prodCount },
                { headers: { Authorization: token ? token : null } }
            );

            // if (response.data)
            getCartItems();
        } catch (error) {
            console.log(error);
        }

        // console.log(`addToCart()`);
        // const existingItem = cartItems.length
        //     ? cartItems.find((item) => {
        //           if (item && item.product.id === productDetail.id) return item;
        //       })
        //     : 0;

        // if (existingItem) {
        //     setCartItems(
        //         cartItems.map((item) =>
        //             item.product.id === productDetail.id
        //                 ? { ...item, quantity: item.quantity + prodCount }
        //                 : { ...item }
        //         )
        //     );
        //     console.log(`addToCart : updated`);
        // } else {
        //     setCartItems([
        //         ...cartItems,
        //         { product: productDetail, quantity: prodCount },
        //     ]);
        //     console.log(`addToCart : added`);
        // }
    };

    const removeFromCart = async (productDetail) => {
        try {
            const token = localStorage.getItem("token");
            const response = await axios.post(
                `http://localhost:5000/api/cart/removeFromCart`,
                { productId: productDetail.id },
                { headers: { Authorization: token ? token : null } }
            );
            // if (response.data)
            getCartItems();
        } catch (error) {
            console.log(error);
        }

        // setCartItems(
        //     cartItems.filter((item) => item.product.id !== productDetail.id)
        // );
        console.log(`removeFromCart : removed`);
    };

    const increaseCartItem = async (productDetail) => {
        try {
            const token = localStorage.getItem("token");
            const response = await axios.post(
                `http://localhost:5000/api/cart/increaseCartItem`,
                { productId: productDetail.id },
                { headers: { Authorization: token ? token : null } }
            );

            // if (response.data)
            getCartItems();
        } catch (error) {
            console.log(error);
        }

        console.log(`increaseCartItem() `);
    };

    const decreaseCartItem = async (productDetail) => {
        try {
            const token = localStorage.getItem("token");
            const response = await axios.post(
                `http://localhost:5000/api/cart/decreaseCartItem`,
                { productId: productDetail.id },
                { headers: { Authorization: token ? token : null } }
            );
            response.data && console.dir(response.data, { depth: null });
            getCartItems();
        } catch (error) {
            console.log(error);
        }
    };

    return (
        <CartContext.Provider
            value={{
                getCartItems,
                cartItems,
                addToCart,
                removeFromCart,
                totalProducts,
                totalPrice,
                increaseCartItem,
                decreaseCartItem,
            }}
        >
            {children}
        </CartContext.Provider>
    );
};

export { useCart, CartProvider };
