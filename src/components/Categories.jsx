import React from "react";
import { useState, useEffect } from "react";
import axios from "axios";
import Category from "./Category";

import "../comp_style/Categories.css";

function Categories() {
    const BASE_URL = process.env.REACT_APP_BACKEND_BASE_URL;
    const [productsCategory, setProductsCategory] = useState([]);

    const fetchCategories = async () => {
        try {
            let res = await axios.get(`${BASE_URL}/api/products/categories`);

            res = res.data;
            // console.log(res);
            setProductsCategory(res);
        } catch (error) {
            console.log(`error getting data from backend : ${error}`);
        }
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    return (
        <div className="Categories">
            <div className="Categories-heading">All Categories</div>
            <div className="Categories-body">
                {productsCategory.map((product) => {
                    return (
                        <div className="category-item" key={product.id}>
                            <Category
                                name={product.name}
                                images={product.images}
                                categoryId={product.id}
                            />
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default Categories;
