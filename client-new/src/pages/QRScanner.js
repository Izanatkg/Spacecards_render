import React, { useState } from 'react';
import { Container, Paper, Typography, Box, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const QRScanner = () => {
    const navigate = useNavigate();
    const [error, setError] = useState('');

    const handleScan = (data) => {
        if (data) {
            navigate(`/profile?id=${data}`);
        }
    };

    const handleError = (err) => {
        setError('Error al escanear el código QR');
        console.error(err);
    };

    return (
        <Container maxWidth="sm">
            <Paper elevation={3} sx={{ p: 4, mt: 4 }}>
                <Typography variant="h4" component="h1" gutterBottom>
                    Escanear QR
                </Typography>
                <Box sx={{ mt: 4, textAlign: 'center' }}>
                    <Typography variant="body1" color="text.secondary" paragraph>
                        Esta función estará disponible próximamente.
                    </Typography>
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={() => navigate('/profile')}
                    >
                        Ir a Perfil
                    </Button>
                </Box>
                {error && (
                    <Typography color="error" sx={{ mt: 2 }}>
                        {error}
                    </Typography>
                )}
            </Paper>
        </Container>
    );
};

export default QRScanner;
