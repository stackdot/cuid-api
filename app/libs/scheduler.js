
'use strict'


const EventEmitter = require('events')
let lodash = require('lodash')
const debug = require('debug')('cuid:scheduler')
const CronJob = require('cron').CronJob


module.exports = class Scheduler extends EventEmitter {

	constructor( server, queue ){
		// Extend the EventEmitter:
		super()

		this.crons = {}
		this.queue = queue;
		this.schemas = server._dirs.schemas
		this.events = server._events
		debug( '[new] scheduler'.good )
		this.scheduleJobs()
		this.listenToEvents()

	}


	listenToEvents(){
		// Schedule job when a new one is created by the API:
		this.events.on('newJob', ( job ) => {
			console.log('New Job...')
			this.scheduleJob( job )
		})
	}


	scheduleJobs(){
		debug('Scheduling jobs'.info)
		this.schemas.job.find({ enabled: true }).exec(( err, jobs ) => {
			debug( `Scheduling: ${jobs.length} job(s)..`.debug )
			lodash.each( jobs, this.scheduleJob.bind( this ) )
		})
	}


	scheduleJob( job ){
		debug(`Scheduled: "${job.name}"`);
		// Scheduled already:
		if( !lodash.isEmpty( this.crons[job._id] ) ){
			return debug( `CRON already scheduled for ${job._id} ( ${job.name} )` )
		}
		this.crons[ job._id ] = new CronJob( job.cron, this.queueExecution( job ), true, job.timezone )
	}

	queueExecution( job ){
		return () => {

			// Get the most up to date info before scheduling:
			this.schemas.job.findOne({ _id: job._id }).exec(( err, job ) => {

				if(err) return console.log( 'ERROR'.error, err )
				debug( `Job ${job.name} Scheduled!`.good )
				let queueItem = this.queue.create('job', job)
					.priority( job.priority )
					.attempts( job.attempts )
					.backoff({ type: 'exponential' })
				if(job.ttl !== -1)
					queueItem.ttl( job.ttl )
				queueItem.save()

			})
		}
	}

}

