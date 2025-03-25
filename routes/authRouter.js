const express = require('express');

const { signUp, login, logout } = require('../controllers/authControllers');

const router = express.Router();

router.post('/login', login);

router.post('/signup', signUp);

router.post('/logout', logout);

module.exports = router;
