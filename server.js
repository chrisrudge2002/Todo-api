const bodyParser = require('body-parser');
const express = require('express');
const _ = require('underscore');
const app = express();
const PORT = process.env.PORT || 3000;
let todos = [];
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

	if (!item) {
		return res.status(404).json({'error': 'no todo with that id'});
	}
	
	res.json(item);
});

// DELETE /todos/:id
app.delete('/todos/:id', function (req, res) {
	const item = _.findWhere(todos, {id: parseInt(req.params.id, 10)});

	if (!item) {
		return res.status(404).json({'error': 'no todo with that id'});
	}

	todos = _.without(todos, item);
	res.json(item);
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

// PUT /todos/:id
app.put('/todos/:id', function (req, res) {
	const item = _.findWhere(todos, {id: parseInt(req.params.id, 10)});
	const body = _.pick(req.body, 'description', 'completed');
	let validAttributes = {};

	if (!item) {
		return res.status(404).json({'error': 'no todo with that id'});
	}

	if (body.hasOwnProperty('description') && _.isString(body.description) && body.description.trim().length > 0) {
		validAttributes.description = body.description;
	} else if (body.hasOwnProperty('description')) {
		return res.status(400).send();
	}

	if (body.hasOwnProperty('completed') && _.isBoolean(body.completed)) {
		validAttributes.completed = body.completed;
	} else if (body.hasOwnProperty('completed')) {
		return res.status(400).send();
	}

	_.extend(item, validAttributes);
	res.json(item);
});

// Start the Express web server
app.listen(PORT, function () {
	console.log(`Express listening on port ${PORT}!`);
});