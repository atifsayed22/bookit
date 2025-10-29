import { createContext, useContext } from "react";
import { useUser } from "@clerk/clerk-react";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const { user, isLoaded, isSignedIn } = useUser();
    
    const value = {
        user,
        isLoaded,
        isSignedIn
    };
    
    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};