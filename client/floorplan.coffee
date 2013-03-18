
# 
functional.expose(this)
TL = TLog.getLogger(TLog.LOGLEVEL_MAX,true,true)

Meteor.startup () ->
  Session.set("bl_panel_height_class","")
  Session.set("bl_current_theme", "lb_theme_light")
  imagelayer = d3.floorplan.imagelayer()
  map = d3.floorplan()
    .xScale(d3.scale.linear().domain([0,100.0]).range([0,500.0]))
    .yScale(d3.scale.linear().domain([0,100.0]).range([0,350.0]))
    .addLayer(imagelayer)
  mapdata = {}
  mapdata[imagelayer.id()] = [{
    url: 'http://dciarletta.github.com/d3-floorplan/Sample_Floorplan.jpg',
    x: 0,
    y: 0,
    height: 100.0,
    width: 100.0
     }];
  svg = d3.select("#main_svg").datum(mapdata).call(map)
  null

coordsRelativeToElement = (element, event) ->
  offset = $(element).offset()
  x = event.pageX - offset.left
  y = event.pageY - offset.top
  return {x, y}

Template.map.events {
  'dblclick .map': (event, template) ->
    coords = coordsRelativeToElement(event.currentTarget, event)
    x = coords.x/500
    y = coords.y/500
    Session.set("createCoords", {x, y});
    showStaticModal('#addNodeDialog')
    null 
}

# Template.map.rendered = () -> console.log("map.rendered")

hideModal = (tag) -> $(tag).modal("hide") ; null
showStaticModal = (tag) -> $(tag).modal({backdrop: 'static'})
createNode= (info) -> Meteor.call('createNode', info, hideModal.p('#addNodeDialog'))
tee = (msg, mod, rest) -> TL.info(msg + ":" + JSON.stringify(rest),mod) ; rest

getNodeInfo = (event, template) ->
  nid = template.find(".node_id").value
  serial = template.find(".serial_num").value
  coords = Session.get("createCoords")
  x = coords.x
  y = coords.y
  { nid, serial, x, y}

Template.addNode.events({
  'click .save': compose(createNode, compose(tee.p("createNode","UI"),getNodeInfo))
    
    # 
    #Meteor.call('createNode', getNodeInfo(event, template) , hideModal('#addNodeDialog'))
})

