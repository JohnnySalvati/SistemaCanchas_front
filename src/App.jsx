import { useAuth } from "./context/AuthContext";
import Login from "./pages/Login";
import ScheduleGrid from "./pages/ScheduleGrid";

function App() {
  const { token, login, logout } = useAuth();

  if (!token) return <Login onLogin={login} />;
  
  return (
    <div>
      <ScheduleGrid />
    </div>
  );
}

export default App;
