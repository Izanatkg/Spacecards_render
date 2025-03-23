import React, { useState } from 'react';
import {
    Container,
    Paper,
    Typography,
    TextField,
    Button,
    Box,
    CircularProgress,
    Card,
    CardContent
} from '@mui/material';
import { QRCodeSVG } from 'qrcode.react';
import axios from '../config/axios';

const UserProfile = () => {
    const [userId, setUserId] = useState('');
    const [userInfo, setUserInfo] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSearch = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await axios.get(`/customers/${userId}`);
            setUserInfo(response.data);
        } catch (error) {
            setError(error.response?.data?.message || 'Error al buscar usuario');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container maxWidth="sm">
            <Paper elevation={3} sx={{ p: 4, mt: 4 }}>
                <Typography variant="h4" component="h1" gutterBottom>
                    Perfil de Usuario
                </Typography>
                <form onSubmit={handleSearch}>
                    <TextField
                        fullWidth
                        label="ID de Usuario"
                        value={userId}
                        onChange={(e) => setUserId(e.target.value)}
                        margin="normal"
                        required
                    />
                    {error && (
                        <Typography color="error" sx={{ mt: 2 }}>
                            {error}
                        </Typography>
                    )}
                    <Button
                        fullWidth
                        type="submit"
                        variant="contained"
                        color="primary"
                        sx={{ mt: 3 }}
                        disabled={loading}
                    >
                        {loading ? <CircularProgress size={24} /> : 'Buscar'}
                    </Button>
                </form>

                {userInfo && (
                    <Card sx={{ mt: 4 }}>
                        <CardContent>
                            <Typography variant="h5" gutterBottom>
                                {userInfo.name}
                            </Typography>
                            <Typography color="text.secondary">
                                Email: {userInfo.email}
                            </Typography>
                            <Typography color="text.secondary">
                                Teléfono: {userInfo.phone}
                            </Typography>
                            <Typography variant="h6" sx={{ mt: 2 }}>
                                Puntos: {userInfo.points || 0}
                            </Typography>
                            <Box sx={{ mt: 2 }}>
                                <QRCodeSVG value={userInfo.id} size={200} />
                            </Box>
                        </CardContent>
                    </Card>
                )}
            </Paper>
        </Container>
    );
};

export default UserProfile;
