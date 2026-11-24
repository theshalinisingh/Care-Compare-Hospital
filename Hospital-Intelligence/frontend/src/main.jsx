
import React from 'react';
import { createRoot } from 'react-dom/client';
import Workspace from './Workspace.jsx';

import './styles.css';
import './styles/design-system.css';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Workspace />
  </React.StrictMode>
);
