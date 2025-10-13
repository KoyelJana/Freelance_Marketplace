module.exports = function requireLogin(req, res, next) {
    if (!req.session.freelancer) {
        // If not logged in, redirect to login page
        req.flash('message', 'Please log in to continue');
        return res.redirect('/login');
    }
    next();
};