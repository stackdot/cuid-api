
'use strict'

const Route = require('restify-loader/route')
const lodash = require('lodash')
const CronJob = require('cron').CronJob

module.exports = class Jobs extends Route {

	init(){
		this.addListeners()
	}

	
	addListeners(){

		let self = this
		this.debug('added listeners'.info)

		// Get all jobs:
		this.server.get({
			url: '/v1/jobs',
			validation: {
				queries: {
					limit: {
						isRequired: false,
						min: 1, max: 100
					},
					offset: {
						isRequired: false,
						min: 1, max: 1000
					}
				}
			}
		}, this.getJobs.bind( this ))


		// Create new job:
		this.server.post({
			url: '/v1/jobs',
			validation: {
				resources: self.jobValidator()
			}
		}, this.postJob.bind( this ))


		// Update a job:
		this.server.put({
			url: '/v1/jobs/:id',
			validation: {
				resources: self.jobValidator( true )
			}
		}, this.middleware.jobs.getJob( self.schemas ), this.updateJob.bind( this ))


		// Get single job:
		this.server.get({
			url: '/v1/jobs/:id',
			validation: {
				resources: {
					id: { isRequired: true }
				}
			}
		}, this.middleware.jobs.getJob( self.schemas ), this.getJob.bind( this ))


		// Get single job:
		this.server.del({
			url: '/v1/jobs/:id',
			validation: {
				resources: {
					id: { isRequired: true }
				}
			}
		}, this.middleware.jobs.getJob( self.schemas ), this.deleteJob.bind( this ))


		// Get single job:
		this.server.get({
			url: '/v1/jobs/:id/history',
			validation: {
				resources: {
					id: { isRequired: true },
					limit: {
						isRequired: false,
						isNumeric: true,
						min: 1,
						max: 100
					},
					offset: {
						isRequired: false,
						isNumeric: true,
						min: 0,
						max: 1000
					}
				}
			}
		}, this.middleware.jobs.getJob( self.schemas ), this.getJobHistory.bind( this ))


		// Get single job:
		this.server.get({
			url: '/v1/jobs/:id/history/:historyId',
			validation: {
				resources: {
					id: { isRequired: true },
					limit: {
						isRequired: false,
						isNumeric: true,
						min: 1,
						max: 100
					},
					offset: {
						isRequired: false,
						isNumeric: true,
						min: 0,
						max: 1000
					}
				}
			}
		},
			this.middleware.jobs.getJob( self.schemas ),
			this.middleware.jobs.getHistory( self.schemas, 'historyId', true ),
			this.getHistory.bind( this ))

	}


	// Create a new job:
	// TODO: Add new job to the CRON scheduler
	postJob( req, res, next ){
		let Job = new this.schemas.job( req.params )
		Job.save(( err ) => {
			if(err) return next( err )
			res.send( Job )
			this._events.emit( 'newJob', Job )
		})
	}


	// Get job history
	getHistory( req, res, next ){
		res.send( req.history )
	}


	// Update a job:
	// TODO: Update the CRON scheduler cron
	updateJob( req, res, next ){
		let safeParams = lodash.pick( req.params, [
			'name',
			'description',
			'enabled',
			'cron',
			'environment_vars',
			'meta',
			'priority',
			'ttl',
			'attempts'
		])
		lodash.each( safeParams, ( value, param ) => req.job.set( param, value ) )
		req.job.save(( err ) => {
			if(err) return next( err )
			res.send( req.job )	
			this._events.emit( 'jobUpdated', req.job )
		})
	}


	// Get all jobs:
	getJobs( req, res, next ) {
		req.params.offset = req.params.offset || 0
		req.params.limit = req.params.limit || 50
		let search = this.schemas.job.find({})
			.skip( req.params.offset )
			.limit( req.params.limit )

		search.exec(( err, job ) => {
			if( err ) return next( err )
			res.send( job )
		})
	}


	// Get specific history Item by ID, with logs selected:
	getJobHistory( req, res, next ){
		req.params.offset = req.params.offset || 0
		req.params.limit = req.params.limit || 50
		let query = this.schemas.history.find({ job: req.params.id }).sort('-created')
			.limit( req.params.limit )
			.skip( req.params.offset )

		query.exec(( err, histories ) => {
			if( err ) return next( err )
			res.send( histories )
		})
	}


	// Delete a job:
	deleteJob( req, res, next ){
		console.log('delete job', req.job._id)
		req.job.remove(( err ) => {
			console.log('done', err)
			if( err ) return next( err )
			res.send( 200 )
			this._events.emit( 'jobDeleted', req.job )
		})
	}


	// Get a specific job:
	getJob( req, res, next ){
		res.send( req.job )
	}


	// Validation schema for POSTS / PUTS
	jobValidator( isUpdating = false ){
		let vals = {
			name: {
				isRequired: true,
			},
			attempts: {
				isRequired: false,
				isNumeric: true
			},
			priority: {
				isRequired: false,
				isIn: [ 'low', 'normal', 'medium', 'high', 'critical' ]
			},
			ttl: {
				isRequired: false,
				isNumeric: true
			},
			cron: {
				isRequired: true,
				is: function( key ){
					try {
						new CronJob( this.req.params[key], () => {
							return true
						})
					} catch( e ){
						return true
					}
				}
			},
			environment_vars: {
				required: false,
			},
			enabled: {
				isRequired: false,
				isBoolean: true
			},
			meta: {
				isRequired: false
			}
		}
		// If we are updating nothing is required, since 
		// we may only be senting 1 thing to update:
		if(isUpdating){
			lodash.each( vals, ( val, key ) => vals[key].isRequired = false ) 
			// Update URLs need to have URL param ID defined
			vals.id = { isRequired: true }
		}
		return vals
	}


}


