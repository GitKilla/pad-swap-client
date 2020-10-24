const path = require('path');
const express = require('express');
const app = express();
const publicPath = path.join(__dirname, '..', 'build');
const port = process.env.PORT || 5000;

app.use(express.static(publicPath));

app.get('*', (req, res) => {
   res.redirect('https://' + req.headers.host + req.url);
   res.sendFile(path.join(publicPath, 'index.html'));
});

app.listen(port, () => {
   console.log('Server is up!');
});
