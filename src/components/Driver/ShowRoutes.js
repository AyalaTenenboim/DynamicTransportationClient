import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { GoogleMap, useJsApiLoader, DirectionsRenderer, Marker } from '@react-google-maps/api';
import 'bootstrap/dist/css/bootstrap.min.css';

const containerStyle = {
    width: '100%',
    height: '500px'
};

export default function ShowRoutes() {
    const navigate = useNavigate();
    const mapRef = useRef(null);
    const driverId = localStorage.getItem('driverId');

    // States עבור רכב הנהג
    const [vehicleId, setVehicleId] = useState(null);
    const [loadingVehicle, setLoadingVehicle] = useState(true);

    // States עבור רשימת המסלולים
    const [routes, setRoutes] = useState([]);
    const [selectedRoute, setSelectedRoute] = useState(null);
    const [loadingRoutes, setLoadingRoutes] = useState(false);
    const [routesError, setRoutesError] = useState(null);

    // States עבור המסלול הנבחר
    const [stations, setStations] = useState([]);
    const [directionsResponse, setDirectionsResponse] = useState(null);
    const [routeInfo, setRouteInfo] = useState(null);
    const [isCalculating, setIsCalculating] = useState(false);
    const [mapLoaded, setMapLoaded] = useState(false);
    const [loadingStations, setLoadingStations] = useState(false);

    // States עבור נוסעים
    const [passengers, setPassengers] = useState([]);
    const [loadingPassengers, setLoadingPassengers] = useState(false);
    const [showPassengers, setShowPassengers] = useState(false);
    const [selectedRouteForPassengers, setSelectedRouteForPassengers] = useState(null);
    const [stationsWithPassengers, setStationsWithPassengers] = useState([]);


    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: 'AIzaSyAW6Dws3FyOYcgy02d1Gf3MCVijZMc9oWw',
        language: 'he',
        region: 'IL'
    });

    // פונקציה להמרת כתובת לקואורדינטות
    const geocodeAddress = useCallback(async (address) => {
        if (!window.google) return null;

        return new Promise((resolve, reject) => {
            const geocoder = new window.google.maps.Geocoder();
            geocoder.geocode(
                {
                    address: address,
                    region: 'IL',
                    componentRestrictions: { country: 'IL' }
                },
                (results, status) => {
                    if (status === 'OK' && results[0]) {
                        const location = results[0].geometry.location;
                        resolve({
                            lat: location.lat(),
                            lng: location.lng()
                        });
                    } else {
                        console.error(`Geocoding failed for address "${address}": ${status}`);
                        reject(new Error(`לא ניתן לאתר את הכתובת: ${address}`));
                    }
                }
            );
        });
    }, []);


    // טעינת ID של הרכב לפי הנהג
    const loadDriverVehicle = useCallback(async () => {
        if (!driverId) {
            setRoutesError('לא נמצא מזהה נהג');
            setLoadingVehicle(false);
            return;
        }

        try {
            setLoadingVehicle(true);
            const response = await axios.get(`http://localhost:5238/api/Car/driverId?driverId=${driverId}`);

            console.log('Response data:', response.data);
            console.log('Data type:', typeof response.data);

            // הAPI מחזיר את מספר הרכב ישירות, לא בתוך אובייקט
            if (response.data && (typeof response.data === 'number' || typeof response.data === 'string')) {
                const vehicleIdValue = response.data;
                setVehicleId(vehicleIdValue);
                console.log('נמצא רכב:', vehicleIdValue);
            } else if (response.data && response.data.vehicleId) {
                // אם זה כן אובייקט עם vehicleId
                setVehicleId(response.data.vehicleId);
                console.log('נמצא רכב:', response.data.vehicleId);
            } else {
                setRoutesError('לא נמצא רכב עבור הנהג');
                setLoadingVehicle(false);
            }
        } catch (error) {
            console.error('שגיאה בטעינת פרטי רכב:', error);
            setRoutesError('שגיאה בטעינת פרטי הרכב');
            setLoadingVehicle(false);
        }
    }, [driverId]);

    // טעינת מסלולים לפי רכב
    const loadVehicleRoutes = useCallback(async () => {
        // בדוק שה-vehicleId תקין
        if (!vehicleId || vehicleId === 'undefined' || vehicleId === 'null') {
            console.log('vehicleId לא תקין:', vehicleId);
            setRoutesError('מזהה רכב לא תקין');
            return;
        }

        try {
            setLoadingRoutes(true);
            setRoutesError(null);

            const response = await axios.get(`http://localhost:5238/api/Route/carId?carId=${vehicleId}`);

            if (response.data && response.data.length > 0) {
                setRoutes(response.data);
                console.log(`נמצאו ${response.data.length} מסלולים עבור הרכב`);

                if (response.data.length === 1) {
                    console.log('מסלול יחיד - מציג אוטומטית');
                    // בצע ישירות במקום לקרוא לפונקציה
                    handleRouteSelect(response.data[0]);
                }
            } else {
                setRoutes([]);
                setRoutesError('לא נמצאו מסלולים עבור הרכב');
            }
        } catch (error) {
            console.error('פרטי השגיאה:', {
                message: error.message,
                status: error.response?.status,
                data: error.response?.data,
                url: error.config?.url
            });
            setRoutesError('שגיאה בטעינת מסלולים מהמסד נתונים');
        } finally {
            setLoadingRoutes(false);
            setLoadingVehicle(false);
        }
    }, [vehicleId]);

    // טעינת תחנות עבור מסלול ספציפי - מעודכן לכתובות
    const loadRouteStations = useCallback(async (routeId) => {
        try {
            setLoadingStations(true);
            console.log('טוען תחנות עבור מסלול:', routeId);

            const response = await axios.get(`http://localhost:5238/api/StationInRoute/routeId?routeId=${routeId}`);

            console.log('תגובת תחנות:', response.data);
            if (response.data && response.data.length > 0) {
                // מיון התחנות לפי סדר הנסיעה
                const sortedStations = response.data.sort((a, b) => a.order - b.order);

                // המרת כתובות לקואורדינטות
                const stationsWithCoordinates = [];

                for (const station of sortedStations) {
                    try {
                        // אם יש כבר קואורדינטות, השתמש בהן
                        // if (station.coordinates && station.coordinates.lat && station.coordinates.lng) {
                        //     stationsWithCoordinates.push(station);
                        // }
                        // אם יש כתובת, המיר לקואורדינטות
                        // else if (station.startingAddress) {
                        console.log('ממיר כתובת לקואורדינטות:', station.address);
                        const coords = await geocodeAddress(station.address);
                        stationsWithCoordinates.push({
                            ...station,
                            coordinates: coords,
                            address: station.address // הוסף שדה address לתצוגה
                        });
                        // }
                        // אם אין כתובת וגם לא קואורדינטות
                        // else {
                        //     console.warn('תחנה ללא כתובת או קואורדינטות:', station);
                        //     // הוסף קואורדינטות ברירת מחדל (מרכז הארץ)
                        //     stationsWithCoordinates.push({
                        //         ...station,
                        //         coordinates: { lat: 32.0553, lng: 34.7818 }, // תל אביב
                        //         address: station.startingAddress || 'כתובת לא זמינה'
                        //     });
                        // }
                    } catch (geocodeError) {
                        console.error('שגיאה בהמרת כתובת:', station.address, geocodeError);
                        // הוסף תחנה עם קואורדינטות ברירת מחדל
                        // stationsWithCoordinates.push({
                        //     ...station,
                        //     coordinates: { lat: 32.0553, lng: 34.7818 },
                        //     address: station.address || 'כתובת לא זמינה'
                        // });
                    }
                }

                const mergedStations = mergeIdenticalStations(stationsWithCoordinates);
                setStations(mergedStations);
                console.log(`נטענו ${mergedStations.length} תחנות מוזגות עם קואורדינטות`);
                return mergedStations;
            } else {
                setStations([]);
                console.warn('לא נמצאו תחנות עבור המסלול');
                // alert('לא נמצאו תחנות עבור המסלול');
                return [];
            }
        } catch (error) {
            console.error('שגיאה בטעינת תחנות:', error);
            console.error('פרטי השגיאה:', {
                message: error.message,
                status: error.response?.status,
                data: error.response?.data,
                url: error.config?.url
            });
            setStations([]);
            alert(`שגיאה בטעינת תחנות המסלול: ${error.message}`);
            return [];
        } finally {
            setLoadingStations(false);
        }
    }, [geocodeAddress]);

    const handleRouteSelect = async (route) => {
        console.log('נבחר מסלול:', route);

        const routeId = route.routeId;
        console.log('מזהה המסלול:', routeId);

        setSelectedRoute(route);
        setDirectionsResponse(null);
        setRouteInfo(null);
        setStations([]); // נקה תחנות קודמות

        // וודא שיש מזהה מסלול
        if (!routeId) {
            console.error('אין מזהה למסלול!', route);
            alert('שגיאה: לא נמצא מזהה למסלול');
            return;
        }
        // טעינת התחנות של המסלול
        const routeStations = await loadRouteStations(routeId);

        // אם יש תחנות, התאמת המפה
        if (routeStations.length > 0) {
            // השהיה קצרה כדי לוודא שהמפה מוכנה
            setTimeout(() => {
                fitMapToStations();
            }, 500);
        }
    };


    const loadRoutePassengers = useCallback(async (routeId) => {
        try {
            setLoadingPassengers(true);
            console.log('טוען נוסעים עבור מסלול:', routeId);

            // שלב 1: שלוף את התחנות של המסלול
            const stationsResponse = await axios.get(`http://localhost:5238/api/StationInRoute/routeId?routeId=${routeId}`);
            console.log('תחנות במסלול:', stationsResponse.data);
            if (!stationsResponse.data || stationsResponse.data.length === 0) {
                await axios.delete(`http://localhost:5238/api/Route/routeId?routeId=${routeId}`)
                console.warn('לא נמצאו תחנות במסלול, מוחק את המסלול');
                return;
            }
            const stations = stationsResponse.data;

            // שלב 2: יצירת מערך לאחסון תחנות עם פרטי הנוסעים
            const stationsWithPassengers = [];
            const allPassengers = []; // מערך לכל הנוסעים

            // שלב 3: עבור כל תחנה - שלוף את בקשות הנסיעה ופרטי הנוסעים
            // לולאה מעודכנת - רק תחנות איסוף
            for (const station of stations) {
                console.log(`מעבד תחנה: ${station.stationInRouteId}`);

                // בדוק אם זו תחנת איסוף
                if (station.isPickup) {
                    try {
                        // שלב 3.1: שלוף בקשת נסיעה לתחנה הספציפית
                        const requestResponse = await axios.get(`http://localhost:5238/api/TravelRequests/travelRequestId?travelRequestId=${station.travelRequestsId}`);
                        console.log('בקשת נסיעה:', requestResponse.data);

                        // שלב 3.2: שלוף את פרטי הנוסע
                        const passengerResponse = await axios.get(`http://localhost:5238/api/Passenger/passengerId?passengerId=${requestResponse.data.passengerId}`);
                        console.log('פרטי נוסע:', passengerResponse.data);

                        // הוסף את פרטי הנוסע למערך הכללי
                        const passengerData = {
                            ...passengerResponse.data,
                            requestId: requestResponse.data.travelRequestsId,
                            stationAddress: requestResponse.data.startingAddress,
                            stationType: station.isPickup ? 'איסוף' : 'הורדה',
                            requestDetails: requestResponse.data
                        };

                        allPassengers.push(passengerData);

                        // הוסף את התחנה עם פרטי הנוסע
                        stationsWithPassengers.push({
                            ...station,
                            passenger: passengerData,
                            hasPassenger: true
                        });

                    } catch (stationError) {
                        console.error(`שגיאה בעיבוד תחנת איסוף ${station.stationInRouteId}:`, stationError);
                        // הוסף את התחנה גם בלי נוסע במקרה של שגיאה
                        stationsWithPassengers.push({
                            ...station,
                            passenger: null,
                            hasPassenger: false
                        });
                    }
                } else {
                    // הוסף תחנות הורדה בלי עיבוד נוסע
                    stationsWithPassengers.push({
                        ...station,
                        passenger: null,
                        hasPassenger: false
                    });
                    console.log(`דילג על תחנת הורדה: ${station.stationInRouteId}`);
                }
            }

            console.log('כל הנוסעים:', allPassengers);
            console.log('תחנות עם נוסעים:', stationsWithPassengers);

            // שמירה של הנתונים
            setPassengers(allPassengers);
            setStationsWithPassengers(stationsWithPassengers);

            console.log(`נמצאו סך הכל ${allPassengers.length} נוסעים עבור המסלול`);

        } catch (error) {
            console.error('שגיאה בטעינת נוסעים:', error);
            setPassengers([]);
            setStationsWithPassengers([]);
            alert(`שגיאה בטעינת נוסעים: ${error.message}`);
        } finally {
            setLoadingPassengers(false);
        }
    }, []);


    // טיפול בצפייה בנוסעים - מעודכן
    const handleShowPassengers = async (route) => {
        console.log('מציג נוסעים עבור מסלול:', route);
        setSelectedRouteForPassengers(route);
        setShowPassengers(true);
        setPassengers([]);
        setStationsWithPassengers([]); // הוסף את השורה הזו לstate
        await loadRoutePassengers(route.routeId);
    };

    // חזרה מצפייה בנוסעים - מעודכן
    const backFromPassengers = () => {
        setShowPassengers(false);
        setSelectedRouteForPassengers(null);
        setPassengers([]);
        setStationsWithPassengers([]); // הוסף את השורה הזו לstate
    };
    // חזרה לרשימת המסלולים
    const backToRoutesList = () => {
        setSelectedRoute(null);
        setStations([]);
        setDirectionsResponse(null);
        setRouteInfo(null);
    };
    // חישוב מרכז התחנות - מעודכן
    const getStationsCenter = useCallback(() => {
        if (!stations || stations.length === 0) return { lat: 32.0553, lng: 34.7818 }; // תל אביב
    }, [stations]);


    // התאמת המפה לתחנות - מעודכן
    const fitMapToStations = useCallback(() => {
        if (!mapRef.current || !window.google || !stations || stations.length === 0) return;

        // סנן תחנות עם קואורדינטות תקינות
        const validStations = stations.filter(station =>
            station.coordinates &&
            station.coordinates.lat &&
            station.coordinates.lng
        );

        if (validStations.length === 0) return;

        const bounds = new window.google.maps.LatLngBounds();
        validStations.forEach(station => {
            bounds.extend(station.coordinates);
        });

        // הוספת ריפוד לגבולות
        const ne = bounds.getNorthEast();
        const sw = bounds.getSouthWest();
        const latPadding = (ne.lat() - sw.lat()) * 0.1;
        const lngPadding = (ne.lng() - sw.lng()) * 0.1;

        bounds.extend({
            lat: ne.lat() + latPadding,
            lng: ne.lng() + lngPadding
        });
        bounds.extend({
            lat: sw.lat() - latPadding,
            lng: sw.lng() - lngPadding
        });

        mapRef.current.fitBounds(bounds);
    }, [stations]);

    // פונקציה לחישוב מסלול - מעודכן
    const calculateRoute = useCallback(async () => {
        if (!window.google || !stations || stations.length < 2 || isCalculating) return;

        // ודא שיש קואורדינטות לכל התחנות
        const validStations = stations.filter(station =>
            station.coordinates &&
            station.coordinates.lat &&
            station.coordinates.lng
        );

        if (validStations.length < 2) {
            // alert('נדרשות לפחות 2 תחנות עם קואורדינטות תקינות לחישוב מסלול');
            return;
        }

        console.log('מתחיל חישוב מסלול...');
        setIsCalculating(true);
        setDirectionsResponse(null);
        setRouteInfo(null);

        try {
            const directionsService = new window.google.maps.DirectionsService();

            // הכנת נקודות המסלול - לפי הסדר המדויק של התחנות
            const origin = validStations[0].coordinates;
            const destination = validStations[validStations.length - 1].coordinates;
            const waypoints = validStations.slice(1, -1).map(station => ({
                location: station.coordinates,
                stopover: true
            }));

            console.log('נתוני המסלול:', {
                origin: `${origin.lat}, ${origin.lng}`,
                destination: `${destination.lat}, ${destination.lng}`,
                waypoints: waypoints.length,
                waypointsData: waypoints.map(wp => `${wp.location.lat}, ${wp.location.lng}`)
            });

            const result = await new Promise((resolve, reject) => {
                directionsService.route({
                    origin: origin,
                    destination: destination,
                    waypoints: waypoints,
                    travelMode: window.google.maps.TravelMode.DRIVING,
                    optimizeWaypoints: false,
                    avoidHighways: false,
                    avoidTolls: false,
                    unitSystem: window.google.maps.UnitSystem.METRIC,
                    region: 'IL',
                    avoidFerries: true,
                    drivingOptions: {
                        departureTime: new Date(),
                        trafficModel: 'bestguess'
                    }

                }, (result, status) => {
                    console.log('תוצאת Google Directions:', status);
                    if (status === 'OK') {
                        resolve(result);
                    } else {
                        console.error('שגיאה מ-Google Directions:', status);
                        reject(new Error(`שגיאה בחישוב מסלול: ${status}`));
                    }
                });
            });

            if (result && result.routes && result.routes.length > 0) {
                console.log('מסלול התקבל בהצלחה');
                setDirectionsResponse(result);

                // חישוב מידע המסלול
                const route = result.routes[0];
                let totalDistance = 0;
                let totalDuration = 0;

                if (route.legs) {
                    route.legs.forEach(leg => {
                        totalDistance += leg.distance ? leg.distance.value : 0;
                        totalDuration += leg.duration ? leg.duration.value : 0;
                    });
                }

                setRouteInfo({
                    totalDistance: (totalDistance / 1000).toFixed(1) + ' ק"מ',
                    totalDuration: Math.round(totalDuration / 60) + ' דקות',
                    stationsCount: validStations.length
                });

                console.log('מידע המסלול:', {
                    distance: totalDistance / 1000 + ' ק"מ',
                    duration: Math.round(totalDuration / 60) + ' דקות'
                });
            } else {
                throw new Error('לא התקבל מסלול מ-Google Maps');
            }
        } catch (error) {
            console.error('שגיאה בחישוב המסלול:', error);
            // alert(`שגיאה בחישוב המסלול: ${error.message}`);
        } finally {
            setIsCalculating(false);
        }
    }, [stations, isCalculating]);

    // טעינת המפה
    const onMapLoad = useCallback((map) => {
        console.log('המפה נטענה');
        mapRef.current = map;
        setMapLoaded(true);
    }, []);

    // חישוב מסלול אוטומטי כשהמפה נטענת
    useEffect(() => {
        if (isLoaded && mapLoaded && stations && stations.length >= 2 && !directionsResponse && !isCalculating) {
            console.log('מתחיל חישוב מסלול אוטומטי');
            const timer = setTimeout(() => {
                calculateRoute();
            }, 1500);

            return () => clearTimeout(timer);
        }
    }, [isLoaded, mapLoaded, stations, calculateRoute, directionsResponse, isCalculating]);

    // התאמת המפה כשהמסלול מוכן
    useEffect(() => {
        if (directionsResponse && mapRef.current) {
            console.log('מתאים מפה למסלול');
            const timer = setTimeout(() => {
                fitMapToStations();
            }, 800);

            return () => clearTimeout(timer);
        }
    }, [directionsResponse, fitMapToStations]);

    // טעינת נתונים בעת טעינת הקומפוננטה
    useEffect(() => {
        loadDriverVehicle();
    }, [loadDriverVehicle]);

    // טעינת מסלולים כשנמצא הרכב
    useEffect(() => {
        if (vehicleId) {
            loadVehicleRoutes();
        }
    }, [vehicleId, loadVehicleRoutes]);

    // פונקציה לעדכון זמן תחנה
    // עדכון פונקציה לעדכון זמן תחנה
    const updateStationTime = (stationId, newTime) => {
        setStations(prev =>
            prev.map(station =>
                station.stationId === stationId
                    ? {
                        ...station,
                        ...(station.isPickup
                            ? { timeWindowStart: newTime }
                            : { timeWindowEnd: newTime }
                        )
                    }
                    : station
            )
        );
    };
    // פונקציה למיזוג תחנות זהות וספירת נוסעים
    const mergeIdenticalStations = useCallback((stations) => {
        const stationMap = new Map();

        stations.forEach(station => {
            const key = `${station.address}_${station.isPickup}`;

            if (stationMap.has(key)) {
                // תחנה כבר קיימת - הוסף את הנוסע לרשימה
                const existingStation = stationMap.get(key);
                existingStation.passengerCount = (existingStation.passengerCount || 1) + 1;
                existingStation.travelRequestIds = [...(existingStation.travelRequestIds || [existingStation.travelRequestsId]), station.travelRequestsId];
            } else {
                // תחנה חדשה
                stationMap.set(key, {
                    ...station,
                    passengerCount: 1,
                    travelRequestIds: [station.travelRequestsId]
                });
            }
        });

        return Array.from(stationMap.values()).sort((a, b) => a.order - b.order);
    }, []);
    // // פונקציה לשינוי סוג תחנה
    // const updateStationType = (stationId, newType) => {
    //     setStations(prev =>
    //         prev.map(station =>
    //             station.id === stationId
    //                 ? { ...station, type: newType }
    //                 : station
    //         )
    //     );
    // };

    // פונקציה לחישוב מסלול מחדש ידנית
    const recalculateRoute = () => {
        console.log('חישוב מסלול ידני');
        setDirectionsResponse(null);
        setRouteInfo(null);
        calculateRoute();
    };

    const handleClick = () => {
        navigate('/DriverMenuPage');
    };

    // אם לא נבחר מסלול, הצג רשימת מסלולים
    // אם נבחרה צפייה בנוסעים
    if (showPassengers && selectedRouteForPassengers) {
        return (
            <div className="container mt-4">
                <div className="row justify-content-center">
                    <div className="col-md-10">
                        <div className="card shadow">
                            <div className="card-header">
                                <div className="d-flex justify-content-between align-items-center">
                                    <button
                                        className="btn btn-outline-secondary btn-sm"
                                        onClick={backFromPassengers}
                                    >
                                        ← חזרה לרשימת מסלולים
                                    </button>
                                    <h4 className="mb-0">נוסעים במסלול</h4>
                                    <div></div>
                                </div>
                            </div>
                            <div className="card-body">
                                {loadingPassengers ? (
                                    <div className="text-center py-5">
                                        <div className="spinner-border text-primary" role="status">
                                            <span className="visually-hidden">טוען נוסעים...</span>
                                        </div>
                                        <p className="mt-3">טוען נוסעים...</p>
                                    </div>
                                ) : passengers.length === 0 ? (
                                    <div className="alert alert-info text-center">
                                        <h5>👥 לא נמצאו נוסעים</h5>
                                        <p>עדיין לא נרשמו נוסעים למסלול הזה</p>
                                    </div>
                                ) : (
                                    <div>
                                        <div className="alert alert-success mb-4">
                                            {/* <h6 className="alert-heading">סיכום נוסעים:</h6> */}
                                            <p className="mb-0"><strong>סך הכול נוסעים:</strong> {passengers.length}</p>
                                            {/* {stationsWithPassengers.length > 0 && (
                                                <>
                                                    <p className="mb-0"><strong>תחנות עם נוסעים:</strong> {stationsWithPassengers.filter(s => s.hasPassenger).length}</p>
                                                </>
                                            )} */}
                                        </div>

                                        <div className="row">
                                            {passengers
                                                // .filter(passenger => passenger.stationType === 'איסוף') // הצג רק נוסעי איסוף
                                                .map((passenger, index) => (
                                                    <div key={passenger.passengerId || index} className="col-md-6 mb-3">
                                                        <div className="card border-start border-4 border-success h-100"> {/* שינוי צבע לירוק לאיסוף */}
                                                            <div className="card-body">
                                                                <h6 className="card-title">
                                                                    👥 {passenger.passengerName || `נוסע איסוף ${index + 1}`}
                                                                </h6>
                                                                <div className="row">
                                                                    <div className="col-sm-12">
                                                                        <small className="text-muted d-block">
                                                                            📞 טלפון: {passenger.passengerPhone || 'לא זמין'}
                                                                        </small>
                                                                        <small className="text-muted d-block">
                                                                            📧 אימייל: {passenger.passengerMail || 'לא זמין'}
                                                                        </small>
                                                                        <small className="text-muted d-block">
                                                                            📍 נקודת איסוף: {passenger.stationAddress || 'לא זמין'}
                                                                        </small>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div >
                </div >
                <button
                    onClick={handleClick}
                    className="btn btn-secondary position-fixed bg-secondary border-secondary text-white"
                    style={{ top: '20px', right: '20px', zIndex: 1000 }}
                >
                    חזרה לתפריט
                </button>
            </div >
        );
    }
    if (!selectedRoute) {
        return (
            <div className="container mt-4">
                <div className="row justify-content-center">
                    <div className="col-md-8">
                        <div className="card shadow">
                            <div className="card-header">
                                <h4 className="mb-0 text-center">המסלולים שלי</h4>
                            </div>
                            <div className="card-body">
                                {(loadingVehicle || loadingRoutes) ? (
                                    <div className="text-center py-5">
                                        <div className="spinner-border text-primary" role="status">
                                            <span className="visually-hidden">
                                                {loadingVehicle ? 'טוען פרטי רכב...' : 'טוען מסלולים...'}
                                            </span>
                                        </div>
                                        <p className="mt-3">
                                            {loadingVehicle ? 'טוען פרטי רכב...' : 'טוען מסלולים...'}
                                        </p>
                                    </div>
                                ) : routesError ? (
                                    <div className="alert alert-warning text-center">
                                        <h5>⚠️ {routesError}</h5>
                                        <button
                                            className="btn btn-primary mt-3"
                                            onClick={() => {
                                                setVehicleId(null);
                                                setRoutes([]);
                                                loadDriverVehicle();
                                            }}
                                        >
                                            נסה שוב
                                        </button>
                                    </div>
                                ) : routes.length === 0 ? (
                                    <div className="alert alert-info text-center">
                                        <h5>📋 לא נמצאו מסלולים</h5>
                                        <p>עדיין לא הוגדרו מסלולים עבור הרכב</p>
                                        {vehicleId && (
                                            <small className="text-muted">
                                                רכב מספר: {vehicleId}
                                            </small>
                                        )}
                                    </div>
                                ) : (
                                    <div className="routes-list">
                                        {routes.map((route, index) => (
                                            <div key={route.routeId} className="card mb-3 border-start border-4 border-primary">
                                                <div className="card-body">
                                                    <div className="row align-items-center">
                                                        <div className="col-md-8">
                                                            <h5 className="card-title mb-2">
                                                                🚌 {route.name || `מסלול ${index + 1}`}
                                                            </h5>
                                                            {/* <div className="row">
                                                                <div className="col-sm-6">
                                                                    <small className="text-muted">
                                                                        📍 תחנות: {route.stationsCount || 'לא ידוע'}
                                                                    </small>
                                                                </div>
                                                            </div> */}
                                                            {/* <div className="row mt-1">
                                                                <div className="col-sm-6">
                                                                    <small className="text-muted">
                                                                        🚗 רכב: {vehicleId}
                                                                    </small>
                                                                </div>
                                                            </div> */}
                                                            {route.description && (
                                                                <p className="card-text mt-2 text-muted">
                                                                    {route.description}
                                                                </p>
                                                            )}
                                                            {/* <div className="mt-2">
                                                                <small className="text-info">
                                                                    מזהה מסלול: {route.routeId}
                                                                </small>
                                                            </div> */}
                                                        </div>
                                                        <div className="col-md-4 text-end">
                                                            <div className="d-grid gap-2">
                                                                <button
                                                                    className="btn btn-primary"
                                                                    onClick={() => handleRouteSelect(route)}
                                                                >
                                                                    צפה במסלול
                                                                </button>
                                                                <button
                                                                    className="btn btn-info"
                                                                    onClick={() => handleShowPassengers(route)}
                                                                >
                                                                    פרטי הנוסעים
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
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
                </div>
            </div>
        );
    }

    // הצגת המסלול הנבחר
    return (
        <div className="container-fluid mt-4">
            <div className="row">
                {/* רשימת התחנות */}
                <div className="col-md-4">
                    <div className="bg-light rounded shadow" style={{ height: '100vh', display: 'flex', flexDirection: 'column', position: 'sticky', top: '20px' }}>
                        <div className="p-4 pb-3">
                            {/* כפתור חזרה */}
                            <button
                                className="btn btn-outline-secondary btn-sm mb-3"
                                onClick={backToRoutesList}
                            >
                                ← חזרה לרשימת מסלולים
                            </button>

                            <h4 className="mb-2 text-center">{selectedRoute.name || 'מסלול נבחר'}</h4>
                            <p className="text-center text-muted small mb-4">תחנות המסלול</p>

                            {/* הודעת טעינת תחנות */}
                            {loadingStations && (
                                <div className="alert alert-info mb-4">
                                    <div className="d-flex align-items-center">
                                        <div className="spinner-border spinner-border-sm me-2" role="status"></div>
                                        <span>טוען תחנות...</span>
                                    </div>
                                </div>
                            )}

                            {/* מידע כללי על המסלול */}
                            {routeInfo && (
                                <div className="alert alert-info mb-4">
                                    <h6 className="alert-heading">סיכום המסלול:</h6>
                                    <p className="mb-1"><strong>מספר תחנות:</strong> {routeInfo.stationsCount}</p>
                                    <p className="mb-1"><strong>סך המרחק:</strong> {routeInfo.totalDistance}</p>
                                    <p className="mb-0"><strong>זמן נסיעה כולל:</strong> {routeInfo.totalDuration}</p>
                                </div>
                            )}

                            {/* הודעת חישוב */}
                            {isCalculating && (
                                <div className="alert alert-warning mb-4">
                                    <div className="d-flex align-items-center">
                                        <div className="spinner-border spinner-border-sm me-2" role="status"></div>
                                        <span>מחשב מסלול...</span>
                                    </div>
                                </div>
                            )}

                            {/* הודעה אם אין מסלול */}
                            {!directionsResponse && !isCalculating && mapLoaded && stations.length > 0 && (
                                <div className="alert alert-secondary mb-4">
                                    <span>לחץ על "חשב מסלול" כדי לראות את המסלול על המפה</span>
                                </div>
                            )}

                            {/* הודעה אם אין תחנות */}
                            {!loadingStations && stations.length === 0 && (
                                <div className="alert alert-warning mb-4">
                                    <span>לא נמצאו תחנות עבור המסלול הזה</span>
                                </div>
                            )}
                        </div>

                        {/* רשימת התחנות - עם גלילה */}
                        <div className="flex-grow-1 px-4" style={{ overflowY: 'auto', maxHeight: 'calc(100vh - 400px)' }}>
                            <div className="stations-list">
                                {stations.map((station, index) => (
                                    < div key={station.stationId} className="card mb-3 border-start border-4"
                                        style={{ borderColor: station.isPickup ? '#28a745' : '#dc3545' }}>
                                        <div className="card-body p-3">
                                            <div className="d-flex justify-content-between align-items-start mb-2">
                                                <span className="badge fs-6"
                                                    style={{
                                                        backgroundColor: station.isPickup ? '#28a745' : '#dc3545',
                                                        color: 'white'
                                                    }}>
                                                    תחנה {index + 1} - {station.isPickup ? 'איסוף' : 'הורדה'}
                                                    {index === 0 && ' (התחלה)'}
                                                    {index === stations.length - 1 && ' (סיום)'}
                                                </span>
                                            </div>


                                            <div className="mb-2">
                                                <strong>{station.address}</strong>
                                            </div>

                                            <div className="d-flex align-items-center gap-2">
                                                <label className="form-label mb-0 small">שעה:</label>
                                                <input
                                                    type="time"
                                                    className="form-control form-control-sm"
                                                    value={station.isPickup ? station.estimatedArrivalTime : station.estimatedDepartureTime}
                                                    onChange={(e) => updateStationTime(station.stationId, e.target.value)}
                                                    style={{ width: '120px' }}
                                                />
                                            </div>

                                            <div className="mt-1">
                                                <span className="badge bg-info text-dark">
                                                    👥 {station.passengerCount || 1} נוסע{(station.passengerCount || 1) > 1 ? 'ים' : ''}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* כפתורי פעולה - קבועים בתחתית */}
                        <div className="p-4 pt-3">
                            <div className="d-grid gap-2">
                                <button
                                    className="btn btn-primary"
                                    onClick={recalculateRoute}
                                    disabled={isCalculating || !mapLoaded || stations.length < 2}
                                >
                                    {isCalculating ? (
                                        <>
                                            <div className="spinner-border spinner-border-sm me-2" role="status"></div>
                                            מחשב...
                                        </>
                                    ) : (
                                        <>🔄 חשב מסלול</>
                                    )}
                                </button>
                                <button
                                    className="btn btn-info"
                                    onClick={fitMapToStations}
                                    disabled={!mapLoaded || stations.length === 0}
                                >
                                    🎯 התאם מפה
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* המפה */}
                <div className="col-md-8">
                    <div className="bg-light p-3 rounded shadow" style={{ position: 'sticky', top: '20px', height: '100vh' }}>
                        <h5 className="text-center mb-3">מסלול הנסיעה</h5>
                        {isLoaded ? (
                            <GoogleMap
                                mapContainerStyle={{ ...containerStyle, height: 'calc(100vh - 150px)' }}
                                center={getStationsCenter()}
                                zoom={15}
                                onLoad={onMapLoad}
                                options={{
                                    mapTypeControl: true,
                                    streetViewControl: true,
                                    fullscreenControl: true,
                                    zoomControl: true,
                                    mapTypeId: window.google?.maps.MapTypeId.ROADMAP,
                                    gestureHandling: 'greedy'
                                }}
                            >
                                {/* הצגת המסלול */}
                                {directionsResponse && (
                                    <DirectionsRenderer
                                        directions={directionsResponse}
                                        options={{
                                            suppressMarkers: false,
                                            polylineOptions: {
                                                strokeColor: '#FF6B35',
                                                strokeWeight: 6,
                                                strokeOpacity: 0.8
                                            },
                                            markerOptions: {
                                                clickable: true
                                            }
                                        }}
                                    />
                                )}

                                {/* הצגת markers נוספים אם אין מסלול */}
                                {!directionsResponse && stations.map((station, index) => (
                                    <Marker
                                        key={station.stationId}
                                        position={station.coordinates}
                                        label={{
                                            text: (index + 1).toString(),
                                            color: 'white',
                                            fontSize: '14px',
                                            fontWeight: 'bold'
                                        }}
                                        icon={{
                                            fillColor: station.type === 'איסוף' ? '#28a745' : '#dc3545',
                                            fillOpacity: 1,
                                            strokeColor: 'white',
                                            strokeWeight: 2,
                                            scale: 1
                                        }}
                                        title={`${station.address} - ${station.type} - ${station.time}`}
                                    />
                                ))}
                            </GoogleMap>
                        ) : (
                            <div className="d-flex justify-content-center align-items-center" style={{ height: 'calc(100vh - 150px)' }}>
                                <div className="spinner-border text-primary" role="status">
                                    <span className="visually-hidden">טוען מפה...</span>
                                </div>
                            </div>
                        )}

                        {/* מקרא */}
                        <div className="mt-3 text-center">
                            <div className="row">
                                <div className="col">
                                    <small className="text-muted">
                                        <span className="me-3">🟢 איסוף</span>
                                        <span className="me-3">🔴 הורדה</span>
                                        <span className="me-3">🛣️ מסלול נסיעה</span>
                                        <span>📍 תחנות</span>
                                    </small>
                                </div>
                            </div>

                        </div>
                    </div>
                </div>
            </div>
        </div >
    );
}