import React, { useState, useEffect } from 'react';
import { AppBar, Toolbar, Typography, Button, Box, Menu, MenuItem, IconButton, useMediaQuery, useTheme } from '@mui/material';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import DashboardIcon from '@mui/icons-material/Dashboard';
import LoginIcon from '@mui/icons-material/Login';
import HowToRegIcon from '@mui/icons-material/HowToReg';
import MenuIcon from '@mui/icons-material/Menu';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function Navbar() {
    const { user } = useAuth();
    const [customerData, setCustomerData] = useState(null);
    const [anchorEl, setAnchorEl] = useState(null);
    const [mobileMenuAnchorEl, setMobileMenuAnchorEl] = useState(null);
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const navigate = useNavigate();

    useEffect(() => {
        // Verificar si hay datos del cliente en localStorage
        const storedData = localStorage.getItem('customerData');
        if (storedData) {
            setCustomerData(JSON.parse(storedData));
        }
    }, []);

    const handleMenuOpen = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    const handleMobileMenuOpen = (event) => {
        setMobileMenuAnchorEl(event.currentTarget);
    };

    const handleMobileMenuClose = () => {
        setMobileMenuAnchorEl(null);
    };

    const handleLogout = () => {
        localStorage.removeItem('customerData');
        setCustomerData(null);
        handleMenuClose();
        handleMobileMenuClose();
        navigate('/');
    };

    const handleNavigation = (path) => {
        navigate(path);
        handleMenuClose();
        handleMobileMenuClose();
    };

    return (
        <AppBar position="static">
            <Toolbar>
                <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
                    <RocketLaunchIcon sx={{ mr: 1 }} />
                    <Typography 
                        variant="h6" 
                        component="a" 
                        href="https://space-pass-nq9e0cv.gamma.site/" 
                        target="_blank"
                        rel="noopener noreferrer"
                        sx={{ textDecoration: 'none', color: 'inherit', cursor: 'pointer' }}
                    >
                        Space Pass
                    </Typography>
                </Box>
                
                {isMobile ? (
                    // Menú móvil
                    <>
                        <IconButton
                            color="inherit"
                            onClick={handleMobileMenuOpen}
                            edge="end"
                        >
                            <MenuIcon />
                        </IconButton>
                        <Menu
                            anchorEl={mobileMenuAnchorEl}
                            open={Boolean(mobileMenuAnchorEl)}
                            onClose={handleMobileMenuClose}
                            PaperProps={{
                                sx: { bgcolor: '#1a1f2e', color: 'white' }
                            }}
                        >
                            <MenuItem onClick={() => handleNavigation('/register')}>
                                <HowToRegIcon sx={{ mr: 1 }} />
                                Registrarse
                            </MenuItem>
                            <MenuItem onClick={() => handleNavigation('/login')}>
                                <LoginIcon sx={{ mr: 1 }} />
                                Iniciar Sesión
                            </MenuItem>
                            {customerData && (
                                <MenuItem onClick={() => handleNavigation('/dashboard')}>
                                    <DashboardIcon sx={{ mr: 1 }} />
                                    Mi Dashboard
                                </MenuItem>
                            )}
                            {customerData && (
                                <MenuItem onClick={handleLogout}>
                                    <LoginIcon sx={{ mr: 1 }} />
                                    Cerrar Sesión
                                </MenuItem>
                            )}
                        </Menu>
                    </>
                ) : (
                    // Menú escritorio
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Button 
                            color="inherit" 
                            component={Link} 
                            to="/register"
                            startIcon={<HowToRegIcon />}
                            sx={{ mr: 1 }}
                        >
                            Registrarse
                        </Button>
                        
                        <Button 
                            color="inherit" 
                            component={Link} 
                            to="/login"
                            startIcon={<LoginIcon />}
                            sx={{ mr: 1 }}
                        >
                            Iniciar Sesión
                        </Button>
                        
                        {customerData && (
                            <Button 
                                color="inherit" 
                                component={Link} 
                                to="/dashboard"
                                startIcon={<DashboardIcon />}
                                sx={{ mr: 1 }}
                            >
                                Mi Dashboard
                            </Button>
                        )}
                        
                        {customerData && (
                            <IconButton
                                color="inherit"
                                onClick={handleMenuOpen}
                                sx={{ ml: 1 }}
                            >
                                <AccountCircleIcon />
                            </IconButton>
                        )}
                        
                        {customerData && (
                            <Menu
                                anchorEl={anchorEl}
                                open={Boolean(anchorEl)}
                                onClose={handleMenuClose}
                                PaperProps={{
                                    sx: { bgcolor: '#1a1f2e', color: 'white' }
                                }}
                            >
                                <MenuItem sx={{ pointerEvents: 'none' }}>
                                    <Typography variant="body2">{customerData.name}</Typography>
                                </MenuItem>
                                <MenuItem onClick={handleLogout}>Cerrar Sesión</MenuItem>
                            </Menu>
                        )}
                    </Box>
                )}
            </Toolbar>
        </AppBar>
    );
}

export default Navbar;