import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { NotificationsProvider } from './contexts/NotificationsContext';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import Friends from './pages/Friends';
import Events from './pages/Events';
import LikedEvents from './pages/LikedEvents';
import CreateEvent from './pages/CreateEvent';
import EventDetail from './pages/EventDetail'; // We'll create this next
import DesignTest from './pages/DesignTest';
import InvitationManager from './pages/InvitationManager';
import Signup from './pages/Signup';

const App: React.FC = () => {
  return (
    <AuthProvider>
        <BrowserRouter>
          <div className="font-mono max-w-4xl mx-auto p-4">
            <Routes>
              <Route path="/" element={<Login />} />
              <Route path="/signup/:token" element={<Signup />} />
              <Route path="/signup/first-user" element={<Signup isFirstUser={true} />} />
              <Route 
                path="/dashboard" 
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                } 
              />
              <Route path="/profile" element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/friends" 
                element={
                  <ProtectedRoute>
                    <Friends />
                  </ProtectedRoute>
                }
              />
              <Route 
                path="/events" 
                element={
                  <ProtectedRoute>
                    <Events />
                  </ProtectedRoute>
                }
              />
              <Route 
                path="/events/liked" 
                element={
                  <ProtectedRoute>
                    <LikedEvents />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/events/create" 
                element={
                  <ProtectedRoute>
                    <CreateEvent />
                  </ProtectedRoute>
                }
              />
              <Route 
                path="/events/:id" 
                element={
                  <ProtectedRoute>
                    <EventDetail />
                  </ProtectedRoute>
                }
              />
              <Route 
                path="/design-test" 
                element={
                  <ProtectedRoute>
                    <DesignTest />
                  </ProtectedRoute>
                }
              />
              <Route 
                path="/invitation-manager" 
                element={
                  <ProtectedRoute>
                    <InvitationManager />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </div>
        </BrowserRouter>
    </AuthProvider>
  );
};

export default App;