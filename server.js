"use strict";

const _ = require('underscore');
const bodyParser = require('body-parser');
const db = require('./db.js');
const express = require('express');
const middleware = require('./middleware.js')(db);

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
app.get('/todos', middleware.requireAuthentication, function(req, res) {
	const query = req.query;
	let where = {
		userId: req.user.get('id')
	};

	if (query.hasOwnProperty('q') && query.q.trim().length > 0) {
		where.description = {
			like: `%${query.q}%`
		}
	}

	if (query.hasOwnProperty('completed') && query.completed === 'true') {
		where.completed = true;
	} else if (query.hasOwnProperty('completed') && query.completed === 'false') {
		where.completed = false;
	}

	db.todo.findAll({
		where: where
	}).then(function(todos) {
		res.json(todos);
	}, function() {
		res.status(500).send();
	});
});

// GET /todos/:id
app.get('/todos/:id', middleware.requireAuthentication, function(req, res) {
	db.todo.findOne({
		where: {
			id: parseInt(req.params.id, 10),
			userId: req.user.get('id')
		}
	}).then(function(todo) {
		if (!!todo) {
			res.json(todo.toJSON());
		} else {
			res.status(404).send();
		}
	}, function(e) {
		res.status(500).send();
	});
});

// DELETE /todos/:id
app.delete('/todos/:id', middleware.requireAuthentication, function(req, res) {
	db.todo.destroy({
		where: {
			id: parseInt(req.params.id, 10),
			userId: req.user.get('id')
		}
	}).then(function(rowsDeleted) {
		if (rowsDeleted === 0) {
			res.status(404).send();
		} else {
			res.status(204).send();
		}
	}, function(e) {
		res.status(500).send();
	})
});

// DELETE /users/login
app.delete('/users/login', middleware.requireAuthentication, function(req, res) {
	req.token.destroy().then(function () {
		res.status(204).send();
	}, function() {
		res.status(500).send();
	});
});

// POST /todos
app.post('/todos', middleware.requireAuthentication, function(req, res) {
	const body = _.pick(req.body, 'description', 'completed');

	db.todo.create(body).then(function(todo) {
		req.user.addTodo(todo).then(function() {
			return todo.reload();
		}).then(function(todo) {
			res.json(todo.toJSON());
		})
	}, function(e) {
		return res.status(400).json(e);
	});
});

// POST /users
app.post('/users', function(req, res) {
	const body = _.pick(req.body, 'email', 'password');

	db.user.create(body).then(function(user) {
		res.json(user.toPublicJSON());
	}, function(e) {
		return res.status(400).json(e);
	});
});

// POST /users/login
app.post('/users/login', function(req, res) {
	const body = _.pick(req.body, 'email', 'password');
	let userInstance;

	db.user.authenticate(body).then(function(user) {
		const token = user.generateToken('authentication');
		userInstance = user;

		return db.token.create({
			token: token
		});
	}).then(function(tokenInstance) {
		res.header('Auth', tokenInstance.get('token')).json(userInstance.toPublicJSON());
	}).catch(function(e) {
		res.status(401).send();
	});
});

// PUT /todos/:id
app.put('/todos/:id', middleware.requireAuthentication, function(req, res) {
	const body = _.pick(req.body, 'description', 'completed');
	let attributes = {};

	if (body.hasOwnProperty('description')) {
		attributes.description = body.description;
	}

	if (body.hasOwnProperty('completed')) {
		attributes.completed = body.completed;
	}

	db.todo.findOne({
		where: {
			id: parseInt(req.params.id, 10),
			userId: req.user.get('id')
		}
	}).then(function(todo) {
		if (todo) {
			todo.update(attributes).then(function(todo) {
				res.json(todo.toJSON());
			}, function(e) {
				res.status(400).json(e);
			});
		} else {
			res.status(404).send();
		}
	}, function(e) {
		res.status(500).send();
	});
});

// Start the Express web server
db.sequelize.sync({
	force: true
}).then(function() {
	app.listen(PORT, function() {
		console.log(`Express listening on port ${PORT}!`);
	});
});