import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Navigation from './components/Navigation';
import Home from './pages/Home';
import Register from './pages/Register';
import UserProfile from './pages/UserProfile';
import QRScanner from './pages/QRScanner';

const theme = createTheme({
  palette: {
    primary: {
      main: '#EE1515', // Pokemon Red
    },
    secondary: {
      main: '#3B4CCA', // Pokemon Blue
    },
    background: {
      default: '#FFFFFF',
    },
  },
  typography: {
    fontFamily: 'Roboto, Arial, sans-serif',
  },
});

const routerConfig = {
  future: {
    v7_startTransition: true,
    v7_relativeSplatPath: true
  }
};

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router {...routerConfig}>
        <Navigation />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/register" element={<Register />} />
          <Route path="/profile" element={<UserProfile />} />
          <Route path="/scan" element={<QRScanner />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
