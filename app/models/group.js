const mongoose = require('mongoose')

const groupSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  guidelines: {
    type:String,
    required: false
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  event: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: false
  }]
}, {
  timestamps: true
})

module.exports = mongoose.model('Group', groupSchema)
