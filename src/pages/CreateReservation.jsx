import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

function CreateReservation({ onCreated }) {
  const { token } = useAuth();
  const [courts, setCourts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [court, setCourt] = useState("");
  const [customer, setCustomer] = useState("");
  const [error, setError] = useState("");
  const [okMsg, setOkMsg] = useState("");

  // Cargar canchas y clientes al montar
  useEffect(() => {
    axios.get("http://127.0.0.1:8000/api/courts/", {
      headers: { Authorization: `Token ${token}` }
    }).then(res => setCourts(res.data));
    axios.get("http://127.0.0.1:8000/api/customers/", {
      headers: { Authorization: `Token ${token}` }
    }).then(res => setCustomers(res.data));
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); setOkMsg("");
    try {
      await axios.post("http://127.0.0.1:8000/api/bookings/", {
        date, start_time: startTime, end_time: endTime, court, customer
      }, {
        headers: { Authorization: `Token ${token}` }
      });
      setOkMsg("Reserva creada!");
      setDate(""); setStartTime(""); setEndTime(""); setCourt(""); setCustomer("");
      if (onCreated) onCreated();
    } catch (err) {
      setError(err.response?.data?.non_field_errors?.[0] || "Error al crear reserva");
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ marginBottom: 32, padding: 16, border: "1px solid #ddd", borderRadius: 8 }}>
      <h3>Nueva Reserva</h3>
      <input type="date" value={date} onChange={e => setDate(e.target.value)} required />
      <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} required />
      <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} required />
      <select value={court} onChange={e => setCourt(e.target.value)} required>
        <option value="">Selecciona cancha</option>
        {courts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
      </select>
      <select value={customer} onChange={e => setCustomer(e.target.value)} required>
        <option value="">Selecciona cliente</option>
        {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
      </select>
      <button type="submit">Reservar</button>
      {okMsg && <div style={{ color: "green" }}>{okMsg}</div>}
      {error && <div style={{ color: "red" }}>{error}</div>}
    </form>
  );
}

export default CreateReservation;
