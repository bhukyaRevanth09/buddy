import { useContext } from 'react';
import { useSocket } from '../src/context/socketContext.js';

export const useSocket = () => {
    const context = useContext(SocketContext);
    
    if (context === undefined || context === null) {
        throw new Error('useSocket must be used within a SocketProvider');
    }
    
    return context;
};