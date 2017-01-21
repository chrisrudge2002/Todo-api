module.exports = function(db) {
	return {
		requireAuthentication: function(req, res, next) {
			const token = req.get('Auth');

			db.user.findByToken(token).then(function(user) {
				req.user = user;
				next();
			}, function(e) {
				res.status(401).send();
			});
		}
	};
};