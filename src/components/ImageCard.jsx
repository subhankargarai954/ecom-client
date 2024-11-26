
// ImageCard.jsx

import React from "react";

import "../comp_style/ImageCard.css";

function ImageCard(props) {
    return (
        <div className="image-div">
            <img
                onClick={props.onClick}
                src={props.source}
                alt="img not rendered"
                className="image"
            />
        </div>
    );
}

export default ImageCard;
