import React, { createContext, useContext, useEffect, useState } from "react";
// import { useLocation } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

const AuthContext = createContext();

const useAuth = () => useContext(AuthContext);

const AuthProvider = ({ children }) => {
    const [userLogged, setUserlogged] = useState(false);
    const [refresh, setRefresh] = useState(0);
    // const [adminLogged, setAdminLogged] = useState(false);
    const [localMemoryToken, setLocalMemoryToken] = useState(
        localStorage.getItem("token") || null
    );

    const updateUserLog = (value) => {
        setUserlogged(value);
        setRefresh((prev) => prev + 1);
        console.log(refresh);
    };

    const checkTokenValidity = () => {
        const token = localStorage.getItem("token");
        console.log(`checkTokenValidity`);
        if (token)
            try {
                const decodedToken = jwtDecode(token);
                const currentTime = Date.now() / 1000;
                if (decodedToken.exp < currentTime) {
                    localStorage.removeItem("token");
                    setLocalMemoryToken(null);
                    setUserlogged(false);
                }
            } catch (error) {
                setUserlogged(false);
                console.log(`Invalid token: ${error}`);
            }
    };

    const updateLocalMemoryToken = () => {
        const token = localStorage.getItem("token");
        setLocalMemoryToken(token ? token : null);
    };

    // on token state update, set userLogged
    useEffect(() => {
        if (localMemoryToken) {
            setUserlogged(true);
            checkTokenValidity();

            const intervalId = setInterval(checkTokenValidity, 5000); // check every minute
            return () => clearInterval(intervalId); // clean interval
        }
        if (localMemoryToken) setUserlogged(true);
        else setUserlogged(false);
    }, [localMemoryToken]);

    useEffect(() => {
        updateLocalMemoryToken();
    }, [userLogged]);

    useEffect(() => {
        const handleStorageChange = (e) => {
            if (e.key === "token") {
                updateLocalMemoryToken();
            }
        };
        window.addEventListener("storage", handleStorageChange);
        // not required but recommended to prevent memory leak
        return () => {
            window.removeEventListener("storage", handleStorageChange);
        };
    }, []);

    return (
        <AuthContext.Provider value={{ userLogged, updateUserLog, refresh }}>
            {children}
        </AuthContext.Provider>
    );
};

export { useAuth, AuthProvider };
