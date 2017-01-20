const bodyParser = require('body-parser');
const express = require('express');
const _ = require('underscore');
const db = require('./db.js');

const app = express();
const PORT = process.env.PORT || 3000;
let todos = [];
let todoNextId = 1;

// Add middleware
app.use(bodyParser.json());

// Setup the root route
app.get('/', function(req, res) {
	res.send('Todo API root');
});

// GET /todos
app.get('/todos', function(req, res) {
	const queryParams = req.query;
	let filteredTodos = todos;

	if (queryParams.hasOwnProperty('q') && queryParams.q.trim().length > 0) {
		filteredTodos = _.filter(filteredTodos, cur => cur.description.toLowerCase().indexOf(queryParams.q.toLowerCase()) > -1);
	}

	if (queryParams.hasOwnProperty('completed') && queryParams.completed === 'true') {
		filteredTodos = _.where(filteredTodos, {
			completed: true
		});
	} else if (queryParams.hasOwnProperty('completed') && queryParams.completed === 'false') {
		filteredTodos = _.where(filteredTodos, {
			completed: false
		});
	}

	res.json(filteredTodos);
});

// GET /todos/:id
app.get('/todos/:id', function(req, res) {
	const matchedItem = _.findWhere(todos, {
		id: parseInt(req.params.id, 10)
	});

	if (!matchedItem) {
		return res.status(404).json({
			'error': 'no todo with that id'
		});
	}

	res.json(matchedItem);
});

// DELETE /todos/:id
app.delete('/todos/:id', function(req, res) {
	const matchedItem = _.findWhere(todos, {
		id: parseInt(req.params.id, 10)
	});

	if (!matchedItem) {
		return res.status(404).json({
			'error': 'no todo with that id'
		});
	}

	todos = _.without(todos, matchedItem);
	res.json(matchedItem);
});

// POST /todos
app.post('/todos', function(req, res) {
	const body = _.pick(req.body, 'description', 'completed');

	db.todo.create(body).then(function(todo) {
		res.json(todo.toJSON());
	}).catch(function(e) {
		return res.status(400).json(e);
	});
});

// PUT /todos/:id
app.put('/todos/:id', function(req, res) {
	const matchedItem = _.findWhere(todos, {
		id: parseInt(req.params.id, 10)
	});
	const body = _.pick(req.body, 'description', 'completed');
	let validAttributes = {};

	if (!matchedItem) {
		return res.status(404).json({
			'error': 'no todo with that id'
		});
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

	_.extend(matchedItem, validAttributes);
	res.json(matchedItem);
});

// Start the Express web server
db.sequelize.sync().then(function() {
	app.listen(PORT, function() {
		console.log(`Express listening on port ${PORT}!`);
	});
});