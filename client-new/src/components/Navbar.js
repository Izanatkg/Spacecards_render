import React from 'react';
import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function Navbar() {
    const { user } = useAuth();

    return (
        <AppBar position="static">
            <Toolbar>
                <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
                    <RocketLaunchIcon sx={{ mr: 1 }} />
                    <Typography 
                        variant="h6" 
                        component="a" 
                        href="https://space-pass-nq9e0cv.gamma.site/" 
                        sx={{ textDecoration: 'none', color: 'inherit' }}
                    >
                        Space Pass
                    </Typography>
                </Box>
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