import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../CSS/HomeCSS.css';

export default function HomePage() {
    const navigate = useNavigate();

    const handleLoginClick = () => {
        navigate('/LoginPage');
    };

    return (
        <div className="home-container">
            <div className="overlay">
                <div className="text-side">
                    <h1 className="heading">Flex Route</h1>
                    <button 
                        className="join-button" 
                        onClick={handleLoginClick}
                        aria-label="כניסה למערכת"
                    >
                        כניסה
                    </button>
                </div>
            </div>
        </div>
    );
}