const express = require('express');
const bodyParser = require('body-parser');
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
	const item = todos.find(cur => cur.id === parseInt(req.params.id, 10));
	if (item) {
		res.json(item);
	} else {
		res.status(404).send();
	}
});

// POST /todos
app.post('/todos', function (req, res) {
	const body = req.body;

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