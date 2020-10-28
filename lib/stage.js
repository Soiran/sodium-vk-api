'use strict'

// classes

class Stage {
    constructor(user, frames, container) {
        this._container = container
        this.closed = false
        this.user = user    
        this.frames = frames
        this.framePosition = 0
    }

    setContainer(container) {
        this._container = container
    }

    receive(ctx) {
        if (!this.closed) this.frames[this.framePosition](ctx, this)
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