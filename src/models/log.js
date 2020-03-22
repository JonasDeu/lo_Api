const mongoose = require("mongoose")

const Log = mongoose.model("Log", {
	name: {
		type: String,
		required: true,
		trim: true
	},
	emoji: {
		type: String,
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
	numEntries: {
		type: Number,
		default: 0 //How to make non editable?
	},
	lastEntry: {
		type: Date
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
