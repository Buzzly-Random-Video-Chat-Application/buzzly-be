const { User, Connection, Review, Livestream } = require('../models');

/**
 * Get user statistics with percentage change compared to last week
 * @returns {Promise<Object>}
 */
const getUserStatistics = async () => {
  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const totalUsersCurrent = await User.countDocuments();
  const maleUsersCurrent = await User.countDocuments({ gender: 'male' });
  const femaleUsersCurrent = await User.countDocuments({ gender: 'female' });
  const otherUsersCurrent = await User.countDocuments({ gender: 'other' });

  const totalUsersPrevious = await User.countDocuments({ createdAt: { $lte: oneWeekAgo } });
  const maleUsersPrevious = await User.countDocuments({ gender: 'male', createdAt: { $lte: oneWeekAgo } });
  const femaleUsersPrevious = await User.countDocuments({ gender: 'female', createdAt: { $lte: oneWeekAgo } });
  const otherUsersPrevious = await User.countDocuments({ gender: 'other', createdAt: { $lte: oneWeekAgo } });

  const calculatePercentageChange = (current, previous) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  return {
    total: {
      quantity: totalUsersCurrent,
      percentage: calculatePercentageChange(totalUsersCurrent, totalUsersPrevious).toFixed(2),
    },
    male: {
      quantity: maleUsersCurrent,
      percentage: calculatePercentageChange(maleUsersCurrent, maleUsersPrevious).toFixed(2),
    },
    female: {
      quantity: femaleUsersCurrent,
      percentage: calculatePercentageChange(femaleUsersCurrent, femaleUsersPrevious).toFixed(2),
    },
    other: {
      quantity: otherUsersCurrent,
      percentage: calculatePercentageChange(otherUsersCurrent, otherUsersPrevious).toFixed(2),
    },
  };
};

/**
 * Get connection statistics
 * @returns {Promise<Object>}
 */
const getConnectionStatistics = async () => {
  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const totalConnections = await Connection.countDocuments();
  const liveConnections = await Connection.countDocuments({ isLive: true });

  const totalConnectionsPrevious = await Connection.countDocuments({ createdAt: { $lte: oneWeekAgo } });
  const liveConnectionsPrevious = await Connection.countDocuments({ isLive: true, createdAt: { $lte: oneWeekAgo } });

  const calculatePercentageChange = (current, previous) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  return {
    total: {
      quantity: totalConnections,
      percentage: calculatePercentageChange(totalConnections, totalConnectionsPrevious).toFixed(2),
    },
    live: {
      quantity: liveConnections,
      percentage: calculatePercentageChange(liveConnections, liveConnectionsPrevious).toFixed(2),
    },
  };
};

/**
 * Get weekly statistics for connections
 * @returns {Promise<Object>}
 */
const getWeeklyConnectionStatistics = async () => {
  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const connections = await Connection.aggregate([
    {
      $match: {
        createdAt: { $gte: oneWeekAgo, $lte: now },
      },
    },
    {
      $group: {
        _id: { $dayOfWeek: '$createdAt' },
        count: { $sum: 1 },
      },
    },
    {
      $sort: { _id: 1 },
    },
  ]);

  const labels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  const dayMapping = {
    1: 6,
    2: 0,
    3: 1,
    4: 2,
    5: 3,
    6: 4,
    7: 5,
  };

  const data = new Array(7).fill(0);

  connections.forEach((connection) => {
    const index = dayMapping[connection._id];
    data[index] = connection.count;
  });

  return {
    labels,
    datasets: {
      label: 'Connections',
      data,
    },
  };
};

/**
 * Get review statistics
 * @returns {Promise<Object>}
 */
const getReviewStatistics = async () => {
  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const totalReviews = await Review.countDocuments();
  const negativeReviews = await Review.countDocuments({ rating: { $lte: 2 } });

  const totalReviewsPrevious = await Review.countDocuments({ createdAt: { $lte: oneWeekAgo } });
  const negativeReviewsPrevious = await Review.countDocuments({ rating: { $lte: 2 }, createdAt: { $lte: oneWeekAgo } });

  const calculatePercentageChange = (current, previous) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  return {
    total: {
      quantity: totalReviews,
      percentage: calculatePercentageChange(totalReviews, totalReviewsPrevious).toFixed(2),
    },
    negative: {
      quantity: negativeReviews,
      percentage: calculatePercentageChange(negativeReviews, negativeReviewsPrevious).toFixed(2),
    },
  };
};

/**
 * Get livestream statistics
 * @returns {Promise<Object>}
 */
const getLivestreamStatistics = async () => {
  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const totalLivestreams = await Livestream.countDocuments();
  const liveLivestreams = await Livestream.countDocuments({ isLive: true });

  const totalLivestreamsPrevious = await Livestream.countDocuments({ createdAt: { $lte: oneWeekAgo } });
  const liveLivestreamsPrevious = await Livestream.countDocuments({ isLive: true, createdAt: { $lte: oneWeekAgo } });

  const calculatePercentageChange = (current, previous) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  return {
    total: {
      quantity: totalLivestreams,
      percentage: calculatePercentageChange(totalLivestreams, totalLivestreamsPrevious).toFixed(2),
    },
    live: {
      quantity: liveLivestreams,
      percentage: calculatePercentageChange(liveLivestreams, liveLivestreamsPrevious).toFixed(2),
    },
  };
};

module.exports = {
  getUserStatistics,
  getConnectionStatistics,
  getWeeklyConnectionStatistics,
  getReviewStatistics,
  getLivestreamStatistics,
};
