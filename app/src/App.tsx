import React, { useEffect, useState, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { useOktaAuth } from '@okta/okta-react';
import { SuperblocksEmbed } from "@superblocksteam/embed-react";
import ErrorPage from "./components/ErrorPage";
import "./App.css";

interface AppError {
  title: string;
  message: string;
  details?: string;
  statusCode?: number;
}

const App = () => {
  const location = useLocation();
  const { authState, oktaAuth } = useOktaAuth();
  const [superblocksToken, setSuperblocksToken] = useState<string>();
  const [error, setError] = useState<AppError | null>(null);

  const path = `${location.pathname}${location.search}`;

  // Environment variables
  const superblocksApplicationId = process.env.REACT_APP_SUPERBLOCKS_APPLICATION_ID;
  const superblocksUrl = process.env.REACT_APP_SUPERBLOCKS_URL;
  const superblocksAppVersion = process.env.REACT_APP_SUPERBLOCKS_APP_VERSION || '2.0';
  const tokenUrl = process.env.REACT_APP_USE_LOCAL_LAMBDA === 'true'
    ? 'http://localhost:3001/oauth2/token'
    : process.env.REACT_APP_API_GATEWAY_URL;

  // Build Superblocks embed URL based on version
  const getSuperblocksEmbedUrl = () => {
    const basePath = superblocksAppVersion === '2.0'
      ? '/code-mode/embed/applications'
      : '/embed/applications';
    return `${superblocksUrl}${basePath}/${superblocksApplicationId}${path}`;
  };

  // Okta Authentication to React App
  const login = async () => {
    await oktaAuth.signInWithRedirect();
  }

  const logout = async () => {
    await oktaAuth.signOut();
  }

  const handleRetry = () => {
    setError(null);
    if (authState?.isAuthenticated && authState?.accessToken && authState?.idToken) {
      getSuperblocksToken(authState.accessToken, authState.idToken);
    }
  };

  // Auto-redirect to login if user is not authenticated
  useEffect(() => {
    if (!authState) {
      return; // Still loading auth state
    }

    if (!authState.isAuthenticated && !authState.isPending) {
      login();
    }
  }, [authState, oktaAuth]); // eslint-disable-line react-hooks/exhaustive-deps

  // Authenticate user to Superblocks
  const getSuperblocksToken = useCallback(async (accessToken: any, idToken: any) => {
    if (!tokenUrl) {
      console.error('Token URL not configured. Set REACT_APP_API_GATEWAY_URL or REACT_APP_USE_LOCAL_LAMBDA=true');
      setError({
        title: 'Configuration Error',
        message: 'Token exchange server URL is not configured.',
        details: 'Set REACT_APP_API_GATEWAY_URL or REACT_APP_USE_LOCAL_LAMBDA=true in your environment configuration.',
      });
      return;
    }

    // Clear any previous errors when retrying
    setError(null);

    try {
      console.log('Fetching Superblocks token from:', tokenUrl);

      const res = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id_token: idToken.idToken,
        }),
      });

      if (!res.ok) {
        let errorData: any;
        let errorText = '';

        try {
          errorData = await res.json();
          errorText = errorData.message || errorData.error || JSON.stringify(errorData);
        } catch {
          errorText = await res.text();
        }

        console.error('Superblocks auth error:', res.status, errorText);

        // Set appropriate error based on status code
        if (res.status === 401 || res.status === 403) {
          setError({
            title: 'Authentication Failed',
            message: 'Unable to authenticate with the token exchange server. Your session may have expired.',
            details: `Status ${res.status}: ${errorText}`,
            statusCode: res.status,
          });
        } else if (res.status === 500 || res.status === 502 || res.status === 503) {
          setError({
            title: 'Server Error',
            message: 'The authentication server encountered an error. Please try again in a moment.',
            details: `Status ${res.status}: ${errorText}`,
            statusCode: res.status,
          });
        } else {
          setError({
            title: 'Authentication Error',
            message: 'An unexpected error occurred during authentication.',
            details: `Status ${res.status}: ${errorText}`,
            statusCode: res.status,
          });
        }
        return;
      }

      const data = await res.json();
      console.log('Successfully received Superblocks token');
      setSuperblocksToken(data?.access_token);
    } catch (error) {
      console.error('Failed to fetch Superblocks token:', error);

      setError({
        title: 'Connection Error',
        message: 'Failed to connect to the authentication server. Please check your network connection and ensure the server is running.',
        details: error instanceof Error ? `${error.name}: ${error.message}` : String(error),
      });
    }
  }, [tokenUrl]);

  useEffect(() => {
    if (authState?.isAuthenticated && authState?.accessToken) {
      getSuperblocksToken(authState.accessToken, authState.idToken);
    }
  }, [authState, getSuperblocksToken]);

  // Handle Superblocks session expiration or authentication errors
  const handleAuthError = (err: any) => {
    console.error('Superblocks authentication error:', err);

    // Clear the token to show error page instead of embed
    setSuperblocksToken(undefined);

    // Set error state to display error page
    setError({
      title: 'Session Expired',
      message: 'Your Superblocks session has expired or encountered an authentication error.',
      details: err?.message || JSON.stringify(err),
    });
  }

  const handleNavigation = (event: any) => {
    let route = `${event.pathname}${event.search}`;
    console.log(`User navigated to: ${route}`);
    window.history.pushState({ path: route }, '', route);
  }

  // Handle custom events emitted from Superblocks App
  const handleEvents = (event: string) => {
    switch (event) {
      case 'logout':
        // Log user out of Okta app when logout button is clicked
        logout();
        break;
      default:
        console.log(`Unknown event ${event}`);
    }
  }

  // Show loading state while auth is pending or token is being fetched
  if (!authState || authState.isPending) {
    return (
      <div className="App">
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          flexDirection: 'column',
          gap: '1rem'
        }}>
          <div style={{
            border: '4px solid #f3f3f3',
            borderTop: '4px solid #3498db',
            borderRadius: '50%',
            width: '40px',
            height: '40px',
            animation: 'spin 1s linear infinite'
          }} />
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  // Show loading state while redirecting to login
  if (authState && !authState.isAuthenticated) {
    return (
      <div className="App">
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          flexDirection: 'column',
          gap: '1rem'
        }}>
          <div style={{
            border: '4px solid #f3f3f3',
            borderTop: '4px solid #3498db',
            borderRadius: '50%',
            width: '40px',
            height: '40px',
            animation: 'spin 1s linear infinite'
          }} />
          <p>Redirecting to login...</p>
        </div>
      </div>
    );
  }

  // Show error page if there's an error
  if (error) {
    return (
      <ErrorPage
        title={error.title}
        message={error.message}
        details={error.details}
        statusCode={error.statusCode}
        onRetry={handleRetry}
        onLogout={logout}
      />
    );
  }

  return (
    <div className="App">
      {
        superblocksToken ? (
          <SuperblocksEmbed
            src={getSuperblocksEmbedUrl()}
            onNavigation={handleNavigation}
            onAuthError={handleAuthError}
            onEvent={handleEvents}
            token={superblocksToken}
          />
        ) : (
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100vh',
            flexDirection: 'column',
            gap: '1rem'
          }}>
            <div style={{
              border: '4px solid #f3f3f3',
              borderTop: '4px solid #3498db',
              borderRadius: '50%',
              width: '40px',
              height: '40px',
              animation: 'spin 1s linear infinite'
            }} />
            <p>Authenticating...</p>
          </div>
        )
      }
    </div>
  );
};

export default App;
