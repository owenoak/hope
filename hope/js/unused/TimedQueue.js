

/** TimedQueue -- TODO: NAME? DOC?
	Push things into its queue (via queue.add) and they will be executed after a little while.
*/
new hope.Class({
	name : "TimedQueue",
	prototype : {
	
		/** Queue of things to execute. */
		queue : null,

		/** Add one or more things to the queue. */
		add : function() {
			this.queue.push.apply(this.queue, arguments);
		},

		/** Method to execute (anonymously) when the interval completes. */
		execute : undefined,

		/** Amount of time in SECONDS between queue events. */
		delay : .1,
		
		/** If paused is true, we will not restart the process timer AFTER the next cycle finishes. 
			Manage paused with hope.Observable.stop() and hope.Observable.start()
		*/
		paused : false,
	
		/** Stop and start the queue.
			Note that we keep the queue running, but it has no effect if it is paused. 
		*/
		stop : function()  {  this.paused = true;	},
		start : function() {  this.paused = false;	},
	
		/** Start the queue when we create the object. */
		onCreate : function() {
			if (!this.execute) throw "TimedQueue MUST provide an execute() handler.";

			this.queue = [];
			
			// interval function, calls queue.execute() if not paused
			var queue = this;
			function execute() {
				if (!queue.paused) queue.execute();
			}
			this._interval = setInterval(execute, this.delay * 1000);
		}
	}
});

