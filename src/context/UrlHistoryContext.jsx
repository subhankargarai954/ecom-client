// UrlHistoryContext.jsx

import React, {
    createContext,
    useContext,
    useEffect,
    // useRef,
    useState,
} from "react";
import { useLocation } from "react-router-dom";

const UrlHistoryContext = createContext();

const useUrlHistory = () => useContext(UrlHistoryContext);

const UrlHistoryProvider = ({ children }) => {
    const location = useLocation();

    const [urlHist, setUrlHist] = useState(location.pathname);

    // const lastPathName = useRef(location.pathname);

    useEffect(() => {
        if (urlHist[urlHist.length - 1] !== location.pathname) {
            setUrlHist((prevUrls) => {
                if (prevUrls.length < 2)
                    return [...prevUrls, location.pathname];
                else return [prevUrls[1], location.pathname];
            });
        }

        // console.dir(urlHist, { depth: null });
    }, [location.pathname]);

    return (
        <UrlHistoryContext.Provider value={{ urlHist }}>
            {children}
        </UrlHistoryContext.Provider>
    );
};

export { useUrlHistory, UrlHistoryProvider };
