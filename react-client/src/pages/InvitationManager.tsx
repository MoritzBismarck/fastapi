// react-client/src/pages/InvitationManager.tsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import Header from '../components/Header';
import Button from '../components/Button';
import { post, get } from '../api/client';

interface InvitationToken {
  id: number;
  token: string;
  description: string;
  expires_at: string;
  created_at: string;
  usage_count: number;
}

const API_URL = process.env.REACT_APP_API_URL!;
const FRONTEND_URL = process.env.REACT_APP_FRONTEND_URL!;

const InvitationManager: React.FC = () => {
  const [tokens, setTokens] = useState<InvitationToken[]>([]);
  const [loading, setLoading] = useState(false);
  const [description, setDescription] = useState('');
  const [expiresDays, setExpiresDays] = useState(30);
  const [error, setError] = useState('');
  const [selectedToken, setSelectedToken] = useState<number | null>(null);
  
  // Fetch existing tokens
  const fetchTokens = async () => {
    setLoading(true);
    try {
      const response = await get<InvitationToken[]>('/invitations');
      setTokens(response);
    } catch (err) {
      setError('Failed to load invitation tokens');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchTokens();
  }, []);

  // Create a new token
  const createToken = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!description) {
      setError('Please enter a description');
      return;
    }
    
    setLoading(true);
    try {
      const response = await post<InvitationToken>('/invitations', {
        description,
        expires_days: expiresDays
      });
      
      setTokens([...tokens, response]);
      setDescription('');
      setError('');
    } catch (err: any) {
      console.error(err.response?.data || err);
      setError(
        err.response?.data?.detail ||
        JSON.stringify(err.response?.data) ||
        'Failed to create invitation token'
      );
    } finally {
      setLoading(false);
    }
  };
  
  // Get QR code URL for a token
  const getQRCodeUrl = (tokenId: number) =>
    `${API_URL}/invitations/${tokenId}/qrcode`;
  
  // Get registration URL that will be encoded in QR
  const getRegistrationUrl = (token: string) =>
    `${FRONTEND_URL}/signup/${token}`;

  return (
    <div className="font-mono max-w-4xl mx-auto p-4">
      <Header />
      
      <h1 className="text-2xl font-bold mb-4">Invitation QR Codes</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      {/* Create new token form */}
      <div className="mb-8 border border-gray-300 p-4">
        <h2 className="text-xl font-bold mb-4">Create New Invitation</h2>
        
        <form onSubmit={createToken}>
          <div className="mb-4">
            <label htmlFor="description" className="block mb-2">Description (e.g., "Hiking Group")</label>
            <input
              type="text"
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="border border-gray-300 p-2 w-full"
              required
            />
          </div>
          
          <div className="mb-4">
            <label htmlFor="expires-days" className="block mb-2">Expires After (days)</label>
            <input
              type="number"
              id="expires-days"
              value={expiresDays}
              onChange={(e) => setExpiresDays(parseInt(e.target.value))}
              min="1"
              max="365"
              className="border border-gray-300 p-2 w-32"
            />
          </div>
          
          <Button type="submit" disabled={loading}>
            {loading ? 'Creating...' : 'Create Invitation QR Code'}
          </Button>
        </form>
      </div>
      
      {/* List of existing tokens */}
      <div>
        <h2 className="text-xl font-bold mb-4">Your Invitation QR Codes</h2>
        
        {loading && tokens.length === 0 ? (
          <p>Loading tokens...</p>
        ) : tokens.length === 0 ? (
          <p>No invitation tokens yet. Create one above.</p>
        ) : (
          <div className="space-y-4">
            {tokens.map(token => (
              <div key={token.id} className="border border-gray-300 p-4">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-bold">{token.description}</h3>
                    <p className="text-sm text-gray-600">Created: {new Date(token.created_at).toLocaleDateString()}</p>
                    <p className="text-sm text-gray-600">Expires: {new Date(token.expires_at).toLocaleDateString()}</p>
                    <p className="text-sm text-gray-600">Uses: {token.usage_count}</p>
                  </div>
                  <Button 
                    onClick={() => setSelectedToken(selectedToken === token.id ? null : token.id)}
                    size="sm"
                  >
                    {selectedToken === token.id ? 'Hide QR Code' : 'Show QR Code'}
                  </Button>
                </div>
                
                {selectedToken === token.id && (
                  <div className="flex flex-col items-center">
                    <p className="mb-2 text-center">
                      Registration URL: 
                      <span className="font-mono text-sm block mt-1">
                        {getRegistrationUrl(token.token)}
                      </span>
                    </p>
                    <img 
                      src={getQRCodeUrl(token.id)} 
                      alt={`QR Code for ${token.description}`}
                      className="border border-gray-300 p-2 bg-white"
                    />
                    <p className="mt-2 text-sm text-gray-600">
                      Scan this QR code to register with this invitation
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default InvitationManager;