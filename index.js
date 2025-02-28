require('app-module-path').addPath(__dirname);

const express = require('express');

const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config({ path: `./env/.env.${process.env.NODE_ENV}` });
const { Logger } = require('@mvp-rockets/namma-lib');
const config = require('config/config');

const loggerParams = {
    environment: config.env,
    type: config.logType,
    clsNameSpace: config.clsNameSpace,
}

if (config.logType === 'aws') {
    loggerParams.isEnable = config.serviceProviderConfig.awsCloudwatch.enableAwsLogger;
    loggerParams.configurations = {
        region: config.serviceProviderConfig.awsCloudwatch.region,
        accessKeyId: config.serviceProviderConfig.awsCloudwatch.accessKeyId,
        secretKey: config.serviceProviderConfig.awsCloudwatch.secretKey,
        logGroupName: config.serviceProviderConfig.awsCloudwatch.logGroupName,
        logStreamName: config.serviceProviderConfig.awsCloudwatch.logStreamName
    }
} else if (config.logType === 'gcp') {
    loggerParams.type = 'google';
    loggerParams.isEnable = config.serviceProviderConfig.gcp.enableGcpLogger;
    loggerParams.configurations = {
        project: config.serviceProviderConfig.gcp.projectName,
        keyFile: config.serviceProviderConfig.gcp.keyFile,
        logStreamName: config.serviceProviderConfig.gcp.logStreamName
    }
}

Logger.initialize(loggerParams);

const cls = require('cls-hooked');

const { token } = require('@mvp-rockets/namma-lib');

token.initialize(config.jwtSecretKey);

const { ApiError } = require('lib');
const { logError, logInfo } = require('lib');
const { HTTP_CONSTANT } = require('@mvp-rockets/namma-lib');

const app = express();
const server = require('http').createServer(app);
const Route = require('route');
const uuid = require('uuid');
const helmet = require("helmet");
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
    const namespace = cls.getNamespace(config.clsNameSpace);
    const platform = req.headers['x-platform'] || 'unknown-platform';
    namespace.run(() => {
        namespace.set('traceId', uuid.v4());
        logInfo(`${req.method} ${req.originalUrl}`, { ...req.body, platform });
        next();
    });
});

Route.setApp(app);

const allowedOrigins = config.cors.whiteListOrigins;
const allowedOriginsRegularExpression = allowedOrigins.map((origin) => new RegExp(`${origin}$`));
app.use(cors({ origin: allowedOriginsRegularExpression }));
app.use(helmet());
app.disable('x-powered-by');

// HealthCheck endpoints
const healthCheckApi = require('resources/health-check-api');
const healthCheckDbAPi = require('resources/health-check-db-api');

app.get('/health-check-api', healthCheckApi);
app.get('/health-check-db', healthCheckDbAPi);

require('./api-routes');

app.use((req, res, next) => {
    const err = new ApiError('Not Found', 'Resource Not Found!', HTTP_CONSTANT.NOT_FOUND);
    next(err);
});

app.use((error, request, response, next) => {
    const platform = request.headers['x-platform'] || 'unknown-platform';
    if (error.constructor === ApiError) {
        logError('Failed to execute the operation', {
            value: error.error,
            stack: error.error ? error.error.stack : [],
            platform
        });
        if (error.code) { response.status(error.code); }
        response.send({
            status: false,
            message: error.errorMessage
        });
    } else {
        response.status(501);
        logError('Failed to execute the operation', { value: error, stack: error.stack, platform });
        response.send({
            status: false,
            errorType: 'unhandled',
            message: 'Something went wrong!'
        });
    }
});

process.on('unhandledRejection', (error) => {
    console.log(error);
    logError('unhandledRejection', { error });
});

process.on('uncaughtException', (error) => {
    console.log(error);
    logError('uncaughtException', { error });
});

process.on('SIGTERM', () => {
    logInfo('SIGTERM signal received: closing HTTP server');
    server.close(() => {
        logInfo('HTTP server closed');
    });
});

server.listen(config.apiPort, () => {
    console.log(`Express server listening on Port :- ${config.apiPort}`);
});
