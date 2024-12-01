// App.jsx

import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Home from "./components/Home";
import NavigationBar from "./components/NavigationBar";
import Category from "./components/Categories";
import Products from "./components/Products";
import Product from "./components/Product";
import Profile from "./components/Profile";
import Signup from "./components/Signup";
import Logout from "./components/Logout";
import Footer from "./components/Footer";
import Login from "./components/Login";
import Cart from "./components/Cart";

import "./App.css";

import { useAuth } from "./context/AuthContext";
import { UrlHistoryProvider } from "./context/UrlHistoryContext";

function App() {
    const { userLogged } = useAuth();

    return (
        <BrowserRouter>
            <UrlHistoryProvider>
                <div className="App">
                    {userLogged ? (
                        <NavigationBar
                            list1={["Home", "Category"]}
                            list2={["Cart", "Profile", "Logout"]}
                        />
                    ) : (
                        <NavigationBar
                            list1={["Home", "Category"]}
                            list2={["Login", "Signup", "Admin "]}
                        />
                    )}
                    <Routes>
                        <Route path="/" exact element={<Home />} />
                        <Route path="/Home" exact element={<Home />} />
                        <Route path="/Category" exact element={<Category />} />
                        <Route
                            path="/Cart"
                            exact
                            element={userLogged ? <Cart /> : <Login />}
                        />
                        <Route
                            path="/products/:id"
                            exact
                            element={<Products />}
                        />
                        <Route
                            path="/product/:id"
                            exact
                            element={<Product />}
                        />
                        <Route path="/Signup" exact element={<Signup />} />
                        <Route path="/Login" exact element={<Login />} />
                        <Route
                            path="/Profile"
                            exact
                            element={userLogged ? <Profile /> : <Login />}
                        />
                        <Route path="/Logout" exact element={<Logout />} />
                    </Routes>

                    <Footer />
                </div>
            </UrlHistoryProvider>
        </BrowserRouter>
    );
}

export default App;
