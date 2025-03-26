import React from 'react';
import { AppBar, Toolbar, Button, Box, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext'; // You'll need to create this context

const Navbar = () => {
    const { isAuthenticated, isAdmin, logout } = useAuth(); // You'll need to implement this context

    return (
        <AppBar position="static" sx={{ background: '#2B4582' }}>
            <Toolbar>
                <Box component={RouterLink} to="/" sx={{ textDecoration: 'none', color: 'white', display: 'flex', alignItems: 'center', gap: 1 }}>
                    <img 
                        src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png"
                        alt="PokéPuntos"
                        style={{ width: 24, height: 24 }}
                    />
                    <Typography variant="h6" component="div">
                        PokéPuntos
                    </Typography>
                </Box>
                
                <Box sx={{ marginLeft: 'auto' }}>
                    {!isAuthenticated ? (
                        <>
                            <Button 
                                component={RouterLink} 
                                to="/login" 
                                color="inherit" 
                                sx={{ mr: 2 }}
                                startIcon={<i className="fas fa-sign-in-alt" />}
                            >
                                Iniciar Sesión
                            </Button>
                            <Button 
                                component={RouterLink} 
                                to="/register" 
                                variant="contained" 
                                color="primary"
                                startIcon={<i className="fas fa-user-plus" />}
                            >
                                Registrarse
                            </Button>
                        </>
                    ) : (
                        <>
                            <Button 
                                component={RouterLink} 
                                to="/" 
                                color="inherit" 
                                sx={{ mr: 2 }}
                                startIcon={<i className="fas fa-home" />}
                            >
                                Inicio
                            </Button>
                            <Button 
                                component={RouterLink} 
                                to="/dashboard" 
                                color="inherit" 
                                sx={{ mr: 2 }}
                                startIcon={<i className="fas fa-user" />}
                            >
                                Mi Cuenta
                            </Button>
                            {isAdmin && (
                                <Button 
                                    component={RouterLink} 
                                    to="/admin" 
                                    color="inherit" 
                                    sx={{ mr: 2 }}
                                    startIcon={<i className="fas fa-cog" />}
                                >
                                    Panel Admin
                                </Button>
                            )}
                            <Button 
                                onClick={logout}
                                variant="contained" 
                                color="primary"
                                startIcon={<i className="fas fa-sign-out-alt" />}
                            >
                                Cerrar Sesión
                            </Button>
                        </>
                    )}
                </Box>
            </Toolbar>
        </AppBar>
    );
};

export default Navbar;
