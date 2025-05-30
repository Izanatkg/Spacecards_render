import React, { useState, useEffect } from 'react';
import {
    Box,
    Container,
    Typography,
    Paper,
    Grid,
    LinearProgress,
    Avatar,
    Card,
    CardContent,
    Divider,
    Button,
    useMediaQuery,
    useTheme,
    CircularProgress,
    Snackbar,
    Alert
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import config from '../config/config';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import PersonIcon from '@mui/icons-material/Person';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import QrCodeIcon from '@mui/icons-material/QrCode';
import StarIcon from '@mui/icons-material/Star';
import LogoutIcon from '@mui/icons-material/Logout';
import RefreshIcon from '@mui/icons-material/Refresh';

// Definición de niveles de lealtad
const loyaltyLevels = [
    { name: 'Cadete Espacial', min: 0, max: 20, color: '#64b5f6', icon: '🚀' },
    { name: 'Piloto Lunar', min: 21, max: 100, color: '#7986cb', icon: '🌙' },
    { name: 'Comandante Galáctico', min: 101, max: 500, color: '#9575cd', icon: '🪐' },
    { name: 'Interstellar', min: 501, max: Infinity, color: '#e040fb', icon: '✨' }
];

// Función para determinar el nivel basado en puntos
const getLevelByPoints = (points) => {
    return loyaltyLevels.find(level => points >= level.min && points <= level.max);
};

const Dashboard = () => {
    const [customerData, setCustomerData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showSnackbar, setShowSnackbar] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [highestLevel, setHighestLevel] = useState(null);
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const navigate = useNavigate();

    // Cargar datos del cliente
    useEffect(() => {
        const loadCustomerData = async () => {
            try {
                // Primero intentar obtener datos del localStorage
                const storedData = localStorage.getItem('customerData');
                
                if (storedData) {
                    const parsedData = JSON.parse(storedData);
                    
                    // Si tenemos el ID del cliente, obtener datos actualizados del servidor
                    if (parsedData.id || parsedData.customer_code) {
                        try {
                            const response = await axios.get(
                                `${config.API_URL}/api/customer/${parsedData.customer_code || parsedData.id}`
                            );
                            
                            if (response.data.success) {
                                // Actualizar datos en localStorage
                                const updatedData = response.data.customer;
                                
                                // Determinar el nivel más alto alcanzado
                                const currentLevel = getLevelByPoints(updatedData.points || 0);
                                const storedHighestLevel = localStorage.getItem('highestLevel');
                                let newHighestLevel = currentLevel;
                                
                                if (storedHighestLevel) {
                                    const parsedHighestLevel = JSON.parse(storedHighestLevel);
                                    // Comparar el nivel actual con el nivel más alto almacenado
                                    if (loyaltyLevels.findIndex(l => l.name === parsedHighestLevel.name) > 
                                        loyaltyLevels.findIndex(l => l.name === currentLevel.name)) {
                                        newHighestLevel = parsedHighestLevel;
                                    }
                                }
                                
                                // Guardar el nivel más alto
                                localStorage.setItem('highestLevel', JSON.stringify(newHighestLevel));
                                setHighestLevel(newHighestLevel);
                                
                                localStorage.setItem('customerData', JSON.stringify(updatedData));
                                setCustomerData(updatedData);
                            } else {
                                setCustomerData(parsedData); // Usar datos almacenados si la API falla
                                
                                // Cargar el nivel más alto almacenado
                                const storedHighestLevel = localStorage.getItem('highestLevel');
                                if (storedHighestLevel) {
                                    setHighestLevel(JSON.parse(storedHighestLevel));
                                } else {
                                    setHighestLevel(getLevelByPoints(parsedData.points || 0));
                                }
                            }
                        } catch (apiError) {
                            console.error('Error fetching updated customer data:', apiError);
                            setCustomerData(parsedData); // Usar datos almacenados si la API falla
                            
                            // Cargar el nivel más alto almacenado
                            const storedHighestLevel = localStorage.getItem('highestLevel');
                            if (storedHighestLevel) {
                                setHighestLevel(JSON.parse(storedHighestLevel));
                            } else {
                                setHighestLevel(getLevelByPoints(parsedData.points || 0));
                            }
                        }
                    } else {
                        setCustomerData(parsedData);
                        
                        // Cargar el nivel más alto almacenado
                        const storedHighestLevel = localStorage.getItem('highestLevel');
                        if (storedHighestLevel) {
                            setHighestLevel(JSON.parse(storedHighestLevel));
                        } else {
                            setHighestLevel(getLevelByPoints(parsedData.points || 0));
                        }
                    }
                } else {
                    // Si no hay datos en localStorage, redirigir al login
                    navigate('/login');
                }
            } catch (error) {
                console.error('Error loading customer data:', error);
                setError('Error al cargar los datos del cliente');
                setShowSnackbar(true);
            } finally {
                setLoading(false);
            }
        };

        loadCustomerData();
    }, [navigate]);

    // Función para refrescar los datos del cliente
    const handleRefresh = async () => {
        if (!customerData || !customerData.customer_code) {
            setError('No se puede actualizar sin datos del cliente');
            setShowSnackbar(true);
            return;
        }
        
        setRefreshing(true);
        setError('');
        
        try {
            const response = await axios.get(
                `${config.API_URL}/api/customer/${customerData.customer_code}`
            );
            
            if (response.data.success) {
                const updatedData = response.data.customer;
                
                // Determinar el nivel más alto alcanzado
                const currentLevel = getLevelByPoints(updatedData.points || 0);
                const storedHighestLevel = localStorage.getItem('highestLevel');
                let newHighestLevel = currentLevel;
                
                if (storedHighestLevel) {
                    const parsedHighestLevel = JSON.parse(storedHighestLevel);
                    if (loyaltyLevels.findIndex(l => l.name === parsedHighestLevel.name) > 
                        loyaltyLevels.findIndex(l => l.name === currentLevel.name)) {
                        newHighestLevel = parsedHighestLevel;
                    }
                }
                
                localStorage.setItem('highestLevel', JSON.stringify(newHighestLevel));
                setHighestLevel(newHighestLevel);
                
                localStorage.setItem('customerData', JSON.stringify(updatedData));
                setCustomerData(updatedData);
                setShowSnackbar(true);
            }
        } catch (error) {
            console.error('Error refreshing customer data:', error);
            setError('Error al actualizar los datos');
            setShowSnackbar(true);
        } finally {
            setRefreshing(false);
        }
    };

    // Función para cerrar sesión
    const handleLogout = () => {
        localStorage.removeItem('customerData');
        // No eliminamos highestLevel para mantener el registro
        navigate('/login');
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <CircularProgress size={60} sx={{ color: '#7e57c2' }} />
            </Box>
        );
    }

    if (!customerData) {
        return (
            <Box sx={{ textAlign: 'center', mt: 8 }}>
                <Typography variant="h5" color="error">
                    No se encontraron datos del cliente
                </Typography>
                <Button 
                    variant="contained" 
                    onClick={() => navigate('/login')} 
                    sx={{ mt: 2 }}
                >
                    Volver al inicio de sesión
                </Button>
            </Box>
        );
    }

    const points = customerData.points || 0;
    const currentLevel = getLevelByPoints(points);
    
    // Si no tenemos un nivel más alto almacenado, usar el nivel actual
    const displayHighestLevel = highestLevel || currentLevel;

    // Calcular progreso hacia el siguiente nivel
    const calculateProgress = () => {
        if (currentLevel.name === 'Interstellar') return 100;
        
        const nextLevelIndex = loyaltyLevels.findIndex(level => level.name === currentLevel.name) + 1;
        if (nextLevelIndex >= loyaltyLevels.length) return 100;
        
        const nextLevel = loyaltyLevels[nextLevelIndex];
        const totalPointsInLevel = nextLevel.min - currentLevel.min;
        const pointsEarnedInLevel = points - currentLevel.min;
        
        return Math.min(Math.round((pointsEarnedInLevel / totalPointsInLevel) * 100), 100);
    };

    const progress = calculateProgress();

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
            <Grid container spacing={4}>
                {/* Tarjeta de perfil */}
                <Grid item xs={12} md={4}>
                    <Card sx={{ 
                        bgcolor: '#1a1f2e', 
                        height: '100%',
                        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
                        borderRadius: 3
                    }}>
                        <CardContent sx={{ p: 3 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                                    Mi Perfil
                                </Typography>
                                <Button 
                                    variant="outlined" 
                                    size="small" 
                                    startIcon={<LogoutIcon />}
                                    onClick={handleLogout}
                                    sx={{ 
                                        borderColor: '#404759',
                                        color: '#b0b8c8',
                                        '&:hover': {
                                            borderColor: '#7986cb',
                                            backgroundColor: 'rgba(121, 134, 203, 0.1)'
                                        }
                                    }}
                                >
                                    Salir
                                </Button>
                            </Box>
                            
                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
                                <Avatar 
                                    sx={{ 
                                        width: 100, 
                                        height: 100, 
                                        bgcolor: displayHighestLevel.color,
                                        fontSize: '2.5rem',
                                        mb: 2,
                                        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)'
                                    }}
                                >
                                    {displayHighestLevel.icon}
                                </Avatar>
                                <Typography variant="h5" sx={{ fontWeight: 'bold', textAlign: 'center' }}>
                                    {customerData.name}
                                </Typography>
                                <Box sx={{ 
                                    display: 'inline-block',
                                    px: 2,
                                    py: 0.5,
                                    mt: 1,
                                    bgcolor: 'rgba(121, 134, 203, 0.2)',
                                    borderRadius: 2,
                                    border: `1px solid ${displayHighestLevel.color}`
                                }}>
                                    <Typography variant="body2" sx={{ color: displayHighestLevel.color, fontWeight: 'medium' }}>
                                        {displayHighestLevel.name}
                                    </Typography>
                                </Box>
                            </Box>
                            
                            <Divider sx={{ my: 2, borderColor: '#404759' }} />
                            
                            <Box sx={{ mb: 2 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                                    <PersonIcon sx={{ color: '#7986cb', mr: 1.5 }} />
                                    <Typography variant="body1">
                                        {customerData.name}
                                    </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                                    <EmailIcon sx={{ color: '#7986cb', mr: 1.5 }} />
                                    <Typography variant="body1">
                                        {customerData.email}
                                    </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                                    <PhoneIcon sx={{ color: '#7986cb', mr: 1.5 }} />
                                    <Typography variant="body1">
                                        {customerData.phone}
                                    </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    <QrCodeIcon sx={{ color: '#7986cb', mr: 1.5 }} />
                                    <Typography variant="body1">
                                        {customerData.customer_code || customerData.code}
                                    </Typography>
                                </Box>
                            </Box>
                            
                            <Button
                                fullWidth
                                variant="contained"
                                startIcon={<RefreshIcon />}
                                disabled={refreshing}
                                onClick={handleRefresh}
                                sx={{ 
                                    mt: 2,
                                    background: 'linear-gradient(45deg, #7e57c2, #5c6bc0)',
                                    '&:hover': {
                                        background: 'linear-gradient(45deg, #9575cd, #7986cb)'
                                    }
                                }}
                            >
                                {refreshing ? 'Actualizando...' : 'Actualizar datos'}
                            </Button>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Tarjeta de puntos y nivel */}
                <Grid item xs={12} md={8}>
                    <Grid container spacing={3}>
                        <Grid item xs={12}>
                            <Card sx={{ 
                                bgcolor: '#1a1f2e',
                                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
                                borderRadius: 3
                            }}>
                                <CardContent sx={{ p: 3 }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                                        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                                            Mis Space Points
                                        </Typography>
                                        <Box sx={{ 
                                            display: 'flex', 
                                            alignItems: 'center',
                                            px: 2,
                                            py: 0.5,
                                            bgcolor: 'rgba(121, 134, 203, 0.2)',
                                            borderRadius: 2,
                                            border: '1px solid #7986cb'
                                        }}>
                                            <StarIcon sx={{ color: '#ffd700', mr: 1 }} />
                                            <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#ffd700' }}>
                                                {points}
                                            </Typography>
                                        </Box>
                                    </Box>
                                    
                                    <Box sx={{ mb: 4 }}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                            <Typography variant="body2" sx={{ color: '#b0b8c8' }}>
                                                Nivel actual: <span style={{ color: currentLevel.color, fontWeight: 'bold' }}>{currentLevel.name}</span>
                                            </Typography>
                                            {currentLevel.name !== 'Interstellar' && (
                                                <Typography variant="body2" sx={{ color: '#b0b8c8' }}>
                                                    {progress}% completado
                                                </Typography>
                                            )}
                                        </Box>
                                        <LinearProgress 
                                            variant="determinate" 
                                            value={progress} 
                                            sx={{ 
                                                height: 10, 
                                                borderRadius: 5,
                                                bgcolor: '#141821',
                                                '& .MuiLinearProgress-bar': {
                                                    background: `linear-gradient(to right, ${currentLevel.color}, ${
                                                        currentLevel.name === 'Interstellar' 
                                                            ? '#e040fb' 
                                                            : loyaltyLevels[loyaltyLevels.findIndex(l => l.name === currentLevel.name) + 1].color
                                                    })`
                                                }
                                            }} 
                                        />
                                    </Box>
                                    
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                                        {loyaltyLevels.map((level, index) => (
                                            <Box 
                                                key={level.name}
                                                sx={{ 
                                                    display: 'flex', 
                                                    flexDirection: 'column', 
                                                    alignItems: 'center',
                                                    opacity: loyaltyLevels.findIndex(l => l.name === currentLevel.name) >= index ? 1 : 0.5
                                                }}
                                            >
                                                <Avatar 
                                                    sx={{ 
                                                        width: 40, 
                                                        height: 40, 
                                                        bgcolor: level.color,
                                                        fontSize: '1rem',
                                                        mb: 1
                                                    }}
                                                >
                                                    {level.icon}
                                                </Avatar>
                                                <Typography 
                                                    variant="caption" 
                                                    sx={{ 
                                                        textAlign: 'center',
                                                        fontWeight: currentLevel.name === level.name ? 'bold' : 'normal',
                                                        color: currentLevel.name === level.name ? level.color : '#b0b8c8'
                                                    }}
                                                >
                                                    {level.name}
                                                </Typography>
                                            </Box>
                                        ))}
                                    </Box>
                                    
                                    <Divider sx={{ my: 3, borderColor: '#404759' }} />
                                    
                                    <Typography variant="h6" sx={{ mb: 2, fontWeight: 'medium' }}>
                                        Beneficios de tu nivel
                                    </Typography>
                                    
                                    <Grid container spacing={2}>
                                        {currentLevel.name === 'Cadete Espacial' && (
                                            <>
                                                <Grid item xs={12} sm={6}>
                                                    <Box sx={{ p: 2, bgcolor: '#141821', borderRadius: 2, height: '100%' }}>
                                                        <Typography variant="subtitle1" sx={{ fontWeight: 'medium', mb: 1 }}>
                                                            🚀 Bienvenida Espacial
                                                        </Typography>
                                                        <Typography variant="body2" sx={{ color: '#b0b8c8' }}>
                                                            10 Space Points de bienvenida
                                                        </Typography>
                                                    </Box>
                                                </Grid>
                                                <Grid item xs={12} sm={6}>
                                                    <Box sx={{ p: 2, bgcolor: '#141821', borderRadius: 2, height: '100%' }}>
                                                        <Typography variant="subtitle1" sx={{ fontWeight: 'medium', mb: 1 }}>
                                                            🎁 Acumulación Básica
                                                        </Typography>
                                                        <Typography variant="body2" sx={{ color: '#b0b8c8' }}>
                                                            2% del valor de tus compras en Space Points
                                                        </Typography>
                                                    </Box>
                                                </Grid>
                                            </>
                                        )}

                                        {currentLevel.name === 'Piloto Lunar' && (
                                            <>
                                                <Grid item xs={12} sm={6}>
                                                    <Box sx={{ p: 2, bgcolor: '#141821', borderRadius: 2, height: '100%' }}>
                                                        <Typography variant="subtitle1" sx={{ fontWeight: 'medium', mb: 1 }}>
                                                            🌙 Descuento Lunar
                                                        </Typography>
                                                        <Typography variant="body2" sx={{ color: '#b0b8c8' }}>
                                                            5% de descuento en tu próxima compra
                                                        </Typography>
                                                    </Box>
                                                </Grid>
                                                <Grid item xs={12} sm={6}>
                                                    <Box sx={{ p: 2, bgcolor: '#141821', borderRadius: 2, height: '100%' }}>
                                                        <Typography variant="subtitle1" sx={{ fontWeight: 'medium', mb: 1 }}>
                                                            🎁 Acumulación Mejorada
                                                        </Typography>
                                                        <Typography variant="body2" sx={{ color: '#b0b8c8' }}>
                                                            3% del valor de tus compras en Space Points
                                                        </Typography>
                                                    </Box>
                                                </Grid>
                                            </>
                                        )}

                                        {currentLevel.name === 'Comandante Galáctico' && (
                                            <>
                                                <Grid item xs={12} sm={6}>
                                                    <Box sx={{ p: 2, bgcolor: '#141821', borderRadius: 2, height: '100%' }}>
                                                        <Typography variant="subtitle1" sx={{ fontWeight: 'medium', mb: 1 }}>
                                                            🪐 Descuento Galáctico
                                                        </Typography>
                                                        <Typography variant="body2" sx={{ color: '#b0b8c8' }}>
                                                            10% de descuento en toda la tienda
                                                        </Typography>
                                                    </Box>
                                                </Grid>
                                                <Grid item xs={12} sm={6}>
                                                    <Box sx={{ p: 2, bgcolor: '#141821', borderRadius: 2, height: '100%' }}>
                                                        <Typography variant="subtitle1" sx={{ fontWeight: 'medium', mb: 1 }}>
                                                            🎁 Acumulación Superior
                                                        </Typography>
                                                        <Typography variant="body2" sx={{ color: '#b0b8c8' }}>
                                                            4% del valor de tus compras en Space Points
                                                        </Typography>
                                                    </Box>
                                                </Grid>
                                                <Grid item xs={12} sm={6}>
                                                    <Box sx={{ p: 2, bgcolor: '#141821', borderRadius: 2, height: '100%' }}>
                                                        <Typography variant="subtitle1" sx={{ fontWeight: 'medium', mb: 1 }}>
                                                            🎯 Promociones Exclusivas
                                                        </Typography>
                                                        <Typography variant="body2" sx={{ color: '#b0b8c8' }}>
                                                            Acceso a ofertas especiales
                                                        </Typography>
                                                    </Box>
                                                </Grid>
                                            </>
                                        )}

                                        {currentLevel.name === 'Interstellar' && (
                                            <>
                                                <Grid item xs={12} sm={6}>
                                                    <Box sx={{ p: 2, bgcolor: '#141821', borderRadius: 2, height: '100%' }}>
                                                        <Typography variant="subtitle1" sx={{ fontWeight: 'medium', mb: 1 }}>
                                                            ✨ Servicio VIP
                                                        </Typography>
                                                        <Typography variant="body2" sx={{ color: '#b0b8c8' }}>
                                                            Atención personalizada y envío gratuito
                                                        </Typography>
                                                    </Box>
                                                </Grid>
                                                <Grid item xs={12} sm={6}>
                                                    <Box sx={{ p: 2, bgcolor: '#141821', borderRadius: 2, height: '100%' }}>
                                                        <Typography variant="subtitle1" sx={{ fontWeight: 'medium', mb: 1 }}>
                                                            🎁 Acumulación Estelar
                                                        </Typography>
                                                        <Typography variant="body2" sx={{ color: '#b0b8c8' }}>
                                                            5% del valor de tus compras en Space Points
                                                        </Typography>
                                                    </Box>
                                                </Grid>
                                                <Grid item xs={12} sm={6}>
                                                    <Box sx={{ p: 2, bgcolor: '#141821', borderRadius: 2, height: '100%' }}>
                                                        <Typography variant="subtitle1" sx={{ fontWeight: 'medium', mb: 1 }}>
                                                            💎 Descuento Interstellar
                                                        </Typography>
                                                        <Typography variant="body2" sx={{ color: '#b0b8c8' }}>
                                                            15% de descuento en toda la tienda
                                                        </Typography>
                                                    </Box>
                                                </Grid>
                                                <Grid item xs={12} sm={6}>
                                                    <Box sx={{ p: 2, bgcolor: '#141821', borderRadius: 2, height: '100%' }}>
                                                        <Typography variant="subtitle1" sx={{ fontWeight: 'medium', mb: 1 }}>
                                                            🎉 Eventos Exclusivos
                                                        </Typography>
                                                        <Typography variant="body2" sx={{ color: '#b0b8c8' }}>
                                                            Invitaciones a eventos y lanzamientos especiales
                                                        </Typography>
                                                    </Box>
                                                </Grid>
                                            </>
                                        )}
                                    </Grid>
                                </CardContent>
                            </Card>
                        </Grid>
                    </Grid>
                </Grid>
            </Grid>

            <Snackbar
                open={showSnackbar}
                autoHideDuration={6000}
                onClose={() => setShowSnackbar(false)}
            >
                <Alert
                    onClose={() => setShowSnackbar(false)}
                    severity={error ? "error" : "success"}
                >
                    {error || "Datos actualizados correctamente"}
                </Alert>
            </Snackbar>
        </Container>
    );
};

export default Dashboard;
