'use strict'

// requirements, globals

const fs = require('fs')

// classes

class Data {
    constructor(path, suit) {
        let tmp = path.split('.')
        if (tmp[tmp.length - 1] != 'json') {
            throw 'Data can only read .json format file.'
        }
        this.path = path
        this.suit = suit
        this.models = {}
        let pathCtx = this.path.split('/').slice(1)
        let shiftingPath = './'
        if (pathCtx.length > 1) {
            pathCtx.slice(0, 1).forEach(f => {
                shiftingPath += (f + '/')
                if (!fs.existsSync(shiftingPath)) {
                    fs.mkdirSync(shiftingPath)
                }
            })
        }
        if(!fs.existsSync(this.path)) {
            if (this.suit) { this.data = suit } else { this.data = {} }
        } else {
            if (!this.data) {
                if (this.suit) { this.data = suit } else { this.data = {} }
            }
        }
    }

    static pathTarget(data, path) {
        var target = data
        path = path.split('.')
        path.forEach(f => {
            if (typeof target == 'object' && !(target instanceof Array)) {
                target = target[f]
            } else {
                throw `lightquery: Path "${path}" have not-object fields before target.`
            }
        })
        return target
    }

    exists(path) {
        var target = this.data
        var exists = true
        path = path.split('.')
        path.forEach(f => {
            if (typeof target == 'object' && !(target instanceof Array) && target[f] != undefined) {
                target = target[f]
            } else {
                exists = false
            }
        })
        return exists
    }

    get data() {
		return JSON.parse(fs.readFileSync(this.path))
	}

	set data(value) {
		fs.writeFileSync(this.path, JSON.stringify(value))
    }

	edit(path, update) {
        path = path.split('.')
        var data = this.data
        var root = data
        var field = path.pop()
        path.forEach(f => {
            if ((typeof root == 'object' && !(root instanceof Array)) &&
                (typeof root[f] == 'object' && !(root[f] instanceof Array))) {
                root = root[f]
            } else {
                throw `lightquery: Path "${path}" have not-object fields before target.`
            }
        })
        root[field] = update(root[field])
        this.data = data
	}

	wipe() {
		this.data = this.suit
    }
    
    addModel(id, scheme, options={}) {
        this.models[id] = {
            scheme: scheme,
            options: options
        }
    }

    new(modelName, path, struct) {
        if (!(modelName in this.models)) {
            throw `lightquery: Model "${modelName}" is not exists in ${this.path}.`
        }
        let model = this.models[modelName]
        for (let f of Object.keys(struct)) {
            if (!(f in model.scheme)) {
                throw `lightquery: Unexpected field ${f} in query.`
            } else {
                if (model.scheme[f] instanceof Function) {
                    if (!model.scheme[f](struct[f])) {
                        throw `lightquery: Valid type of field ${f} in query.`
                    }
                }
            }
        }
        let data = this.data
        let target = DataBase.pathTarget(data, path)
        if (target instanceof Array) {
            target.push(struct)
        } else if (target instanceof Object) {
            if (model.options) {
                if (model.options.keyField) {
                    let tmp = struct[model.options.keyField]
                    delete struct[model.options.keyField]
                    target[tmp] = struct
                }
            }
        } else {
            throw `lightquery: Cannot spawn new instance of model ${modelName} in this path.`
        }
        this.data = data
    }
}

// export

module.exports = Data