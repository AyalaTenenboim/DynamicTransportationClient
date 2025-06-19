import axios from 'axios';
import React, { useState, useEffect } from 'react';
import '../../CSS/PassengerLogin.css';
import { useNavigate } from 'react-router-dom';

export default function UpdateDriverAndCar() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  // מצב הנהג
  const [driver, setDriver] = useState({
    DriverId: null,
    DriverName: "",
    DriverPassword: "",
    DriverPhone: "",
    DriverMail: ""
  });

  // מצב הרכב
  const [car, setCar] = useState({
    CarId: null,
    DriverId: null,
    LocationCar: "",
    StartTimeCar: "",
    EndTimeCar: "",
    NumOfPlaces: 0,
    IsAvailable: true
  });

  const [driverErrors, setDriverErrors] = useState({});
  const [carErrors, setCarErrors] = useState({});

  // טעינת פרטי הנהג והרכב הקיימים
  useEffect(() => {
    const driverId = localStorage.getItem("driverId");
    const driverName = localStorage.getItem("driverName");
    const driverPassword = localStorage.getItem("driverPassword");

    if (!driverId) {
      alert("לא נמצא מזהה נהג");
      navigate('/DriverLogin');
      return;
    }

    // טעינת פרטי הנהג
    const loadDriverData = axios.get(`http://localhost:5238/api/Driver/${driverName}/${driverPassword}`)
      .then((response) => {
        const driverData = response.data;
        setDriver({
          DriverId: driverData.driverId || driverData.DriverId,
          DriverName: driverData.driverName || driverData.DriverName || "",
          DriverPassword: driverData.driverPassword || driverData.DriverPassword || "",
          DriverPhone: driverData.driverPhone || driverData.DriverPhone || "",
          DriverMail: driverData.driverMail || driverData.DriverMail || ""
        });
      });

    // טעינת פרטי הרכב
    const loadCarData = axios.get(`http://localhost:5238/api/Car/driver/${driverId}`)
      .then((response) => {
        const carData = response.data;
        setCar({
          CarId: carData.carId || carData.CarId,
          DriverId: carData.driverId || carData.DriverId,
          LocationCar: carData.locationCar || carData.LocationCar || "",
          StartTimeCar: carData.startTimeCar || carData.StartTimeCar || "",
          EndTimeCar: carData.endTimeCar || carData.EndTimeCar || "",
          NumOfPlaces: carData.numOfPlaces || carData.NumOfPlaces || 0,
          IsAvailable: carData.isAvailable !== undefined ? carData.isAvailable : (carData.IsAvailable !== undefined ? carData.IsAvailable : true)
        });
      })
      .catch((err) => {
        console.error("שגיאה בטעינת פרטי רכב:", err);
        // אם אין רכב, נשאיר את הערכים הריקים
      });

    Promise.all([loadDriverData, loadCarData])
      .finally(() => {
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        alert("שגיאה בטעינת הפרטים");
        navigate('/DriverMenuPage');
      });
  }, [navigate]);

  function validateDriverForm() {
    const errors = {};
    const nameRegex = /^[a-zA-Zא-ת\s]{2,50}$/;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*()_\-+=\[\]{};':"\\|,.<>\/?]).{8,}$/;
    const phoneRegex = /^05\d{8}$/;

    if (!driver.DriverName.trim()) {
      errors.DriverName = "שדה חובה";
    } else if (!driver.DriverName.match(nameRegex)) {
      errors.DriverName = "שם חייב להכיל רק אותיות";
    }

    if (driver.DriverPassword.trim() && !driver.DriverPassword.match(passwordRegex)) {
      errors.DriverPassword = "הסיסמה חלשה";
    }

    if (!driver.DriverMail.trim()) {
      errors.DriverMail = "שדה חובה";
    } else if (!driver.DriverMail.match(emailRegex)) {
      errors.DriverMail = "מייל לא תקין";
    }

    if (!driver.DriverPhone.trim()) {
      errors.DriverPhone = "שדה חובה";
    } else if (!driver.DriverPhone.match(phoneRegex)) {
      errors.DriverPhone = "מספר לא תקין";
    }

    setDriverErrors(errors);
    return Object.keys(errors).length === 0;
  }

  function validateCarForm() {
    const errors = {};

    if (!car.LocationCar.trim()) errors.LocationCar = "שדה חובה";
    if (!car.StartTimeCar) errors.StartTimeCar = "שדה חובה";
    if (!car.EndTimeCar) errors.EndTimeCar = "שדה חובה";
    if (!car.NumOfPlaces || car.NumOfPlaces <= 0) errors.NumOfPlaces = "חייב להיות לפחות מקום אחד";

    setCarErrors(errors);
    return Object.keys(errors).length === 0;
  }

  function handleDriverUpdate(e) {
    e.preventDefault();
    if (!validateDriverForm()) return;

    const updateData = {
      DriverId: driver.DriverId,
      DriverName: driver.DriverName,
      DriverPhone: driver.DriverPhone,
      DriverMail: driver.DriverMail
    };

    if (driver.DriverPassword.trim()) {
      updateData.DriverPassword = driver.DriverPassword;
    }

    axios.put(`http://localhost:5238/api/Driver`, updateData)
      .then(() => {
        localStorage.setItem("driverName", driver.DriverName);
        alert("פרטי הנהג עודכנו בהצלחה!");
        setDriver({ ...driver, DriverPassword: "" }); // ניקוי שדה הסיסמה
      })
      .catch((err) => {
        console.error(err);
        alert("שגיאה בעדכון פרטי הנהג");
      });
  }

  function handleCarUpdate(e) {
    e.preventDefault();
    if (!validateCarForm()) return;

    const carData = {
      CarId: car.CarId,
      DriverId: driver.DriverId,
      NumOfPlaces: car.NumOfPlaces,
      IsAvailable: car.IsAvailable,
      LocationCar: car.LocationCar,
      StartTimeCar: car.StartTimeCar,
      EndTimeCar: car.EndTimeCar
    };

    const apiCall = car.CarId
      ? axios.put(`http://localhost:5238/api/Car`, carData)  // עדכון רכב קיים
      : axios.post(`http://localhost:5238/api/Car`, carData); // יצירת רכב חדש

    apiCall
      .then((response) => {
        if (!car.CarId && response.data) {
          // אם זה רכב חדש, שמירת ה-ID שהתקבל
          const newCarId = response.data.carId || response.data.CarId || response.data.id;
          setCar({ ...car, CarId: newCarId });
        }
        alert("פרטי הרכב עודכנו בהצלחה!");
      })
      .catch((err) => {
        console.error(err);
        alert("שגיאה בעדכון פרטי הרכב");
      });
  }

  if (loading) {
    return (
      <div className="login-container">
        <div className="login-box">
          <h2>טוען פרטים...</h2>
        </div>
      </div>
    );
  }


   const handleClick = () => {
        navigate('/DriverMenuPage');
    };


  return (
    <div className="login-container">
      <div style={{ display: 'flex', gap: '20px', maxWidth: '800px', width: '100%' }}>

        {/* טופס פרטי הנהג */}
        <div className="login-box" style={{ flex: 1 }}>
          <h2>עדכון פרטים אישיים</h2>

          <input
            className="login-input"
            type="text"
            placeholder={driver.DriverName}
            onChange={(e) => setDriver({ ...driver, DriverName: e.target.value })}
          />
          {driverErrors.DriverName && <div className="error-text">{driverErrors.DriverName}</div>}

          <input
            className="login-input"
            type="password"
            placeholder={driver.DriverPassword}
            onChange={(e) => setDriver({ ...driver, DriverPassword: e.target.value })}
          />
          {driverErrors.DriverPassword && <div className="error-text">{driverErrors.DriverPassword}</div>}

          <input
            className="login-input"
            type="email"
            placeholder={driver.DriverMail}
            onChange={(e) => setDriver({ ...driver, DriverMail: e.target.value })}
          />
          {driverErrors.DriverMail && <div className="error-text">{driverErrors.DriverMail}</div>}

          <input
            className="login-input"
            type="text"
            placeholder={driver.DriverPhone}
            onChange={(e) => setDriver({ ...driver, DriverPhone: e.target.value })}
          />
          {driverErrors.DriverPhone && <div className="error-text">{driverErrors.DriverPhone}</div>}

          <button className="login-button" onClick={handleDriverUpdate} style={{ marginTop: '15px' }}>
            עדכן פרטים אישיים
          </button>
        </div>

        {/* טופס פרטי הרכב */}
        <div className="login-box" style={{ flex: 1 }}>
          <h2>עדכון פרטי רכב</h2>

          <input
            className="login-input"
            type="text"
            placeholder={car.LocationCar}
            onChange={(e) => setCar({ ...car, LocationCar: e.target.value })}
          />
          {carErrors.LocationCar && <div className="error-text">{carErrors.LocationCar}</div>}

          <label className="time-label">שעת התחלה</label>
          <input
            className="login-input"
            type={car.StartTimeCar}
            onChange={(e) => setCar({ ...car, StartTimeCar: e.target.value })}
          />
          {carErrors.StartTimeCar && <div className="error-text">{carErrors.StartTimeCar}</div>}

          <label className="time-label">שעת סיום</label>
          <input
            className="login-input"
            type={car.EndTimeCar}
            onChange={(e) => setCar({ ...car, EndTimeCar: e.target.value })}
          />
          {carErrors.EndTimeCar && <div className="error-text">{carErrors.EndTimeCar}</div>}

          <input
            className="login-input"
            type="number"
            placeholder={car.NumOfPlaces}
            onChange={(e) => setCar({ ...car, NumOfPlaces: parseInt(e.target.value) || 0 })}
          />
          {carErrors.NumOfPlaces && <div className="error-text">{carErrors.NumOfPlaces}</div>}

          <label style={{ display: 'flex', alignItems: 'center', marginTop: '10px' }}>
            <input
              type={car.IsAvailable}
              onChange={(e) => setCar({ ...car, IsAvailable: e.target.checked })}
              style={{ marginLeft: '8px' }}
            />
            זמין
          </label>

          <button className="login-button" onClick={handleCarUpdate} style={{ marginTop: '15px' }}>
            עדכן פרטי רכב
          </button>
        </div>
      </div>

      <button
        onClick={handleClick}
        className="btn btn-secondary position-fixed bg-secondary border-secondary text-white"
        style={{ top: '20px', right: '20px', zIndex: 1000 }}
      >
        חזרה לתפריט
      </button>
    </div>
  );
}