import { useEffect } from "react";
import { useUser } from "@clerk/clerk-react";
import axiosInstance from "../axiosInstance";

const userAuthSync = () => {
  const { user } = useUser();

  useEffect(() => {
    const syncUser = async () => {
      if (!user) return;

      try {
        const response = await axiosInstance.post("/users/sync", {
          clerkId: user.id,
          name: user.fullName,
          email: user.primaryEmailAddress?.emailAddress,
        });

        console.log("✅ User synced:", response.data);
      } catch (error) {
        console.error("❌ Error syncing user:", error);
      }
    };

    syncUser();
  }, [user]);
};

export default userAuthSync
