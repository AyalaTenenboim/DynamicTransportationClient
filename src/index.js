import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import LoginPage from './components/LoginPage';
import PassengerRegistration from './components/Passenger/PassengerRegistration';
import DriverRegistration from './components/Driver/DriverRegistration';
import PassengerLogin from './components/Passenger/PassengerLogin';
import DriverLogin from './components/Driver/DriverLogin';
import PassengerMenuPage from './components/Passenger/PassengerMenuPage';
import UpdatePassenger from './components/Passenger/UpdatePassenger';
import ShowHistoryPassenger from './components/Passenger/ShowHistoryPassenger';
import NewTravelRequest from './components/Passenger/NewTravelRequest';
import DriverMenuPage from './components/Driver/DriverMenuPage';
import ShowRoutes from './components/Driver/ShowRoutes';
import RequestApproval from './components/Passenger/RequestApproval';
import UpdateDriverAndCar from './components/Driver/UpdateDriverAndCar';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    {/* <Provider store={store}> */}
    <BrowserRouter>
      <Routes>
        <Route path='' element={<App />}></Route>
        <Route path='/LoginPage' element={<LoginPage />}></Route>
        <Route path='/DriverLogin' element={<DriverLogin />}></Route>
        <Route path='/PassengerLogin' element={<PassengerLogin />}></Route>
        <Route path='/DriverRegistration' element={<DriverRegistration />}></Route>
        <Route path='/PassengerRegistration' element={<PassengerRegistration />}></Route>
        <Route path='/PassengerMenuPage' element={<PassengerMenuPage />}></Route>
        <Route path='/UpdatePassenger' element={<UpdatePassenger />}></Route>
        <Route path='/ShowHistoryPassenger' element={<ShowHistoryPassenger />}></Route>
        <Route path='/NewTravelRequest' element={<NewTravelRequest />}></Route>
        <Route path='/DriverMenuPage' element={<DriverMenuPage />}></Route>
        <Route path='/ShowRoutes' element={<ShowRoutes/>}></Route>
        <Route path='/RequestApproval' element={<RequestApproval />}></Route>
        <Route path='/UpdateDriverAndCar' element={<UpdateDriverAndCar />}></Route>
      </Routes>
    </BrowserRouter>
    {/* </Provider> */}
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
