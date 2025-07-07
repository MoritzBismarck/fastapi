// react-client/src/pages/ChatRoom.tsx
import React, { useState, useEffect, useRef } from 'react';
import { getStoredToken } from '../utils/tokenStorage';
import { ChatEncryption } from '../utils/chatEncryption';
import Header from '../components/Header';

type ChatRole = 'caretaker' | 'helpseeker' | null;
type Message = {
  text: string;
  isMine: boolean;
  timestamp: Date;
};

const ChatRoom: React.FC = () => {
  const [role, setRole] = useState<ChatRole>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isMatched, setIsMatched] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [remainingTime, setRemainingTime] = useState<number | null>(null);
  const [isEncryptionReady, setIsEncryptionReady] = useState(false);
  
  const ws = useRef<WebSocket | null>(null);
  const encryption = useRef<ChatEncryption>(new ChatEncryption());
  const partnerPublicKey = useRef<CryptoKey | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);
  
  // Connect to WebSocket when role is selected
  const connectWebSocket = async (selectedRole: ChatRole) => {
    const token = getStoredToken();
    const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000';
    const wsUrl = `${apiUrl.replace('http', 'ws')}/chat/ws?token=${token}`;

    console.log('Connecting to WebSocket:', wsUrl); // Debug log
    
    ws.current = new WebSocket(wsUrl);
    
    ws.current.onopen = () => {
      console.log('WebSocket connected successfully');
      setIsConnected(true);
      // Send join message
      ws.current?.send(JSON.stringify({
        type: 'join',
        role: selectedRole
      }));
    };
    
    ws.current.onmessage = async (event) => {
      const data = JSON.parse(event.data);
      
      switch (data.type) {
        case 'matched':
          setIsMatched(true);
          // Generate and share public key
          const keyPair = await encryption.current.generateKeyPair();
          const publicKeyString = await encryption.current.exportPublicKey(keyPair.publicKey);
          
          ws.current?.send(JSON.stringify({
            type: 'publicKey',
            key: publicKeyString
          }));
          break;
          
        case 'partnerPublicKey':
          // Import and store partner's public key
          const importedKey = await encryption.current.importPublicKey(data.key);
          partnerPublicKey.current = importedKey;
          setIsEncryptionReady(true);
          
          // Add system message
          setMessages(prev => [...prev, {
            text: "🔒 Encrypted connection established. Your conversation is private.",
            isMine: false,
            timestamp: new Date()
          }]);
          break;
          
        case 'partnerEncryptedMessage':
          try {
            const decryptedMessage = await encryption.current.decryptMessage(data.data);
            setMessages(prev => [...prev, {
              text: decryptedMessage,
              isMine: false,
              timestamp: new Date()
            }]);
          } catch (error) {
            console.error('Failed to decrypt message:', error);
          }
          break;
          
        case 'timerUpdate':
          setRemainingTime(data.remainingSeconds);
          break;
          
        case 'sessionEnd':
          handleSessionEnd(data.reason);
          break;
      }
    };
    
    ws.current.onerror = (error) => {
      console.error('WebSocket error:', error);
      setIsConnected(false);
    };
    
    ws.current.onclose = () => {
      setIsConnected(false);
      setIsMatched(false);
    };
  };
  
  const handleSessionEnd = (reason: string) => {
    setIsMatched(false);
    setMessages([]);
    setRemainingTime(null);
    setIsEncryptionReady(false);
    partnerPublicKey.current = null;
    
    // Show end message
    if (reason === 'timeout') {
      alert('Your 5-minute session has ended. Thank you for participating!');
    } else {
      alert('Your chat partner has disconnected.');
    }
    
    // Reset to role selection
    setRole(null);
    ws.current?.close();
  };
  
  const selectRole = (selectedRole: ChatRole) => {
    setRole(selectedRole);
    if (selectedRole) {
      connectWebSocket(selectedRole);
    }
  };
  
  const sendMessage = async () => {
    if (!inputMessage.trim() || !isEncryptionReady || !partnerPublicKey.current) return;
    
    try {
      // Encrypt the message
      const encryptedMessage = await encryption.current.encryptMessage(
        inputMessage,
        partnerPublicKey.current
      );
      
      // Send encrypted message
      ws.current?.send(JSON.stringify({
        type: 'encryptedMessage',
        data: encryptedMessage
      }));
      
      // Add to local messages
      setMessages(prev => [...prev, {
        text: inputMessage,
        isMine: true,
        timestamp: new Date()
      }]);
      
      setInputMessage('');
    } catch (error) {
      console.error('Failed to send message:', error);
      alert('Failed to send message. Please try again.');
    }
  };
  
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      ws.current?.close();
    };
  }, []);
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Role selection screen
  if (!role) {
    return (
      <div className="min-h-screen bg-[#F9F2E3] font-mono flex flex-col">
        <Header title="Support Chat - Beta" />
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="bg-white border-4 border-black p-8 max-w-md w-full">
            <h1 className="text-2xl font-bold mb-6 text-center uppercase">Choose Your Role</h1>
            <p className="mb-6 text-center">
              Connect anonymously for a 5-minute support session
            </p>
            <div className="space-y-4">
              <button
                onClick={() => selectRole('caretaker')}
                className="w-full py-4 bg-[#A59B91] text-[#F9F2E3] border-2 border-black font-bold uppercase hover:bg-[#918880] transition-colors"
              >
                I want to help (Caretaker)
              </button>
              <button
                onClick={() => selectRole('helpseeker')}
                className="w-full py-4 bg-[#2A2A2A] text-[#F9F2E3] border-2 border-black font-bold uppercase hover:bg-[#444] transition-colors"
              >
                I need support (Helpseeker)
              </button>
            </div>
            <p className="mt-6 text-xs text-center text-gray-600">
              All conversations are encrypted end-to-end and not stored
            </p>
          </div>
        </div>
      </div>
    );
  }
  
  // Waiting screen
  if (!isMatched) {
    return (
      <div className="min-h-screen bg-[#F9F2E3] font-mono flex flex-col">
        <Header title="Support Chat - Beta" />
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="bg-white border-4 border-black p-8 max-w-md w-full text-center">
            <h2 className="text-xl font-bold mb-4 uppercase">
              Waiting for a {role === 'caretaker' ? 'Helpseeker' : 'Caretaker'}...
            </h2>
            <div className="my-8">
              <div className="animate-pulse flex justify-center">
                <div className="w-4 h-4 bg-black rounded-full mx-1"></div>
                <div className="w-4 h-4 bg-black rounded-full mx-1 animation-delay-200"></div>
                <div className="w-4 h-4 bg-black rounded-full mx-1 animation-delay-400"></div>
              </div>
            </div>
            <p className="text-gray-600">You'll be matched soon</p>
            <button
              onClick={() => {
                setRole(null);
                ws.current?.close();
              }}
              className="mt-4 text-blue-700 underline hover:text-blue-900"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  // Chat interface
  return (
    <div className="min-h-screen bg-[#F9F2E3] font-mono flex flex-col">
      {/* Header */}
      <div className="bg-[#2A2A2A] text-[#F9F2E3] p-4 flex justify-between items-center">
        <div>
          <h2 className="font-bold">
            You are: <span className="uppercase">{role}</span>
          </h2>
          <p className="text-xs">
            Connected to: {role === 'caretaker' ? 'Helpseeker' : 'Caretaker'}
          </p>
        </div>
        {remainingTime !== null && (
          <div className="text-right">
            <div className="text-2xl font-bold font-mono">
              {formatTime(remainingTime)}
            </div>
            <p className="text-xs">remaining</p>
          </div>
        )}
      </div>
      
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex ${msg.isMine ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs px-4 py-2 rounded-lg ${
                msg.isMine
                  ? 'bg-[#A59B91] text-[#F9F2E3]'
                  : 'bg-white border border-gray-300'
              }`}
            >
              <p className="whitespace-pre-wrap break-words">{msg.text}</p>
              <p className={`text-xs mt-1 ${msg.isMine ? 'text-[#E5DCCC]' : 'text-gray-500'}`}>
                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Input area */}
      <div className="bg-white border-t-4 border-black p-4">
        <div className="flex space-x-2">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={isEncryptionReady ? "Type a message..." : "Establishing secure connection..."}
            disabled={!isEncryptionReady}
            className="flex-1 p-2 border-2 border-gray-300 font-mono focus:border-black focus:outline-none"
          />
          <button
            onClick={sendMessage}
            disabled={!isEncryptionReady || !inputMessage.trim()}
            className="px-6 py-2 bg-[#2A2A2A] text-[#F9F2E3] font-bold uppercase disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#444] transition-colors"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatRoom;