const faceRouter = require('./face')

function route(app) {
    app.use('/api',faceRouter);
}

module.exports = route;