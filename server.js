const bodyParser = require('body-parser');
const express = require('express');
const _ = require('underscore');
const app = express();
const PORT = process.env.PORT || 3000;
const todos = [];
let todoNextId = 1;

// Add middleware
app.use(bodyParser.json());

// Setup the root route
app.get('/', function (req, res) {
	res.send('Todo API root');
});

// GET /todos
app.get('/todos', function (req, res) {
	res.json(todos);
});

// GET /todos/:id
app.get('/todos/:id', function (req, res) {
	const item = _.findWhere(todos, {id: parseInt(req.params.id, 10)});
	if (item) {
		res.json(item);
	} else {
		res.status(404).send();
	}
});

// POST /todos
app.post('/todos', function (req, res) {
	const body = _.pick(req.body, 'description', 'completed');

	// Validate the data provided
	if (!_.isString(body.description) || body.description.trim().length === 0 || !_.isBoolean(body.completed)) {
		return res.status(400).send();
	}
	body.description = body.description.trim();

	// Add id field and then increment the next id value
	body.id = todoNextId++;

	// Add the new todo item to our todo array
	todos.push(body);

	res.json(body);
});

// Start the Express web server
app.listen(PORT, function () {
	console.log(`Express listening on port ${PORT}!`);
});