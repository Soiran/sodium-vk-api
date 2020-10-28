'use strict'

// classes

class Validators { // using as static collections
    constructor(method) {
        this.validate = method
    }

    static get Int() {
        return v => Number(v) === v && v % 1 === 0
    }

    static get Float() {
        return v => Number(v) === v && v % 1 !== 0
    }

    static get String() {
        return v => typeof v === 'string'
    }

    static get IntArray() {
        return v => {
            if (v instanceof Array) {
                return v.every(e => Number(e) === e && e % 1 === 0)
            }
            return false
        }
    }

    static get FloatArray() {
        return v => {
            if (v instanceof Array) {
                return v.every(e => Number(e) === e && e % 1 !== 0)
            }
            return false
        }
    }

    static get StringArray() {
        return v => {
            if (v instanceof Array) {
                return v.every(e => typeof e === 'string')
            }
            return false
        }
    }

    static get Array() {
        return v => v instanceof Array
    }

    static get Object() {
        return v => typeof v == 'object' && v instanceof Object && !(v instanceof Array)
    }

    static parse(v) {
        if (+v) return Number(v)
        try { return JSON.parse(v) } catch { return v }
    }
}

// export

module.exports = Validators