const { verifyToken } = require("../services/authService");

// ==========================================
// AUTHENTICATE - Verify JWT Token
// ==========================================

const authenticate = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: "Authorization token is required"
            });
        }

        const token = authHeader.split(' ')[1];
        const { valid, decoded, error } = verifyToken(token);

        if (!valid || !decoded) {
            return res.status(401).json({
                success: false,
                message: "Invalid or expired token",
                error: error
            });
        }

        req.employee = decoded;
        req.employeeId = decoded.id;
        req.employeeRole = decoded.role;

        next();
    } catch (error) {
        console.error("Authentication error:", error);
        return res.status(401).json({
            success: false,
            message: "Authentication failed",
            error: error.message
        });
    }
};

// ==========================================
// AUTHORIZE - Check Role
// ==========================================

const authorize = (...allowedRoles) => {
    return (req, res, next) => {
        try {
            const employeeRole = req.employeeRole;

            if (!employeeRole) {
                return res.status(403).json({
                    success: false,
                    message: "No role found for this employee"
                });
            }

            if (!allowedRoles.includes(employeeRole)) {
                return res.status(403).json({
                    success: false,
                    message: `Insufficient permissions. Required roles: ${allowedRoles.join(', ')}`
                });
            }

            next();
        } catch (error) {
            console.error("Authorization error:", error);
            return res.status(403).json({
                success: false,
                message: "Authorization failed",
                error: error.message
            });
        }
    };
};

// ==========================================
// IS OWN PROFILE
// ==========================================

const isOwnProfile = (req, res, next) => {
    try {
        const requestedEmployeeId = req.params.id;
        const loggedInEmployeeId = req.employeeId;
        const employeeRole = req.employeeRole;

        if (employeeRole === 'admin') {
            return next();
        }

        if (requestedEmployeeId !== loggedInEmployeeId) {
            return res.status(403).json({
                success: false,
                message: "You can only access your own profile"
            });
        }

        next();
    } catch (error) {
        console.error("Profile access error:", error);
        return res.status(403).json({
            success: false,
            message: "Access denied",
            error: error.message
        });
    }
};

module.exports = {
    authenticate,
    authorize,
    isOwnProfile
};