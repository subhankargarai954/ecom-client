// Category.jsx

import React from "react";
// import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";

import "../comp_style/Category.css";

import ImageCard from "./ImageCard";
import Cart from "./Cart";

function Category(props) {
    const showMore = (categoryId) => {
        console.log(`category ${categoryId} selected`);
    };

    return (
        <div className="category">
            <div className="category-heading">
                <p className="category-head">{props.name}</p>
            </div>

            <div className="category-images">
                {props.images.map((image, index) => {
                    return <ImageCard source={image} key={index} />;
                })}
            </div>

            <Link to={`/products/${props.categoryId}`}>
                <div
                    onClick={() => {
                        showMore(props.categoryId);
                    }}
                    className="category-details"
                >
                    <button className="category-buton"> Show more </button>
                </div>
            </Link>
        </div>
    );
}

export default Category;
