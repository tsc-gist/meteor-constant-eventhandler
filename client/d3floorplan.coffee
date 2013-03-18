
d3.floorplan = () ->
  layers = []
  xScale = d3.scale.linear()
  yScale = d3.scale.linear()

  map = (g) ->
    width  = xScale.range()[1] - xScale.range()[0]
    height = yScale.range()[1] - yScale.range()[0]

    g.each((data) ->
      return if !data?

      g = d3.select(this)

      init_defs(g.selectAll("defs").data([0]).enter().append("defs"))

      vis       = g.selectAll(".map-layers").data([0])
      visEnter  = vis.enter().append("g").attr("class","map-layers")
      visUpdate = d3.transition(vis)

      visEnter.append("rect")
        .attr("class", "canvas")
        .attr("pointer-events","all")
        .style("opacity",0)

      visUpdate.attr("width", width)
        .attr("height", height)
        .attr("x",xScale.range()[0])
        .attr("y",yScale.range()[0])

      controls = g.selectAll(".map-controls").data([0])
      controlsEnter = controls.enter()
              .append("g").attr("class","map-controls")
      init_controls(controlsEnter)
      offset = if controls.select(".hide").classed("ui-show-hide") then 95 else 10
      console.log(controls.select(".hide").classed("ui-show-hide"))
      console.log(offset)
      panelHt = Math.max(45, 10 + layers.length * 20)
      controls.attr("view-width", width)
        .attr("transform", "translate("+(width-offset)+",0)")
        .select("rect")
        .attr("height", panelHt)

      layerControls = controls.select("g.layer-controls")
        .selectAll("g").data(layers, (l) -> l.id())
      layerControlsEnter = layerControls.enter()
        .append("g").attr("class", "ui-active")
        .style("cursor","pointer")
        .on("click", (l) -> 
          button = d3.select(this);
          layer = g.selectAll("g."+l.id());
          if(button.classed("ui-active"))
            layer.style("display","none");
            button.classed("ui-active", false).classed("ui-default", true)
          else
            layer.style("display","inherit")
            button.classed("ui-active", true).classed("ui-default", false)
        );

      layerControlsEnter.append("rect")
        .attr("x", 0)
        .attr("y", 1)
        .attr("rx", 5)
        .attr("ry", 5)
        .attr("width", 75)
        .attr("height", 18)
        .attr("stroke-width", "1px");
      
      layerControlsEnter.append("text")
        .attr("x", 10)
        .attr("y", 15)
        .style("font-size","12px")
        .style("font-family", "Helvetica, Arial, sans-serif")
        .text((l) -> l.title());

      layerControls.transition().duration(1000)
        .attr("transform", (d,i) -> "translate(0," + ((layers.length-(i+1))*20) + ")");

      maplayers = vis.selectAll(".maplayer")
              .data(layers, (l) -> l.id());
      maplayers.enter()
        .append("g")
        .attr("class", (l) -> "maplayer " + l.title())
        .append("g")
        .attr("class", (l) -> l.id())
        .datum(null);
      maplayers.exit().remove();
      maplayers.order();
      
      maplayers.each((layer) -> d3.select(this).select("g." + layer.id()).datum(data[layer.id()]).call(layer));

      console.log("D3 FP")
    )  

  map.xScale = (scale) -> 
    if scale?
      xScale = scale 
      l.xScale(scale) for l in layers
      map
    else
      xScale

  map.yScale = (scale) -> 
    if scale?
      yScale = scale 
      l.yScale(scale) for l in layers
      map
    else
      yScale
  
  map.addLayer = (layer,index) ->
    layer.xScale(xScale)
    layer.yScale(yScale)
    if(index?)
      layers.splice(index, 0, layer);
    else
      layers.push(layer)
    map
  
  init_controls = (selection) -> selection.each( () ->
    controls = d3.select(this);

    controls.append("path")
      .attr("class", "ui-show-hide")
      .attr("d", "M10,3 v40 h-7 a3,3 0 0,1 -3,-3 v-34 a3,3 0 0,1 3,-3 Z")
      .attr("fill","url(#grip-texture)")
      .attr("stroke", "none")
      .style("opacity", 0.5)

    controls.append("path")
      .attr("class", "show ui-show-hide")
      .attr("d", "M2,23 l6,-15 v30 Z")
      .attr("fill","rgb(204,204,204)")
      .attr("stroke", "none")
      .style("opacity", 0.5)

    controls.append("path")
      .attr("class", "hide")
      .attr("d", "M8,23 l-6,-15 v30 Z")
      .attr("fill","rgb(204,204,204)")
      .attr("stroke", "none")
      .style("opacity", 0)

    controls.append("path")
      .attr("class","ui-show-hide-event")
      .attr("d", "M10,3 v40 h-7 a3,3 0 0,1 -3,-3 v-34 a3,3 0 0,1 3,-3 Z")
      .attr("pointer-events", "all")
      .attr("fill","none")
      .attr("stroke", "none")
      .style("cursor","pointer")
      .on("mouseover", () -> controls.selectAll("path.ui-show-hide").style("opacity", 1))
      .on("mouseout", () -> controls.selectAll("path.ui-show-hide").style("opacity", 0.5))
      .on("click", 
        # try adding a timeout as recommended by jdolitsky on IRC
        ()-> Meteor.setTimeout(() ->
          console.log("CLICK")
          if (controls.select(".hide").classed("ui-show-hide"))
            controls.transition()
              .duration(1000)
              .attr("transform", "translate("+(controls.attr("view-width")-10)+",0)")
              .each("end", () ->
                controls.select(".hide")
                  .style("opacity",0)
                  .classed("ui-show-hide",false)
                controls.select(".show")
                  .style("opacity",1)
                  .classed("ui-show-hide",true)
                controls.selectAll("path.ui-show-hide")
                  .style("opacity",0.5)
                null
              )
          else
            controls.transition()
              .duration(1000)
              .attr("transform", "translate("+(controls.attr("view-width")-95)+",0)")
              .each("end", () -> 
                controls.select(".show")
                  .style("opacity",0)
                  .classed("ui-show-hide",false)
                controls.select(".hide")
                  .style("opacity",1)
                  .classed("ui-show-hide",true)
                controls.selectAll("path.ui-show-hide")
                  .style("opacity",0.5)
                null
              )
            null
        , 1000)
      )

      controls.append("rect")
        .attr("x",10)
        .attr("y",0)
        .attr("width", 85)
        .attr("fill", "rgba(204,204,204,0.9)")
        .attr("stroke", "none");

      controls.append("g")
        .attr("class", "layer-controls")
        .attr("transform", "translate(15,5)")
      
      )

  init_defs = (selection) -> selection.each( () ->
    defs = d3.select(this)

    grad = defs.append("radialGradient")
      .attr("id","metal-bump")
      .attr("cx","50%")
      .attr("cy","50%")
      .attr("r","50%")
      .attr("fx","50%")
      .attr("fy","50%")

    grad.append("stop")
      .attr("offset","0%")
      .style("stop-color","rgb(170,170,170)")
      .style("stop-opacity",0.6)

    grad.append("stop")
      .attr("offset","100%")
      .style("stop-color","rgb(204,204,204)")
      .style("stop-opacity",0.5)

    grip = defs.append("pattern")
      .attr("id", "grip-texture")
      .attr("patternUnits", "userSpaceOnUse")
      .attr("x",0)
      .attr("y",0)
      .attr("width",3)
      .attr("height",3)

    grip.append("rect")
      .attr("height",3)
      .attr("width",3)
      .attr("stroke","none")
      .attr("fill", "rgba(204,204,204,0.5)")

    grip.append("circle")
      .attr("cx", 1.5)
      .attr("cy", 1.5)
      .attr("r", 1)
      .attr("stroke", "none")
      .attr("fill", "url(#metal-bump)")
    )
  
  map

d3.floorplan.imagelayer = () ->
  xScale = d3.scale.linear()
  yScale = d3.scale.linear()
  id = "fp-imagelayer-" + new Date().valueOf()

  images = (g) ->
  
    g.each( (data) -> 
      return if !data?

      g = d3.select(this);
      
      imgs = g.selectAll("image").data(data, (img) -> img.url)
      
      imgs.enter().append("image")
        .attr("xlink:href", (img) -> img.url)
        .style("opacity", 1e-6);
      
      imgs.exit().transition().style("opacity",1e-6).remove();
      
      imgs.transition()
        .attr("x", (img) -> img.x)
        .attr("y", (img) -> img.y)
        .attr("height", (img) -> yScale(img.y+img.height) - yScale(img.y))
        .attr("width" , (img) -> xScale(img.x+img.width)  - xScale(img.x))
        .style("opacity", (img) -> img.opacity || 1.0);
      console.log("D3 FP IL")
    );
  
  images.xScale = (scale) -> 
    if scale?
      xScale = scale
      images
    else
      xScale
  images.yScale = (scale) -> 
    if scale?
      yScale = scale
      images
    else
      yScale
  images.id = () -> id
  images.title = (n) -> 
    if n?
      name = n
      images
    else
      name
  images
