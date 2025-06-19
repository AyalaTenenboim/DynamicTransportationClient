import React from "react";
import { useNavigate } from 'react-router-dom';
import '../CSS/LoginCSS.css';

export default function LoginPage() {
    const navigate = useNavigate();
    return (
        <div className="login-container">
            <div className="login-card">
                <h1 className="login-title">התחברות למערכת</h1>
                <p className="login-subtitle">אנא בחרו את סוג המשתמש:</p>
                <button onClick={() => navigate('/PassengerLogin')} className="login-button">נוסע</button>
                <button onClick={() => navigate('/DriverLogin')} className="login-button">נהג</button>
            </div>
        </div>
    );
}
