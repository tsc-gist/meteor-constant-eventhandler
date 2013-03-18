
Nodes = new Meteor.Collection "nodes"

Meteor.methods {
  createNode: (options) ->
    options ?= {}
    console.log options
    null
}