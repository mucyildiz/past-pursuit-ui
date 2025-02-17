import React, { useState, useEffect } from "react";
import "./Login.css";
import User from "../models/User";

interface LoginProps {
  onLogin: (user: User) => void;
}

const isDevelopment = import.meta.env.DEV;

const generateRandomName = () => {
  const adjectives = [
    "Happy",
    "Lucky",
    "Clever",
    "Brave",
    "Mighty",
    "Swift",
    "Wise",
  ];
  const nouns = [
    "Panda",
    "Tiger",
    "Eagle",
    "Dragon",
    "Phoenix",
    "Warrior",
    "Knight",
  ];
  const randomNum = Math.floor(Math.random() * 1000);

  return `${adjectives[Math.floor(Math.random() * adjectives.length)]}${
    nouns[Math.floor(Math.random() * nouns.length)]
  }${randomNum}`;
};

export default function Login({ onLogin }: LoginProps) {
  const [showUsernameForm, setShowUsernameForm] = useState(false);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    const createDevUser = async () => {
      if (isDevelopment) {
        const randomName = generateRandomName();
        try {
          const response = await fetch(
            "http://localhost:8080/api/past-pursuit/users",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                name: randomName,
                email: `${randomName.toLowerCase()}@dev.local`,
              }),
            }
          );

          if (response.ok) {
            const user = await response.json();
            onLogin(user);
          } else {
            console.error("Failed to create dev user");
          }
        } catch (error) {
          console.error("Error creating dev user:", error);
        }
      }
    };

    createDevUser();
  }, [onLogin]);

  // Skip rendering login UI in development
  if (isDevelopment) {
    return null;
  }

  const handleGoogleLogin = () => {
    const width = 500;
    const height = 600;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;

    window.open(
      "https://api.pastpursuit.io/api/auth/google",
      "Google Login",
      `width=${width},height=${height},left=${left},top=${top}`
    );

    window.addEventListener("message", async (event) => {
      if (event.origin === "https://api.pastpursuit.io") {
        const response = event.data;

        // If response is just an email, show username form
        if (typeof response === "string" && response.includes("@")) {
          setEmail(response);
          setShowUsernameForm(true);
        } else {
          // If response is a full user object, proceed with login
          onLogin(response as User);
        }
      }
    });
  };

  const handleUsernameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch(
        "https://api.pastpursuit.io/api/past-pursuit/users",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: username,
            email: email,
          }),
        }
      );

      if (response.ok) {
        const user = await response.json();
        onLogin(user);
      } else {
        const errorData = await response.json();
        alert(errorData.message || "Failed to create user");
      }
    } catch (error) {
      console.error("Error creating user:", error);
      alert("Failed to create user");
    }
  };

  return (
    <div className="login-container">
      <h1 id="logo">Past Pursuit</h1>
      <div className="login-box">
        {!showUsernameForm ? (
          <>
            <h2>Welcome to Past Pursuit</h2>
            <button onClick={handleGoogleLogin} className="google-login-button">
              <img src="/google-icon.png" alt="Google" />
              Sign in with Google
            </button>
          </>
        ) : (
          <>
            <h2>Choose Your Username</h2>
            <form onSubmit={handleUsernameSubmit}>
              <input
                type="text"
                placeholder="Enter username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                minLength={3}
                maxLength={20}
                pattern="[A-Za-z0-9_]+"
                title="Username can only contain letters, numbers, and underscores"
              />
              <button type="submit" className="submit-button">
                Continue
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
