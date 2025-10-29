import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { SignIn, SignUp, SignedOut, SignedIn } from "@clerk/clerk-react";
import Browse from "./pages/customer/Browse";
import MyBookings from "./pages/customer/MyBookings";
import BookingPage from "./pages/customer/BookingPage";
import AgencyPackages from "./pages/customer/AgencyPackages";
import BusinessProfile from "./pages/business/BusinessProfile";
import Services from "./pages/business/Services";
import Appointments from "./pages/business/Appointments";
import BusinessCalendar from "./pages/business/BusinessCalendar";
import RoleSelection from "./pages/RoleSelection";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <Router>
      <Navbar />
      <main className="min-h-screen bg-gray-50">
        <Routes>
          <Route
            path="/"
            element={
              <>
                <SignedOut>
                  <div className="flex flex-col justify-center items-center h-screen bg-gray-100">
                    <div className="mb-4 p-3 bg-yellow-100 text-yellow-800 rounded text-center max-w-md">
                      <b>Note:</b> The backend is deployed on Render. After login or signup, it may take a few seconds to wake up and respond. Please be patient if you experience a short delay.
                    </div>
                    <SignIn 
                      redirectUrl="/select-role"
                      signUpUrl="/sign-up"
                    />
                  </div>
                </SignedOut>
                <SignedIn>
                  <Navigate to="/select-role" replace />
                </SignedIn>
              </>
            }
          />
          <Route
            path="/sign-up"
            element={
              <>
                <SignedOut>
                  <div className="flex flex-col justify-center items-center h-screen bg-gray-100">
                    <div className="mb-4 p-3 bg-yellow-100 text-yellow-800 rounded text-center max-w-md">
                      <b>Note:</b> The backend is deployed on Render. After login or signup, it may take a few seconds to wake up and respond. Please be patient if you experience a short delay.
                    </div>
                    <SignUp 
                      redirectUrl="/select-role"
                      signInUrl="/"
                    />
                  </div>
                </SignedOut>
                <SignedIn>
                  <Navigate to="/select-role" replace />
                </SignedIn>
              </>
            }
          />
          <Route
            path="/select-role"
            element={
              <ProtectedRoute>
                <RoleSelection />
              </ProtectedRoute>
            }
          />
          
          {/* Customer Dashboard - Redirect to Browse */}
          <Route
            path="/customer/dashboard"
            element={<Navigate to="/customer/browse" replace />}
          />
          
          {/* Customer Browse Page */}
          <Route
            path="/customer/browse"
            element={
              <ProtectedRoute>
                <Browse />
              </ProtectedRoute>
            }
          />
          
          {/* Customer Bookings Page */}
          <Route
            path="/customer/bookings"
            element={
              <ProtectedRoute>
                <MyBookings />
              </ProtectedRoute>
            }
          />
          
          {/* Agency Packages Page */}
          <Route
            path="/agency/:agencyId/packages"
            element={
              <ProtectedRoute>
                <AgencyPackages />
              </ProtectedRoute>
            }
          />
          
          {/* Agency Detail/Info Page - redirect to packages */}
          <Route
            path="/agency/:agencyId"
            element={
              <ProtectedRoute>
                <AgencyPackages />
              </ProtectedRoute>
            }
          />
          
          {/* Customer Booking Page - Travel Agency Booking */}
          <Route
            path="/agency/:agencyId/book"
            element={
              <ProtectedRoute>
                <BookingPage />
              </ProtectedRoute>
            }
          />
          
          {/* Legacy route support */}
          <Route
            path="/business/:businessId/book"
            element={
              <ProtectedRoute>
                <BookingPage />
              </ProtectedRoute>
            }
          />
          
          {/* Business Dashboard Route */}
          <Route
            path="/business/dashboard"
            element={
              <ProtectedRoute>
                <div className="container mx-auto px-4 py-8">
                  <h1 className="text-3xl font-bold">Business Dashboard 🏢</h1>
                  <p className="text-gray-600 mt-2">Manage your business and appointments here!</p>
                </div>
              </ProtectedRoute>
            }
          />

          {/* Business Profile Route */}
          <Route
            path="/business/profile"
            element={
              <ProtectedRoute>
                <BusinessProfile />
              </ProtectedRoute>
            }
          />

          {/* Business Services Route */}
          <Route
            path="/business/services"
            element={
              <ProtectedRoute>
                <Services />
              </ProtectedRoute>
            }
          />

          {/* Business Appointments Route */}
          <Route
            path="/business/appointments"
            element={
              <ProtectedRoute>
                <Appointments />
              </ProtectedRoute>
            }
          />

          {/* Business Calendar Route */}
          <Route
            path="/business/calendar"
            element={
              <ProtectedRoute>
                <BusinessCalendar />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute>
                <div className="container mx-auto px-4 py-8">
                  <h1 className="text-3xl font-bold">Admin Dashboard ⚙️</h1>
                  <p className="text-gray-600 mt-2">System administration and oversight.</p>
                </div>
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </Router>
  );
}

export default App;
