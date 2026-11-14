import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { TrainingOverlay } from './training/TrainingOverlay';
import './style.css';
import './visuals/industrial.css';
ReactDOM.createRoot(document.getElementById('root')!).render(<React.StrictMode><div id="game-world"><App/></div><TrainingOverlay/></React.StrictMode>);
