import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { TrainingOverlay } from './training/TrainingOverlay';
import './style.css';
import { ChallengeClock } from './training/ChallengeClock';
import { BaseAlert } from './weather/BaseEmergencyBanner';
import './visuals/industrial.css';
ReactDOM.createRoot(document.getElementById('root')!).render(<React.StrictMode><ChallengeClock/><div id="game-world"><App/><BaseAlert/></div><TrainingOverlay/></React.StrictMode>);
