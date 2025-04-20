import React from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';

const Dashboard: React.FC = () => {
  // Sample data for services
  const liveServices = [
    { id: 1, name: 'Event Matcher', description: 'Find and join events with your friends', route: '/events'},
    { id: 2, name: 'Friend Finder', description: 'Find and connect with friends', route: '/friends' } 
  ];
  
  const upcomingServices = [
    { id: 1, name: 'User Profiles', description: 'Customizable user profiles with avatars' },
    { id: 2, name: 'Messaging', description: 'Direct messaging between users' },
    { id: 3, name: 'Notifications', description: 'Real-time notification system' }
  ];

  return (
    <main>
      <Header />
      
      <section id="live-services" className="mb-8">
        <h2 className="text-xl font-bold mb-4 border-b border-gray-300 pb-2">Live Services</h2>
        
        {liveServices.length > 0 ? (
          <ul className="space-y-4">
            {liveServices.map(service => (
              <li key={service.id} className="border border-gray-300 p-4">
                <h3 className="font-bold">{service.name}</h3>
                <p>{service.description}</p>
                |
                <Link 
                  to={service.route} 
                  className="text-blue-700 underline hover:text-blue-900 mt-2 inline-block"
                >
                  Access Service
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-600">No live services available at the moment.</p>
        )}
      </section>
      
      <section id="upcoming-services" className="mb-8">
        <h2 className="text-xl font-bold mb-4 border-b border-gray-300 pb-2">Coming Soon</h2>
        
        {upcomingServices.length > 0 ? (
          <ul className="space-y-4">
            {upcomingServices.map(service => (
              <li key={service.id} className="border border-gray-300 p-4 bg-gray-50">
                <h3 className="font-bold">{service.name}</h3>
                <p>{service.description}</p>
                <span className="text-gray-600 text-sm mt-1 inline-block">
                  Coming soon...
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-600">No upcoming services planned at the moment.</p>
        )}
      </section>
      
      <footer className="mt-8 pt-4 border-t border-gray-400 text-gray-600 text-sm">
        <p>© 2025 Bone Social Web Project. All rights reserved.</p>
      </footer>
    </main>
  );
};

export default Dashboard;