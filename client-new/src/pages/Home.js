import React from 'react';
import { Container, Paper, Typography, Button, Box } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const Home = () => {
    const navigate = useNavigate();

    return (
        <Container maxWidth="sm">
            <Paper elevation={3} sx={{ p: 4, mt: 4, textAlign: 'center' }}>
                <Typography variant="h4" component="h1" gutterBottom>
                    Bienvenido al Club Pokémon
                </Typography>
                <Typography variant="body1" paragraph>
                    ¡Únete a nuestro programa de lealtad y obtén recompensas exclusivas!
                </Typography>
                <Box sx={{ mt: 4, display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Button
                        variant="contained"
                        color="primary"
                        size="large"
                        onClick={() => navigate('/register')}
                    >
                        Regístrate Ahora
                    </Button>
                    <Button
                        variant="outlined"
                        color="secondary"
                        size="large"
                        onClick={() => navigate('/scan')}
                    >
                        Escanear QR
                    </Button>
                </Box>
            </Paper>
        </Container>
    );
};

export default Home;
