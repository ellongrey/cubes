// Copyright 2011-2012 Kevin Reid under the terms of the MIT License as detailed
// in the accompanying file README.md or <http://opensource.org/licenses/MIT>.

var Circuit = (function () {
  "use strict";
  var DEBUG_WIRE = false;
  
  // These are slice'd because the circuit code does foo[aDirection] a lot, so we want the toString() behavior of real JS arrays. TODO: Review whether it would be better to use symbol strings (e.g. "px", "py", ...) or numbers for directions.
  var DIRECTIONS = Object.freeze([
    Array.prototype.slice.call(UNIT_PX),
    Array.prototype.slice.call(UNIT_PY),
    Array.prototype.slice.call(UNIT_PZ),
    Array.prototype.slice.call(UNIT_NX),
    Array.prototype.slice.call(UNIT_NY),
    Array.prototype.slice.call(UNIT_NZ)
  ]);
  
  var directionsPretty = Object.freeze({
    "1,0,0": "+X",
    "0,1,0": "+Y",
    "0,0,1": "+Z",
    "-1,0,0": "-X",
    "0,-1,0": "-Y",
    "0,0,-1": "-Z"
  });
  
  function blockOutputKeys(block) {
    return DIRECTIONS.map(function (direction) {
      return block + "/" + direction;
    });
  }
  
  function dirKeys(value) {
    var o = {};
    DIRECTIONS.forEach(function (direction) {
      o[direction] = value;
    });
    return o;
  }
  
  var IN = "IN";
  var OUT = "OUT";
  var INOUT = "INOUT";
  var NONE = "NONE";
  
  function getRot(world, block) {
    return CubeRotation.byCode[world.gRotv(block)];
  }
  
  function Circuit(world) {
    function getBehavior(block) {
      return world.gtv(block).behavior;
    }
    
    // Blocks making up the circuit
    var blocks = [];
    var aabb = null;
    
    // Circuit topology
    var cGraph = {};
    var cEdges = []; // used for circuit viewing only
    
    // A table of information about the circuit such as "does this circuit
    // contain IC outputs in this direction", generated by compilation.
    var cNotes = {};
    
    var localState = {};
    
    var evaluate = function (state) {throw new Error("uncompiled");};
    
    // --- Methods ---
    
    this.world = world;
    this.blocks = blocks;
    this.getOrigin = function () {
      return this.blocks[0];
    };
    this.add = function (blockVec) {
      blocks.push(blockVec);
      var blockAAB = AAB.unitCube(blockVec);
      if (aabb === null) {
        aabb = blockAAB;
      } else {
        aabb = aabb.boundingUnion(blockAAB);
      }
    };
    this.getAABB = function () {
      return aabb;
    };
    this.compile = function () { // TODO should be implicit
      if (DEBUG_WIRE) console.info("Recompiling a circuit");
      var nodes = [];
      var nets = [];
      var netSerial = 0;
      
      // Clear and initialize
      cGraph = {};
      cEdges = [];
      cNotes = {};
      
      // Find active nodes
      blocks.forEach(function (block) {
        var beh = getBehavior(block);
        if (beh && beh !== Circuit.behaviors.wire) {
          // Initialize state
          cGraph[block] = {};
          
          // Build index
          if (beh !== Circuit.behaviors.junction) {
            nodes.push(block);
          }
        }
      });
      
      // Build graph edges
      function traceNet(net, block, direction) {
        if (DEBUG_WIRE) console.group("traceNet " + net + " " + block + ":" + getBehavior(block) + " : " + direction);
        direction = Array.prototype.slice.call(direction);
        var bn = block.slice();
        vec3.add(bn, direction, bn);
        for (;; vec3.add(bn, direction, bn)) {
          if (DEBUG_WIRE) console.log("walk " + bn);
          var bnBeh = getBehavior(bn);
          var comingFrom = vec3.negate(direction, []);
          if (!bnBeh) {
            return; // not a circuit element
          } else if (bnBeh === Circuit.behaviors.wire) {
            continue; // pass-through
          } else if (cGraph[bn][comingFrom] && cGraph[bn][comingFrom] !== net) {
            throw new Error("met different net!");
          } else if (cGraph[bn][comingFrom] && cGraph[bn][comingFrom] === net) {
            return; // already traced -- TODO: this case unnecessary/can'thappen?
          } else {
            // found new unclaimed node
            // Note: bn was being mutated, but we exit now so saving it is safe.
            cGraph[bn][comingFrom] = net;
            net.push([bn,comingFrom]);
            net.edges.push([net,block,bn]);
            net["has" + bnBeh.getFace(world, bn, comingFrom)] = true;
            traceIntoNode(net, bn, comingFrom);
            return;
          }
        }
        if (DEBUG_WIRE) console.groupEnd();
      }
      function traceIntoNode(net, block, comingFrom) {
        if (DEBUG_WIRE) console.group("traceIntoNode " + net + " " + block + ":" + getBehavior(block) + " " + comingFrom);
        DIRECTIONS.forEach(function (direction) {
          if (String(direction) === String(comingFrom)) {
            // don't look backward
            return;
          }
          
          if (cGraph[block][direction]) {
            // already traced
            return;
          }
          
          var beh = getBehavior(block);
          
          // non-junctions get separate nets, junctions extend nets
          if (beh !== Circuit.behaviors.junction) {
            net = [];
            net.edges = [];
            net.serial = netSerial++;
            net.toString = function () { return "net" + this.serial; };
            nets.push(net);
          }
          
          cGraph[block][direction] = net;
          net.push([block,direction]);
          net["has" + beh.getFace(world, block, direction)] = true;
          traceNet(net, block, direction);
        });
        if (DEBUG_WIRE) { console.groupEnd(); }
      }
      nodes.forEach(function (block) {
        if (DEBUG_WIRE) { console.group("root " + block + ":" + getBehavior(block)); }
        if (getBehavior(block) === Circuit.behaviors.junction) {
          // do not trace from junctions (not implemented yet)
          if (DEBUG_WIRE) { console.groupEnd(); }
          return;
        }
        traceIntoNode(null, block, null);
        if (DEBUG_WIRE) { console.groupEnd(); }
      });
      
      // Delete useless nets and record useful ones.
      // A net is useful if has both an input and an output, or if it has a junction.
      // Useless nets are either straight line o/o or i/i connections, or are when traceNet didn't find something.
      nets.forEach(function (net) {
        if (!((net.hasIN && net.hasOUT) || net.hasINOUT)) {
          net.forEach(function (record) {
            delete cGraph[record[0]][record[1]];
          });
        } else {
          cEdges = cEdges.concat(net.edges); // TODO: kludgy
        }
      });
      
      
      var evaluators = [];
      var seen = {};
      
      //var opush = evaluators.push;
      //evaluators.push = function (f) {
      //  if (player && world === player.getWorld()) {
      //    console.log("adding evaluator: " + f);
      //  }
      //  opush.call(this, f);
      //}
      
      function blockEvaluator(block, faceDirection) {
        compile(block);
        var key = block+"/"+faceDirection;
        return function (state) { return state[key]; };
      }
      
      function netEvaluator(net) {
        compileNet(net);
        var key = net.serial;
        return function (state) { return state[key]; };
      }
      
      function compileNet(net) {
        var key = net.serial;
        if (seen[key]) return;
        seen[key] = true;
        
        //console.group("compiling net " + net);
        
        var getters = [];
        net.forEach(function (record) {
          var block = record[0];
          var faceDirection = record[1];
          if (getBehavior(block).getFace(world, block, faceDirection) === OUT) {
            //console.log("doing connected output face", net.toString(), block, faceDirection);
            getters.push(blockEvaluator(block, faceDirection));
          }
        });
        function evalnet(state) {
          //if (player && world == player.getWorld()) console.log("neteval", key, state[key]);
          var flag = false;
          getters.forEach(function (f) {
            flag = flag || f(state);
          });
          state[key] = flag;
        }
        //evalnet.toString = function () { return ""+key; };
        evaluators.push(evalnet);
        
        //console.groupEnd();
      }
      
      function compile(block, caller) {
        var blockKey = String(block);
        if (seen[blockKey]) { return; }
        seen[blockKey] = true;

        //console.group("compiling block " + block);
        
        var beh = getBehavior(block);
        var inputGetters = {};
        DIRECTIONS.forEach(function (direction) {
          if (beh.getFaceUnrotated(world, block, direction) === IN) {
            var net = cGraph[block][getRot(world, block).transformVector(direction, [])];
            if (net)
              inputGetters[direction] = netEvaluator(net);
          }
        });

        var f = beh.compile(world, block, inputGetters, cNotes);
        //f.toString = function () { return ""+block; };
        evaluators.push(f);
        
        //console.groupEnd();
      }

      // We used to only compile starting from the "output" blocks. This is a nice optimization in principle, but interferes with debugging circuits since they show their connectivity but have all values undefined. Instead, we...
      // Make sure every net has its value computed
      nets.forEach(compileNet);
      // Make sure every block (outputs in particular) has had its turn (even if it has no connected nets)
      nodes.forEach(compile);
      
      evaluate = function (state) {
        if (!state) state = {};
        evaluators.forEach(function (f) { f(state); });
      };
      
      Object.freeze(cNotes);
    };
    this.evaluate = function (state) {
      evaluate(state);
    };
    this.refreshLocal = function () {
      localState = {
        allowWorldEdit: true
      };
      evaluate(localState);
    };
    this.getNotes = function () { return cNotes; };
    this.getEdges = function () { // for circuit visualization
      return cEdges;
    };
    this.getNetValue = function (net) { // for circuit visualization
      return localState[net.serial];
    };
    
    // For circuit testing. Return the value output by the given face of the given block.
    this.getBlockOutput = function (block, face) { 
      if (getBehavior(block) === behaviors.junction) {
        // junctions don't have output data, so look up the net
        return localState[cGraph[block]["1,0,0"].serial];
      } else {
        // look up specific face output
        return localState[Array.prototype.slice.call(block) + "/" + Array.prototype.slice.call(face)];
      }
    } 
    this.describeBlock = function (block) {
      var graph = cGraph[block];
      if (!graph) return "Wire";
      var s = "";
      if (getBehavior(block) === Circuit.behaviors.junction) {
        // junctions are symmetric, so don't be redundant
        var net = graph["1,0,0"];
        if (net) {
          s = "\n(" + net.serial + ") = " + localState[net.serial];
        }
      } else {
        DIRECTIONS.forEach(function (direction) {
          var net = graph[direction];
          if (net) {
            s += "\n" + directionsPretty[direction] + " (" + net.serial + ")";
            switch (getBehavior(block).getFace(world, block, direction)) {
              case OUT: 
                s += " \u2190 " + localState[block+"/"+direction];
                break;
              case IN:
                s += " = " + localState[net.serial];
                break;
            }
          }
        });
      }
      return s;
    };
    
    Object.freeze(this);
  }
  
  var behaviors = Circuit.behaviors = {};
  
  (function () {
    function nb(name, proto) {
      var beh = Object.create(proto);
      beh.name = name;
      behaviors[name] = beh;
      return beh;
    }
    function compileOutput(world, block, faces) {
      var outRot = getRot(world, block);
      var keys = faces.map(function (face) {
        var rotFace = outRot.transformVector(face, []);
        return block + "/" + rotFace;
      });
      return function (state, value) {
        keys.forEach(function (key) { state[key] = value; });
      }
    }
    function combineInputs(inputs, faces) {
      // TODO: combine more cleverly than 'or'
      var inputEvals = [];
      faces.forEach(function (direction) {
        if (inputs[direction])
          inputEvals.push(inputs[direction]);
      });
      return function (state) {
        var flag = false;
        inputEvals.forEach(function (f) {
          flag = flag || f(state);
        });
        return flag;
      };
    }
    
    var protobehavior = {};
    protobehavior.faces = dirKeys(NONE);
    protobehavior.executeForBlock = function (world, cube, subDatum) {};
    protobehavior.getFaceUnrotated = function (world, block, face) {
      return this.faces[face];
    };
    protobehavior.getFace = function (world, block, face) {
      var faceValue = this.getFaceUnrotated(world, block, getRot(world, block).inverse.transformVector(face, []));
      if (faceValue === undefined) throw new Error("shouldn't happen");
      return faceValue;
    };

    var inputOnlyBeh = Object.create(protobehavior);
    inputOnlyBeh.faces = dirKeys(IN);
    
    var outputOnlyBeh = Object.create(protobehavior);
    outputOnlyBeh.faces = dirKeys(OUT);

    // Special behavior -- wires are not nodes
    nb("wire", protobehavior);    
    
    // Special behavior -- junctions are bidirectional
    var junction = nb("junction", protobehavior);
    junction.faces = dirKeys(INOUT);
    
    // --- Ordinary behaviors (alphabetical order) ---
    
    // Become another block, by numeric ID.
    var become = nb("become", inputOnlyBeh);
    become.compile = function (world, block, inputs) {
      var input = combineInputs(inputs, DIRECTIONS);
      return function (state) {
        var i = input(state);
        if (typeof i === "number" && "blockOut_effects" in state) {
          var outerWorld = state.blockIn_world;
          state.blockOut_effects.push(
            [ZEROVEC, [Math.floor(mod(i, 256))]]);
        }
      };
    };
    
    // Emits on +X the count of side inputs which are equal to the -X input
    var count = nb("count", protobehavior);
    count.faces = dirKeys(IN);
    count.faces["1,0,0"] = OUT;
    count.compile = function (world, block, inputs) {
      // TODO refactor
      var valueInput = inputs[[-1,0,0]] || function () { return null; };
      var aInput     = inputs[[0,1,0]]  || function () { return null; };
      var bInput     = inputs[[0,-1,0]] || function () { return null; };
      var cInput     = inputs[[0,0,1]]  || function () { return null; };
      var dInput     = inputs[[0,0,-1]] || function () { return null; };
      var out = compileOutput(world, block, [[1,0,0]]);
      return function (state) {
        var toCount = valueInput(state);
        out(state, 
          (aInput(state) == toCount ? 1 : 0) +
          (bInput(state) == toCount ? 1 : 0) +
          (cInput(state) == toCount ? 1 : 0) +
          (dInput(state) == toCount ? 1 : 0));
      };
    };
    
    // "Gate" gate - Emits -X value on +X if a surrounding input is true
    var gate = nb("gate", protobehavior);
    gate.faces = dirKeys(IN);
    gate.faces["1,0,0"] = OUT;
    gate.compile = function (world, block, inputs) {
      var gateInput = combineInputs(inputs, [[0,-1,0],[0,1,0],[0,0,-1],[0,0,1]]);
      var valueInput = inputs[[-1,0,0]] || function () { return null; };
      var out = compileOutput(world, block, [[1,0,0]]);
      return function (state) {
        out(state, gateInput(state) ? valueInput(state) : null);
      };
    };
    
    var getContact = nb("getContact", outputOnlyBeh);
    getContact.compile = function (world, block, inputs) {
      var myLookVectorStr = getRot(world, block).transformVector(UNIT_NX, []).toString();
      var out = compileOutput(world, block, DIRECTIONS);
      return function (state) {
        var world, faces;
        out(state, (world = state.blockIn_world)
            ? !!(
                (faces = world.getContacts(state.blockIn_cube)) &&
                faces[myLookVectorStr]
              )
            : null);
      };
    };
    
    var getSubDatum = nb("getSubDatum", outputOnlyBeh);
    getSubDatum.compile = function (world, block, inputs) {
      var out = compileOutput(world, block, DIRECTIONS);
      return function (state) {
        if (state.blockIn_world) {
          var bic = state.blockIn_cube;
          out(state, state.blockIn_world.gSubv(bic));
        } else {
          out(state, null);
        }
      };
    };
    
    // Get the ID of the block in the -X direction, either inner or outer
    var getNeighborID = nb("getNeighborID", outputOnlyBeh);
    getNeighborID.compile = function (world, block, inputs) {
      var out = compileOutput(world, block, DIRECTIONS);
      var myLookVector = getRot(world, block).transformVector(UNIT_NX);
      var neighborInner = vec3.add(myLookVector, block, vec3.create());
      return function (state) {
        var nworld, ncube;
        if (state.blockIn_world) {
          nworld = state.blockIn_world;
          ncube = vec3.add(getRot(state.blockIn_world, state.blockIn_cube).transformVector(myLookVector),
                           state.blockIn_cube);
        } else {
          nworld = world;
          ncube = neighborInner;
        }
        out(state, nworld.gv(ncube));
      };
    };
    
    var indicator = nb("indicator", inputOnlyBeh);
    indicator.compile = function (world, block, inputs) {
      var input = combineInputs(inputs, DIRECTIONS);
      return function (state) {
        var flag = !!input(state);
        //if (player && world === player.getWorld()) { console.log("evaluating indicator", block, inputs, "got", flag); }
        var cur = world.gSubv(block);
        if (flag !== cur && state.allowWorldEdit) {
          world.sSubv(block, flag ? 1 : 0);
        }
      };
    };
    
    var nor = nb("nor", protobehavior);
    nor.faces = dirKeys(OUT);
    nor.faces["1,0,0"] = nor.faces["-1,0,0"] = IN;
    nor.compile = function (world, block, inputs) {
      var input = combineInputs(inputs, [[-1,0,0],[1,0,0]]);
      var out = compileOutput(world, block, [
        [0,0,1],
        [0,0,-1],
        [0,1,0],
        [0,-1,0]
      ]);
      return function (state) {
        out(state, !input(state));
      };
    };
    
    // Cause a neighbor to become another block, by numeric ID.
    var put = nb("put", inputOnlyBeh);
    put.compile = function (world, block, inputs) {
      var input = combineInputs(inputs, DIRECTIONS);
      var myLookVector = getRot(world, block).transformVector(UNIT_PX);
      return function (state) {
        var i = input(state);
        if (typeof i === "number" && "blockOut_effects" in state) {
          var outerWorld = state.blockIn_world;
          state.blockOut_effects.push([myLookVector, [Math.floor(mod(i, 256)), 0]]);
        }
      };
    };
    
    var setRotation = nb("setRotation", inputOnlyBeh);
    setRotation.compile = function (world, block, inputs) {
      var input = combineInputs(inputs, DIRECTIONS);
      return function (state) {
        state.blockOut_rotation = input(state);
      };
    };
    
    // Normally null; occasionally emits a numeric value.
    // The value emitted is 1 divided by the (probabilistic) rate of events per second.
    var spontaneous = nb("spontaneous", outputOnlyBeh);
    spontaneous.compile = function (world, block, inputs) {
      var out = compileOutput(world, block, DIRECTIONS);
      return function (state) {
        out(state, state.blockIn_spontaneous || null);
      };
    };
  
    // This behavior evaluates a block's inner circuit.
    var ic = nb("ic", protobehavior);
    ic.faces = "<DYNAMIC>"; // bogus, shouldn't be noticed
    ic.getFaceUnrotated = function (world, block, face) {
      // TODO this is overly long considering how often it's called in a compile; perhaps have the block type cache some info?
      var type = world.gtv(block);
      if (!type.world) {
        if (typeof console !== 'undefined')
          console.warn("IC behavior applied to non-world block type!");
        return NONE;
      }
      var hasIn = false;
      var hasOut = false;
      type.world.getCircuits().forEach(function (circuit) {
        var notes = circuit.getNotes();
        hasIn  = hasIn  || notes["icInput_" + face];
        hasOut = hasOut || notes["icOutput_" + face];
      });
      // NOTE: Prioritizes inputs because hasIn may be bogus: precise detection of icInput connectivity is not implemented
      return hasOut ? OUT : hasIn ? IN : NONE;
    };
    ic.compile = function (world, block, inputs) {
      var type = world.gtv(block);
      if (!type.world) {
        if (typeof console !== 'undefined')
          console.warn("IC behavior applied to non-world block type!");
        return;
      }
      var circuitsArr = [];
      type.world.getCircuits().forEach(function (circuit) {
        circuitsArr.push(circuit);
      });
      
      var inTable = [];
      var outTable = [];
      DIRECTIONS.map(function (dir) {
        var faceType = ic.getFaceUnrotated(world, block, dir);
        if (faceType === IN) {
          inTable.push(["blockIn_input_" + dir, inputs[dir] || function () { return undefined; }]);
        }
        if (faceType === OUT) {
          outTable.push([compileOutput(world, block, [dir]), "blockOut_output_" + dir]);
        }
      });
      
      return function (state) {
        circuitsArr.forEach(function (circuit) {
          //console.group("evaluating IC at", block);
          var subState = {
            blockIn_world: world,
            blockIn_cube: block
          };
          inTable.forEach(function (r) {
            //console.log("importing to ic", r[0], r[1](state));
            subState[r[0]] = r[1](state);
          });
          circuit.evaluate(subState);
          outTable.forEach(function (r) {
            //console.log("exporting from ic", r[1], subState[r[1]]);
            if (r[1] in subState) { // this test needed because multiple circuits are evaluated. TODO: build the inTable and outTable on a per-circuit basis so we don't evaluate irrelevant circuits, or re-evaluate circuits with inputs
              r[0](state, subState[r[1]]);
            }
          });
          //console.groupEnd("evaluating IC at", block);
        });
      };
    };
    
    var icInput = nb("icInput", outputOnlyBeh);
    icInput.compile = function (world, block, inputs, notes) {
      var table = DIRECTIONS.map(function (dir) {
        // TODO Give a nice way to detect whether our faces are connected so as to report accurately in notes
        notes["icInput_" + dir] = true;
        return [compileOutput(world, block, [vec3.scale(dir, -1, [])]), "blockIn_input_" + dir];
      });
      return function (state) {
        table.forEach(function (r) {
          r[0](state, state[r[1]]);
        });
      };
    };

    var icOutput = nb("icOutput", inputOnlyBeh);
    icOutput.compile = function (world, block, inputs, notes) {
      var table = [];
      DIRECTIONS.forEach(function (dir) {
        var input = inputs[vec3.scale(dir, -1, [])];
        if (input) {
          notes["icOutput_" + dir] = true;
          table.push(["blockOut_output_" + dir, input]);
        }
      });
      return function (state) {
        table.forEach(function (r) {
          // TODO detect/handle conflicts among multiple outputs
          state[r[0]] = r[1](state);
        });
      };
    };
  
    Object.freeze(behaviors);
  }());
  
  Circuit.executeCircuitInBlock = function (blockWorld, outerWorld, cube, subDatum, extraState) {
    var effects = [];
    blockWorld.getCircuits().forEach(function (circuit) {
      var state = extraState ? Object.create(extraState) : {};
      state.blockIn_world = outerWorld;
      state.blockIn_cube = cube;
      state.blockOut_effects = effects;
      
      circuit.evaluate(state);
      
      // Rotations are only assigned when the circuit is being evaluated in the normal case, not during an instantanous event such as the spontaneous event
      if ("blockOut_rotation" in state && !extraState) {
         outerWorld.rawRotations[(cube[0]*outerWorld.wy+cube[1])*outerWorld.wz+cube[2]] // TODO KLUDGE
          = CubeRotation.canonicalCode(state.blockOut_rotation);
        // This does not need a change notification, because rotations are not true state, but always a function of the world state (note that extraState must be omitted).
      }
    });
    
    // Transform from block reference frame to world reference frame.
    // This is done now so that the effects of blockOut_rotation are already
    // applied.
    var theCubeRot = getRot(outerWorld, cube);
    return effects.map(function (record) {
      var relativeCube = record[0];
      var effect = record[1];
      return [
        vec3.add(theCubeRot.transformVector(relativeCube), cube),
        effect
      ];
    });
  };
  
  return Object.freeze(Circuit);
}());;
