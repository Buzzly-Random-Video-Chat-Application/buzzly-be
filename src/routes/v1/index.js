const express = require('express');
const authRoute = require('./auth.route');
const userRoute = require('./user.route');
const socketRoute = require('./socket.route');
const reviewRoute = require('./review.route');
const docsRoute = require('./docs.route');

const router = express.Router();

const defaultRoutes = [
  { path: '/auth', route: authRoute },
  { path: '/users', route: userRoute },
  { path: '/socket', route: socketRoute },
  { path: '/reviews', route: reviewRoute },
  { path: '/docs', route: docsRoute },
];

defaultRoutes.forEach((route) => {
  router.use(route.path, route.route);
});

module.exports = router;