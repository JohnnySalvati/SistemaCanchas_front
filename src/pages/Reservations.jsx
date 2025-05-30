import React, { useEffect, useState } from "react";
import axios from "axios";

function Reservations({ token }) {
  const [reservations, setReservations] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchReservations = async () => {
      try {
        const res = await axios.get("http://127.0.0.1:8000/api/bookings/", {
          headers: { Authorization: `Token ${token}` }
        });
        setReservations(res.data);
      } catch (err) {
        setError("Error al cargar las reservas.");
      }
    };

    fetchReservations();
  }, [token]);

  if (error) return <div style={{ color: "red" }}>{error}</div>;

  return (
    <div style={{ maxWidth: 600, margin: "40px auto" }}>
      <h2>Reservas</h2>
      <ul>
        {reservations.map(res => (
          <li key={res.id}>
            <b>{res.date}</b> {res.start_time} - {res.end_time} | Cancha: {res.court_name} | Cliente: {res.customer_name}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Reservations;
