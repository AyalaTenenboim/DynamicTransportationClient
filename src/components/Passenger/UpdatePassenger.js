import axios from "axios";
import React, { useEffect, useState } from "react";
import '../../CSS/PassengerLogin.css';
import { useNavigate, useLocation } from 'react-router-dom';

export default function UpdatePassenger() {
    const navigate = useNavigate();
    const location = useLocation();
    const details = location.state;

    const passengerId = parseInt(localStorage.getItem('passengerId'));

    const [passenger, setPassenger] = useState({
        passengerName: "",
        passengerPassword: "",
        passengerMail: "",
        passengerPhone: ""
    });

    const [inputErrors, setInputErrors] = useState({});

    useEffect(() => {
        axios.get(`http://localhost:5238/api/Passenger/passengerId?passengerId=${passengerId}`)
            .then((response) => {
                if (response.data !== '')
                    setPassenger(response.data);
                else
                    alert("שגיאה בשליפת פרטי הנוסע");
            })
    }, []);

    function handleSubmit(event) {
        event.preventDefault();

        setInputErrors({});
        const nameRegex = /^[a-zA-Zא-ת\s]{2,50}$/;
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*()_\-+=\[\]{};':"\\|,.<>\/?]).{8,}$/;
        const phoneRegex = /^05\d{8}$/;

        const errors = {};
        if (!passenger.passengerName.trim()) {
            errors.passengerName = "שדה חובה";
        } else if (!nameRegex.test(passenger.passengerName)) {
            errors.passengerName = "שם חייב להכיל רק אותיות";
        }

        if (!passenger.passengerPassword.trim()) {
            errors.passengerPassword = "שדה חובה";
        } else if (!passwordRegex.test(passenger.passengerPassword)) {
            errors.passengerPassword = "הסיסמה חייבת להכיל לפחות 8 תווים כולל ספרה, אות קטנה, אות גדולה ותו מיוחד";
        }

        if (!passenger.passengerMail.trim()) {
            errors.passengerMail = "שדה חובה";
        } else if (!emailRegex.test(passenger.passengerMail)) {
            errors.passengerMail = "כתובת מייל לא תקינה";
        }

        if (!passenger.passengerPhone.trim()) {
            errors.passengerPhone = "שדה חובה";
        } else if (!phoneRegex.test(passenger.passengerPhone)) {
            errors.passengerPhone = "מספר פלאפון לא תקין";
        }

        if (Object.keys(errors).length > 0) {
            setInputErrors(errors);
            return;
        }

        axios.put("http://localhost:5238/api/Passenger", passenger)
            .then((response) => {
                localStorage.setItem('passengerId', response.data.passengerId);
                localStorage.setItem('passengerName', response.data.passengerName);
                alert("הפרטים עודכנו בהצלחה");
            }).catch((err) => {
                console.log(err);
            });
    }

    return (
        <div className="login-container">
            <div className="login-box">
                <h2>עדכון פרטים</h2>
                <form onSubmit={handleSubmit}>
                    <input
                        className="login-input"
                        type="text"
                        // placeholder="שם מלא"
                        placeholder ={passenger.passengerName}
                        onChange={(e) => setPassenger({ ...passenger, passengerName: e.target.value })}
                    />
                    {inputErrors.passengerName && <div className="error-text">{inputErrors.passengerName}</div>}

                    <input
                        className="login-input"
                        type="password"
                        // placeholder="סיסמה"
                        placeholder ={passenger.passengerPassword}
                        onChange={(e) => setPassenger({ ...passenger, passengerPassword: e.target.value })}
                    />
                    {inputErrors.passengerPassword && <div className="error-text">{inputErrors.passengerPassword}</div>}

                    <input
                        className="login-input"
                        type="email"
                        // placeholder="כתובת מייל"
                        placeholder ={passenger.passengerMail}
                        onChange={(e) => setPassenger({ ...passenger, passengerMail: e.target.value })}
                    />
                    {inputErrors.passengerMail && <div className="error-text">{inputErrors.passengerMail}</div>}

                    <input
                        className="login-input"
                        type="text"
                        // placeholder="פלאפון"
                        placeholder ={passenger.passengerPhone}
                        onChange={(e) => setPassenger({ ...passenger, passengerPhone: e.target.value })}
                    />
                    {inputErrors.passengerPhone && <div className="error-text">{inputErrors.passengerPhone}</div>}

                    <button className="login-button" type="submit">עדכון הפרטים</button>
                </form>

                {/* <div className="register-text">
                    חזור לתפריט?{" "}
                    <span className="register-link" onClick={() => navigate('/PassengerMenuPage')}>לחץ כאן</span>
                </div> */}
            </div>
        </div>
    );
}
