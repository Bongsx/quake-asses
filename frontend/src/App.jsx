import { useState } from "react";
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Dashboard from "./components/Dashboard";
import EarthquakeEventsList from "./components/EarthquakeEventsList";
import AiAlert from "./components/AiAlert";
import SuggestionForm from "./components/SuggestionForm";
import "./App.css";
import "./index.css";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/earthquake-events" element={<EarthquakeEventsList />} />
        <Route path="/ai-alert" element={<AiAlert />} />
        <Route path="/suggestion-form" element={<SuggestionForm />} />
      </Routes>
    </Router>
  );
}

export default App;
