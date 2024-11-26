import React, { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import axios from "axios";
import { useLocation } from "react-router-dom";

import "../comp_style/Login.css";

import { useAuth } from "../context/AuthContext";
import { useUrlHistory } from "../context/UrlHistoryContext";

function Login() {
    const [phone, setPhone] = useState("");
    const [password, setPassword] = useState("");
    const [errorMessage, setErrorMessage] = useState();
    const [successMessage, setSuccessMessage] = useState();

    const location = useLocation();
    const navigate = useNavigate();
    const { userLogged, updateUserLog } = useAuth();
    const { urlHist } = useUrlHistory();

    const handleSubmit = async (e) => {
        e.preventDefault();

        const phoneRegex = /^[6-9][0-9]{9}$/;
        if (!phoneRegex.test(phone)) {
            console.log(`${phone}`);
            setErrorMessage(`Provide valid 10 digit Indian phone no.`);
            return;
        }

        setErrorMessage("");

        try {
            const response = await axios.post(
                `http://localhost:5000/api/auth/login`,
                { phone: phone, password: password }
            );

            response.data.error &&
                console.log(`response.error: ${response.data.error}`);

            if (response.data.token) {
                localStorage.setItem("token", response.data.token);
                setSuccessMessage("Login Successful");
                console.log(`userLogged: ${userLogged}`);
 
                setTimeout(() => {
                    setSuccessMessage("");
                    updateUserLog(true);
                    navigate(
                        urlHist[1] === "/Login" || urlHist[1] === "/Logout"
                            ? "/"
                            : `${urlHist[1]}`
                    );
                    console.log(`lgin-s userLogged: ${userLogged}`);
                }, 2000);
            } else setErrorMessage(`${response.data.error}`);
        } catch (error) {
            setErrorMessage(`Login Unsuccessful: ${error}`);
        }
    };

    return (
        <div className="login">
            <div className="login-heading">Login</div>

            <form className="login-form">
                <div className="login-body">
                    <div className="login-body-items">
                        <div className="login-item-label">
                            Phone<span>*</span>
                        </div>
                        <div className="login-item-input">
                            <input
                                type="tel"
                                className="login-input-field login-telephone"
                                placeholder="10 digits only"
                                pattern="[6-9][0-9]{9}"
                                maxLength={10}
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="login-body-items">
                        <div className="login-item-label">
                            Password<span>*</span>
                        </div>
                        <div className="login-item-input">
                            <input
                                type="password"
                                className="login-input-field login-password"
                                placeholder="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                    </div>

                    {errorMessage ? (
                        <div className="login-error-message">
                            {errorMessage}
                        </div>
                    ) : (
                        <div className="login-success-message">
                            {successMessage}
                        </div>
                    )}

                    <div className="login-submit">
                        <button
                            className="login-submit-button"
                            onClick={handleSubmit}
                        >
                            Login
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
}

export default Login;
