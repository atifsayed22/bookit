import { useState, useEffect } from "react";
import logo from "../assets/image.png";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { SignedIn, SignedOut, UserButton } from "@clerk/clerk-react";
import { useAuth } from "../context/AuthContext";
import axiosInstance from "../axiosInstance";

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const { user, isLoaded, isSignedIn } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // 🔹 Fetch & sync user role
  useEffect(() => {
    const loadUserRole = async () => {
      if (isLoaded && isSignedIn && user?.id) {
        try {
          await axiosInstance.post("/users/sync", {
            clerkId: user.id,
            email: user.emailAddresses[0]?.emailAddress,
            name: user.fullName,
            imageUrl: user.imageUrl,
          });
          const { data } = await axiosInstance.get(`/users/${user.id}`);
          setUserRole(data.user.role);
        } catch (err) {
          console.error("Role fetch failed:", err);
        }
      }
      setIsLoading(false);
    };
    loadUserRole();
  }, [user, isLoaded, isSignedIn]);

  const navConfig = {
    customer: [
      { name: "Browse Travel", href: "/customer/browse"},
      { name: "My Bookings", href: "/customer/bookings"},
    ],
    business: [
      { name: "Profile", href: "/business/profile",  },
      { name: "Packages", href: "/business/services"},
      { name: "Bookings", href: "/business/appointments"},
    ],
    admin: [
      { name: "Dashboard", href: "/admin/dashboard"},
      { name: "Agencies", href: "/admin/businesses"},
      { name: "Users", href: "/admin/users"},
    ],
  };

  const theme = {
    customer: "blue",
    business: "green",
    admin: "purple",
  }[userRole] || "blue";

  if (isLoading) return <div className="h-16 bg-gray-100 animate-pulse" />;

  return (
    <nav className="bg-white border-b shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-16">
        {/* Logo */}
        <Link to="/" className="font-bold text-xl flex items-center gap-2">
          <img src={logo} alt="BookVerse Logo" className="h-10 w-auto" />
          {userRole && (
            <span
              className={`text-sm px-2 py-1 rounded-full bg-${theme}-100 text-${theme}-700`}
            >
              {userRole}
            </span>
          )}
        </Link>

        {/* Desktop Nav */}
        <SignedIn>
          <div className="hidden md:flex items-center gap-3">
            {navConfig[userRole]?.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  location.pathname === item.href
                    ? `text-${theme}-700 bg-${theme}-100`
                    : `text-gray-700 hover:text-${theme}-700`
                }`}
              >
                {item.icon} {item.name}
              </Link>
            ))}
          </div>
        </SignedIn>

        {/* Auth Buttons / Clerk */}
        <div className="flex items-center gap-3">
          <SignedOut>
            <Link
              to="/login"
              className={`bg-${theme}-600 hover:bg-${theme}-700 text-white px-4 py-2 rounded-md`}
            >
              Sign In
            </Link>
          </SignedOut>

          <SignedIn>
            <UserButton afterSignOutUrl="/" />
            <button
              onClick={() => setIsMenuOpen((p) => !p)}
              className="md:hidden p-2 rounded-md hover:bg-gray-100"
            >
              <span className="text-xl">☰</span>
            </button>
          </SignedIn>
        </div>
      </div>

      {/* Mobile Nav */}
      <SignedIn>
        {isMenuOpen && (
          <div className="md:hidden border-t bg-gray-50 py-2">
            {navConfig[userRole]?.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                onClick={() => setIsMenuOpen(false)}
                className={`block px-4 py-2 ${
                  location.pathname === item.href
                    ? `text-${theme}-700 bg-${theme}-100`
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                {item.icon} {item.name}
              </Link>
            ))}
          </div>
        )}
      </SignedIn>
    </nav>
  );
};

export default Navbar;
