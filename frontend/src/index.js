import React from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter as Router } from 'react-router-dom';
import BasicLayout from './BasicLayout';

ReactDOM.render(
  <Router>
    <BasicLayout />
  </Router>,
  document.getElementById('root')
);
