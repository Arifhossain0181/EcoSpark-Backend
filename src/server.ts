
import express from 'express';
import app from './app';
const bootstrap = async() => {
    try {
       
        app.listen(process.env.PORT, () => {
            console.log(`Server is running on http://localhost:${process.env.PORT}`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
    }
}

bootstrap();