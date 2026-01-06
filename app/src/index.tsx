// src/index.js  
import React from 'react';
import ReactDOM from 'react-dom/client';
import { Security, LoginCallback } from '@okta/okta-react';
import { OktaAuth, toRelativeUrl } from '@okta/okta-auth-js';
import { BrowserRouter as Router, Routes, Route, useNavigate, Navigate } from 'react-router-dom';  
import config from './config';
import App from './App';
import Home from './pages/Home'; 

const oktaAuth = new OktaAuth(config.oidc);

const Root = () => {
  const navigate = useNavigate();
  const restoreOriginalUri = async (_oktaAuth:any, originalUri:any) => {
    navigate(toRelativeUrl(originalUri || '/', window.location.origin), { replace: true });
  };

  return (
    <Security oktaAuth={oktaAuth} restoreOriginalUri={restoreOriginalUri}>
      <Routes>
        <Route path='/login/callback' element={<LoginCallback />} />
        <Route path='/' element={<App />} />
        <Route path='*' element={<App />} />
      </Routes>
    </Security>
  );
}

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
)
root.render(
  <Router>
    <Root />
  </Router>
);