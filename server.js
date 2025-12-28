const express = require('express');
const http = require('http');
const socketInit = require('./socket')
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();
const app = express();
const server = http.createServer(app);
app.use(cors());
app.use(bodyParser.json());

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
});


mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.log(err));

app.get('/', (req, res) => {
  res.send('Chat server is running');
});

app.use('/api/auth', require('./routes/auth'));
app.use('/api/chats', require('./routes/chats'));

socketInit(server)

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log('Server running on port 3000')
})
