// Logout.jsx

import React, { useEffect, useState } from "react";

import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useUrlHistory } from "../context/UrlHistoryContext";

import "../comp_style/Logout.css";

function Logout() {
    const { userLogged, updateUserLog } = useAuth();
    const { urlHist } = useUrlHistory();

    const navigate = useNavigate();

    const [counter, setCounter] = useState(5);

    useEffect(() => {
        const func = () => {
            const confirm = window.confirm("Are you sure to logout ?");
            // console.log(`23 userLogged: ${userLogged}`);

            if (confirm) {
                localStorage.removeItem("token");
                updateUserLog(false);
                navigate("/");
            } else {
                navigate(`${urlHist[1]}`);
            }
        };
        func();
    }, []);

    // useEffect(() => {}, []);

    return (
        <div className="logout">
            {/* <div className="logout-inner">You logged out</div>
            <div className="logout-redirect">
                Redirect to Home page in {counter} seconds
            </div> */}
        </div>
    );
}

export default Logout;
