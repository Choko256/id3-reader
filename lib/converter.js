'use strict'

const { descriptions } = require('./frame-identifiers')

module.exports = (obj) => {
    const final = {}
    Object.keys(obj).forEach((key) => {
        if (descriptions[key]) {
            final[descriptions[key].key] = obj[key]
        }
    })
    return final
}
