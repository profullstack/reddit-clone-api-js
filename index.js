import {} from 'dotenv/config';
import http from 'http';
import express from 'express';
import logger from 'morgan';
import log from 'debug';
import passport from 'passport';
import cors from 'cors';
import localStrategy from './auth/local';
import jwtStrategy from './auth/jwt';
import routes from './routes';
import './db';

const app = express();
const port = process.env.PORT;

const debug = log('express-starter:server');

app.set('port', port);

// refs: https://stackoverflow.com/q/42009672
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(cors({
  origin: '*',
  optionsSuccessStatus: 200,
}));

passport.use(localStrategy);
passport.use(jwtStrategy);

app.use('/api/1', routes);

const server = http.createServer(app);

server.listen(port, () => debug(`listening on port ${port}`));
