import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter as Router } from 'react-router-dom';
import BasicLayout from './BasicLayout';

const container = document.getElementById('root');
const root = createRoot(container);

root.render(
  <Router>
    <BasicLayout />
  </Router>
);
