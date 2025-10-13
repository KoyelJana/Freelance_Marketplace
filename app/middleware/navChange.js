const jwt = require('jsonwebtoken')

const navChange = (req, res, next) => {

    if (req.cookies.FreelancerToken) {
        try {
            const data = jwt.verify(req.cookies.FreelancerToken, process.env.JWT_TOKEN_SECRET_KEY);
            res.locals.user = data
        }
        catch (err) {
            res.locals.user = null
        }
    } else {
        res.locals.user = null
    }

    next()
}

module.exports = navChange