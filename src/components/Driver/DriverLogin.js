import { useState } from "react";
import axios from "axios";
import { useNavigate } from 'react-router-dom';
import '../../CSS/PassengerLogin.css';

export default function DriverLogin() {
    const navigate = useNavigate();

    const [driverName, setDriverName] = useState('');
    const [driverId, setDriverId] = useState('');
    const [carId, setCarId] = useState('');
    const [driverPassword, setDriverPassword] = useState('');
    const [error, setError] = useState('');

    function handleButtonClick() {
        setError('');
        if (!driverName || !driverPassword) {
            setError("יש למלא את כל השדות");
            return;
        }

        axios.get(`http://localhost:5238/api/Driver/${driverName}/${driverPassword}`)
            .then((response) => {
                if (response.data !== '') {
                    localStorage.setItem('driverName', response.data.driverName);
                    localStorage.setItem('driverId', response.data.driverId);
                    localStorage.setItem('carId', response.data.carId);
                    navigate('/DriverMenuPage');
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
                <h2>התחברות נהג</h2>
                <input
                    className="login-input"
                    type="text"
                    placeholder="שם משתמש"
                    onChange={(e) => setDriverName(e.target.value)}
                />
                <input
                    className="login-input"
                    type="password"
                    placeholder="סיסמה"
                    onChange={(e) => setDriverPassword(e.target.value)}
                />
                {error && <div className="error-text">{error}</div>}
                <button className="login-button" onClick={handleButtonClick}>כניסה</button>
                <p className="register-text">
                    עדיין לא רשומים?{" "}
                    <span className="register-link" onClick={() => navigate('/DriverRegistration')}>להרשמה</span>
                </p>
            </div>
        </div>
    );
}
