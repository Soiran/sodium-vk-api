'use strict'

// classes

/**
 * Stages class creates a script whereby a bot responds to new messages from a specific user.
 */
class Stage {
    constructor(user, frames=[ _=>{} ], container, timeoutTime=false, timeoutAnswer=_=>{}) {
        this._container = container
        this.closed = false
        this.user = user
        if (!frames) {
            this.frames = [ _=>{} ];
        } else {
            this.frames = frames
        }
        this.framePosition = 0
        this.timeoutTime = timeoutTime;
        this.timeoutAnswer = timeoutAnswer;
    }

    /**
     * Deploying stage to container.
     */
    setContainer(container) {
        this._container = container
    }

    /**
     * Handling new message.
     */
    receive(msg) {
        if (!this.closed) this.frames[this.framePosition](msg, this)
        if (+this.timeoutTime && !this.timeout) {
            this.timeout = setTimeout(_ => {
                this.close();
                this.timeoutAnswer(msg, this);
            }, this.timeoutTime);
        }
    }

    /**
     * Moves to next frame.
     */
    next() {
        if (!this.closed) this.framePosition++
    }

    /**
     * Moves to previous frame.
     */
    back() {
        if (!this.closed) this.framePosition--
    }

    /**
     * Skip frames.
     */
    skip(n=1) {
        if (!this.closed) this.framePosition += Math.abs(n) + 1
    }

    /**
     * Moves to specific frame.
     */
    slideTo(n=this.framePosition) {
        if (!this.closed) this.framePosition = n
    }

    /**
     * Moves to another frame by steps count.
     */
    move(n=0) {
        if (!this.closed) this.framePosition += n
    }

    /**
     * Close the stage.
     */
    close() {
        this.closed = true
        if (this._container) delete this._container[this._container.indexOf(this)]
    }
}

// export

module.exports = Stage