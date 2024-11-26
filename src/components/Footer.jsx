// Footer.jsx

import React from "react";

import "../comp_style/Footer.css";
import { useUrlHistory } from "../context/UrlHistoryContext";

function Footer() {
    const { urlHist } = useUrlHistory();

    return (
        <div className="footer">
            <h1>Footer</h1>
            <h3>{urlHist}</h3>
        </div>
    );
}

export default Footer;
