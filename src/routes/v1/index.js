const express = require('express');

const authRoute = require('./auth.route');
const userRoute = require('./user.route');
const socketRoute = require('./socket.route');
const reviewRoute = require('./review.route');
const docsRoute = require('./docs.route');
const blogRoute = require('./blog.route');
const feedbackRoute = require('./feedback.route');

const config = require('../../config/config');

const router = express.Router();

const defaultRoutes = [
  { path: '/auth', route: authRoute },
  { path: '/users', route: userRoute },
  { path: '/socket', route: socketRoute },
  { path: '/reviews', route: reviewRoute },
  { path: '/blogs', route: blogRoute },
  { path: '/feedbacks', route: feedbackRoute },  
];

const devRoutes = [
  { path: '/docs', route: docsRoute },
];

defaultRoutes.forEach((route) => {
  router.use(route.path, route.route);
});

if (config.env === 'development') {
  devRoutes.forEach((route) => {
    router.use(route.path, route.route);
  });
}

module.exports = router;