const path = require('path');
const express = require('express');
const app = express();
const publicPath = path.join(__dirname, '..', 'build');
const port = process.env.PORT || 5000;

app.use(express.static(publicPath));

app.get('*', (req, res) => {
   res.sendFile(path.join(publicPath, 'index.html'));
});

app.listen(port, () => {
   console.log('Server is up!');
});

function requireHTTPS(req, res, next) {
   // The 'x-forwarded-proto' check is for Heroku
   if (!req.secure && req.get('x-forwarded-proto') !== 'https' && process.env.NODE_ENV !== "development") {
     return res.redirect('https://' + req.get('host') + req.url);
   }
   next();
 }

 app.use(requireHTTPS);