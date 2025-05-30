import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import styles from './ScheduleGrid.module.css';

function ScheduleGrid() {
  const { token } = useAuth();
  const [reload, setReload] = useState(0);

  const [date, setDate] = useState(() => {
    const today = new Date();
    return today.toISOString().slice(0,10);
  });
  const [courts, setCourts] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  // Para crear reserva rápida
  const [formParams, setFormParams] = useState(null);
  // Para ver reservas de un cliente
  const [customerBookings, setCustomerBookings] = useState(null);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");

  const startTime = "08:00";
  const endTime = "20:00";
  const interval = 30;
  const timeslots = getTimeslots(startTime, endTime, interval);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const resCourts = await axios.get("http://127.0.0.1:8000/api/courts/", {
        headers: { Authorization: `Token ${token}` }
      });
      setCourts(resCourts.data);

      const resBookings = await axios.get(`http://127.0.0.1:8000/api/bookings/?date=${date}`, {
        headers: { Authorization: `Token ${token}` }
      });
      setBookings(resBookings.data);
      setLoading(false);
    }
    fetchData();
  }, [token, date, reload]);

  // Avanzar y retroceder días
  const changeDay = (delta) => {
    const d = new Date(date);
    d.setDate(d.getDate() + delta);
    setDate(d.toISOString().slice(0,10));
  };

  function getTimeslots(start, end, intervalMinutes) {
    const slots = [];
    let d = new Date(`2000-01-01T${start}:00`);
    const endD = new Date(`2000-01-01T${end}:00`);
    while (d <= endD) {
      slots.push(d.toTimeString().slice(0,5));
      d = new Date(d.getTime() + intervalMinutes * 60000);
    }
    return slots;
  }

  // Obtiene la reserva para esa cancha y horario
  const getBooking = (courtId, time) => {
    return bookings.find(b =>
      b.court === courtId &&
      b.start_time.slice(0,5) === time
    );
  };

  // Trae todas las reservas del cliente seleccionado
  const handleShowCustomerBookings = async (customerId, name, phone) => {
    setCustomerName(name);
    setCustomerPhone(phone);
    const res = await axios.get(`http://127.0.0.1:8000/api/bookings/?customer=${customerId}`, {
      headers: { Authorization: `Token ${token}` }
    });
    setCustomerBookings(res.data);
  };

  return (
    <div style={{overflowX: "auto"}}>
      <div style={{ margin: "10px 0" }}>
        <button onClick={() => changeDay(-1)}>← Día anterior</button>
        <b style={{margin: "0 15px"}}>{date}</b>
        <button onClick={() => changeDay(1)}>Día siguiente →</button>
      </div>
      <table style={{ borderCollapse: "collapse", width: "100%" }}>
        <thead>
          <tr>
            <th style={{ border: "1px solid #aaa", padding: "5px" }}>Horario</th>
            {courts.map(court => (
              <th key={court.id} style={{ border: "1px solid #aaa", padding: "5px" }}>
                {court.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {timeslots.map(time => (
            <tr key={time}>
              <td style={{ border: "1px solid #aaa", padding: "5px", fontWeight: "bold" }}>{time}</td>
              {courts.map(court => {
                const booking = getBooking(court.id, time);
                  if (booking) {
                    // Colocá el console.log acá:
                    console.log(booking);
                  }
                return (
                  <td key={court.id} style={{
                    border: "1px solid #aaa",
                    background: booking ? "#ffd" : "#fff",
                    color: booking ? "#c00" : "#222",
                    padding: "5px",
                    minWidth: 110
                  }}>
                    {booking ? (
                      <div>
                        <button
                          style={{ fontSize: 12 }}
                          onClick={() => handleShowCustomerBookings(
                            booking.customer,
                            booking.customer_name,
                            booking.customer_phone)}
                        >
                          {booking.customer_name}
                        </button>
                      </div>
                    ) : (
                      <button
                        style={{ fontSize: 12 }}
                        onClick={() => setFormParams({ court: court.id, time, date })}
                      >
                        Reservar
                      </button>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      {loading && <div>Cargando grilla...</div>}

      {/* Mini form inline para crear reserva */}
      {formParams && (
        <QuickCreateForm
          {...formParams}
          onClose={() => setFormParams(null)}
          // onCreated={() => { setFormParams(null); setLoading(true); setTimeout(() => setLoading(false), 300); }}
          onCreated={() => { setFormParams(null); setReload(r => r + 1); }}
        />
      )}

      {/* Mostrar reservas del cliente (simple modal) */}
      {customerBookings && (
        <div style={{
          position: "fixed", top: 50, left: 0, right: 0, background: "#fff", border: "2px solid #aaa",
          maxWidth: 450, margin: "auto", padding: 16, zIndex: 10
        }}>
          <h3>Reservas de {customerName}</h3>
          Teléfono: {customerPhone}
          <button onClick={() => setCustomerBookings(null)} style={{ float: "right" }}>Cerrar</button>
          <ul>
            {customerBookings.map(b => (
              <li key={b.id}>
                {b.date} {b.start_time.slice(0,5)}-{b.end_time.slice(0,5)} | Cancha: {courts.find(c => c.id === b.court)?.name}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function getEndTimeOptions(start, end, interval) {
  // start y end son strings: "09:00", "21:00", interval en minutos
  let [h, m] = start.split(":").map(Number);
  const [endH, endM] = end.split(":").map(Number);
  const options = [];
  while (h < endH || (h === endH && m <= endM)) {
    options.push(`${h.toString().padStart(2,"0")}:${m.toString().padStart(2,"0")}`);
    m += interval;
    if (m >= 60) { h++; m -= 60; }
  }
  return options;
}

// Mini formulario rápido para reservar una celda
function QuickCreateForm({ court, time, date, onClose, onCreated }) {
  const { token } = useAuth();
  const [customers, setCustomers] = useState([]);
  const [customer, setCustomer] = useState("");
  const [customerInput, setCustomerInput] = useState("");
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [endTime, setEndTime] = useState(""); 
  const [error, setError] = useState("");
  const [okMsg, setOkMsg] = useState("");

  const systemEndTime = "21:00";
  const interval = 30; // minutos

  useEffect(() => {
    axios.get("http://127.0.0.1:8000/api/customers/", {
      headers: { Authorization: `Token ${token}` }
    }).then(res => setCustomers(res.data));
    // Sugerido: primer valor después del start_time
    const options = getEndTimeOptions(time, systemEndTime, interval);
    setEndTime(options[1] || options[0]);
  }, [time, token]);

  useEffect(() => {
    setFilteredCustomers(
      customers.filter(c =>
        c.name.toLowerCase().includes(customerInput.toLowerCase())
      )
    );
  }, [customerInput, customers]);

  const handleCustomerSelect = (cust) => {
    setCustomer(cust.id);
    setCustomerInput(cust.name);
    setShowSuggestions(false);
  };

  const endTimeOptions = getEndTimeOptions(time, systemEndTime, interval).slice(1);

  const handleSubmit = async e => {
    e.preventDefault();
    setError(""); setOkMsg("");
    if (!customer) {
      setError("Seleccioná un cliente válido");
      return;
    }
    try {
      await axios.post("http://127.0.0.1:8000/api/bookings/", {
        date,
        start_time: time,
        end_time: endTime,
        court,
        customer
      }, {
        headers: { Authorization: `Token ${token}` }
      });
      setOkMsg("Reserva creada!");
      setTimeout(() => { onCreated(); }, 500);
    } catch (err) {
      setError(err.response?.data?.non_field_errors?.[0] || "Error al crear reserva");
    }
  };

  return (
    <div style={{
      position: "fixed", top: 80, left: 0, right: 0, background: "#f7f7f7", border: "2px solid #666",
      maxWidth: 330, margin: "auto", padding: 18, zIndex: 15
    }}>
      <b>Reserva rápida</b>
      <form onSubmit={handleSubmit}>
        <div>Fecha: <b>{date}</b></div>
        <div>Hora inicio: <b>{time}</b></div>
        <div>
          Fin: 
          <select value={endTime} onChange={e => setEndTime(e.target.value)} required>
            {endTimeOptions.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
        <div style={{ position: "relative" }}>
          Cliente:
          <input
            type="text"
            placeholder="Nombre cliente"
            value={customerInput}
            onChange={e => {
              setCustomerInput(e.target.value);
              setCustomer(""); // Resetea ID hasta seleccionar
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            autoComplete="off"
            required
            style={{ width: "100%" }}
          />
          {showSuggestions && customerInput.length > 0 && filteredCustomers.length > 0 && (
            <ul style={{
              listStyle: "none", margin: 0, padding: 0,
              position: "absolute", zIndex: 10, background: "#fff",
              border: "1px solid #aaa", width: "100%", maxHeight: 100, overflowY: "auto"
            }}>
              {filteredCustomers.map(c => (
                <li
                  key={c.id}
                  style={{ padding: 4, cursor: "pointer" }}
                  onClick={() => handleCustomerSelect(c)}
                >
                  {c.name}
                </li>
              ))}
            </ul>
          )}
        </div>
        <button type="submit">Reservar</button>
        <button type="button" style={{marginLeft:8}} onClick={onClose}>Cancelar</button>
      </form>
      {okMsg && <div style={{color:"green"}}>{okMsg}</div>}
      {error && <div style={{color:"red"}}>{error}</div>}
    </div>
  );
}

export default ScheduleGrid;