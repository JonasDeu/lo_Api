const mongoose = require("mongoose")

const Log = mongoose.model("Log", {

    name: {
        type: String,
        required: true,
        trim: true
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: "User"
    },
    date: {
        type: Date,
        default: Date.now
    },
    entries: [
        {
            time: {
                type: Date,
                default: Date.now
            }
            //amount
            //level
        }
    ]

})

module.exports = Log