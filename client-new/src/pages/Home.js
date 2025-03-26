import React from 'react';
import { Container, Typography, Button, Box, Grid, Card, CardContent, CardMedia } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const Home = () => {
    const navigate = useNavigate();

    const features = [
        {
            icon: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/rare-candy.png',
            title: 'Gana Puntos',
            description: 'Acumula PokéPuntos con cada compra y canjéalos por cartas exclusivas.'
        },
        {
            icon: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/master-ball.png',
            title: 'Cartas Exclusivas',
            description: 'Accede a cartas Pokémon especiales y ediciones limitadas.'
        },
        {
            icon: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/lucky-egg.png',
            title: 'Beneficios Especiales',
            description: 'Obtén descuentos y promociones exclusivas para miembros.'
        }
    ];

    const featuredCards = [
        {
            image: 'https://assets.pokemon.com/assets/cms2/img/cards/web/SM10/SM10_EN_226.png',
            name: 'Charizard GX',
            rarity: 'Ultra Rara',
            points: 5000
        },
        {
            image: 'https://assets.pokemon.com/assets/cms2/img/cards/web/SWSH4/SWSH4_EN_188.png',
            name: 'Pikachu VMAX',
            rarity: 'Secreta Rara',
            points: 4500
        },
        {
            image: 'https://assets.pokemon.com/assets/cms2/img/cards/web/SV01/SV01_EN_198.png',
            name: 'Mewtwo V',
            rarity: 'Full Art',
            points: 3500
        }
    ];

    return (
        <Box sx={{ width: '100%', overflow: 'hidden' }}>
            {/* Hero Section */}
            <Box
                sx={{
                    background: 'linear-gradient(135deg, #4B8BF4 0%, #2B4582 100%)',
                    minHeight: '80vh',
                    display: 'flex',
                    alignItems: 'center',
                    color: 'white',
                    py: 8
                }}
            >
                <Container>
                    <Grid container spacing={4} alignItems="center">
                        <Grid item xs={12} md={6}>
                            <Typography variant="h2" component="h1" sx={{ fontWeight: 700, mb: 3 }}>
                                PokéPuntos
                            </Typography>
                            <Typography variant="h5" sx={{ mb: 4, opacity: 0.9 }}>
                                Colecciona, gana y canjea PokéPuntos por cartas Pokémon exclusivas. 
                                ¡Conviértete en el mejor entrenador!
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 2 }}>
                                <Button
                                    variant="contained"
                                    size="large"
                                    onClick={() => navigate('/register')}
                                    sx={{
                                        bgcolor: '#2B4582',
                                        '&:hover': { bgcolor: '#1a2f5c' }
                                    }}
                                >
                                    Comenzar Ahora
                                </Button>
                                <Button
                                    variant="outlined"
                                    size="large"
                                    onClick={() => navigate('/scan')}
                                    sx={{
                                        color: 'white',
                                        borderColor: 'white',
                                        '&:hover': {
                                            borderColor: 'white',
                                            bgcolor: 'rgba(255,255,255,0.1)'
                                        }
                                    }}
                                >
                                    Escanear QR
                                </Button>
                            </Box>
                        </Grid>
                        <Grid item xs={12} md={6} sx={{ display: 'flex', justifyContent: 'center' }}>
                            <Box
                                component="img"
                                src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/25.png"
                                alt="Pikachu"
                                sx={{
                                    width: '400px',
                                    height: 'auto',
                                    animation: 'float 3s ease-in-out infinite',
                                    '@keyframes float': {
                                        '0%': { transform: 'translateY(0px)' },
                                        '50%': { transform: 'translateY(-20px)' },
                                        '100%': { transform: 'translateY(0px)' }
                                    }
                                }}
                            />
                        </Grid>
                    </Grid>
                </Container>
            </Box>

            {/* Features Section */}
            <Container sx={{ py: 8 }}>
                <Typography variant="h3" component="h2" textAlign="center" sx={{ mb: 6 }}>
                    Características
                </Typography>
                <Grid container spacing={4}>
                    {features.map((feature, index) => (
                        <Grid item xs={12} md={4} key={index}>
                            <Card 
                                sx={{ 
                                    height: '100%',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    p: 3,
                                    borderRadius: 2,
                                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                                }}
                            >
                                <Box
                                    component="img"
                                    src={feature.icon}
                                    alt={feature.title}
                                    sx={{ width: 48, height: 48, mb: 2 }}
                                />
                                <Typography variant="h5" component="h3" sx={{ mb: 2 }}>
                                    {feature.title}
                                </Typography>
                                <Typography variant="body1" color="text.secondary" textAlign="center">
                                    {feature.description}
                                </Typography>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            </Container>

            {/* Featured Cards Section */}
            <Box sx={{ bgcolor: 'grey.100', py: 8 }}>
                <Container>
                    <Typography variant="h3" component="h2" textAlign="center" sx={{ mb: 6 }}>
                        Cartas Destacadas
                    </Typography>
                    <Grid container spacing={4}>
                        {featuredCards.map((card, index) => (
                            <Grid item xs={12} sm={6} md={4} key={index}>
                                <Card 
                                    sx={{ 
                                        height: '100%',
                                        transition: 'transform 0.3s ease',
                                        '&:hover': {
                                            transform: 'translateY(-5px)'
                                        }
                                    }}
                                >
                                    <CardMedia
                                        component="img"
                                        image={card.image}
                                        alt={card.name}
                                        sx={{ height: 300, objectFit: 'contain' }}
                                    />
                                    <CardContent>
                                        <Typography variant="h6" gutterBottom>
                                            {card.name}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            Rareza: {card.rarity}
                                        </Typography>
                                        <Typography variant="body2" color="primary" sx={{ fontWeight: 'bold' }}>
                                            {card.points} PokéPuntos
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
                </Container>
            </Box>
        </Box>
    );
};

export default Home;
