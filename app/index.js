'use strict'

/*
 Consider maybe using https://github.com/node-schedule/node-schedule instead of CRON
 */

// Settings:
const PORT = process.env.PORT || 8080
const UI_PORT = process.env.UI_PORT || 8081
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379'
const DB = process.env.DB || 'mongodb://localhost/cuid'



// Modules:
const colors = require('colors')
const kue = require('kue')
const ui = require('kue-ui')
const express = require('express')



// Connect to mongodb:
const mongoose = require('mongoose')
mongoose.connect( DB )
console.log(`Connected to MongoDB using: ${DB}`.green)



// Create KUE UI for debugging:
let app = express()
let queue = kue.createQueue({
	redis: REDIS_URL
})
ui.setup({
	apiURL: '/api',
	baseURL: '/kue',
	updateInterval: 5000
})
app.use('/api', kue.app)
app.use('/kue', ui.app)
kue.app.listen(3000)



// REST API Server:
let server = require('restify-loader')({
	dir: __dirname,
	name: 'cuid',
	version: '1.0.0',
	dirs: {
		libs: 'libs',
		middleware: 'middleware',
		schemas: 'schemas'
	},
	// raven: {
	// 	context: {
	// 		ENV: process.env.ENVIRONMENT || "localhost"
	// 	},
	// 	DSN: process.env.SENTRY_DSN || 'DSN_KEY',
	// },
}, {
	mongoose: mongoose
})



// Start the Scheduler and Listener:
server.Listener = new server._dirs.libs.listener( server, queue, kue )
server.Scheduler = new server._dirs.libs.scheduler( server, queue, kue )



// Listen for connections:
server.listen(PORT, () => {
	console.log(`Listening to port: ${PORT}`.green)
})
app.listen( UI_PORT, () => {
	console.log( `Kue UI listening on ${UI_PORT}` )
})
