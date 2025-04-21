const allRoles = {
  user: [ 'get', 'delete', 'update'],
  admin: ['manage', 'get', 'delete', 'update'],
};

const roles = Object.keys(allRoles);
const roleRights = new Map(Object.entries(allRoles));

module.exports = {
  roles,
  roleRights,
};
