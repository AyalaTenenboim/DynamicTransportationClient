import { useNavigate } from "react-router";
import React from 'react';
import '../../CSS/PassengerMenuPage.css';

export default function PassengerMenuPage() {
    const navigate = useNavigate();
    const passengerName = localStorage.getItem('passengerName');

    return (
        <div className='menu-container'>
            <div className="menu-header">שלום <br />{passengerName}</div>
            <div className="button-row">
                <button className="menu-button" onClick={() => navigate('/UpdatePassenger')}>
                    עדכון פרטים אישיים
                </button>
                <button className="menu-button" onClick={() => navigate('/NewTravelRequest')}>
                    הצטרפות לנסיעה חדשה
                </button>
                <button className="menu-button" onClick={() => navigate('/RequestApproval')}>
                      צפייה בפרטי הנסיעה ואישור/ביטול הצטרפות 
                </button>
                <button className="menu-button" onClick={() => navigate('/ShowHistoryPassenger')}>
                    צפייה בנסיעות קודמות
                </button>
            </div>
        </div>
    );
}
