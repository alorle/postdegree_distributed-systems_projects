module.exports.randString = (prefix = '') => {
  return prefix + ((prefix.length > 0) ? '_' : '') +
    Math.random().toString(36).substring(2, 15);
};

module.exports.buildClientMsg = (to, from, data) => {
  return JSON.stringify({ to, from, data });
};
