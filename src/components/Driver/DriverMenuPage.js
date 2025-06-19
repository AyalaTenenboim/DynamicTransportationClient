import { useNavigate } from "react-router";
import React from 'react';
import '../../CSS/PassengerMenuPage.css';

export default function DriverMenuPage() {
    const navigate = useNavigate();
    const driverName = localStorage.getItem('driverName');

    return (
        <div className='menu-container'>
            <div className="menu-header">שלום <br />{driverName}</div>
            <div className="button-row">
                <button className="menu-button" onClick={() => navigate('/UpdateDriverAndCar')}>
                    עדכון פרטים אישיים
                </button>
                <button className="menu-button" onClick={() => navigate('/ShowRoutes')}>
                    צפייה במסלולים להיום ופרטי הנוסעים שבמסלול
                </button>
            </div>
        </div>
    );
}
