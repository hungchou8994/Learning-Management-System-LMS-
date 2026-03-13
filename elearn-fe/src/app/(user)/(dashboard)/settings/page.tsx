"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/providers/AuthContext";
import FooterOne from "@/layouts/footers/FooterOne";
import HeaderOne from "@/layouts/headers/HeaderOne";
import Wrapper from "@/layouts/Wrapper";
import bg_img from "@/assets/img/bg/dashboard_bg.jpg";
import Image from "next/image";
import "./imageUpload.scss";

interface UserInfo {
  username: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  skill: string;
  bio: string;
  socialShare: {
    facebook?: string;
    twitter?: string;
    linkedin?: string;
    website?: string;
    github?: string;
  };
  avatarUrl?: string;
  coverUrl?: string;
}

type TabType = "profile" | "social" | "password" | "images";

const Settings = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>("profile");
  const [userInfo, setUserInfo] = useState<UserInfo>({
    username: "",
    firstName: "",
    lastName: "",
    phoneNumber: "",
    skill: "",
    bio: "",
    socialShare: {
      facebook: "",
      twitter: "",
      linkedin: "",
      website: "",
      github: "",
    },
  });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>("");
  const [coverPreview, setCoverPreview] = useState<string>("");
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const clearMessages = () => {
    setError("");
    setSuccessMessage("");
  };

  const fetchUserData = async () => {
    try {
      clearMessages();
      const response = await fetch(
        "http://localhost:3000/api/elearn/user/user",
        {
          credentials: "include",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch user information");
      }

      const data = await response.json();
      // Convert array of social links to object format
      const socialLinks = data.data.socialShare || [];

      // Use the new URL structure for images
      const avatarUrl = data.data.avatarUrl
        ? `http://localhost:3000/elearn${data.data.avatarUrl}`
        : "";
      const coverUrl = data.data.coverUrl
        ? `http://localhost:3000/elearn${data.data.coverUrl}`
        : "";

      setUserInfo({
        ...data.data,
        avatarUrl,
        coverUrl,
        socialShare: {
          facebook: socialLinks[0] || "",
          twitter: socialLinks[1] || "",
          linkedin: socialLinks[2] || "",
          website: socialLinks[3] || "",
          github: socialLinks[4] || "",
        },
      });
      setIsLoading(false);
    } catch (err) {
      setError("Failed to load user information");
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  const handleUpdateProfile = async (updatedInfo: UserInfo) => {
    try {
      clearMessages();
      setIsLoading(true);
      const response = await fetch(
        "http://localhost:3000/api/elearn/user/information",
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify(updatedInfo),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update profile");
      }

      setSuccessMessage("Profile updated successfully");
      // Fetch fresh data after update
      await fetchUserData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update profile");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateSocialShare = async (
    socialLinks: UserInfo["socialShare"]
  ) => {
    try {
      clearMessages();
      setIsLoading(true);
      const socialLinksArray = Object.values(socialLinks).filter(
        (link) => link
      );

      const response = await fetch(
        "http://localhost:3000/api/elearn/user/social",
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({ socialShare: socialLinksArray }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update social links");
      }

      setSuccessMessage("Social links updated successfully");
      // Fetch fresh data after update
      await fetchUserData();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update social links"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError("New passwords do not match");
      return;
    }
    try {
      clearMessages();
      setIsLoading(true);
      const response = await fetch("http://localhost:3001/api/auth/password", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update password");
      }

      setSuccessMessage("Password updated successfully");
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update password"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCoverFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setCoverPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageUpload = async (type: "avatar" | "cover") => {
    try {
      clearMessages();
      setIsLoading(true);
      const file = type === "avatar" ? avatarFile : coverFile;
      if (!file) {
        setError(`Please select a ${type} image`);
        return;
      }

      const formData = new FormData();
      formData.append(type, file);

      const response = await fetch(
        `http://localhost:3000/api/elearn/user/${type}`,
        {
          method: "PUT",
          credentials: "include",
          body: formData,
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to upload ${type}`);
      }

      setSuccessMessage(
        `${type.charAt(0).toUpperCase() + type.slice(1)} updated successfully`
      );
      await fetchUserData();
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to upload ${type}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="dashboard__content-wrap">
      <div className="dashboard__content-title">
        <h4 className="title">Settings</h4>
      </div>
      <div className="row">
        <div className="col-lg-12">
          <div className="dashboard__nav-wrap">
            <ul className="nav nav-tabs" id="myTab" role="tablist">
              <li
                onClick={() => setActiveTab("profile")}
                className="nav-item"
                role="presentation"
              >
                <button
                  className={`nav-link ${
                    activeTab === "profile" ? "active" : ""
                  }`}
                >
                  Profile
                </button>
              </li>
              <li
                onClick={() => setActiveTab("social")}
                className="nav-item"
                role="presentation"
              >
                <button
                  className={`nav-link ${
                    activeTab === "social" ? "active" : ""
                  }`}
                >
                  Social
                </button>
              </li>
              <li
                onClick={() => setActiveTab("password")}
                className="nav-item"
                role="presentation"
              >
                <button
                  className={`nav-link ${
                    activeTab === "password" ? "active" : ""
                  }`}
                >
                  Password
                </button>
              </li>
              <li
                onClick={() => setActiveTab("images")}
                className="nav-item"
                role="presentation"
              >
                <button
                  className={`nav-link ${
                    activeTab === "images" ? "active" : ""
                  }`}
                >
                  Images
                </button>
              </li>
            </ul>
          </div>
          <div className="tab-content" id="myTabContent">
            {isLoading ? (
              <div className="alert alert-info">Loading...</div>
            ) : error ? (
              <div className="alert alert-danger">{error}</div>
            ) : successMessage ? (
              <div className="alert alert-success">{successMessage}</div>
            ) : null}
            <div
              className={`tab-pane fade ${
                activeTab === "profile" ? "show active" : ""
              }`}
              id="itemOne-tab-pane"
              role="tabpanel"
            >
              <div className="instructor__profile-form-wrap">
                <form
                  onSubmit={(e) => e.preventDefault()}
                  className="instructor__profile-form"
                >
                  <div className="row">
                    <div className="col-md-6">
                      <div className="form-grp">
                        <label htmlFor="username">Username</label>
                        <input
                          id="username"
                          type="text"
                          value={userInfo.username}
                          disabled
                          style={{
                            cursor: "not-allowed",
                            backgroundColor: "#f0f0f0",
                          }}
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="form-grp">
                        <label htmlFor="firstname">Display Name</label>
                        <input
                          id="displayname"
                          type="text"
                          value={
                            `${userInfo.firstName} ${userInfo.lastName}` || ""
                          }
                          disabled
                          style={{
                            cursor: "not-allowed",
                            backgroundColor: "#f0f0f0",
                          }}
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="form-grp">
                        <label htmlFor="firstname">First Name</label>
                        <input
                          id="firstname"
                          type="text"
                          value={userInfo.firstName || ""}
                          onChange={(e) =>
                            setUserInfo((prev) => ({
                              ...prev,
                              firstName: e.target.value,
                            }))
                          }
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="form-grp">
                        <label htmlFor="lastname">Last Name</label>
                        <input
                          id="lastname"
                          type="text"
                          value={userInfo.lastName || ""}
                          onChange={(e) =>
                            setUserInfo((prev) => ({
                              ...prev,
                              lastName: e.target.value,
                            }))
                          }
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="form-grp">
                        <label htmlFor="phonenumber">Phone Number</label>
                        <input
                          id="phonenumber"
                          type="tel"
                          value={userInfo.phoneNumber || ""}
                          onChange={(e) =>
                            setUserInfo((prev) => ({
                              ...prev,
                              phoneNumber: e.target.value,
                            }))
                          }
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="form-grp">
                        <label htmlFor="skill">Skill/Occupation</label>
                        <input
                          id="skill"
                          type="text"
                          value={userInfo.skill || ""}
                          onChange={(e) =>
                            setUserInfo((prev) => ({
                              ...prev,
                              skill: e.target.value,
                            }))
                          }
                        />
                      </div>
                    </div>
                  </div>
                  <div className="form-grp">
                    <label htmlFor="bio">Bio</label>
                    <textarea
                      id="bio"
                      value={userInfo.bio || ""}
                      onChange={(e) =>
                        setUserInfo((prev) => ({
                          ...prev,
                          bio: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="submit-btn mt-25">
                    <button
                      type="submit"
                      className="btn"
                      onClick={() => handleUpdateProfile(userInfo)}
                    >
                      Update Info
                    </button>
                  </div>
                </form>
              </div>
            </div>
            <div
              className={`tab-pane fade ${
                activeTab === "social" ? "show active" : ""
              }`}
              id="itemTwo-tab-pane"
              role="tabpanel"
            >
              <div className="instructor__profile-form-wrap">
                <form
                  onSubmit={(e) => e.preventDefault()}
                  className="instructor__profile-form"
                >
                  <div className="form-grp">
                    <label htmlFor="facebook">Facebook</label>
                    <input
                      id="facebook"
                      type="url"
                      placeholder="https://facebook.com/"
                      value={userInfo.socialShare.facebook || ""}
                      onChange={(e) =>
                        setUserInfo((prev) => ({
                          ...prev,
                          socialShare: {
                            ...prev.socialShare,
                            facebook: e.target.value,
                          },
                        }))
                      }
                    />
                  </div>
                  <div className="form-grp">
                    <label htmlFor="twitter">Twitter</label>
                    <input
                      id="twitter"
                      type="url"
                      placeholder="https://twitter.com/"
                      value={userInfo.socialShare.twitter || ""}
                      onChange={(e) =>
                        setUserInfo((prev) => ({
                          ...prev,
                          socialShare: {
                            ...prev.socialShare,
                            twitter: e.target.value,
                          },
                        }))
                      }
                    />
                  </div>
                  <div className="form-grp">
                    <label htmlFor="linkedin">LinkedIn</label>
                    <input
                      id="linkedin"
                      type="url"
                      placeholder="https://linkedin.com/"
                      value={userInfo.socialShare.linkedin || ""}
                      onChange={(e) =>
                        setUserInfo((prev) => ({
                          ...prev,
                          socialShare: {
                            ...prev.socialShare,
                            linkedin: e.target.value,
                          },
                        }))
                      }
                    />
                  </div>
                  <div className="form-grp">
                    <label htmlFor="website">Website</label>
                    <input
                      id="website"
                      type="url"
                      placeholder="https://website.com/"
                      value={userInfo.socialShare.website || ""}
                      onChange={(e) =>
                        setUserInfo((prev) => ({
                          ...prev,
                          socialShare: {
                            ...prev.socialShare,
                            website: e.target.value,
                          },
                        }))
                      }
                    />
                  </div>
                  <div className="form-grp">
                    <label htmlFor="github">Github</label>
                    <input
                      id="github"
                      type="url"
                      placeholder="https://github.com/"
                      value={userInfo.socialShare.github || ""}
                      onChange={(e) =>
                        setUserInfo((prev) => ({
                          ...prev,
                          socialShare: {
                            ...prev.socialShare,
                            github: e.target.value,
                          },
                        }))
                      }
                    />
                  </div>
                  <div className="submit-btn mt-25">
                    <button
                      type="submit"
                      className="btn"
                      onClick={() =>
                        handleUpdateSocialShare(userInfo.socialShare)
                      }
                    >
                      Update Social Links
                    </button>
                  </div>
                </form>
              </div>
            </div>
            <div
              className={`tab-pane fade ${
                activeTab === "password" ? "show active" : ""
              }`}
              id="itemThree-tab-pane"
              role="tabpanel"
            >
              <div className="instructor__profile-form-wrap">
                <form
                  onSubmit={handleUpdatePassword}
                  className="instructor__profile-form"
                >
                  <div className="form-grp">
                    <label htmlFor="currentPassword">Current Password</label>
                    <input
                      id="currentPassword"
                      type="password"
                      value={passwordForm.currentPassword}
                      onChange={(e) =>
                        setPasswordForm((prev) => ({
                          ...prev,
                          currentPassword: e.target.value,
                        }))
                      }
                      required
                    />
                  </div>
                  <div className="form-grp">
                    <label htmlFor="newPassword">New Password</label>
                    <input
                      id="newPassword"
                      type="password"
                      value={passwordForm.newPassword}
                      onChange={(e) =>
                        setPasswordForm((prev) => ({
                          ...prev,
                          newPassword: e.target.value,
                        }))
                      }
                      required
                    />
                  </div>
                  <div className="form-grp">
                    <label htmlFor="confirmPassword">
                      Confirm New Password
                    </label>
                    <input
                      id="confirmPassword"
                      type="password"
                      value={passwordForm.confirmPassword}
                      onChange={(e) =>
                        setPasswordForm((prev) => ({
                          ...prev,
                          confirmPassword: e.target.value,
                        }))
                      }
                      required
                    />
                  </div>
                  <div className="submit-btn mt-25">
                    <button type="submit" className="btn">
                      Update Password
                    </button>
                  </div>
                </form>
              </div>
            </div>
            {activeTab === "images" && (
              <div className="dashboard__content">
                <div className="row">
                  <div className="col-lg-6">
                    <div className="dashboard__card">
                      <div className="dashboard__card-header">
                        <h5 className="title">Profile Picture</h5>
                      </div>
                      <div className="dashboard__card-body">
                        <div className="image-upload-container">
                          <label
                            className="image-preview-wrapper"
                            htmlFor="avatar-input"
                            aria-label="Upload profile picture"
                          >
                            {avatarPreview ? (
                              <div className="image-preview">
                                <Image
                                  src={avatarPreview}
                                  alt="Avatar preview"
                                  width={200}
                                  height={200}
                                  className="preview-image"
                                />
                                <div className="image-overlay">
                                  <span className="change-text">
                                    Change Photo
                                  </span>
                                </div>
                              </div>
                            ) : userInfo.avatarUrl ? (
                              <div className="image-preview">
                                <Image
                                  src={userInfo.avatarUrl}
                                  alt="Current avatar"
                                  width={200}
                                  height={200}
                                  className="preview-image"
                                />
                                <div className="image-overlay">
                                  <span className="change-text">
                                    Change Photo
                                  </span>
                                </div>
                              </div>
                            ) : (
                              <div className="upload-placeholder">
                                <i className="fas fa-user-circle"></i>
                                <span>Upload Profile Picture</span>
                              </div>
                            )}
                          </label>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleAvatarChange}
                            className="file-input"
                            id="avatar-input"
                          />
                          <div className="upload-info">
                            <p>Recommended: Square image, at least 400x400px</p>
                            <p>Maximum file size: 5MB</p>
                          </div>
                          <button
                            onClick={() => handleImageUpload("avatar")}
                            className="upload-button"
                            disabled={!avatarFile || isLoading}
                          >
                            {isLoading ? (
                              <span className="loading-spinner"></span>
                            ) : (
                              <>
                                <i className="fas fa-cloud-upload-alt"></i>
                                {avatarFile
                                  ? "Upload Avatar"
                                  : "Select Image First"}
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="col-lg-6">
                    <div className="dashboard__card">
                      <div className="dashboard__card-header">
                        <h5 className="title">Cover Image</h5>
                      </div>
                      <div className="dashboard__card-body">
                        <div className="image-upload-container">
                          <label
                            className="image-preview-wrapper cover-wrapper"
                            htmlFor="cover-input"
                            aria-label="Upload cover image"
                          >
                            {coverPreview ? (
                              <div className="image-preview cover-preview">
                                <Image
                                  src={coverPreview}
                                  alt="Cover preview"
                                  width={400}
                                  height={200}
                                  className="preview-image"
                                />
                                <div className="image-overlay">
                                  <span className="change-text">
                                    Change Cover
                                  </span>
                                </div>
                              </div>
                            ) : userInfo.coverUrl ? (
                              <div className="image-preview cover-preview">
                                <Image
                                  src={userInfo.coverUrl}
                                  alt="Current cover"
                                  width={400}
                                  height={200}
                                  className="preview-image"
                                />
                                <div className="image-overlay">
                                  <span className="change-text">
                                    Change Cover
                                  </span>
                                </div>
                              </div>
                            ) : (
                              <div className="upload-placeholder cover-placeholder">
                                <i className="fas fa-image"></i>
                                <span>Upload Cover Image</span>
                              </div>
                            )}
                          </label>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleCoverChange}
                            className="file-input"
                            id="cover-input"
                          />
                          <div className="upload-info">
                            <p>
                              Recommended: 1200x400px, landscape orientation
                            </p>
                            <p>Maximum file size: 5MB</p>
                          </div>
                          <button
                            onClick={() => handleImageUpload("cover")}
                            className="upload-button"
                            disabled={!coverFile || isLoading}
                          >
                            {isLoading ? (
                              <span className="loading-spinner"></span>
                            ) : (
                              <>
                                <i className="fas fa-cloud-upload-alt"></i>
                                {coverFile
                                  ? "Upload Cover"
                                  : "Select Image First"}
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
