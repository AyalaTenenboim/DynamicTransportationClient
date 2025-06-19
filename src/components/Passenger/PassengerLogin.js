import { useState } from "react";
import axios from "axios";
import { useNavigate } from 'react-router-dom';
import '../../CSS/PassengerLogin.css'; // ודא שהקובץ הזה קיים

export default function PassengerLogin() {
    const navigate = useNavigate();
    const [passengerName, setPassengerName] = useState('');
    const [passengerPassword, setPassengerPassword] = useState('');
    const [error, setError] = useState('');

    function handleButtonClick() {
        setError('');
        if (!passengerName || !passengerPassword) {
            setError("יש למלא את כל השדות");
            return;
        }

        axios.get(`http://localhost:5238/api/Passenger/${passengerName}/${passengerPassword}`)
            .then((response) => {
                if (response.data !== '') {
                    localStorage.setItem('passengerId', response.data.passengerId);
                    localStorage.setItem('passengerName', response.data.passengerName);
                    navigate('/PassengerMenuPage');
                } else {
                    setError("אינך קיים במערכת");
                }
            }).catch((err) => {
                setError("שגיאה בעת ההתחברות");
                console.log(err);
            });
    }

    return (
        <div className="login-container">
            <div className="login-box">
                <h2>התחברות נוסע</h2>
                <input
                    className="login-input"
                    type="text"
                    placeholder="שם משתמש"
                    onChange={(e) => setPassengerName(e.target.value)}
                />
                <input
                    className="login-input"
                    type="password"
                    placeholder="סיסמה"
                    onChange={(e) => setPassengerPassword(e.target.value)}
                />
                {error && <div className="error-text">{error}</div>}
                <button className="login-button" onClick={handleButtonClick}>כניסה</button>
                <p className="register-text">
                    עדיין לא רשומים?{" "}
                    <span className="register-link" onClick={() => navigate('/PassengerRegistration')}>להרשמה</span>
                </p>
            </div>
        </div>
    );
}
