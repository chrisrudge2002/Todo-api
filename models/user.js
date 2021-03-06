"use strict";

const _ = require('underscore');
const bcrypt = require('bcryptjs');
const cryptojs = require('crypto-js');
const jwt = require('jsonwebtoken');

module.exports = function(sequelize, DataTypes) {
	const user = sequelize.define('user', {
		email: {
			type: DataTypes.STRING,
			allowNull: false,
			unique: true,
			validate: {
				isEmail: true
			}
		},
		salt: {
			type: DataTypes.STRING
		},
		password_hash: {
			type: DataTypes.STRING
		},
		password: {
			type: DataTypes.VIRTUAL,
			allowNull: false,
			validate: {
				len: [7, 100]
			},
			set: function(value) {
				const salt = bcrypt.genSaltSync(10);
				const hashedPassword = bcrypt.hashSync(value, salt);

				this.setDataValue('password', value);
				this.setDataValue('salt', salt);
				this.setDataValue('password_hash', hashedPassword);
			}
		}
	}, {
		hooks: {
			beforeValidate: function(user, options) {
				if (typeof user.email === 'string') {
					user.email = user.email.toLowerCase();
				}
			}
		},
		classMethods: {
			authenticate: function(body) {
				return new Promise(function(resolve, reject) {
					if (typeof body.email !== 'string' || typeof body.password !== 'string') {
						return reject();
					}

					user.findOne({
						where: {
							email: body.email
						}
					}).then(function(user) {
						if (!user || !bcrypt.compareSync(body.password, user.get('password_hash'))) {
							return reject();
						}

						return resolve(user);
					}, function(e) {
						return reject();
					});
				});
			},
			findByToken: function(token) {
				return new Promise(function(resolve, reject) {
					try {
						const decodedJWT = jwt.verify(token, 'qwerty098');
						const bytes = cryptojs.AES.decrypt(decodedJWT.token, 'abc123!@#!');
						const tokenData = JSON.parse(bytes.toString(cryptojs.enc.Utf8));

						user.findById(tokenData.id).then(function(user) {
							if (user) {
								resolve(user);
							} else {
								reject();
							}
						}, function(e) {
							reject();
						});
					} catch (e) {
						reject();
					}
				})
			}
		},
		instanceMethods: {
			toPublicJSON: function() {
				return _.pick(this.toJSON(), 'id', 'email', 'createdAt', 'updatedAt');
			},
			generateToken: function(type) {
				if (!_.isString(type)) {
					return undefined;
				}

				try {
					const stringData = JSON.stringify({
						id: this.get('id'),
						type: type
					});
					const encryptedData = cryptojs.AES.encrypt(stringData, 'abc123!@#!').toString();
					return jwt.sign({
						token: encryptedData
					}, 'qwerty098');
				} catch (e) {
					return undefined;
				}
			}
		}
	});
	return user;
};