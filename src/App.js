import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import Header from './components/Header';
import ScheduleList from './components/ScheduleList';
import ScheduleForm from './components/ScheduleForm';
import Calendar from './components/Calendar';
import NotificationPermission from './components/NotificationPermission';

function App() {
  return (
    <Router>
      <div className="App">
        <Header />
        <NotificationPermission />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<ScheduleList />} />
            <Route path="/calendar" element={<Calendar />} />
            <Route path="/add" element={<ScheduleForm />} />
            <Route path="/edit/:id" element={<ScheduleForm />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
