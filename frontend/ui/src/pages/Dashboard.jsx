import { UserButton } from "@clerk/clerk-react";
import { useAuth } from "../context/AuthContext";

const Dashboard = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-2xl font-bold text-gray-900">📚 BookVerse</h1>
            <UserButton afterSignOutUrl="/" />
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="text-center">
            <h2 className="text-3xl font-semibold text-gray-900 mb-4">
              Welcome to your Dashboard!
            </h2>
            {user && (
              <p className="text-lg text-gray-600 mb-8">
                Hello, {user.firstName || user.emailAddresses[0]?.emailAddress}! 👋
              </p>
            )}
            
            {/* Dashboard content area */}
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-gray-500">
                Your dashboard content will go here...
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
