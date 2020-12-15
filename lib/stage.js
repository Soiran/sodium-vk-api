'use strict'

// classes

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

    setContainer(container) {
        this._container = container
    }

    receive(msg) {
        if (!this.closed) this.frames[this.framePosition](msg, this)
        if (+this.timeoutTime && !this.timeout) {
            this.timeout = setTimeout(_ => {
                this.close();
                this.timeoutAnswer(msg, this);
            }, this.timeoutTime);
        }
    }

    next() {
        if (!this.closed) this.framePosition++
    }

    back() {
        if (!this.closed) this.framePosition--
    }

    skip(n=1) {
        if (!this.closed) this.framePosition += Math.abs(n) + 1
    }

    slideTo(n=this.framePosition) {
        if (!this.closed) this.framePosition = n
    }

    move(n=0) {
        if (!this.closed) this.framePosition += n
    }

    close() {
        this.closed = true
        if (this._container) delete this._container[this._container.indexOf(this)]
    }
}

// export

module.exports = Stage