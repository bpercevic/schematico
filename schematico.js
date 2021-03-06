var UserController = require("./controllers/user");
var RouteController = require("./controllers/route");
var express = require("express");
var stylus = require("stylus");
var util = require("./controllers/util");
var bodyParser = require("body-parser");
var scheduler = require("node-schedule");
var app = express();
var env = process.env.NODE_ENV || 'development';
if ('development' == env) {
	app.set("views", __dirname + "/views");
	app.set("view engine", "jade");
	app.use(bodyParser.json({type:"application/json"}));
	app.use(stylus.middleware({
		compress : true,
		src : __dirname + "/public",
		dest : __dirname + "/public"
	}));
	app.use(express.static(__dirname + "/public"));
	app.use(function(error, req, res, next) {
		if (error instanceof SyntaxError) {
			res.send(400, "JSON syntax error. Maybe you're missing quotes around the keys?");
		} else {
			next();
		}
	});
}
util.connectToMongoDB("localhost", "alpha");

// Static Pages //
var numberOfVisitors = 0;
app.get("/", function(req, res) {
	var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
	var time = new Date();
	numberOfVisitors++;
	console.log(numberOfVisitors+" visits - "+time.toDateString()+" - "+ip);
	res.render("index");
});

// Parameter Middleware //
app.param("username", function(req, res, next, id) {
	// console.log("param: username."); = the key
	// console.log("id: ", id); = the actual value
	next();
});

/**
	Sign up for an account
	@param body 	email, username, password
 */
app.post("/signup",				UserController.CheckIfEmailExists,
								UserController.CheckIfUsernameExists,
								UserController.CreateNewUser);

/**
	Get your token back by authing email and password
	@param username		person's username
 */
app.post("/recover",			UserController.Authenticate,
								UserController.RecoverToken);

/**
	Get all routes as strings
	@param username		person's username
 */
app.get("/:username/routes",	UserController.UserForUsername,
								RouteController.GetRoutes);

/**
	Delete a route
	@param username		person's username
	@query token 		token required to make API calls
 */
app.delete("/:username/:route",	UserController.UserForUsername,
								UserController.ValidateTokenInQuery,
								RouteController.DeleteRoute);

/**
	Delete a username
	@param username		person's username
	@param body 		person's email and password as body
	@query token 		token required to make API calls
 */
app.post("/:username",			UserController.UserForUsername,
								UserController.ValidateTokenInQuery,
								UserController.Authenticate,
								UserController.DestroyByToken);

/**
	Get random data for a route
	@param username		person's username
	@query token 		token required to make API calls
	@query count 		(optional) how many model objects you want back
 */
app.get("/:username/:route",	UserController.UserForUsername,
								UserController.ValidateTokenInQuery,
								UserController.CheckRequestCountLimit,
								RouteController.GetRoute,
								UserController.IncrementRequestCount,
								RouteController.PopulateModel);

/**
	Create a new route and schema
	@param username		person's username
	@query token 		token required to make API calls
	@body  model 		the model for this route
 */
app.post("/:username/:route",	UserController.UserForUsername,
								UserController.ValidateTokenInQuery,
								RouteController.CheckIfRouteExists,
								RouteController.CreateRoute);

/**
	Update a route with a new schema
	@param username		person's username
	@query token 		token required to make API calls
	@body  model 		the new model for this route
 */
app.put("/:username/:route",	UserController.UserForUsername,
								UserController.ValidateTokenInQuery,
								RouteController.UpdateRoute);

app.listen(5000);

exports.app = app;
exports.UserController = UserController;
exports.RouteController = RouteController;
