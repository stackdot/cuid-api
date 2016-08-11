
'use strict'


const EventEmitter = require('events')
let lodash = require('lodash')
const debug = require('debug')('cuid:scheduler')
const CronJob = require('cron').CronJob
const Q = require('q')



module.exports = class Scheduler extends EventEmitter {

	constructor( server, queue, kue ){
		// Extend the EventEmitter:
		super()

		this.crons = {}
		this.queue = queue
		this.schemas = server._dirs.schemas
		this.events = server._events
		debug( '[new] scheduler'.good )
		this.scheduleJobs()
		this.listenToEvents()

	}


	listenToEvents(){
		// Schedule job when a new one is created by the API:
		this.events.on( 'newJob', ( job ) => {
			debug( `New Job: ${job.name}` )
			if( job.enabled ){
				this.scheduleJob( job )
			}
		})
		// Remove current CRON and create new one when Job is updated:
		this.events.on( 'jobUpdated', ( job ) => {
			debug( `Job Updated: ${job.name}` )
			this.crons[ job._id ].stop()
			this.crons[ job._id ] = null
			if(job.enabled){
				this.scheduleJob( job )
			}
		})
	}


	scheduleJobs(){
		debug( 'Scheduling jobs'.info )
		this.schemas.job.find({ enabled: true }).exec(( err, jobs ) => {
			debug( `Scheduling: ${jobs.length} job(s)..`.debug )
			lodash.each( jobs, this.scheduleJob.bind( this ) )
		})
	}


	scheduleJob( job ){
		debug( `Scheduled: "${job.name}"` );
		// Scheduled already:
		if( !lodash.isEmpty( this.crons[job._id] ) ){
			return debug( `CRON already scheduled for ${job._id} ( ${job.name} )` )
		}
		this.crons[ job._id ] = new CronJob( job.cron, this.queueExecution( job ), true, job.timezone )
	}

	queueExecution( job ){
		return () => {

			// Get the most up to date info before scheduling:
			this.getJob( job._id )
				.then( this.createQueueItem.bind( this ) )
				.then( this.createHistoryRecord.bind( this ) )
				.then(( data ) => {
					debug( `Finished Queueing ${job.name}`.info )
				})
				.catch(( err ) => {
					console.log('Err', err)
				})

		}
	}

	createQueueItem( job ){
		const deferred = Q.defer()
		debug( `Job ${job.name} Scheduled!`.good )

		let queueItem = this.queue.create( 'job', lodash.extend( job.toObject(), { title: `${job.type} - ${job.name}` } ) )
			.priority( job.priority )
			.attempts( job.attempts )
			.delay( 500 ) // Have to delay to allow mongo to record before updatign
			.backoff({ type: 'exponential' })
		if(job.ttl !== -1){
			queueItem.ttl( job.ttl )
		}
		queueItem.save(( err ) => {
			if( err ) return deferred.reject( err )
			deferred.resolve( queueItem )
		})

		return deferred.promise

	}

	createHistoryRecord( queueItem ){

		debug( `Creating History Record ( ${queueItem.id} )`.info )

		const deferred = Q.defer()
		let Hist = new this.schemas.history({
			job: queueItem.data._id,
			kueJob: queueItem.id,
			data: queueItem.data,
			state: queueItem._state,
			created_at: queueItem.created_at,
			promote_at: queueItem.promote_at,
			updated_at: queueItem.updated_at,
			failed_at: queueItem.failed_at,
			started_at: queueItem.started_at
		})
		Hist.save(( err ) => {
			if( err ) return deferred.reject( err )
			deferred.resolve( Hist )
		})
		return deferred.promise

	}

	getJob( id ){

		const deferred = Q.defer()
		this.schemas.job.findOne({ _id: id }).exec(( err, job ) => {
			if(err) return deferred.reject( err )
			if(!job) return deferred.reject( new Error('not able to find job') )
			deferred.resolve( job )
		})
		return deferred.promise

	}

}

