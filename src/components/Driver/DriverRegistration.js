import axios from 'axios';
import React, { useState } from 'react';
import '../../CSS/PassengerLogin.css';
import { useNavigate } from 'react-router-dom';

export default function DriverRegistration() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isDriverSaved, setIsDriverSaved] = useState(false);

  const [driver, setDriver] = useState({
    DriverId: null,
    DriverName: "",
    DriverPassword: "",
    DriverPhone: "",
    DriverMail: "",
    LocationCar: "",
    StartTimeCar: "",
    EndTimeCar: "",
    NumOfPlaces: 0,
    IsAvailable: true
  });

  const [inputErrors, setInputErrors] = useState({});

  function validateStep1() {
    const errors = {};
    const nameRegex = /^[a-zA-Zא-ת\s]{2,50}$/;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*()_\-+=\[\]{};':"\\|,.<>\/?]).{8,}$/;
    const phoneRegex = /^05\d{8}$/;

    if (!driver.DriverName.trim()) errors.DriverName = "שדה חובה";
    else if (!driver.DriverName.match(nameRegex)) errors.DriverName = "שם חייב להכיל רק אותיות";

    if (!driver.DriverPassword.trim()) errors.DriverPassword = "שדה חובה";
    else if (!driver.DriverPassword.match(passwordRegex)) errors.DriverPassword = "הסיסמה חלשה";

    if (!driver.DriverMail.trim()) errors.DriverMail = "שדה חובה";
    else if (!driver.DriverMail.match(emailRegex)) errors.DriverMail = "מייל לא תקין";

    if (!driver.DriverPhone.trim()) errors.DriverPhone = "שדה חובה";
    else if (!driver.DriverPhone.match(phoneRegex)) errors.DriverPhone = "מספר לא תקין";

    setInputErrors(errors);
    return Object.keys(errors).length === 0;
  }

  function validateStep2() {
    const errors = {};

    if (!driver.LocationCar.trim()) errors.LocationCar = "שדה חובה";
    if (!driver.StartTimeCar) errors.StartTimeCar = "שדה חובה";
    if (!driver.EndTimeCar) errors.EndTimeCar = "שדה חובה";
    if (!driver.NumOfPlaces || driver.NumOfPlaces <= 0) errors.NumOfPlaces = "חייב להיות לפחות מקום אחד";

    setInputErrors(errors);
    return Object.keys(errors).length === 0;
  }

  function handleNext(e) {
    e.preventDefault();
    if (!validateStep1()) return;

    const driverData = {
      DriverName: driver.DriverName,
      DriverPassword: driver.DriverPassword,
      DriverPhone: driver.DriverPhone,
      DriverMail: driver.DriverMail
    };

    if (!isDriverSaved) {
      // POST פעם ראשונה
      axios.post("http://localhost:5238/api/Driver", driverData)
        .then((response) => {
          const newId = response.data.driverId || response.data.DriverId || response.data.id;
          if (newId) {
            setDriver((prev) => ({ ...prev, DriverId: newId }));
            localStorage.setItem("driverId", newId);
            localStorage.setItem("driverName", driverData.DriverName);
            setIsDriverSaved(true);
            setStep(2);
          } else {
            alert("שגיאה: לא התקבל מזהה נהג");
          }
        })
        .catch((err) => {
          console.error(err);
          alert("שגיאה בשליחת פרטי נהג");
        });
    } else {
      // PUT אם חזר אחורה ושינה
      axios.put(`http://localhost:5238/api/Driver`, {
        DriverId: driver.DriverId,
        ...driverData
      })
        .then(() => {
          setStep(2);
        })
        .catch((err) => {
          console.error(err);
          alert("שגיאה בעדכון פרטי נהג");
        });
    }
  }

  function handleRegister(e) {
    e.preventDefault();
    if (!validateStep2()) return;

    axios.post("http://localhost:5238/api/Car", {
      DriverId: driver.DriverId,
      NumOfPlaces: driver.NumOfPlaces,
      IsAvailable: driver.IsAvailable,
      LocationCar: driver.LocationCar,
      StartTimeCar: driver.StartTimeCar,
      EndTimeCar: driver.EndTimeCar
    })
      .then(() => {
        navigate('/DriverMenuPage');
      })
      .catch((err) => {
        console.error(err);
        alert("שגיאה בשליחת פרטי רכב");
      });
  }

  return (
    <div className="login-container">
      <div className="login-box">
        {step === 1 && (
          <>
            <h2>הרשמת נהג - פרטים אישיים</h2>
            <input
              className="login-input"
              type="text"
              placeholder="שם משתמש"
              value={driver.DriverName}
              onChange={(e) => setDriver({ ...driver, DriverName: e.target.value })}
            />
            {inputErrors.DriverName && <div className="error-text">{inputErrors.DriverName}</div>}

            <input
              className="login-input"
              type="password"
              placeholder="סיסמה"
              value={driver.DriverPassword}
              onChange={(e) => setDriver({ ...driver, DriverPassword: e.target.value })}
            />
            {inputErrors.DriverPassword && <div className="error-text">{inputErrors.DriverPassword}</div>}

            <input
              className="login-input"
              type="email"
              placeholder="מייל"
              value={driver.DriverMail}
              onChange={(e) => setDriver({ ...driver, DriverMail: e.target.value })}
            />
            {inputErrors.DriverMail && <div className="error-text">{inputErrors.DriverMail}</div>}

            <input
              className="login-input"
              type="text"
              placeholder="טלפון"
              value={driver.DriverPhone}
              onChange={(e) => setDriver({ ...driver, DriverPhone: e.target.value })}
            />
            {inputErrors.DriverPhone && <div className="error-text">{inputErrors.DriverPhone}</div>}

            <button className="login-button" onClick={handleNext}>הבא</button>
            <p className="register-text">
               רשומים?{" "}
              <span className="register-link" onClick={() => navigate('/DriverLogin')}>להתחברות</span>
            </p>
          </>
        )}

        {step === 2 && (
          <>
            <h2>הרשמת נהג - פרטי רכב</h2>

            <input
              className="login-input"
              type="text"
              placeholder="כתובת"
              value={driver.LocationCar}
              onChange={(e) => setDriver({ ...driver, LocationCar: e.target.value })}
            />
            {inputErrors.LocationCar && <div className="error-text">{inputErrors.LocationCar}</div>}

            <label className="time-label">שעת התחלה</label>
            <input
              className="login-input"
              type="time"
              value={driver.StartTimeCar}
              onChange={(e) => setDriver({ ...driver, StartTimeCar: e.target.value })}
            />
            {inputErrors.StartTimeCar && <div className="error-text">{inputErrors.StartTimeCar}</div>}

            <label className="time-label">שעת סיום</label>
            <input
              className="login-input"
              type="time"
              value={driver.EndTimeCar}
              onChange={(e) => setDriver({ ...driver, EndTimeCar: e.target.value })}
            />
            {inputErrors.EndTimeCar && <div className="error-text">{inputErrors.EndTimeCar}</div>}

            <input
              className="login-input"
              type="number"
              placeholder="מספר מקומות ברכב"
              value={driver.NumOfPlaces}
              onChange={(e) => setDriver({ ...driver, NumOfPlaces: parseInt(e.target.value) })}
            />
            {inputErrors.NumOfPlaces && <div className="error-text">{inputErrors.NumOfPlaces}</div>}

            <label>
              <input
                type="checkbox"
                checked={driver.IsAvailable}
                onChange={(e) => setDriver({ ...driver, IsAvailable: e.target.checked })}
              />
              זמין
            </label>

            <div style={{ marginTop: '15px' }}>
              <button className="login-button" onClick={() => setStep(1)} style={{ marginRight: '10px' }}>חזרה</button>
              <button className="login-button" onClick={handleRegister}>הרשמה</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
