

// instantiate sketch
var createSketch = function(C, appendTo) {
  return new p5(sketch(C), appendTo);
}


// Constants + Logic + Sketch
var sketch = function(C) { // myboard indicates if it is your board or your opponent's




  return function(p) {
    p.setup = function() {

      if (!C.logic) bindLogic(p, C);
      else _.assign(p, C.logic);


      // Initialize some constants
      p.SIZE = C.SIZE || C.size || 35;
      p.STROKE = C.STROKE || C.stroke || 1;
      p.SM = C.SM || C.sm || p.SIZE / 8;
      p.OFFSET = C.OFFSET || C.offset || p.SIZE * 0.125;
      p.HALFSIZE = p.SIZE / 2;
      p.CROSS_STROKE = C.CROSS_STROKE || C.cross_stroke || p.SIZE * 0.1;
      p.SIZE_INVERSE = 1 / p.SIZE;
      p.FRAMERATE = C.FRAMERATE || C.framerate || 60;

      p.SILH = C.silh !== undefined ? C.silh :
              C.SILH !== undefined ? C.SILH :
              C.silhouette !== undefined ? C.silhouette : true;

      p.CURSOR = C.cursor !== undefined ? C.cursor :
        C.CURSOR !== undefined ? C.CURSOR : true;



      p.ODD = Math.round(p.STROKE) % 2 === 1;

      if (!C.redraw) p.noLoop();


      p.drawGrid = function() {
        p.background(255);
        p.noFill();
        p.stroke(0);
        p.strokeWeight(p.STROKE);

        // Draw grid
        for (let j = 0; j < p.HEIGHT + 1; j++) {
          p.line(0, j * p.SIZE, p.SIZE * p.WIDTH, j * p.SIZE);
        }
        for (let i = 0; i < p.WIDTH + 1; i++) {
          p.line(i * p.SIZE, 0, i * p.SIZE, p.SIZE * p.HEIGHT);
        }

        if (p.occupiedCells) {
          _.each(p.occupiedCells, p.drawGap);
        }
      }

      p.drawCross = function(x, y) {
        p.stroke(184, 23, 23);
        p.strokeWeight(p.CROSS_STROKE);
        p.line(x + p.SM + p.CROSS_STROKE / 2, y + p.SM + p.CROSS_STROKE / 2,
          x + p.SIZE - p.SM, y + p.SIZE - p.SM);
        p.line(x + p.SIZE - p.SM, y + p.SM + p.CROSS_STROKE / 2,
          x + p.SM + p.CROSS_STROKE / 2, y + p.SIZE - p.SM);
      }

      // This function draws a gap.
      // Now there's three types of gaps: simple gap, mark and a dim gap.
      // They each have different color and tranparency;
      p.drawGap = function({ x, y, type }) {

        switch (type) {

          case undefined:
          case GAP:
            p.fill(12, 103, 136);
            break;

          case MARK:
            p.fill(12, 105, 12);
            break;

          case DIM:
            p.fill(12, 103, 136, 90);
            break;

          case RED:
            p.fill(214, 108, 74, 90);
            break;

          case GAPSHOT:
            p.fill(188, 99, 230);
            break;
        }

        p.noStroke();

        // I can't figure out a reason for this but if the stroke weight is set to
        // an odd value, then adding the full stroke weight to the starting coordinates
        // makes it placed right and not shifted down by a pixel and this number
        // is half of that for a board whose stroke weight is even.
        p.rect(x * p.SIZE + (p.ODD ? p.STROKE : p.STROKE / 2),
          y * p.SIZE + (p.ODD ? p.STROKE : p.STROKE / 2),
          p.SIZE - p.STROKE, p.SIZE - p.STROKE);
      }


      // Bind different functions and variables depending on the board type
      // (your or your opponent's)
      if (p.type === 'hidden') {


        // Draw crosses and gaps
        p.navy = function() {
          for (let i = 0; i < p.WIDTH; i++) {
            for (let j = 0; j < p.HEIGHT; j++) {

              switch (p.cells[i][j]) {
                case EMPTY:
                  break;

                case GAP:
                  p.drawGap({ x: i, y: j, type: GAP})
                  break;

                case SHIP:
                  p.drawCross(i * p.SIZE, j * p.SIZE);
                  break;
              }
            }
          }
        }

        // Do nothing
        p.updateSilhouette = function() {}


      } else {

        // Renderer
        p.drawShip = function(ship) {
          p.fill(81, 226, 30);
          p._drawShip(ship);
        }

        p._drawShip = function(ship) {
          p.stroke(0);
          p.strokeWeight(p.STROKE);

          { // Sausages
            let xTop = ship.start.x * p.SIZE + p.OFFSET + p.STROKE;
            let xBot = ship.end.x * p.SIZE - p.OFFSET + p.SIZE;
            let yTop = ship.start.y * p.SIZE + p.OFFSET + p.STROKE;
            let yBot = ship.end.y * p.SIZE - p.OFFSET + p.SIZE;

            p.beginShape();
            p.vertex(xTop, yTop);
            p.vertex(xBot, yTop);
            p.vertex(xBot, yBot);
            p.vertex(xTop, yBot);
            p.endShape(p.CLOSE);
          }


          for (let i of ship.inds) {
            // Cross out dead cells
            if (!i.alive) {
              p.drawCross(i.x * p.SIZE, i.y * p.SIZE)
            }
          }
        }

        p.drawSilh = function() {
          if (!p.shipSilhouette) return;
          if (p.shipSilhouette.meetsCriteria) p.fill(81, 226, 30, 80);
          else p.fill(228, 82, 42, 80);
          p._drawShip(p.shipSilhouette);
        }


        // Holds x, y coordinates of ship that is to be created
        p.shipCreation = null;

        // Hint the form of the future ship while making it
        p.shipSilhouette = null;

        // Draw your navy and the gaps
        p.navy = function() {
          // draw ships
          p.ships.forEach(p.drawShip)
          p.deadShips.forEach(p.drawShip)
          if (p.SILH) p.drawSilh();

          // change color of shot tiles
          _.each(p.gaps, p.drawGap);
        }

        // Draw ship's silhouette that hints the player the size of the ships
        // while it is being created
        if (p.SILH) p.updateSilhouette = function(x, y) {
          if (!p.shipCreation) return;
          let ends = p.matchEnds(p.shipCreation, { x, y });

          if (!p.shipSilhouette ||

            (p.shipSilhouette.start.x !== ends.start.x ||
              p.shipSilhouette.start.y !== ends.start.y ||
              p.shipSilhouette.end.x !== ends.end.x ||
              p.shipSilhouette.end.y !== ends.end.y))

          {
            p.shipSilhouette = new Ship(ends.start, ends.end, true);
            p.meetCriteria(p.shipSilhouette);
          }
        }

        // Resolve mouse click event
        p.click = function(x, y) {
          if (p.ingame) return;

          if (p.SILH) if (!p.shipCreation) {
            if (!p.isEmpty(x, y)) return;
            p.shipCreation = { x, y };
            return;
          }
          // Select ends of the future ship
          if (p.SILH) if (p.shipSilhouette.meetsCriteria) {

            p.addShip(p.shipCreation, { x, y });

            // Remove the silhouette
            p.shipSilhouette = null;
            p.shipCreation = null;
          }

          p.handleClick();
        }

      }

      p.createCanvas(p.WIDTH * p.SIZE + p.STROKE, p.HEIGHT * p.SIZE + p.STROKE);
      p.frameRate(p.FRAMERATE);
    },



    // this function draws everything to the canvas ~60 times a second
    p.draw = function() {

      p.drawGrid();

      // draw the navy / enemy's navy (if hit) and the gaps
      p.navy()

      // get row and column
      let x = Math.floor(p.mouseX * p.SIZE_INVERSE);
      if (x < 0 || x >= p.WIDTH) return;

      let y = Math.floor(p.mouseY * p.SIZE_INVERSE);
      if (y < 0 || y >= p.HEIGHT) return;

      // create half-transparent ship silhouette (while making a ship)
      if (p.SILH) p.updateSilhouette(x, y);

      p.noStroke();

      // Hovering
      if (p.CURSOR) if (p.isEmpty(x, y) &&
      (!p.shipSilhouette || !p.shipSilhouette.check(x, y))) {
        p.fill(240, 238, 24);
        p.rect(x * p.SIZE + p.STROKE, y * p.SIZE + p.STROKE,
          p.SIZE - p.STROKE, p.SIZE - p.STROKE);
      } else {
        p.fill(240, 238, 24, 90);
        p.rect(x * p.SIZE + p.STROKE, y * p.SIZE + p.STROKE,
          p.SIZE - p.STROKE, p.SIZE - p.STROKE);
      }
    },


    p.mouseClicked = function() {

      // get row and column
      let x = Math.floor(p.mouseX * p.SIZE_INVERSE);
      if (x < 0 || x >= p.WIDTH) return;

      let y = Math.floor(p.mouseY * p.SIZE_INVERSE);
      if (y < 0 || y >= p.HEIGHT) return;

      // pass coordinates to click handlers
      p.click(x, y);
    }

  }
}
