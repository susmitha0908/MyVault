import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { VaultLockProvider } from "./security/VaultLockContext";
import DashboardLayout from "./layouts/DashboardLayout";
import Dashboard from "./pages/Dashboard";
import Projects from "./pages/Projects";
import Credentials from "./pages/Credentials";
import Emails from "./pages/Emails";
import Notes from "./pages/Notes";
import Favorites from "./pages/Favorites";
import Activity from "./pages/Activity";
import Recovery from "./pages/Recovery";
import Settings from "./pages/Settings";

const App = () => {
  const [searchQuery, setSearchQuery] = useState("");

  const handleGlobalSearch = (query: string) => {
    setSearchQuery(query);
  };

  return (
    <VaultLockProvider>
      <Router>
        <DashboardLayout onSearch={handleGlobalSearch}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/credentials" element={<Credentials />} />
            <Route path="/emails" element={<Emails />} />
            <Route path="/notes" element={<Notes />} />
            <Route path="/favorites" element={<Favorites />} />
            <Route path="/activity" element={<Activity />} />
            <Route path="/security" element={<Settings />} />
            <Route path="/recovery" element={<Recovery />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </DashboardLayout>
      </Router>
    </VaultLockProvider>
  );
};

export default App;
