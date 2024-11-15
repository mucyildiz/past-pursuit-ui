import React, { useState } from "react";
import { saveUserName } from "../utils/localStorage";

interface UserFormProps {
  onUserNameSubmit: (name: string) => void;
}

const UserForm: React.FC<UserFormProps> = ({ onUserNameSubmit }) => {
  const [name, setName] = useState("");

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    saveUserName(name);
    onUserNameSubmit(name);
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        name="userName"
        placeholder="Enter your name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
      />
      <button type="submit">Start Game</button>
    </form>
  );
};

export default UserForm;
