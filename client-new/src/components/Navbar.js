import React from 'react';
import { AppBar, Toolbar, Typography, Button } from '@mui/material';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function Navbar() {
    const { user } = useAuth();

    return (
        <AppBar position="static">
            <Toolbar>
                <Typography variant="h6" component={Link} to="/" style={{ flexGrow: 1, textDecoration: 'none', color: 'inherit' }}>
                    PokéPuntos
                </Typography>
                {!user ? (
                    <Button color="inherit" component={Link} to="/register">
                        Registrarse
                    </Button>
                ) : (
                    <Typography variant="subtitle1">
                        {user.name}
                    </Typography>
                )}
            </Toolbar>
        </AppBar>
    );
}

export default Navbar;