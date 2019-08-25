
const express = require('express')
const passport = require('passport')

const Group = require('../models/group')

// this is a collection of methods that help us detect situations when we need
// to throw a custom error
const customErrors = require('../../lib/custom_errors')

// function to send 404 when non-existant document is requested
const handle404 = customErrors.handle404
// we'll use this function to send 401 when a user tries to modify a resource
// that's owned by someone else
const requireOwnership = customErrors.requireOwnership

// this is middleware that will remove blank fields from `req.body`, e.g.
// { group: { title: '', text: 'foo' } } -> { group: { text: 'foo' } }
const removeBlanks = require('../../lib/remove_blank_fields')
// passing this as a second argument to `router.<verb>` will make it
// so that a token MUST be passed for that route to be available
// it will also set `req.user`
const requireToken = passport.authenticate('bearer', { session: false })

// instantiate a router (mini app that only handles routes)
const router = express.Router()

// INDEX
// GET /groups
router.get('/groups', requireToken, (req, res, next) => {
  Group.find()
    .then(groups => {
      // `groups` will be an array of Mongoose documents
      // we want to convert each one to a POJO, so we use `.map` to
      // apply `.toObject` to each one
      return groups.map(group => group.toObject())
    })
    // respond with status 200 and JSON of the groups
    .then(groups => res.status(200).json({ groups: groups }))
    // if an error occurs, pass it to the handler
    .catch(next)
})

// SHOW
// GET /groups/5a7db6c74d55bc51bdf39793
router.get('/groups/:id', requireToken, (req, res, next) => {
  // req.params.id will be set based on the `:id` in the route
  Group.findById(req.params.id)
    .then(handle404)
    // if `findById` is succesful, respond with 200 and "group" JSON
    .then(group => res.status(200).json({ group: group.toObject() }))
    // if an error occurs, pass it to the handler
    .catch(next)
})

// CREATE
// POST /groups
router.post('/groups', requireToken, (req, res, next) => {
  // set owner of new group to be current user
  req.body.group.owner = req.user.id

  Group.create(req.body.group)
    // respond to succesful `create` with status 201 and JSON of new "group"
    .then(group => {
      res.status(201).json({ group: group.toObject() })
    })
    // if an error occurs, pass it off to our error handler
    // the error handler needs the error message and the `res` object so that it
    // can send an error message back to the client
    .catch(next)
})

// UPDATE
// PATCH /groups/5a7db6c74d55bc51bdf39793
router.patch('/groups/:id', requireToken, removeBlanks, (req, res, next) => {
  // if the client attempts to change the `owner` property by including a new
  // owner, prevent that by deleting that key/value pair
  delete req.body.group.owner

  Group.findById(req.params.id)
    .then(handle404)
    .then(group => {
      // pass the `req` object and the Mongoose record to `requireOwnership`
      // it will throw an error if the current user isn't the owner
      requireOwnership(req, group)

      // pass the result of Mongoose's `.update` to the next `.then`
      return group.update(req.body.group)
    })
    // if that succeeded, return 204 and no JSON
    .then(() => res.sendStatus(204))
    // if an error occurs, pass it to the handler
    .catch(next)
})

// DESTROY
// DELETE /groups/5a7db6c74d55bc51bdf39793
router.delete('/groups/:id', requireToken, (req, res, next) => {
  Group.findById(req.params.id)
    .then(handle404)
    .then(group => {
      // throw an error if current user doesn't own `group`
      requireOwnership(req, group)
      // delete the group ONLY IF the above didn't throw
      group.remove()
    })
    // send back 204 and no content if the deletion succeeded
    .then(() => res.sendStatus(204))
    // if an error occurs, pass it to the handler
    .catch(next)
})

module.exports = router
