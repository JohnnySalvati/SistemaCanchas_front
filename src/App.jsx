import React, { useState } from "react";
import { useAuth } from "./context/AuthContext";
import Login from "./pages/Login";
import ScheduleGrid from "./pages/ScheduleGrid";
import Reservations from "./pages/Reservations";
import CreateReservation from "./pages/CreateReservation";

function App() {
  const { token, login, logout } = useAuth();
  const [reload, setReload] = useState(0);

  if (!token) return <Login onLogin={login} />;
  
  return (
    <div>
      <button onClick={logout} style={{ float: "right" }}>Logout</button>
      <h1>Sistema de Reservas</h1>
      <ScheduleGrid />
      {/* <CreateReservation onCreated={() => setReload(r => r + 1)} />
      <Reservations key={reload} token={token} /> */}
    </div>
  );
}

export default App;
