import { useState } from "react";
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Dashboard from "./components/Dashboard";
import "./App.css";
import "./index.css";
import EarthquakeEventsList from "./components/EarthquakeEventsList";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/earthquake-events" element={<EarthquakeEventsList />} />
      </Routes>
    </Router>
  );
}

export default App;
