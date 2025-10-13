const jwt = require('jsonwebtoken')

const adminNavChange = (req, res, next) => {

    if (req.cookies.clientToken) {
        try {
            const data = jwt.verify(req.cookies.clientToken, "clientlogineuieioewhre");
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

module.exports = adminNavChange