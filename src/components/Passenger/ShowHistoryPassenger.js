import React, { useEffect, useState } from 'react';
import { Container, Spinner, Card, Button } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function ShowHistoryPassenger() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [travelRequests, setTravelRequests] = useState([]);
    const passengerId = localStorage.getItem('passengerId');

    useEffect(() => {
        axios.get(`http://localhost:5238/api/TravelRequests/passengerId?passengerId=${passengerId}`)
            .then((response) => {
                if (response.data) {
                    setTravelRequests(response.data);
                }
            })
            .catch((err) => {
                console.log(err);
            })
            .finally(() => {
                setLoading(false);
            });
    }, []);

    const handleClick = () => {
        navigate('/PassengerMenuPage');
    };

    return (
        <Container className="mt-5" style={{ direction: 'rtl' }}>
            <h3 className="mb-4 text-center fw-bold">היסטוריית נסיעות</h3>

            {loading ? (
                <div className="text-center mt-5">
                    <Spinner animation="border" />
                </div>
            ) : travelRequests.length === 0 ? (
                <div className="text-center mt-5">אין נסיעות קיימות</div>
            ) : (
                travelRequests.map((travel, index) => (
                    <Card key={index} className="mb-3 shadow-sm">
                        <Card.Body>
                            <Card.Title className="fw-bold">פרטי נסיעה {travel.travelId}</Card.Title>
                            <Card.Text>
                                <strong>תאריך יציאה:</strong> {travel.date?.split('T')[0]}<br />
                                <strong>שעת יציאה:</strong> {travel.startTime}<br />
                                <strong>מוצא:</strong> {travel.startingAddress}<br />
                                <strong>יעד:</strong> {travel.destinationAddress}<br />
                            </Card.Text>
                        </Card.Body>
                    </Card>
                ))
            )}

            <button
                onClick={handleClick}
                className="btn btn-secondary position-fixed bg-secondary border-secondary text-white"
                style={{ top: '20px', right: '20px', zIndex: 1000 }}
            >
                חזרה לתפריט
            </button>
        </Container>
    );
}
