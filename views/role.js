const authenticateRole = (role) => {
    return (req, res, next) => {
        const { result } = req;
        if (result.role !== role) {
            return res.status(403).send('Anda tidak memiliki akses ke halaman ini');
        }
        next();
    };
};

module.exports = {authenticateRole}