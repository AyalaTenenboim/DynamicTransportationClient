import React, { useEffect, useState } from 'react';
import axios from 'axios';

export default function ClarkAndWrightRunner() {
  const [data, setData] = useState(null);
  const [lastRun, setLastRun] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAlgorithm = async () => {
      try {
        const response = await axios.get('http://localhost:5238/api/ClarkAndWrightAlgorithm');
        setData(response.data);
        setLastRun(new Date().toLocaleTimeString());
        setError(null);
      } catch (err) {
        setError('שגיאה בהפעלה: ' + err.message);
      }
    };

    // הפעלה מיידית בהתחלה
    fetchAlgorithm();

    // הפעלה כל 5 דקות
    const interval = setInterval(fetchAlgorithm, 300000);

    // ניקוי טיימר כשקומפוננטה מתפרקת
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">הרצת אלגוריתם Clark and Wright</h1>
      <p className="mb-2">זמן ריצה אחרון: {lastRun || 'טרם רץ'}</p>
      {error && <p className="text-red-500">{error}</p>}
      <pre className="bg-gray-100 p-2 rounded overflow-auto max-h-96">
        {data ? JSON.stringify(data, null, 2) : 'טוען נתונים...'}
      </pre>
    </div>
  );
}
