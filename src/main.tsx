import React from 'react';
import {createRoot} from 'react-dom/client';
import './styles/admin.css';
import {App} from './App';
import {ToastProvider, ToastContainer} from './services/toast';

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ToastProvider>
      <App />
      <ToastContainer />
    </ToastProvider>
  </React.StrictMode>,
);
