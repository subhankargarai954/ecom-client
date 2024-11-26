import React, { useState } from "react";
import axios from "axios";

import "../comp_style/Signup.css";
import { useNavigate } from "react-router-dom";

function Signup() {
    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [password, setPassword] = useState("");
    const [address, setAddress] = useState("");
    const [errorMessage, setErrorMessage] = useState();
    const [successMessage, setSuccessMessage] = useState("");

    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Name validation: At least two words
        const nameRegex = /^[a-zA-Z]+( [a-zA-Z]+)+$/;
        if (!nameRegex.test(name)) {
            setErrorMessage("Name must contain at least two words.");
            return;
        }

        // Phone validation: 10 digits starting with [6-9]
        const phoneRegex = /^[6-9][0-9]{9}$/;
        if (!phoneRegex.test(phone)) {
            setErrorMessage(
                "Phone number must be valid Indian 10 digits number."
            );
            return;
        }

        // Password validation: At least 4 characters
        if (password.length < 4) {
            setErrorMessage("Password must be at least 4 characters long.");
            return;
        }

        setErrorMessage("");

        try {
            const response = await axios.post(
                `http://localhost:5000/api/auth/signup`,
                {
                    name: name,
                    phone: phone,
                    password: password,
                    address: address,
                }
            );
            console.dir(response.data, { depth: null });

            const token = response.data.token;

            if (token) {
                localStorage.setItem("token", token);
                setSuccessMessage(response.data.message);
            } else {
                setErrorMessage(`${response.data.error}`);
            }
        } catch (error) {
            console.log(`error during signup : ${error}`);
            setErrorMessage(error);
        }

        setTimeout(() => {
            if (successMessage) {
                setSuccessMessage("");
                navigate("/Login");
            }
        }, 3000);
    };

    //     const phoneNo = e.target.value;
    //     phoneNo.length === 10 ? setPhone(`${phoneNo}`) : setPhone(``);
    //     console.log(`${phone}`);
    // };

    return (
        <div className="signup">
            <div className="signup-heading">Signup</div>
            <form onSubmit={handleSubmit} className="signup-form">
                <div className="signup-entries">
                    <div className="signup-labels">
                        Name<span>*</span>
                    </div>
                    <div className="signup-fields name">
                        <input
                            type="text"
                            className="ip-field text"
                            placeholder="Full Name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                        />
                    </div>
                </div>

                <div className="signup-entries">
                    <div className="signup-labels">
                        Phone<span>*</span>
                    </div>
                    <div className="signup-fields phone">
                        <input
                            type="tel"
                            className="ip-field text"
                            placeholder="only 10 digits"
                            pattern="[6-9][0-9]{9}"
                            maxLength={10}
                            onChange={(e) => setPhone(e.target.value)}
                            required
                        />
                    </div>
                </div>

                <div className="signup-entries">
                    <div className="signup-labels">
                        Password<span>*</span>
                    </div>
                    <div className="signup-fields password">
                        <input
                            type="password"
                            className="ip-field password"
                            placeholder="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                </div>

                <div className="signup-entries">
                    <div className="signup-labels"> Address </div>
                    <div className="signup-fields address">
                        <input
                            type="textarea"
                            className="ip-field textarea"
                            placeholder="village, locality"
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                        />
                    </div>
                </div>

                {errorMessage ? (
                    <div className="signup-error-message">{errorMessage}</div>
                ) : (
                    <div className="signup-success-message">
                        {successMessage}
                    </div>
                )}

                <div className="signup-submit">
                    <button className="submit-button" onClick={handleSubmit}>
                        Signup
                    </button>
                </div>
            </form>
        </div>
    );
}

export default Signup;
