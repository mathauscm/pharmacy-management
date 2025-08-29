// ...existing code...
// Middleware de logger
function logger(req, res, next) {
  console.log(`${req.method} ${req.url}`);
  next();
}
module.exports = logger;
// ...existing code...
