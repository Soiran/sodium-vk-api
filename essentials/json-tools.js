'use strict'

// requirements, globals

const fs = require('fs')

// classes

/**
 * The data class is used for easy reading and editing of JSON files.
 */
class Data {
    constructor(path, suit) {
        let tmp = path.split('.');
        if (tmp[tmp.length - 1] != 'json') {
            throw '(constructor) Can only read .json format file.';
        }
        this.path = path;
        this.suit = suit;
        this.models = {};
        let pathCtx = this.path.split('/').slice(1);
        let shiftingPath = './';
        if (pathCtx.length > 1) {
            pathCtx.slice(0, 1).forEach(f => {
                shiftingPath += (f + '/')
                if (!fs.existsSync(shiftingPath)) {
                    fs.mkdirSync(shiftingPath);
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

    /**
     * Gets value by path from the discrete object.
     */
    static pathTarget(data, path='') {
        path = '' + path;
        var target = data;
        if (path) {
            path = path.split('.');
            path.forEach(f => {
                if (typeof target == 'object' && !(target instanceof Array)) {
                    if (target[f] == undefined) {
                        if (target instanceof Object) {
                            target[f] = true;
                        }
                    }
                    target = target[f];
                } else {
                    throw `Path "${path}" have not-object fields before target.`;
                }
            })
        }
        return target;
    }

    /**
     * Checks for key existing.
     */
    exists(path='') {
        path = '' + path;
        var target = this.data;
        var exists = true;
        path = path.split('.')
        path.forEach(f => {
            if (typeof target == 'object' && !(target instanceof Array) && target[f] != undefined) {
                target = target[f];
            } else {
                exists = false;
            }
        })
        return exists;
    }
    
    get data() {
		return JSON.parse(fs.readFileSync(this.path))
	}

	set data(value) {
		fs.writeFileSync(this.path, JSON.stringify(value))
    }

    /**
     * Gets value from path.
     */
    get(path) {
        return Data.pathTarget(this.data, path);
    }

    /**
     * Gets keys from path.
     */
    keys(path) {
        let obj = Data.pathTarget(this.data, path);
        if (obj instanceof Object && !(obj instanceof Array)) {
            return Object.keys(Data.pathTarget(this.data, path));
        } else {
            throw `Cannot get object keys in the path "${path}". (not an object)`;
        }
    }

    /**
     * Gets values from path.
     */
    values(path) {
        let obj = Data.pathTarget(this.data, path);
        if (obj instanceof Object && !(obj instanceof Array)) {
            return Object.values(Data.pathTarget(this.data, path));
        } else {
            throw `Cannot get object values in the path "${path}". (not an object)`;
        }
    }

    /**
     * Gets entries from path.
     */
    entries(path) {
        let obj = Data.pathTarget(this.data, path);
        if (obj instanceof Object && !(obj instanceof Array)) {
            return Object.entries(Data.pathTarget(this.data, path));
        } else {
            throw `Cannot get object entries in the path "${path}". (not an object)`;
        }
    }

    /**
     * Sets value to key by path.
     */
    set(path='', value) {
        path = '' + path;
        let containerPath = path.split('.').slice(0, -1).join('.');
        let field = path.split('.').pop();
        let data = this.data;
        let container = Data.pathTarget(data, containerPath);
        if (container instanceof Object && !(container instanceof Array)) {
            container[field] = value;
            this.data = data;
        } else {
            throw `(set) Cannot create a new field in the path "${path}". (not an object)`;
        }
    }

    /**
     * Removes key by path.
     */
    remove(path='') {
        path = '' + path;
        let containerPath = path.split('.').slice(0, -1).join('.');
        let field = path.split('.').pop();
        let data = this.data;
        let container = Data.pathTarget(data, containerPath);
        if (container instanceof Object && !(container instanceof Array)) {
            delete container[field];
            this.data = data;
        } else {
            throw `(set) Cannot remove field in the path "${path}". (not an object)`;
        }
    }

    /**
     * Renames key by path.
     */
    rename(path='', newName) {
        path = '' + path;
        let containerPath = path.split('.').slice(0, -1).join('.');
        let field = path.split('.').pop();
        let data = this.data;
        let container = Data.pathTarget(data, containerPath);
        if (container instanceof Object) {
            let tmp = container[field];
            delete container[field];
            container[newName] = tmp;
            this.data = data;
        } else {
            throw `(set) Cannot rename field in the path "${path}". (not an object)`;
        }
    }

    /**
     * Push value to array from path.
     */
    push(path='', value) {
        path = '' + path;
        let data = this.data;
        let container = Data.pathTarget(data, path);
        if (container instanceof Array) {
            container.push(value);
            this.data = data;
        } else {
            throw `(set) Cannot push a new element in the path "${path}". (not an array)`;
        }
    }

    /**
     * Edit key value from path.
     */
	edit(path='', update) {
        path = '' + path;
        path = path.split('.');
        var data = this.data;
        var root = data;
        var field = path.pop();
        path.forEach(f => {
            if ((typeof root == 'object' && !(root instanceof Array)) &&
                (typeof root[f] == 'object' && !(root[f] instanceof Array))) {
                root = root[f];
            } else {
                throw `(edit) Path "${path}" have not-object fields before target.`;
            }
        })
        root[field] = update(root[field]);
        this.data = data;
        return root[field];
	}

    /**
     * Wipes all data to suit.
     */
	wipe() {
		this.data = this.suit;
    }
    
    /**
     * Creates new data model.
     */
    addModel(id, scheme) {
        this.models[id] = {
            scheme: scheme
        }
    }

    /**
     * Spawns data model.
     */
    spawn(modelName, containerPath='', keyField='', struct) {
        containerPath = '' + containerPath;
        keyField = '' + keyField;
        if (!(modelName in this.models)) {
            throw `(spawn) Model "${modelName}" is not exists in ${this.path}.`;
        }
        let model = this.models[modelName];
        for (let f in model.scheme) {
            if (model.scheme[f] instanceof Function) {
                if (!(f in struct)) {
                    throw `(spawn) Missing field ${f} in query.`;
                } else {
                    if (model.scheme[f](struct[f]) == (false || undefined || NaN)) {
                        throw `(spawn) Invalid type of field ${f} in query.`;
                    }
                }
            } else {
                if (!(f in struct)) {
                    struct[f] = model.scheme[f];
                }
            }
        }
        let data = this.data;
        let container = Data.pathTarget(data, containerPath);
        if (container instanceof Array) {
            container.push(struct);
        } else if (container instanceof Object) {
            if (keyField) {
                if (keyField.startsWith('$')) {
                    let f = keyField.slice(1);
                    if (f) {
                        let tmp = struct[f];
                        delete struct[f];
                        container[tmp] = struct;
                    } else {
                        container[keyField] = struct;
                    }
                } else {
                    container[keyField] = struct;
                }
            } else {
                throw `(spawn) Cannot spawn new instance of model ${modelName} in this path. (key field required)`;
            }
        } else {
            throw `(spawn) Cannot spawn new instance of model ${modelName} in this path. (not a container)`;
        }
        this.data = data;
    }
}

// export

module.exports = Data