import axios from 'axios';
import React, { useState } from 'react';
import '../../CSS/PassengerLogin.css'; // עיצוב אחיד עם דף ההתחברות
import { useNavigate } from 'react-router-dom';

export default function PassengerRegistration() {
    const navigate = useNavigate();
    const [passenger, setPassenger] = useState({
        passengerName: "",
        passengerPassword: "",
        passengerMail: "",
        passengerPhone: ""
    });

    const [inputErrors, setInputErrors] = useState({});

    function handleButtonClick(e) {
        e.preventDefault();

        const nameRegex = /^[a-zA-Zא-ת\s]{2,50}$/;
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*()_\-+=\[\]{};':"\\|,.<>\/?]).{8,}$/;
        const phoneRegex = /^05\d{8}$/;

        const errors = {};

        if (!passenger.passengerName.match(nameRegex))
            errors.passengerName = "שם חייב להכיל רק אותיות";
        if (!passenger.passengerPassword.match(passwordRegex))
            errors.passengerPassword = "הסיסמה חייבת לפחות 8 תווים כולל אותיות, מספר ותו מיוחד";
        if (!passenger.passengerMail.match(emailRegex))
            errors.passengerMail = "כתובת מייל לא תקינה";
        if (!passenger.passengerPhone.match(phoneRegex))
            errors.passengerPhone = "מספר פלאפון לא תקין";

        setInputErrors(errors);

        if (Object.keys(errors).length === 0) {
            axios.post("http://localhost:5238/api/Passenger", passenger)
                .then((response) => {
                    if (response.data !== '') {
                        localStorage.setItem('passengerId', response.data.passengerId);
                        localStorage.setItem('passengerName', response.data.passengerName);
                        navigate('/PassengerMenuPage');
                    } else {
                        alert("ההרשמה נכשלה");
                    }
                }).catch((err) => {
                    console.log(err);
                    alert("שגיאה בשרת");
                });
        }
    }

    return (
        <div className="login-container">
            <div className="login-box">
                <h2>הרשמת נוסע</h2>

                <input
                    className="login-input"
                    type="text"
                    placeholder="שם משתמש"
                    onChange={(e) => setPassenger({ ...passenger, passengerName: e.target.value })}
                />
                {inputErrors.passengerName && <div className="error-text">{inputErrors.passengerName}</div>}

                <input
                    className="login-input"
                    type="password"
                    placeholder="סיסמה"
                    onChange={(e) => setPassenger({ ...passenger, passengerPassword: e.target.value })}
                />
                {inputErrors.passengerPassword && <div className="error-text">{inputErrors.passengerPassword}</div>}

                <input
                    className="login-input"
                    type="email"
                    placeholder="אימייל"
                    onChange={(e) => setPassenger({ ...passenger, passengerMail: e.target.value })}
                />
                {inputErrors.passengerMail && <div className="error-text">{inputErrors.passengerMail}</div>}

                <input
                    className="login-input"
                    type="text"
                    placeholder="פלאפון"
                    onChange={(e) => setPassenger({ ...passenger, passengerPhone: e.target.value })}
                />
                {inputErrors.passengerPhone && <div className="error-text">{inputErrors.passengerPhone}</div>}

                <button className="login-button" onClick={handleButtonClick}>הרשמה</button>

                <p className="register-text">
                    כבר רשומים?{" "}
                    <span className="register-link" onClick={() => navigate('/PassengerLogin')}>התחברו</span>
                </p>
            </div>
        </div>
    );
}
