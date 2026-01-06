import React from "react";
import { useLocation } from "react-router-dom";
import { SuperblocksEmbed } from "@superblocksteam/embed-react";
import config from "../config";
import "../App.css";

const Home = () => {
  const location = useLocation();
  const path = `${location.pathname}${location.search}`;

  // Handle Superblocks session expiration
  const handleAuthError = (err: any) => {
    console.log(err);
  }

  const handleNavigation = (event: any) => {
    let route = `${event.pathname}${event.search}`;
    console.log(`User navigated to: ${route}`);
    window.history.pushState({ path: route }, '', route);
  }

  // Handle custom events emitted from Superblocks App
  const handleEvents = (event: string) => {
    switch (event) {
      default:
        console.log(`Unknown event ${event}`);
    }
  }

  const getEmbedUrl = () => {
    switch (process.env.REACT_APP_ENV) {
      case 'production':
        return `https://app.superblocks.com/embed/applications/${config.superblocks.appId}${path}`;
      case 'staging':
        return `https://app.superblocks.com/embed/applications/preview/${config.superblocks.appId}${path}?branch=staging`;
      default:
        return `https://app.superblocks.com/embed/applications/preview/${config.superblocks.appId}${path}?branch=${process.env.REACT_APP_BRANCH}`;
    }
  }

  return (
    <div className="App">
      <SuperblocksEmbed
        src={getEmbedUrl()}
        onNavigation={handleNavigation}
        onAuthError={handleAuthError}
        onEvent={handleEvents}
        token={config.superblocks.token}
      />
    </div>
  );
};

export default Home;
