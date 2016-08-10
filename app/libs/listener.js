
'use strict';


const EventEmitter = require('events')
let lodash = require('lodash')
const debug = require('debug')('cuid:listener')
const Q = require('q')


module.exports = class Runner extends EventEmitter {

	constructor( server, queue, kue ){
		// Extend the EventEmitter:
		super()
		let self = this

		this.crons = {}
		this.kue = kue
		this.queue = queue
		this.schemas = server._dirs.schemas
		this.events = server._events
		debug('[new] listener'.good)
		this.listenOnQueue()
		
	}

	listenOnQueue(){
		debug( 'listening on queue'.debug )

		this.queue.on('job complete', this.updateJobStatus.bind( this ) )
		this.queue.on('job enqueue', this.updateJobStatus.bind( this ) )
		this.queue.on('job failed', this.updateJobStatus.bind( this ) )
		// On progress triggers too fast and causes DB lock issues...
		// this.queue.on('job progress', this.updateJobStatus.bind( this ) )
		this.queue.on('job failed attempt', this.updateJobStatus.bind( this ) )

	}


	updateJobStatus( id ){
		this.getData( id )
			.then( this.recordJobHistory.bind( this ) )
			.then(( res )=>{
				debug( `Job History Updated ${id}`.info )
			})
			.catch(( err ) => {
				debug('ERR'.error, err)
			})
	}


	recordJobHistory( data ){

		const deferred = Q.defer()
		let { job, logs, history } = data

		job = lodash.omit( job, ['client'] )
		debug( `Record History: ${job._state} `.info )

		// Update the history with new values:
		history.set( 'job', job.data._id )
		history.set( 'logs', logs )
		history.set( 'data', job.data )
		history.set( 'state', job._state )
		history.set( 'meta', {
			attempts: job._attempts,
			error: job._error,
			worker: job._workerId
		})
		history.set( 'created_at', job.created_at )
		history.set( 'promote_at', job.promote_at )
		history.set( 'updated_at', job.updated_at )
		history.set( 'failed_at', job.failed_at )
		history.set( 'started_at', job.started_at )
		history.set( 'raw', job )

		history.save(( err ) => {
			if( err ) return deferred.reject( err )
			this.events.emit( 'updatedHistory', history )
			deferred.resolve( history )
		})

		return deferred.promise
	}



	// Get Job and Log data and return in sane way
	getData( id ){
		const deferred = Q.defer()
		Q.all([ this.getJob( id ), this.getLogs( id ), this.getHistoryRecord( id ) ])
			.then(( results ) => {
				deferred.resolve({
					job: results[ 0 ],
					logs: results[ 1 ],
					history: results[ 2 ]
				})
			})
			.catch( deferred.reject )
		return deferred.promise
	}



	getHistoryRecord( jobId ){
		const deferred = Q.defer()
		this.schemas.history.findOne({ kueJob: jobId }).exec(( err, historyRecord ) => {
			if(err) return deferred.reject( err )
			if(!historyRecord) return deferred.reject( new Error('not able to find historyRecord') )
			deferred.resolve( historyRecord )
		})
		return deferred.promise
	}



	// Get Job data from Kue
	getJob( id ){
		const deferred = Q.defer()
		this.kue.Job.get( id, deferred.makeNodeResolver() )
		return deferred.promise
	}



	// Get Log data for Job from Kue
	getLogs( id ){
		const deferred = Q.defer()
		this.kue.Job.log( id, deferred.makeNodeResolver() )
		return deferred.promise
	}


}


