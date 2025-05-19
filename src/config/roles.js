const allRoles = {
  user: ['get', 'delete', 'update', 'create'],
  admin: ['manage', 'get', 'delete', 'update', 'create'],
};

const roles = Object.keys(allRoles);
const roleRights = new Map(Object.entries(allRoles));

module.exports = {
  roles,
  roleRights,
};
