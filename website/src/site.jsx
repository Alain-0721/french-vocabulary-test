import React from 'react';
import {createRoot} from 'react-dom/client';
import {App} from './grammar-preview/main.jsx';
import {startPwa} from './pwa.js';
import './native-app.css';
import {startNativeUpdates} from './native-updates.js';
createRoot(document.getElementById('root')).render(<App production/>);
startNativeUpdates();
if(import.meta.env?.PROD)startPwa();
