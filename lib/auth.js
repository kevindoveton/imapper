var exports = module.exports = {};

exports.authenticate = function(opts, callback) {
	var loginStatus = null;
	// console.log("User logging in");
	// console.log(opts);
	// { username: 'user', password: 'password', method: 'LOGIN' }

	// insert login logic here
	callback(loginStatus, null)
}