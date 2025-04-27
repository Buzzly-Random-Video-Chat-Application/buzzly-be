const parseContent = (req, res, next) => {
  if (req.body.content && typeof req.body.content === 'string') {
    try {
      req.body.content = JSON.parse(req.body.content);
    } catch (error) {
      return next(new ApiError(httpStatus.BAD_REQUEST, 'Invalid JSON format in content'));
    }
  }
  next();
};
  
module.exports = parseContent;