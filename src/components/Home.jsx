// Home.jsx

import React from "react";
import { useState, useEffect } from "react";
import axios from "axios";

import "../comp_style/Home.css";

import Categories from "./Categories";

function Home() {
    return (
        <div className="home">
            <Categories />
        </div>
    );
}

export default Home;
