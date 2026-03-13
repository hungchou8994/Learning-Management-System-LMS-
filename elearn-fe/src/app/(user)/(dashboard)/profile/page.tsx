"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/providers/AuthContext";
import styles from "./styles.module.scss";

interface UserProfile {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  phoneNumber: string;
  skill: string;
  bio: string;
  dob?: string;
}

const Profile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile>({
    firstName: "",
    lastName: "",
    username: "",
    email: "",
    phoneNumber: "",
    skill: "",
    bio: "",
    dob: "",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        // Fetch general user information
        const userResponse = await fetch(
          `${process.env.NEXT_PUBLIC_API_GATEWAY_URL}/api/elearn/user/user`,
          {
            credentials: "include",
          }
        );

        if (!userResponse.ok) {
          throw new Error("Failed to fetch user profile");
        }

        const userData = await userResponse.json();

        // Fetch email information
        const emailResponse = await fetch(
          `${process.env.NEXT_PUBLIC_API_GATEWAY_URL}/api/auth/me`,
          {
            credentials: "include",
          }
        );

        if (!emailResponse.ok) {
          throw new Error("Failed to fetch email information");
        }

        const emailData = await emailResponse.json();

        // Combine the data
        setProfile({
          ...userData.data,
          email: emailData.user?.email || userData.data.email || "",
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load profile");
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, []);

  if (isLoading) {
    return (
      <div className={styles.profileContainer}>
        <div className={styles.loadingSpinner}></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.profileContainer}>
        <div className={styles.errorMessage}>{error}</div>
      </div>
    );
  }

  return (
    <div className={styles.profileContainer}>
      <div className={styles.profileContent}>
        <div className={styles.infoCard}>
          <div className={styles.bioSection}>
            <div className={styles.sectionTitle}>
              <i className="fas fa-user"></i>
              User Information
            </div>
            <div className={styles.infoGrid}>
              <div className={styles.infoColumn}>
                <div className={styles.infoRow}>
                  <div className={styles.infoLabel}>
                    <i className="fas fa-user-circle"></i>
                    Full Name
                  </div>
                  <div className={styles.infoValue}>
                    {profile.firstName} {profile.lastName}
                  </div>
                </div>
                <div className={styles.infoRow}>
                  <div className={styles.infoLabel}>
                    <i className="fas fa-at"></i>
                    Username
                  </div>
                  <div className={styles.infoValue}>@{profile.username}</div>
                </div>
                <div className={styles.infoRow}>
                  <div className={styles.infoLabel}>
                    <i className="fas fa-briefcase"></i>
                    Skill
                  </div>
                  <div className={styles.infoValue}>
                    {profile.skill || "Not specified"}
                  </div>
                </div>
              </div>

              <div className={styles.infoColumn}>
                <div className={styles.infoRow}>
                  <div className={styles.infoLabel}>
                    <i className="fas fa-envelope"></i>
                    Email Address
                  </div>
                  <div className={styles.infoValue}>{profile.email}</div>
                </div>
                <div className={styles.infoRow}>
                  <div className={styles.infoLabel}>
                    <i className="fas fa-phone"></i>
                    Phone Number
                  </div>
                  <div className={styles.infoValue}>
                    {profile.phoneNumber || "Not provided"}
                  </div>
                </div>
                <div className={styles.infoRow}>
                  <div className={styles.infoLabel}>
                    <i className="fas fa-calendar"></i>
                    Date of Birth
                  </div>
                  <div className={styles.infoValue}>
                    {profile.dob
                      ? new Date(profile.dob).toLocaleDateString("en-GB")
                      : "Not provided"}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className={styles.bioSection} style={{ paddingTop: "0px" }}>
            <h2 className={styles.sectionTitle}>
              <i className="fas fa-book"></i>
              Biography
            </h2>
            <div className={styles.bioContent}>
              {profile.bio || "No biography added yet."}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
