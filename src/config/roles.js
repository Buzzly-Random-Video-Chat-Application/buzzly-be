const allRoles = {
  user: [ 'updateUser', 'deleteUser', 'createReview', 'updateReview', 'deleteReview', 'getAppRating'],
  admin: ['getUsers', 'manageUsers','updateUser', 'deleteUser', 'createReview', 'updateReview', 'deleteReview', 'getAppRating'],
};

const roles = Object.keys(allRoles);
const roleRights = new Map(Object.entries(allRoles));

module.exports = {
  roles,
  roleRights,
};
