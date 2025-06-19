import React, { useState, useCallback } from 'react';
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { GoogleMap, useJsApiLoader, Marker, InfoWindow, DirectionsRenderer } from '@react-google-maps/api';
import 'bootstrap/dist/css/bootstrap.min.css';

const containerStyle = {
    width: '100%',
    height: '500px'
};

const center = {
    lat: 32.0853,
    lng: 34.7818
};

export default function NewTravelRequest() {
    const navigate = useNavigate();
    const passengerId = localStorage.getItem('passengerId');

    const [tRequest, setTRequest] = useState({
        startingAddress: '',
        destinationAddress: '',
        date: new Date().toISOString().split('T')[0],
        startTime: '',
        endTime: ''
    });

    const [mapMarkers, setMapMarkers] = useState({
        start: null,
        end: null
    });

    const [selectedLocation, setSelectedLocation] = useState(null);
    const [selectedAddress, setSelectedAddress] = useState('');
    
    // מצב לניהול המסלול
    const [directionsResponse, setDirectionsResponse] = useState(null);
    const [routeInfo, setRouteInfo] = useState(null);
    
    // מצב להצגת הודעת הצלחה
    const [showSuccessMessage, setShowSuccessMessage] = useState(false);

    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: 'AIzaSyBVnoMkXIgkd9G_Vq6fjnxPofbhARoj6qM',
        language: 'he',
        region: 'IL'
    });

    // פונקציה לחישוב המסלול
    const calculateRoute = useCallback((startAddress, endAddress) => {
        if (!window.google || !startAddress || !endAddress) return;

        const directionsService = new window.google.maps.DirectionsService();
        
        directionsService.route({
            origin: startAddress,
            destination: endAddress,
            travelMode: window.google.maps.TravelMode.DRIVING,
            language: 'he',
            region: 'IL'
        }, (result, status) => {
            if (status === 'OK') {
                setDirectionsResponse(result);
                
                // שמירת מידע על המסלול
                const route = result.routes[0];
                const leg = route.legs[0];
                setRouteInfo({
                    distance: leg.distance.text,
                    duration: leg.duration.text,
                    startAddress: leg.start_address,
                    endAddress: leg.end_address
                });
            } else {
                console.error('שגיאה בחישוב המסלול:', status);
                setDirectionsResponse(null);
                setRouteInfo(null);
            }
        });
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setTRequest({ ...tRequest, [name]: value });

        // עדכון סמנים במפה לפי הכתובות
        if (name === "startingAddress" && value !== "") {
            geocodeAddressForDisplay(value, "start");
        }
        if (name === "destinationAddress" && value !== "") {
            geocodeAddressForDisplay(value, "end");
        }

        // חישוב המסלול אם יש שתי כתובות
        const updatedRequest = { ...tRequest, [name]: value };
        if (updatedRequest.startingAddress && updatedRequest.destinationAddress) {
            calculateRoute(updatedRequest.startingAddress, updatedRequest.destinationAddress);
        } else {
            setDirectionsResponse(null);
            setRouteInfo(null);
        }
    };

    // פונקציה להצגת סמנים במפה בלבד (לא נשמר בטופס)
    const geocodeAddressForDisplay = (address, type) => {
        if (!window.google) return;
        
        const geocoder = new window.google.maps.Geocoder();
        geocoder.geocode({ address: address }, (results, status) => {
            if (status === 'OK' && results[0]) {
                const location = results[0].geometry.location;
                setMapMarkers(prev => ({
                    ...prev,
                    [type]: {
                        lat: location.lat(),
                        lng: location.lng()
                    }
                }));
            }
        });
    };

    // טיפול בלחיצה על המפה
    const handleMapClick = (event) => {
        const clickedLocation = {
            lat: event.latLng.lat(),
            lng: event.latLng.lng()
        };
        
        setSelectedLocation(clickedLocation);
        
        // המרת קואורדינטות לכתובת
        const geocoder = new window.google.maps.Geocoder();
        const latlng = { lat: clickedLocation.lat, lng: clickedLocation.lng };

        geocoder.geocode({ location: latlng }, (results, status) => {
            if (status === 'OK' && results[0]) {
                setSelectedAddress(results[0].formatted_address);
            } else {
                setSelectedAddress('כתובת לא זמינה');
            }
        });
    };

    // בחירת נקודת מוצא
    const handleStartPointChoice = () => {
        setTRequest(prev => ({
            ...prev,
            startingAddress: selectedAddress
        }));
        
        setMapMarkers(prev => ({
            ...prev,
            start: selectedLocation
        }));
        
        // חישוב מסלול אם יש כתובת יעד
        if (tRequest.destinationAddress) {
            calculateRoute(selectedAddress, tRequest.destinationAddress);
        }
        
        setSelectedLocation(null);
        setSelectedAddress('');
    };

    // בחירת נקודת יעד
    const handleEndPointChoice = () => {
        setTRequest(prev => ({
            ...prev,
            destinationAddress: selectedAddress
        }));
        
        setMapMarkers(prev => ({
            ...prev,
            end: selectedLocation
        }));
        
        // חישוב מסלול אם יש כתובת מוצא
        if (tRequest.startingAddress) {
            calculateRoute(tRequest.startingAddress, selectedAddress);
        }
        
        setSelectedLocation(null);
        setSelectedAddress('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // בדיקת שדות חובה
        if (!tRequest.startingAddress.trim()) {
            alert("יש להזין כתובת מוצא");
            return;
        }

        if (!tRequest.destinationAddress.trim()) {
            alert("יש להזין כתובת יעד");
            return;
        }

        // אם אין שעת יציאה או הגעה, יש להציג התראה
        if (!tRequest.startTime && !tRequest.endTime) {
            alert("חובה להקליד שעת יציאה או שעת הגעה.");
            return;
        }

        try {
            await axios.post("http://localhost:5238/api/TravelRequests/", {
                passengerId: parseInt(passengerId),
                startingAddress: tRequest.startingAddress,
                destinationAddress: tRequest.destinationAddress,
                date: tRequest.date,
                startTime: tRequest.startTime || "00:00:00",
                endTime: tRequest.endTime || "00:00:00",
                openOrClosed: "open"
            });

            setShowSuccessMessage(true);
        } catch (error) {
            console.error("שגיאה בשליחת הבקשה:", error);
            alert("אירעה שגיאה בשליחת הבקשה.");
        }
    };

    const handleClick = () => {
        navigate('/PassengerMenuPage');
    };

    // אם הבקשה נשלחה בהצלחה, הצג הודעת הצלחה
    if (showSuccessMessage) {
        return (
            <div className="container-fluid d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
                <div className="text-center">
                    <div className="card p-5 shadow-lg" style={{ maxWidth: '600px', margin: '0 auto' }}>
                        <div className="card-body">
                            <div className="mb-4">
                                <div className="text-success mb-3" style={{ fontSize: '4rem' }}>
                                    ✓
                                </div>
                                <h2 className="text-success mb-4">בקשה נשלחה בהצלחה!</h2>
                                <p className="lead mb-4" style={{ fontSize: '1.2rem' }}>
                                    בעוד מספר דקות תוכל/י לצפות בפרטי הנסיעה
                                </p>
                            </div>
                            <button 
                                onClick={handleClick}
                                className="btn btn-primary btn-lg px-5"
                                style={{ fontSize: '1.1rem' }}
                            >
                                חזרה לתפריט הראשי
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }


    return (
        <div className="container-fluid mt-4">
            <div className="row">
                {/* טופס הבקשה */}
                <div className="col-md-4">
                    <form onSubmit={handleSubmit} className="bg-light p-4 rounded shadow">
                        <h4 className="mb-4 text-center">בקשה לנסיעה חדשה</h4>

                        <div className="mb-3">
                            <label className="form-label">כתובת מוצא:</label>
                            <input
                                type="text"
                                name="startingAddress"
                                value={tRequest.startingAddress}
                                onChange={handleChange}
                                className="form-control"
                                placeholder="הזן כתובת או בחר במפה"
                                required
                            />
                        </div>

                        <div className="mb-3">
                            <label className="form-label">כתובת יעד:</label>
                            <input
                                type="text"
                                name="destinationAddress"
                                value={tRequest.destinationAddress}
                                onChange={handleChange}
                                className="form-control"
                                placeholder="הזן כתובת או בחר במפה"
                                required
                            />
                        </div>

                        {/* מידע על המסלול */}
                        {/* {routeInfo && (
                            <div className="alert alert-info mb-3">
                                <h6 className="alert-heading">פרטי המסלול:</h6>
                                <p className="mb-1"><strong>מרחק:</strong> {routeInfo.distance}</p>
                                <p className="mb-0"><strong>זמן נסיעה:</strong> {routeInfo.duration}</p>
                            </div>
                        )} */}

                        <div className="mb-3">
                            <label className="form-label">תאריך נסיעה:</label>
                            <input
                                type="date"
                                name="date"
                                value={tRequest.date}
                                onChange={handleChange}
                                className="form-control"
                                required
                            />
                        </div>

                        <p className="text-muted text-center mb-3">הכנס שעת יציאה או שעת הגעה רצויה</p>

                        <div className="mb-3">
                            <label className="form-label">שעת יציאה:</label>
                            <input
                                type="time"
                                name="startTime"
                                value={tRequest.startTime}
                                onChange={handleChange}
                                className="form-control"
                            />
                        </div>

                        <div className="mb-3">
                            <label className="form-label">שעת הגעה:</label>
                            <input
                                type="time"
                                name="endTime"
                                value={tRequest.endTime}
                                onChange={handleChange}
                                className="form-control"
                            />
                        </div>
                        <button type="submit" className="btn btn-primary w-100">שלח בקשה</button>
                    </form>
                </div>

                {/* המפה */}
                <div className="col-md-8">
                    <div className="bg-light p-3 rounded shadow">
                        <h5 className="text-center mb-3">לחץ על המפה לבחירת נקודות</h5>
                        {isLoaded ? (
                            <GoogleMap
                                mapContainerStyle={containerStyle}
                                center={center}
                                zoom={13}
                                onClick={handleMapClick}
                            >
                                {/* הצגת המסלול */}
                                {directionsResponse && (
                                    <DirectionsRenderer
                                        directions={directionsResponse}
                                        options={{
                                            suppressMarkers: false,
                                            polylineOptions: {
                                                strokeColor: '#4285F4',
                                                strokeWeight: 5,
                                                strokeOpacity: 0.8
                                            }
                                        }}
                                    />
                                )}

                                {/* סמנים רק אם אין מסלול */}
                                {!directionsResponse && (
                                    <>
                                        {/* סמן נקודת מוצא */}
                                        {mapMarkers.start && (
                                            <Marker
                                                position={mapMarkers.start}
                                                icon={{
                                                    url: 'https://maps.google.com/mapfiles/ms/icons/green-dot.png'
                                                }}
                                                title="נקודת מוצא"
                                            />
                                        )}
                                        
                                        {/* סמן נקודת יעד */}
                                        {mapMarkers.end && (
                                            <Marker
                                                position={mapMarkers.end}
                                                icon={{
                                                    url: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png'
                                                }}
                                                title="נקודת יעד"
                                            />
                                        )}
                                    </>
                                )}

                                {/* חלון מידע לנקודה שנלחץ עליה */}
                                {selectedLocation && (
                                    <InfoWindow
                                        position={selectedLocation}
                                        onCloseClick={() => {
                                            setSelectedLocation(null);
                                            setSelectedAddress('');
                                        }}
                                    >
                                        <div style={{ textAlign: "center", direction: "rtl", minWidth: "200px" }}>
                                            <div style={{ marginBottom: '10px', fontWeight: 'bold', fontSize: '14px' }}>
                                                {selectedAddress}
                                            </div>
                                            <hr style={{ margin: '10px 0' }} />
                                            <div style={{ marginBottom: '10px', fontWeight: 'bold' }}>בחר פעולה:</div>
                                            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                                                <button
                                                    className="btn btn-sm btn-success"
                                                    onClick={handleStartPointChoice}
                                                    style={{ fontSize: '12px' }}
                                                >
                                                    נקודת מוצא
                                                </button>
                                                <button
                                                    className="btn btn-sm btn-danger"
                                                    onClick={handleEndPointChoice}
                                                    style={{ fontSize: '12px' }}
                                                >
                                                    נקודת יעד
                                                </button>
                                            </div>
                                            <hr style={{ margin: '10px 0' }} />
                                            <small style={{ color: '#666' }}>
                                                {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
                                            </small>
                                        </div>
                                    </InfoWindow>
                                )}
                            </GoogleMap>
                        ) : (
                            <div className="d-flex justify-content-center align-items-center" style={{height: '500px'}}>
                                <div className="spinner-border" role="status">
                                    <span className="visually-hidden">טוען...</span>
                                </div>
                            </div>
                        )}
                        
                        {/* מקרא */}
                        <div className="mt-2 text-center">
                            <small className="text-muted">
                                <span className="me-3">🟢 נקודת מוצא</span>
                                <span className="me-3">🔴 נקודת יעד</span>
                                <span className="me-3">🛣️ מסלול נסיעה</span>
                                <span>💡 לחץ על המפה לבחירת נקודות</span>
                            </small>
                        </div>
                    </div>
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