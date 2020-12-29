'use strict'

// requirements, globals

const colors = ['primary', 'secondary', 'negative', 'positive']

// classes

/**
 * Button class uses to create button object for layout.
 */
class Button {
    constructor(label, color='secondary', action={ type: 'text' }) {
        if (1 > label.length > 50) {
            throw 'Abnormal length of button text.'
        }
        if (!colors.includes(color)) {
            throw 'Invalid button color.'
        }
        this.label = label
        this.color = color
        this.action = action
    }
}

/**
 * Layout class is used to create a new keyboard and package it for the api.
 */
class Layout {
    constructor(buttons, options={}) {
        this.scheme = { buttons: [] }
        let _outstack = false
        let _lastRow = -1
        /*  _outstack is a flag that determines if the previos
            element in the constructor was a button array   */
        buttons.forEach(x => {
            if (x instanceof Array) {
                this._addButtonsRow(x)
                _lastRow += 1
                _outstack = true
            } else {
                if (_outstack || _lastRow == -1) {
                    this.scheme.buttons.push([])
                    _lastRow += 1
                    _outstack = false
                }
                this._stackButton(_lastRow, x)
            }
        })
        Object.assign(this.scheme, options)
    }

    /**
     * Adds new buttons row.
     */
    _addButtonsRow(buttons) {
        this.scheme.buttons.push([])
        var row = this.scheme.buttons.length - 1
        buttons.forEach(b => this._stackButton(row, b))
    }

    /**
     * Stacks new button to keyboard model.
     */
    _stackButton(row, button) {
        if (button instanceof Button) {
            this.scheme.buttons[row].push({
                action: {
                    label: button.label,
                    ...button.action
                },
                color: button.color
            })
        } else if (typeof button == 'string') {
            if (1 > button.length > 50) {
                throw 'Abnormal length of button text.'
            } else {
                if (button.startsWith('%')) {
                    let tmp = button.slice(1)
                    let label = button
                    let color = 'secondary'
                    if (tmp.startsWith('primary')) {
                        label = tmp.slice(7)
                        color = tmp.slice(0, 7)
                    } else if (tmp.startsWith('secondary')) {
                        label = tmp.slice(9)
                        color = tmp.slice(0, 9)
                    } else if (tmp.startsWith('negative')) {
                        label = tmp.slice(8)
                        color = tmp.slice(0, 8)
                    } else if (tmp.startsWith('positive')) {
                        label = tmp.slice(8)
                        color = tmp.slice(0, 8)
                    }
                    this.scheme.buttons[row].push({
                        action: {
                            type: 'text',
                            label: label
                        },
                        color: color
                    })
                } else {
                    this.scheme.buttons[row].push({
                        action: {
                            type: 'text',
                            label: button
                        },
                        color: 'secondary'
                    })
                }
            }
        } else if (button instanceof Object && !(button instanceof Array)) {
            this.scheme.buttons[row].push(button)
        } else {
            throw 'Invalid button object.'
        }
    }
}

// export

module.exports = { Button, Layout }