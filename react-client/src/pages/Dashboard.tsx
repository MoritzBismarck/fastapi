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
      {/*<div className="mb-6">
        <NotificationsProvider>
          <NotificationsList />
        </NotificationsProvider>
      </div>}*/}
      
      <div className="mb-12 flex flex-col items-center">
        <Link to="/friends" className="text-xl text-black underline font-bold">
          1. Friends
        </Link>
        <p className="font-bold mt-2">Find your friends</p>
      </div>

      <div className="mb-12 flex flex-col items-center">
        <Link to="/events" className="text-xl text-black underline font-bold">
          2. Events
        </Link>
        <p className="font-bold mt-2">Match with events</p>
      </div>

      {/* <div className="mb-12">
        <a 
          href="/chat" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-xl text-blue-700 underline font-bold"
        >
          Support Chat
        </a>
        <p className="ml-8 mt-2">Anonymous 5-minute support sessions (Beta)</p>
      </div> */}
      
      <hr className="border-gray-400 my-8" />

      <div className="mb-8 flex flex-col">
        <Link to="/rfc" className="text-l text-black underline font-bold">
          Request for Comment
        </Link>
        <p className="font-bold text-l">Give Your Feedback</p>
      </div>

      <hr className="border-gray-400 my-8" />
      
      <footer className="text-gray-600 text-sm font-bold mt-8">
        <p>CLOSED BETA</p>
        <p>© 2025 Lalela Arts & Comms UG</p>
        <p>CONNECTION: bone-social.com</p>
      </footer>
    </div>
  );
};

export default Dashboard;