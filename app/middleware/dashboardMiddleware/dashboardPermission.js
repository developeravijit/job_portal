const permission = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.redirect("/dashboard/login");
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).render("403", {
        error: "Access Denied",
      });
    }

    next();
  };
};

module.exports = permission;
