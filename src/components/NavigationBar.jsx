// NavigationBar.jsx

import React, { useEffect, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";

import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";

import "../comp_style/NavigationBar.css";

function NavigationBar({ list1, list2 }) {
    const { totalProducts } = useCart();
    // const { userLogged, updateUserLog } = useAuth();

    const [totalItems, setTotalItems] = useState(0);

    // const navigate = useNavigate();
    // const urlLocation = useLocation();
    // const [currUrl, setCurrUrl] = useState(urlLocation);

    // useEffect(() => {
    // setCurrUrl( );
    // }, [urlLocation]);

    useEffect(() => {
        setTotalItems(totalProducts);
    }, [totalProducts]);

    // const handleLogout = (x) => {
    // console.log(x);

    // if (x === "Logout") {
    // const confirm = window.confirm("Are you sure to Logout ?");

    // if (confirm) {
    // localStorage.removeItem("token");
    // updateUserLog(false);
    // console.log(`if ${userLogged}`);
    // } else {
    // console.log(`else ${userLogged}`);
    // navigate('/Logout');
    // }
    // }
    // };

    const handleCheck = () => {
        // console.log(`currUrl: ${currUrl}`);
    };

    return (
        <div className="NavigationBar" onClick={handleCheck}>
            <div className="navbar-logo">
                <NavLink to={"/"} className="navbar-logo-navlink">
                    Logo
                </NavLink>
            </div>
            <div className="navbar-container">
                <div className="navbar-container-child">
                    <div className="navbar-child-element">
                        {list1.map((item, index) => (
                            <NavLink
                                to={`/${item}`}
                                className="navbar-navlink"
                                key={index}
                            >
                                {item}
                            </NavLink>
                        ))}
                    </div>
                </div>
                <div className="navbar-container-child">
                    <div className="navbar-child-element">
                        {list2.map((item, index) => (
                            <NavLink
                                to={`/${item}`}
                                className="navbar-navlink navlink-cart"
                                key={index}
                                onClick={() => {
                                    // handleLogout(item);
                                }}
                            >
                                {item}
                                {item === "Cart" ? (
                                    <div className="navlink-cart-count">
                                        {totalItems}
                                    </div>
                                ) : (
                                    <></>
                                )}
                            </NavLink>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default NavigationBar;
