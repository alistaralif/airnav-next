"use client";

import { useState } from "react";
import { useSession, signIn, signOut } from "next-auth/react";
import { useUI } from "@/context/UIContext";
import { useMap } from "@/context/MapContext";
import { useRouter } from "next/navigation";
import "./LoginPanel.css";

export default function LoginPanel() {
  const { data: session, status, update } = useSession();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { closeSidebar } = useUI();
  const { reloadSectorsLayer } = useMap();
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await signIn("credentials", {
      username,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError("Invalid username or password");
    } else {
      await update();
      await reloadSectorsLayer();
      router.refresh();
      closeSidebar();
    }
  };

  const handleLogout = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    await signOut({ redirect: false });
    await reloadSectorsLayer();
    router.refresh();
    // Force full page reload to update all components
    window.location.reload();
  };

  if (status === "loading") {
    return (
      <div className="login-container">
        <p>Loading...</p>
      </div>
    );
  }

  if (session) {
    return (
      <div className="login-container">
        <h3 className="login-title">Account</h3>
        <div className="login-user-info">
          <p className="login-username">
            Logged in as: <strong>{session.user.name}</strong>
          </p>
          <p className="login-role">
            Role: <strong>{session.user.role}</strong>
          </p>
        </div>
        <div className="login-features">
          <p>✅ Singapore sectors visible</p>
          <p>✅ Full search access</p>
        </div>
        <button 
          type="button"
          onClick={handleLogout} 
          className="login-button logout-button"
        >
          Logout
        </button>
      </div>
    );
  }

  return (
    <div className="login-container">
      <h3 className="login-title">Login</h3>
      <p className="login-subtitle">
        Login to access Singapore sectors and additional features.
      </p>
      {error && <p className="login-error">{error}</p>}
      <form onSubmit={handleSubmit} className="login-form">
        <div className="login-field">
          <label htmlFor="username">Username</label>
          <input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>
        <div className="login-field">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit" disabled={loading} className="login-button">
          {loading ? "Signing in..." : "Sign In"}
        </button>
      </form>
    </div>
  );
}