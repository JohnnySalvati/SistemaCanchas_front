import React, { useState } from "react";
import axios from "axios";

function Login({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      // Cambia la URL si tu backend está en otro host/puerto
      const response = await axios.post("http://127.0.0.1:8000/api-token-auth/", {
        username,
        password,
      });
      const token = response.data.token;
      onLogin(token);
    } catch (err) {
      setError("Usuario o contraseña incorrectos");
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: "60px auto", padding: 32, border: "1px solid #ccc", borderRadius: 8 }}>
      <h2>Iniciar sesión</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <input
            type="text"
            placeholder="Usuario"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            style={{ width: "100%", marginBottom: 10 }}
          />
        </div>
        <div>
          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ width: "100%", marginBottom: 10 }}
          />
        </div>
        <button type="submit" style={{ width: "100%" }}>
          Ingresar
        </button>
      </form>
      {error && <div style={{ color: "red", marginTop: 12 }}>{error}</div>}
    </div>
  );
}

export default Login;
