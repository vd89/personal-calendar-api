import express from 'express';
import debug from 'debug';
import cookieParser from 'cookie-parser';
import i18n from 'i18n';
import path from 'path';
import morgan from 'morgan';
import compression from 'compression';
import helmet from 'helmet';
import cors from 'cors';

import appConfig from './appConfig.js';
import { errHandler, headerFunction, notFound, unauthorizedErrors } from './middleware/errorMiddleware.js';
import { extendedRequestMiddleware } from './middleware/middleware.js';
import apiRoutes from './router/index.js';
import { pingRes, testAuth } from './helper/extraHelper.js';


// initial database
import './models/index.js';

const app = express();
const appLog = debug('app:app -> ');
const { availableLocals, defaultLanguage, projectRoot, whiteList } = appConfig;

i18n.configure({
  locales: availableLocals,
  directory: path.join(projectRoot, 'src', 'locals'),
  defaultLocale: defaultLanguage,
});

const corsOptionsDelegate = function(req, callback) {
  let corsOptions;
  if (whiteList.indexOf(req.header('Origin')) !== -1) {
    corsOptions = {
      origin: true,
      credentials: true,
      optionsSuccessStatus: 200,
      methods: ['OPTIONS', 'HEAD', 'GET', 'POST', 'PUT', 'DELETE'],
      allowedHeaders: ['X-Requested-With', 'Content-Type', 'Accept', 'Authorization'],
    };
  } else {
    corsOptions = {
      origin: false,
      credentials: true,
      optionsSuccessStatus: 200,
      methods: ['OPTIONS', 'HEAD', 'GET', 'POST', 'PUT', 'DELETE'],
      allowedHeaders: ['X-Requested-With', 'Content-Type', 'Accept', 'Authorization'],
    };
  }
  callback(null, corsOptions);
};

app.use(i18n.init);
app.use(cookieParser());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined'));
app.use(compression());
app.use(helmet());
app.set('showStackError', true);
app.use('*', cors(corsOptionsDelegate));


app.use(extendedRequestMiddleware);

app.all('*', headerFunction);

app.get('/', testAuth);
app.get('/ping', pingRes);
app.use('/', apiRoutes);

app.use(unauthorizedErrors);
app.use(errHandler);
app.use(notFound);

export default app;
