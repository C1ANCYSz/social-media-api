const express = require('express');

const router = express.Router();
router.get('/', (req, res) => {
  res.send('me');
});

router.get('/conversations', (req, res) => {
  res.send('my conversations');
});

router.get('/following', (req, res) => {
  res.send('people I follow');
});

router.get('/followers', (req, res) => {
  res.send('people following me');
});
router.get('/posts', (req, res) => {
  res.send('people following me');
});

router.get('/update-profile', (req, res) => {
  res.send('update profile');
});

module.exports = router;
