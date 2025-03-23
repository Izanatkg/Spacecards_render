import React from 'react';
import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const Navigation = () => {
    const navigate = useNavigate();

    return (
        <AppBar position="static">
            <Toolbar>
                <Typography 
                    variant="h6" 
                    component="div" 
                    sx={{ flexGrow: 1, cursor: 'pointer' }}
                    onClick={() => navigate('/')}
                >
                    Club Pokémon
                </Typography>
                <Box>
                    <Button 
                        color="inherit" 
                        onClick={() => navigate('/')}
                    >
                        Inicio
                    </Button>
                    <Button 
                        color="inherit" 
                        onClick={() => navigate('/register')}
                    >
                        Registro
                    </Button>
                    <Button 
                        color="inherit" 
                        onClick={() => navigate('/profile')}
                    >
                        Perfil
                    </Button>
                    <Button 
                        color="inherit" 
                        onClick={() => navigate('/scan')}
                    >
                        Escanear
                    </Button>
                </Box>
            </Toolbar>
        </AppBar>
    );
};

export default Navigation;
