const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

const todos = [{
	id: 1,
	description: 'Desc 1',
	completed: false
},{
	id: 2,
	description: 'Desc 2',
	completed: false
},{
	id: 3,
	description: 'Desc 3',
	completed: true
}];

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

// Start the Express web server
app.listen(PORT, function () {
	console.log(`Express listening on port ${PORT}!`);
});