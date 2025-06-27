import React, { useEffect, useState } from 'react';
import { useNavigate } from "react-router";
import axios from 'axios';

export default function RequestApproval() {
  const passengerId = localStorage.getItem('passengerId');
  const navigate = useNavigate();
  const [stations, setStations] = useState([]);
  const [lastClosedTravelRequestId, setLastClosedTravelRequestId] = useState();
  const [startingAddress, setStartingAddress] = useState('');
  const [destinationAddress, setDestinationAddress] = useState('');
  const [hasJoined, setHasJoined] = useState(false);
  const [hasDeclined, setHasDeclined] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [noDataFound, setNoDataFound] = useState(false);
  const [noRequestToApproval, setNoRequestToApproval] = useState(false);

  // פונקציה לבדיקה אם הנסיעה עדיין רלוונטית
  const isTravelStillRelevant = (timeWindowStart, timeWindowEnd) => {
    if (!timeWindowStart || !timeWindowEnd) {
      console.log("חסרים נתוני זמן:", { timeWindowStart, timeWindowEnd });
      return true; // אם אין נתוני זמן, נציג את הבקשה
    }

    try {
      const now = new Date();

      // לצורך בדיקה - תוכל להוסיף שעות לזמן הנוכחי
      // לדוגמה: now.setHours(now.getHours() + 2); // מוסיף 2 שעות לזמן הנוכחי

      // פונקציה להמרת זמן בפורמט HH:MM:SS לתאריך מלא של היום
      const parseTimeToday = (timeString) => {
        const today = new Date();
        const [hours, minutes, seconds] = timeString.split(':');
        today.setHours(parseInt(hours, 10));
        today.setMinutes(parseInt(minutes, 10));
        today.setSeconds(parseInt(seconds, 10));
        today.setMilliseconds(0);
        return today;
      };

      let travelStartTime, travelEndTime;

      // בדיקה אם הזמן בפורמט HH:MM:SS (רק שעה)
      if (typeof timeWindowStart === 'string' && timeWindowStart.match(/^\d{2}:\d{2}:\d{2}$/)) {
        travelStartTime = parseTimeToday(timeWindowStart);
      } else {
        travelStartTime = new Date(timeWindowStart);
      }

      if (typeof timeWindowEnd === 'string' && timeWindowEnd.match(/^\d{2}:\d{2}:\d{2}$/)) {
        travelEndTime = parseTimeToday(timeWindowEnd);
      } else {
        travelEndTime = new Date(timeWindowEnd);
      }

      // בדיקה אם התאריכים תקינים
      if (isNaN(travelStartTime.getTime()) || isNaN(travelEndTime.getTime())) {
        console.log("תאריכים לא תקינים, מציג בקשה בכל מקרה:", {
          timeWindowStart,
          timeWindowEnd,
          startValid: !isNaN(travelStartTime.getTime()),
          endValid: !isNaN(travelEndTime.getTime())
        });
        return true; // אם התאריכים לא תקינים, נציג את הבקשה
      }

      console.log("בדיקת זמנים:", {
        now: now.toLocaleTimeString('he-IL'),
        travelStartTime: travelStartTime.toLocaleTimeString('he-IL'),
        travelEndTime: travelEndTime.toLocaleTimeString('he-IL'),
        timeWindowStart,
        timeWindowEnd
      });

      // אם עדיין לא הגיע זמן האיסוף - הבקשה רלוונטית
      if (now < travelStartTime) {
        console.log("עדיין לא הגיע זמן האיסוף - מציג בקשה");
        return true;
      }

      // אם עבר זמן האיסוף אבל עדיין לא עברה שעת ההגעה - הבקשה עדיין רלוונטית
      if (now >= travelStartTime && now < travelEndTime) {
        console.log("בזמן הנסיעה - מציג בקשה");
        return true;
      }

      // אם עברה שעת ההגעה - הבקשה לא רלוונטית
      if (now >= travelEndTime) {
        console.log("עברה שעת ההגעה - לא מציג בקשה");
        console.log("השוואת זמנים:", {
          nowTime: now.toLocaleTimeString('he-IL'),
          endTime: travelEndTime.toLocaleTimeString('he-IL'),
          difference: Math.round((now.getTime() - travelEndTime.getTime()) / (1000 * 60)), // ההפרש בדקות
          isPastEndTime: now >= travelEndTime
        });
        return false;
      }

      console.log("הנסיעה עדיין רלוונטית");
      return true;

    } catch (error) {
      console.error("שגיאה בבדיקת זמנים:", error);
      return true; // במקרה של שגיאה, נציג את הבקשה
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        // const response = await axios.get(`http://localhost:5238/api/TravelRequests/lastClosed/${passengerId}`);

        // if (response.data !== '' && response.data != null && response.data !== undefined) {
        //   const travelRequestId = response.data.travelRequestsId;
        //   setStartingAddress(response.data.startingAddress);
        //   setDestinationAddress(response.data.destinationAddress);
        //   setLastClosedTravelRequestId(travelRequestId);

        // const travelRequestId = parseInt(localStorage.getItem('travelRequestId'));
        const existing = localStorage.getItem('travelRequestIds');
        const travelRequestIds = existing ? JSON.parse(existing) : [];

        if (travelRequestIds.length === 0) {
          setNoRequestToApproval(false);
          console.error("לא נמצאו בקשות נסיעה");
          return;
        }

        for (const travelRequestId of travelRequestIds) {
          const stationsResponse = await axios.get(`http://localhost:5238/api/StationInRoute/travelRequestId?travelRequestId=${travelRequestId}`);
          const stationsData = stationsResponse.data;
          console.log("נתוני תחנות:", stationsData);

          // בדיקה אם הנסיעה עדיין רלוונטית
          if (stationsData.length > 0) {
            const isRelevant = isTravelStillRelevant(stationsData[0].timeWindowStart, stationsData[0].timeWindowEnd);
            console.log("האם הנסיעה רלוונטית?", isRelevant);

            if (!isRelevant) {
              // אם הנסיעה לא רלוונטית יותר, נציג "אין נתונים"
              console.log("הנסיעה לא רלוונטית - מציג אין נתונים");
              setNoDataFound(true);
              // setStations([]);
              setStations(prev => [...prev, []]);
              setStartingAddress('');
              setDestinationAddress('');
              setLastClosedTravelRequestId(null);
              // return;
              continue;
            }
          }

          // setStations(stationsData);
          setStations(prev => [...prev, stationsData]);
          setNoRequestToApproval(true);

          // בדיקה אם הנוסע כבר הצטרף למסלול
          const joinedRouteKey = `joined_route_${passengerId}_${travelRequestId}`;
          const hasAlreadyJoined = localStorage.getItem(joinedRouteKey) === 'true';
          setHasJoined(hasAlreadyJoined);

          // בדיקה אם הנוסע דחה את המסלול
          const declinedRouteKey = `declined_route_${passengerId}_${travelRequestId}`;
          const hasAlreadyDeclined = localStorage.getItem(declinedRouteKey) === 'true';
          setHasDeclined(hasAlreadyDeclined);

          setNoDataFound(false);
        }
        // } else {
        //   // הטיפול במקרה של חוסר נתונים
        //   setNoDataFound(true);
        //   setStations([]);
        //   setStartingAddress('');
        //   setDestinationAddress('');
        //   setLastClosedTravelRequestId(null);
        // }
      } catch (error) {
        console.error("שגיאה בבקשות:", error);
        setNoDataFound(true);
      }
    };

    fetchData();
  }, [passengerId]);

  const handleJoinRoute = async () => {
    setIsLoading(true);
    try {
      // כאן תוכל להוסיף את הקריאה לשרת לצורך הצטרפות למסלול
      // לדוגמה:
      // await axios.post(`http://localhost:5238/api/JoinRoute`, {
      //   passengerId: passengerId,
      //   travelRequestId: lastClosedTravelRequestId
      // });

      // סימולציה של קריאה לשרת
      await new Promise(resolve => setTimeout(resolve, 1000));

      setHasJoined(true);

      // שמירה ב-localStorage שהנוסע הצטרף למסלול הזה
      const joinedRouteKey = `joined_route_${passengerId}_${lastClosedTravelRequestId}`;
      localStorage.setItem(joinedRouteKey, 'true');

    } catch (error) {
      console.error("שגיאה בהצטרפות למסלול:", error);
      alert("אירעה שגיאה בהצטרפות למסלול");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeclineRoute = async () => {
    setIsLoading(true);
    try {

      const stationInRouteIdPickup = stations[0].StationInRouteId;
      const stationInRouteIdDropoff = stations[1].StationInRouteId;
      if (!stationInRouteIdPickup || !stationInRouteIdDropoff) {
        console.error("חסרים מזהי תחנות במסלול:", { stationInRouteIdPickup, stationInRouteIdDropoff });
        alert("אירעה שגיאה בדחיית המסלול - חסרים נתונים");
        setIsLoading(false);
        return;
      }
      console.log("מזהי תחנות במסלול:", { stationInRouteIdPickup, stationInRouteIdDropoff });
      // הקריאה לשרת לצורך דחיית המסלול

      for (const stationDelete of [stationInRouteIdPickup, stationInRouteIdDropoff]) {
        await axios.delete(`http://localhost:5238/api/StationInRoute/${stationDelete}`);
        console.log("תחנה הוסרה בהצלחה", { stationDelete });
      }



      setHasDeclined(true);

      // שמירה ב-localStorage שהנוסע דחה את המסלול הזה
      const declinedRouteKey = `declined_route_${passengerId}_${lastClosedTravelRequestId}`;
      localStorage.setItem(declinedRouteKey, 'true');

    } catch (error) {
      console.error("שגיאה בדחיית המסלול:", error);
      alert("אירעה שגיאה בדחיית המסלול");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClick = () => {
    navigate('/PassengerMenuPage');
  };

  if (noDataFound) {
    return (
      <div style={styles.noDataContainer}>
        <div style={styles.noDataMessage}>
          <h3>📋 אין נסיעות קיימות</h3>
          <p>אנא נסה שוב מאוחר יותר</p>
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

  // if (stations.length < 2) {
  if (!noRequestToApproval) {
    // return <div style={styles.loading}>טוען נתוני מסלול...</div>;
    return (
      <div style={styles.noDataContainer}>
        <div style={styles.noDataMessage}>
          <h3>📋 אין נתונים זמינים</h3>
          <p>אנא נסה שוב מאוחר יותר</p>
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

  // const pickup = stations.find(s => s.IsPickup === 'true');
  // const dropoff = stations.find(s => s.IsPickup === 'false');
  var requestId = 1;

  return (
    <div style={styles.container}>
      {hasJoined && (
        <div style={styles.successMessage}>
          <h3>הצטרפת למסלול בהצלחה!</h3>
        </div>
      )}

      {hasDeclined && (
        <div style={styles.declinedMessage}>
          <h3>הוסרת מהמסלול בהצלחה!</h3>
        </div>
      )}

      {!hasDeclined && (
        // <>
        //   <h2>המסלול שלך:</h2>

        //   <div style={styles.box}>
        //     <h4>תחנת איסוף</h4>
        //     <p><strong>כתובת:</strong> {stations[0].address}</p>
        //     <p><strong>שעה משוערת לאיסוף:</strong> {stations[0].timeWindowStart}</p>
        //   </div>

        //   <div style={styles.box}>
        //     <h4>תחנת הורדה</h4>
        //     <p><strong>כתובת:</strong> {stations[1].address}</p>
        //     <p><strong>שעת הגעה משוערת:</strong> {stations[1].timeWindowEnd}</p>
        //   </div>

        //   {!hasJoined && (
        //     <div style={styles.buttonsContainer}>
        //       <button
        //         style={styles.joinButton}
        //         onClick={handleJoinRoute}
        //         disabled={isLoading}
        //       >
        //         {isLoading ? 'מצטרף...' : 'הצטרפות'}
        //       </button>

        //       <button
        //         style={styles.declineButton}
        //         onClick={handleDeclineRoute}
        //         disabled={isLoading}
        //       >
        //         {isLoading ? 'מעדכן...' : 'לא מעוניין להצטרף'}
        //       </button>
        //     </div>
        //   )}
        // </>
        <>
          <h2>המסלול שלך:</h2>

          {stations.map((stationGroup, index) =>
            stationGroup.length === 2 && (
              <div key={index} style={{ marginBottom: '20px' }}>
                <div style={styles.box}>
                  {stationGroup[0].isPickup === 'true' ? (
                    <>
                      <h4>תחנת איסוף {requestId}</h4>
                      <p><strong>כתובת:</strong> {stationGroup[0].address}</p>
                      <p><strong>שעה משוערת לאיסוף:</strong> {stationGroup[0].timeWindowStart}</p>
                    </>
                  ) : (
                    <>
                      <h4>תחנת הורדה {requestId++}</h4>
                      <p><strong>כתובת:</strong> {stationGroup[1].address}</p>
                      <p><strong>שעת הגעה משוערת:</strong> {stationGroup[1].timeWindowEnd}</p>
                    </>
                  )}
                </div>
              </div>
            )
          )}

          {!hasJoined && (
            <div style={styles.buttonsContainer}>
              <button
                style={styles.joinButton}
                onClick={handleJoinRoute}
                disabled={isLoading}
              >
                {isLoading ? 'מצטרף...' : 'הצטרפות'}
              </button>

              <button
                style={styles.declineButton}
                onClick={handleDeclineRoute}
                disabled={isLoading}
              >
                {isLoading ? 'מעדכן...' : 'לא מעוניין להצטרף'}
              </button>
            </div>
          )}
        </>
      )}
      <button
        onClick={handleClick}
        className="btn btn-secondary position-fixed bg-secondary border-secondary text-white"
        style={{ top: '20px', right: '20px', zIndex: 1000 }}
      >
        חזרה לתפריט
      </button>
    </div>

  );
};

const styles = {
  container: {
    direction: 'rtl',
    maxWidth: '600px',
    margin: '0 auto',
    padding: '20px',
    fontFamily: 'Arial',
    backgroundColor: '#f9f9f9',
    borderRadius: '12px',
    boxShadow: '0 0 10px rgba(0,0,0,0.1)'
  },
  box: {
    backgroundColor: '#fff',
    padding: '15px',
    margin: '15px 0',
    borderRadius: '8px',
    border: '1px solid #ddd'
  },
  loading: {
    direction: 'rtl',
    textAlign: 'center',
    padding: '20px',
    fontSize: '18px',
    fontFamily: 'Arial'
  },
  noDataContainer: {
    direction: 'rtl',
    maxWidth: '600px',
    margin: '0 auto',
    padding: '20px',
    fontFamily: 'Arial'
  },
  noDataMessage: {
    backgroundColor: '#fff3cd',
    color: '#856404',
    padding: '20px',
    borderRadius: '8px',
    textAlign: 'center',
    border: '1px solid #ffeaa7',
    boxShadow: '0 0 10px rgba(0,0,0,0.1)'
  },
  buttonsContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    marginTop: '20px'
  },
  joinButton: {
    backgroundColor: '#4CAF50',
    color: 'white',
    padding: '15px 30px',
    fontSize: '18px',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    width: '100%',
    transition: 'background-color 0.3s',
    fontFamily: 'Arial'
  },
  declineButton: {
    backgroundColor: '#f44336',
    color: 'white',
    padding: '15px 30px',
    fontSize: '18px',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    width: '100%',
    transition: 'background-color 0.3s',
    fontFamily: 'Arial'
  },
  successMessage: {
    backgroundColor: '#d4edda',
    color: '#155724',
    padding: '15px',
    borderRadius: '8px',
    marginBottom: '20px',
    textAlign: 'center',
    border: '1px solid #c3e6cb'
  },
  declinedMessage: {
    backgroundColor: '#f8d7da',
    color: '#721c24',
    padding: '15px',
    borderRadius: '8px',
    marginBottom: '20px',
    textAlign: 'center',
    border: '1px solid #f5c6cb'
  }
};