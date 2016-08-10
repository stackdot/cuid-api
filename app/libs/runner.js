
'use strict';

const EventEmitter = require('events')
let lodash = require('lodash')
const debug = require('debug')('cuid:runner')

module.exports = class Runner extends EventEmitter {

	constructor( server, queue ){
		// Extend the EventEmitter:
		super()
		let self = this

		this.crons = {}
		this.queue = queue;
		this.schemas = server._dirs.schemas
		this.events = server._events
		debug('[new] runner'.good)
		this.listenOnQueue()
		
	}

	listenOnQueue(){
		console.log('listening on queue')



	}

}