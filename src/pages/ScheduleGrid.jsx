import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import styles from './ScheduleGrid.module.css';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { parseISO } from "date-fns";
import { registerLocale } from "react-datepicker";
import es from "date-fns/locale/es";
registerLocale("es", es);


function ScheduleGrid() {
  const backend = import.meta.env.VITE_BACKEND_URL;

  const { token, logout } = useAuth();
  const [reload, setReload] = useState(0);

  const [date, setDate] = useState(() => {
    const today = new Date();
    // Corrige a horario local
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`; // YYYY-MM-DD en hora local
  }); 
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  const [courts, setCourts] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  // Para crear reserva rápida
  const [formParams, setFormParams] = useState(null);
  // Para ver reservas de un cliente
  const [customerBookings, setCustomerBookings] = useState(null);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");

  // deleteConfirm será null o un objeto { booking }
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // para habilitar edicion de cliente
  const [editCustomer, setEditCustomer] = useState(false);
  const [editedName, setEditedName] = useState(customerName);
  const [editedPhone, setEditedPhone] = useState(customerPhone);
  useEffect(() => {
    setEditedName(customerName);
    setEditedPhone(customerPhone);
    setEditCustomer(false); // cada vez que abre el modal, no edición por defecto
  }, [customerName, customerPhone]);

  const startTime = "08:00";
  const endTime = "24:00";
  const interval = 30;
  const timeslots = getTimeslots(startTime, endTime, interval);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const resCourts = await axios.get(`${backend}/api/courts/`, {
        headers: { Authorization: `Token ${token}` }
      });
      setCourts(resCourts.data);

      const resBookings = await axios.get(`${backend}/api/bookings/?date=${date}`, {
        headers: { Authorization: `Token ${token}` }
      });
      setBookings(resBookings.data);
      setLoading(false);
    }
    fetchData();
  }, [token, date, reload]);

  // // Avanzar y retroceder días
  // const changeDay = (delta) => {
  //   const d = new Date(date);
  //   d.setDate(d.getDate() + delta);
  //   setDate(d.toISOString().slice(0,10));
  // };

  // dateStr: "YYYY-MM-DD", days: int (positivo o negativo)
  function sumarDias(dateStr, days) {
    const [year, month, day] = dateStr.split('-').map(Number);
    const d = new Date(year, month - 1, day);
    d.setDate(d.getDate() + days);
    // Retorna como "YYYY-MM-DD"
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

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
  // time es "HH:MM"
  const getBookingForTimeslot = (courtId, time) => {
    // Convierte a minutos para comparar fácilmente
    const timeToMinutes = t => {
      const [h, m] = t.split(":").map(Number);
      return h * 60 + m;
    };

    const slotStart = timeToMinutes(time);

    return bookings.find(b => {
      if (b.court !== courtId) return false;
      const bookingStart = timeToMinutes(b.start_time.slice(0,5));
      const bookingEnd = timeToMinutes(b.end_time.slice(0,5));
      // Si el turno abarca el inicio del slot (incluye reservas “largas”)
      return slotStart >= bookingStart && slotStart < bookingEnd;
    });
  };

  // Trae todas las reservas del cliente seleccionado
  const handleShowCustomerBookings = async (customerId, name, phone) => {
    setCustomerName(name);
    setCustomerPhone(phone);
    const res = await axios.get(`${backend}/api/bookings/?customer=${customerId}`, {
      headers: { Authorization: `Token ${token}` }
    });
    setCustomerBookings(res.data);
  };

  return (
  <div className={styles.pageWrapper}>
    <div className={styles.stickyHeader}>
      <div className={styles.headerRow}>
        <span className={styles.titulo}>Belgrano Tenis & Padel - Sistema de Reservas</span>
        <div className={styles.superiorNavWrapper}>
          <button
            className={styles.navBtnSmallTop}
            onClick={() => setDate(sumarDias(date, 7))}
            title="Avanzar 7 días"
          >
            {formatFecha(sumarDias(date, 7), "short")}
          </button>
        </div>
        <button className={styles.logoutBtn} onClick={logout}>
          Logout
        </button>
      </div>
      <div className={styles.navRowColumn}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "6px 0" }}>
          <button 
            className={styles.navBtnSmall}
            onClick={() => setDate(sumarDias(date, -1))}
            title="Día anterior">
              {formatFecha(sumarDias(date, -1), 'short')}
          </button>
          {/* <div style={{ position: "relative" }}> */}
          <button
            className={`${styles.fechaLabel} ${getWeekdayClass(date)} ${styles.navBtnCentral}`}
            onClick={() => setShowDatePicker(true)}
            // style={{ cursor: "pointer", minWidth: 170 }}
          >
            {formatFecha(date, 'long')}
          </button>
          {showDatePicker && (
            <div
              style={{
                position: "absolute",
                left: "50%",
                transform: "translateX(-50%)",
                top: "calc(100% + 0px)", // Debajo del botón y con espacio
                zIndex: 9999,
                background: "#fff",
                borderRadius: 10,
                boxShadow: "0 4px 18px #0002",
                padding: "6px 8px",
              }}
            >
            <DatePicker
              locale="es"
              selected={parseISO(date)}
              onChange={d => {
                setDate(d.toISOString().slice(0, 10));
                setShowDatePicker(false);
              }}
              inline
              minDate={new Date(2024, 0, 1)}
              maxDate={new Date(2030, 11, 31)}
              onClickOutside={() => setShowDatePicker(false)}
              // Permite cambiar mes y año arriba del calendario
              showMonthDropdown
              showYearDropdown
              dropdownMode="select"
              // locale="es" // si querés español
            />
          </div>
          )}
          <button 
            className={styles.navBtnSmall}
            onClick={() => setDate(sumarDias(date, 1))}
            aria-label="Día siguiente"
            >
              {formatFecha(sumarDias(date, 1), 'short')}
          </button>
        </div>
        <button className={styles.navBtnSmall}
          onClick={() => setDate(sumarDias(date, -7))}
          title="Retroceder 7 días"
        >
          {formatFecha(sumarDias(date, -7), "short")}
        </button>
      </div>
    </div>
    {/* Grilla scrollable */}
    <div className={styles.gridWrapper}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th className={`${styles.th} ${getWeekdayClass(date)}`}>Horario</th>
            {courts.map(court => (
              <th key={court.id} className={`${styles.th} ${getWeekdayClass(date)}`}>
                {court.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {timeslots.map(time => (
            <tr key={time}>
              <td className={`${styles.td} ${styles.timeCol} ${getWeekdayClass(date)}`}>{time}</td>
              {courts.map(court => {
                const booking = getBookingForTimeslot(court.id, time);
                const isBookingStart = booking && booking.start_time.slice(0,5) === time;
                return (
                  <td
                    key={court.id}
                    className={
                      booking
                        ? `${styles.td} ${styles.reserved}`
                        : `${styles.td} ${styles.free}`
                    }
                  >
                  {booking ? (
                    <div className={styles.reservaCell}>
                      {isBookingStart ? (
                        <>
                          <button
                            className={`${styles.button} ${styles.buttonReserved}`}
                            onClick={() =>
                              handleShowCustomerBookings(
                                booking.customer,
                                booking.customer_name,
                                booking.customer_phone
                              )
                            }
                          >
                            {booking.customer_name}
                          </button>
                          <button
                            className={styles.trashBtn}
                            title="Eliminar reserva"
                            onClick={() => setDeleteConfirm(booking)}
                          >
                            {/* SVG icono basura */}
                            <svg
                              width="18"
                              height="18"
                              viewBox="0 0 20 20"
                              fill="none"
                              style={{ verticalAlign: "middle" }}
                            >
                              <rect x="5" y="7" width="14" height="12" rx="2" stroke="#a00" strokeWidth="1.6"/>
                              <path d="M10 11V17M14 11V17" stroke="#a00" strokeWidth="1.6" strokeLinecap="round"/>
                              <path d="M3 7H21" stroke="#a00" strokeWidth="1.6" />
                              <path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" stroke="#a00" strokeWidth="1.6" />
                            </svg>
                          </button>
                        </>
                      ) : (
                        <span style={{ color: "#a00", fontWeight: 500 }}>Ocupado</span>
                      )}
                    </div>
                  ) : (
                  <button
                    className={styles.reserveBtn}
                    onClick={() => setFormParams({ court: court.id, courtName: court.name, time, date })}
                    aria-label="Reservar"
                  >
                    {/* vacío, solo el fondo del botón */}
                  </button>
                  )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      {loading && <div style={{ textAlign: "center", margin: 15 }}>Cargando grilla...</div>}
    </div>

    {/* Mini form inline para crear reserva */}
    {formParams && (
      <>
        <div
          className={styles.modalOverlay}
          onClick={() => setFormParams(null)}
        />
        <div className={styles.modal}>
        <QuickCreateForm
          {...formParams}
          onClose={() => setFormParams(null)}
          onCreated={() => {
            setFormParams(null);
            setReload(r => r + 1);
          }}
        />
        </div>
      </>
    )}

    {/* Mostrar reservas del cliente (simple modal) */}
    {customerBookings && (
      <>
        <div
          className={styles.modalOverlay}
          onClick={() => setCustomerBookings(null)}
        />
        <div className={styles.modal}>
          <h3>
            {editCustomer ? (
              <input
                type="text"
                value={editedName}
                onChange={e => setEditedName(e.target.value)}
                style={{fontWeight:"bold", fontSize:18}}
              />
            ) : (
              <>Reservas de {customerName}</>
            )}
          </h3>

          <div style={{ marginBottom: 10, fontSize: 15 }}>
            Teléfono:{" "}
            {editCustomer ? (
              <input
                type="text"
                value={editedPhone}
                onChange={e => setEditedPhone(e.target.value)}
                style={{fontSize:15}}
              />
            ) : (
              <b>{customerPhone}</b>
            )}
          </div>

          {!editCustomer ? (
            <button
              className={styles.editBtn}
              style={{ marginLeft: 10 }}
              onClick={() => setEditCustomer(true)}
            >
              Editar cliente
            </button>
          ) : (
            <>
              <button
                className={styles.editBtn}
                style={{ marginLeft: 10 }}
                onClick={async () => {
                  try {
                    // Hacé PUT al endpoint de clientes (ajustá si tu API es distinta)
                    const customerId = customerBookings?.[0]?.customer;
                    await axios.put(`${backend}/api/customers/${customerId}/`, {
                      name: editedName,
                      phone: editedPhone,
                    }, {
                      headers: { Authorization: `Token ${token}` }
                    });
                    setCustomerName(editedName);
                    setCustomerPhone(editedPhone);
                    setEditCustomer(false);
                    setReload(r=> r + 1);
                  } catch (err) {
                    alert("No se pudo actualizar el cliente");
                  }
                }}
              >
                Guardar
              </button>
              <button
                className={styles.editBtn}
                style={{ marginLeft: 8, background: "#ddd" }}
                onClick={() => {
                  setEditedName(customerName);
                  setEditedPhone(customerPhone);
                  setEditCustomer(false);
                }}
              >
                Cancelar
              </button>
            </>
          )}

          <ul style={{ marginTop: 30 }}>
            {customerBookings.map(b => (
              <li key={b.id} style={{ margin: "6px 0" }}>
                {b.date} {b.start_time.slice(0, 5)}-{b.end_time.slice(0, 5)} | Cancha:{" "}
                {courts.find(c => c.id === b.court)?.name}

                <button
                  className={styles.trashBtn}
                  title="Eliminar reserva"
                  onClick={() => setDeleteConfirm(b)}
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 3 20 20"
                    fill="none"
                    style={{ verticalAlign: "middle" }}
                  >
                    <rect x="5" y="7" width="14" height="12" rx="2" stroke="#a00" strokeWidth="1.6"/>
                    <path d="M10 11V17M14 11V17" stroke="#a00" strokeWidth="1.6" strokeLinecap="round"/>
                    <path d="M3 7H21" stroke="#a00" strokeWidth="1.6" />
                    <path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" stroke="#a00" strokeWidth="1.6" />
                  </svg>
                </button>

              </li>
            ))}
          </ul>
        </div>
      </>
      
    )}

    {deleteConfirm && (
      <>
        <div className={styles.modalOverlay} onClick={() => setDeleteConfirm(null)} />
        <div className={styles.modal}>
          <h3>¿Eliminar reserva?</h3>
          <div style={{marginBottom:12, fontSize:15, color:"#333"}}>
            <div><b>Cliente:</b> {deleteConfirm.customer_name}</div>
            <div><b>Fecha:</b> {deleteConfirm.date}</div>
            <div>
              <b>Hora:</b> {deleteConfirm.start_time.slice(0,5)} - {deleteConfirm.end_time.slice(0,5)}
            </div>
            <div>
              <b>Cancha:</b> {courts.find(c => c.id === deleteConfirm.court)?.name}
            </div>
          </div>
          <div style={{display:"flex", justifyContent:"flex-end", gap:10}}>
            <button
              className={styles.button}
              style={{background:"#aaa"}}
              onClick={() => setDeleteConfirm(null)}
            >
              Cancelar
            </button>
            <button
              className={`${styles.button} ${styles.buttonReserved}`}
              style={{background:"#e64646", color:"#fff"}}
              onClick={async () => {
                try {
                  await axios.delete(`${backend}/api/bookings/${deleteConfirm.id}/`, {
                    headers: { Authorization: `Token ${token}` }
                  });
                  setReload(r => r + 1);
                  if (customerBookings) {
                    setCustomerBookings(customerBookings.filter(b => b.id !== deleteConfirm.id));
                  }
                  setDeleteConfirm(null);
                } catch (err) {
                  setDeleteConfirm(null);
                  // Podés mostrar un toast, mensaje, etc
                }
              }}
            >
              Confirmar eliminación
            </button>
          </div>
        </div>
      </>
    )}

    <footer className={styles.footer}>
      © {new Date().getFullYear()} Desarrollado por InSoft - www.insoft.ar
    </footer>
  </div>
);
}

function formatFecha(dateStr, format = "long") {
  const [year, month, day] = dateStr.split('-').map(Number);
  const fecha = new Date(year, month - 1, day);

  if (format === "long") {
    // martes, 3 de junio de 2025
    const opciones = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
    return fecha.toLocaleDateString('es-AR', opciones);
  } else if (format === "short") {
    // Martes 3
    const opciones = { weekday: 'long', day: 'numeric' };
    let s = fecha.toLocaleDateString('es-AR', opciones);
    return s.charAt(0).toUpperCase() + s.slice(1); // Primera mayúscula
  }
  return dateStr;
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
function QuickCreateForm({ court, courtName, time, date, onClose, onCreated }) {
  const backend = import.meta.env.VITE_BACKEND_URL;
  const { token } = useAuth();
  const [customers, setCustomers] = useState([]);
  const [customer, setCustomer] = useState(""); // customer.id si existe
  const [customerInput, setCustomerInput] = useState(""); // texto en input
  const [customerPhone, setCustomerPhone] = useState(""); // para nuevo cliente
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [endTime, setEndTime] = useState(""); 
  const [error, setError] = useState("");
  const [okMsg, setOkMsg] = useState("");

  const systemEndTime = "21:00";
  const interval = 30; // minutos

  useEffect(() => {
    axios.get(`${backend}/api/customers/`, {
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

  // ¿Existe un cliente exacto? (ignorando mayúsculas)
  const selectedCustomer = customers.find(
  c => c.name.toLowerCase() === customerInput.trim().toLowerCase()
  );

  const handleCustomerSelect = (cust) => {
    setCustomer(cust.id);
    setCustomerInput(cust.name);
    setShowSuggestions(false);
    setCustomerPhone(""); // Limpia el teléfono si selecciona uno existente
  };

  const endTimeOptions = getEndTimeOptions(time, systemEndTime, interval).slice(1);

  const handleSubmit = async e => {
    e.preventDefault();
    setError(""); setOkMsg("");

    let customerId = customer;

    // Si NO existe, crealo
    if (!selectedCustomer) {
      if (!customerPhone || customerPhone.length < 5) {
        setError("Ingresá un teléfono válido para el nuevo cliente.");
        return;
      }
      try {
        // Crea cliente nuevo
        const res = await axios.post(
          `${backend}/api/customers/`,
          { name: customerInput.trim(), phone: customerPhone },
          { headers: { Authorization: `Token ${token}` } }
        );
        customerId = res.data.id;
        setCustomers([...customers, res.data]); // opcional, para refrescar autocomplete
      } catch (err) {
        setError("No se pudo crear el cliente: " + (err.response?.data?.detail || ""));
        return;
      }
    }

    // Crear reserva normalmente
    try {
      await axios.post(`${backend}/api/bookings/`, {
        date,
        start_time: time,
        end_time: endTime,
        court,
        customer: customerId
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
    <div className={styles.miniFormModal}>
      <b>Reserva {courtName && <span style={{color:"#2967af"}}>{courtName}</span>}</b>
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
        {/* Si el cliente NO existe, pedí el teléfono */}
        {!selectedCustomer && customerInput.length > 0 && (
          <div>
            Teléfono:
            <input
              type="text"
              value={customerPhone}
              onChange={e => setCustomerPhone(e.target.value)}
              placeholder="Teléfono cliente"
              required
              style={{ width: "100%" }}
            />
          </div>
        )}
        <button type="submit">Reservar</button>
        <button type="button" style={{marginLeft:8}} onClick={onClose}>Cancelar</button>
      </form>
      {okMsg && <div style={{color:"green"}}>{okMsg}</div>}
      {error && <div style={{color:"red"}}>{error}</div>}
    </div>
  );
}

const WEEKDAYS = [
  { name: 'Domingo',   class: styles.bgDomingo },
  { name: 'Lunes',     class: styles.bgLunes },
  { name: 'Martes',    class: styles.bgMartes },
  { name: 'Miércoles', class: styles.bgMiercoles },
  { name: 'Jueves',    class: styles.bgJueves },
  { name: 'Viernes',   class: styles.bgViernes },
  { name: 'Sábado',    class: styles.bgSabado }
];

function getWeekdayClass(dateStr) {
  // Suponé que dateStr es "2025-05-29"
  const [year, month, day] = dateStr.split("-");
  // JS: los meses son 0-based, por eso el -1
  const date = new Date(year, month - 1, day);
  const dayIdx = date.getDay(); // 0 = Domingo, ..., 6 = Sábado
  return WEEKDAYS[dayIdx].class;
}



export default ScheduleGrid;