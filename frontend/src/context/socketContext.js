/*
==========================================================
FRONTEND SOCKET CONTEXT
FILE:
src/context/socketContext.js
==========================================================
*/

import React, {
  createContext,
  useEffect,
  useRef,
  useState,
  useCallback
} from "react";

import { AppState } from "react-native";

import { io } from "socket.io-client";

import * as SecureStore from "expo-secure-store";

import axios from "axios";

import { SOCKET_EVENTS } from "../../evenets/frontendsocketEvents";

export const SocketContext =
  createContext();



// CONFIG


const SOCKET_URL =
  "http://10.112.58.157:9090";

const API_URL =
  "http://10.112.58.157:9090/api";



// SOCKET PROVIDER



export const SocketProvider = ({
  children
}) => {

  const socketRef = useRef(null);

  const appState = useRef(
    AppState.currentState
  );

  const reconnectTimeout =
    useRef(null);

  const [socket, setSocket] =
    useState(null);

  const [connected, setConnected] =
    useState(false);

  const [loading, setLoading] =
    useState(true);

  

  // GET ACCESS TOKEN

  

  const getAccessToken =
    async () => {

      try {

        const token =
          await SecureStore.getItemAsync(
            "accessToken"
          );

        if (!token) {

          console.log(
            " ACCESS TOKEN NOT FOUND"
          );

          return null;
        }

        return token.startsWith(
          "Bearer "
        )
          ? token.replace(
              "Bearer ",
              ""
            )
          : token;

      } catch (err) {

        console.log(
          "GET ACCESS TOKEN ERROR"
        );

        console.log(err);

        return null;
      }
    };

  

  // GET REFRESH TOKEN
 
  

  const getRefreshToken =
    async () => {

      try {

        const token =
          await SecureStore.getItemAsync(
            "refreshToken"
          );

        if (!token) {

          console.log(
            " REFRESH TOKEN NOT FOUND"
          );

          return null;
        }

        return token;

      } catch (err) {

        console.log(
          "GET REFRESH TOKEN ERROR"
        );

        console.log(err);

        return null;
      }
    };

  
  
  // REFRESH ACCESS TOKEN
  
  

  const refreshAccessToken =
    async () => {

      try {



        console.log(
          " REFRESHING ACCESS TOKEN"
        );

       

        const refreshToken =
          await getRefreshToken();

        if (!refreshToken) {

          return null;
        }

        const response =
          await axios.post(
            `${API_URL}/auth/refresh-token`,
            {
              refreshToken
            }
          );

        const newAccessToken =
          response.data?.accessToken;

        if (!newAccessToken) {

          console.log(
            " NEW ACCESS TOKEN NOT RECEIVED"
          );

          return null;
        }

        await SecureStore.setItemAsync(
          "accessToken",
          `Bearer ${newAccessToken}`
        );

        console.log(
          "ACCESS TOKEN REFRESHED"
        );

        return newAccessToken;

      } catch (err) {

        console.log(
          " REFRESH TOKEN ERROR"
        );

        console.log(
          err?.response?.data ||
            err?.message
        );

        return null;
      }
    };

  
  // DISCONNECT SOCKET

  

  const disconnectSocket =
    useCallback(() => {

      try {

   

        console.log(
          " SOCKET DISCONNECT"
        );

       
        if (socketRef.current) {

          socketRef.current.removeAllListeners();

          socketRef.current.disconnect();

          socketRef.current = null;
        }

        setSocket(null);

        setConnected(false);

      } catch (err) {

        console.log(
          " DISCONNECT ERROR"
        );

        console.log(err);
      }

    }, []);

  

  // CREATE SOCKET

  

  const createSocket =
    async (token) => {

      try {



        console.log(
          " CREATE SOCKET"
        );

       
        const newSocket = io(
          SOCKET_URL,
          {

            transports: [
              "websocket"
            ],

            auth: {
              token
            },

            autoConnect: true,

            forceNew: true,

            reconnection: true,

            reconnectionAttempts:
              Infinity,

            reconnectionDelay: 2000,

            reconnectionDelayMax: 10000,

            timeout: 20000
          }
        );

    
        // CONNECT
      

        newSocket.on(
          "connect",
          () => {

          

            console.log(
              " SOCKET CONNECTED"
            );

            console.log(
              " SOCKET ID:",
              newSocket.id
            );

        

            setConnected(true);

            setLoading(false);
          }
        );

        
        
        // READY
        
        

        newSocket.on(
          SOCKET_EVENTS.CONNECTION_READY,
          (data) => {

            console.log(
              " CONNECTION READY"
            );

            console.log(data);
          }
        );

        
    
        // LOCATION UPDATE
       
        

        newSocket.on(
          SOCKET_EVENTS.LOCATION_UPDATE,
          (data) => {

            console.log(
              "\n LIVE LOCATION UPDATE"
            );

            console.log(data);
          }
        );

        
        
        // BOOKING ACCEPTED
       
        

        newSocket.on(
          SOCKET_EVENTS.BOOKING_ACCEPTED,
          (data) => {

            console.log(
              "\n BOOKING ACCEPTED"
            );

            console.log(data);
          }
        );

        
     
        // BUDDY ARRIVED
      
        

        newSocket.on(
          SOCKET_EVENTS.BUDDY_ARRIVED,
          (data) => {

            console.log(
              "\n BUDDY ARRIVED"
            );

            console.log(data);
          }
        );

        /*
        
        OTP
       
        */

        newSocket.on(
          SOCKET_EVENTS.OTP_GENERATED,
          (data) => {

            console.log(
              "\n OTP GENERATED"
            );

            console.log(data);
          }
        );

        /*
        
        DISCONNECT
        
        */

        newSocket.on(
          "disconnect",
          (reason) => {

            

            console.log(
              " SOCKET DISCONNECTED"
            );

            console.log(
              " REASON:",
              reason
            );

           
            setConnected(false);

         
            // TOKEN EXPIRED
            

            if (
              reason ===
              "io server disconnect"
            ) {

              console.log(
                " SERVER DISCONNECTED SOCKET"
              );
            }
          }
        );

        /*
       
        CONNECT ERROR
        
        */

        newSocket.on(
          "connect_error",
          async (err) => {

           

            console.log(
              " SOCKET CONNECT ERROR"
            );

            console.log(
              err?.message
            );

           

            setConnected(false);

            /*
         
            TOKEN EXPIRED
            
            */

            if (
              err?.message ===
              "Unauthorized"
            ) {

              console.log(
                " TRYING TOKEN REFRESH"
              );

              const newToken =
                await refreshAccessToken();

              if (newToken) {

                disconnectSocket();

                setTimeout(() => {

                  connectSocket();

                }, 1500);

              }
            }
          }
        );

        /*
       
        RECONNECT ATTEMPT
        
        */

        newSocket.io.on(
          "reconnect_attempt",
          (attempt) => {

            console.log(
              ` RECONNECT ATTEMPT ${attempt}`
            );
          }
        );

        /*
        
        RECONNECTED
        
        */

        newSocket.io.on(
          "reconnect",
          (attempt) => {

            console.log(
              `🟢 RECONNECTED (${attempt})`
            );
          }
        );

        /*
        
        SAVE SOCKET
        
        */

        socketRef.current =
          newSocket;

        setSocket(newSocket);

      } catch (err) {

        console.log(
          " CREATE SOCKET ERROR"
        );

        console.log(err);

        setLoading(false);
      }
    };

  /*
  
  CONNECT SOCKET
 
  */

  const connectSocket =
    useCallback(async () => {

      try {

        setLoading(true);

        const token =
          await getAccessToken();

        if (!token) {

          const newToken =
            await refreshAccessToken();

          if (!newToken) {

            setLoading(false);

            return;
          }

          await createSocket(
            newToken
          );

          return;
        }

        if (socketRef.current?.connected) {

          console.log(
            " SOCKET ALREADY CONNECTED"
          );

          setLoading(false);

          return;
        }

        disconnectSocket();

        await createSocket(token);

      } catch (err) {

        console.log(
          " CONNECT SOCKET ERROR"
        );

        console.log(err);

        setLoading(false);
      }

    }, [disconnectSocket]);

  /*
  
  APP STATE LISTENER
  
  */

  useEffect(() => {

    const subscription =
      AppState.addEventListener(
        "change",
        async (nextState) => {

          console.log(
            `APP STATE: ${nextState}`
          );

          
          
          // APP ACTIVE
       
          

          if (
            appState.current.match(
              /inactive|background/
            ) &&
            nextState === "active"
          ) {

            console.log(
              " APP ACTIVE AGAIN"
            );

            if (
              !socketRef.current
                ?.connected
            ) {

              await connectSocket();
            }
          }

          appState.current =
            nextState;
        }
      );

    return () =>
      subscription.remove();

  }, [connectSocket]);

  // INITIAL CONNECT


  useEffect(() => {

    connectSocket();

    return () => {

      disconnectSocket();

      if (
        reconnectTimeout.current
      ) {

        clearTimeout(
          reconnectTimeout.current
        );
      }
    };

  }, []);

  /*

  CONTEXT
 
  */

  return (

    <SocketContext.Provider
      value={{

        socket,

        connected,

        loading,

        reconnect:
          connectSocket,

        disconnect:
          disconnectSocket
      }}
    >

      {children}

    </SocketContext.Provider>
  );
};