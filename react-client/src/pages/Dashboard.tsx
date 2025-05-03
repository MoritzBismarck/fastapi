// react-client/src/pages/Dashboard.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import NotificationsList from '../components/NotificationsList';
import { NotificationsProvider } from '../contexts/NotificationsContext';

const Dashboard: React.FC = () => {
  return (
    <div className="font-mono max-w-4xl mx-auto p-4">
      <Header />
      
      {/* Notifications Section - wrapped in provider */}
      <div className="mb-6">
        <NotificationsProvider>
          <NotificationsList />
        </NotificationsProvider>
      </div>
      
      <div className="mb-12">
        <Link to="/events" className="text-xl text-blue-700 underline font-bold">
          Events
        </Link>
        <p className="ml-8 mt-2">Find and join events with your friends</p>
      </div>
      
      <div className="mb-12">
        <Link to="/friends" className="text-xl text-blue-700 underline font-bold">
          Friends
        </Link>
        <p className="ml-8 mt-2">Find and connect with friends</p>
      </div>
      
      <hr className="border-gray-400 my-8" />
      
      <footer className="text-gray-600 text-sm">
        <p>© 2025 Bone Social Web Project</p>
        <p>CONNECTION: fickdoomscrolling.com</p>
      </footer>
    </div>
  );
};

export default Dashboard;