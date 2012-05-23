// Copyright 2011-2012 Kevin Reid under the terms of the MIT License as detailed
// in the accompanying file README.md or <http://opensource.org/licenses/MIT>.

var CubesControlBindingUI;
var Input;
(function () {
  "use strict";
  
  function parseEvent(ev) {
    switch (ev.type) {
      case "keydown":
      case "keyup":
        // NOTE: Per MDN <https://developer.mozilla.org/en/DOM/KeyboardEvent> the keyCode attribute is deprecated (but its replacement is not yet implemented in Gecko)
        // TODO: Research the best way to express keybindings
        return ["key", ev.keyCode];
        break;
      case "mousedown":
      case "mouseup":
        if (ev.buttons) { 
          // Per <https://developer.mozilla.org/en/DOM/MouseEvent>
          // This is the preferred definition because it supports >3 buttons.
          // take lowest bit of buttons mask
          var bit = 0, buttons = ev.buttons;
          while (!(buttons & 1)) {
            bit++;
            buttons = buttons >> 1;
          }
          return ["mouse", bit];
        } else {
          switch (ev.button) {
            case 0: return ["mouse", 0];
            case 1: return ["mouse", 2];
            case 2: return ["mouse", 1];
          }
        }
        break;
      case "mousewheel":
        return ["wheel", signum(ev.wheelDeltaX), signum(ev.wheelDeltaY)];
      default:
        return null;
    }
  }
  
  function ControlChip(value, set, deleter) {
    var el = document.createElement("span");
    el.className = "control-chip";
    el.style.position = "relative"; // context for delete button
    this.element = el;
    
    if (value === null) {
      el.textContent = "…";
      el.classList.add("control-chip-placeholder");
    } else {
      var desc;
      switch (value[0]) {
        case "key":
          switch (value[1]) {
            // TODO are the constants available somewhere?
            // I generated this table from MDN content
            // <https://developer.mozilla.org/en/DOM/KeyboardEvent>
            // perl -pe 's/^(.*?)\t(.*?)\t(.*?) key.$/case $2: desc = "$3";/; s/^DOM_VK_(.*?)\t(.*?)\t(.*?).$/case $2: desc = "\L$1";/;'
            case   3: desc = "cancel"; break;
            case   6: desc = "help"; break;
            case   8: desc = "backspace"; break;
            case   9: desc = "tab"; break;
            case  12: desc = "clear"; break;
            case  13: desc = "return"; break;
            case  14: desc = "enter"; break;
            case  16: desc = "shift"; break;
            case  17: desc = "control"; break;
            case  18: desc = "alt"; break;
            case  19: desc = "pause"; break;
            case  20: desc = "caps lock"; break;
            case  27: desc = "escape"; break;
            case  28: desc = "convert"; break;
            case  29: desc = "nonconvert"; break;
            case  30: desc = "accept"; break;
            case  31: desc = "modechange"; break;
            case  32: desc = "space"; break;
            case  33: desc = "page up"; break;
            case  34: desc = "page down"; break;
            case  35: desc = "end"; break;
            case  36: desc = "home"; break;
            case  37: desc = "←"; break;
            case  38: desc = "↑"; break;
            case  39: desc = "→"; break;
            case  40: desc = "↓"; break;
            case  41: desc = "select"; break;
            case  41: desc = "select"; break;
            case  42: desc = "print"; break;
            case  42: desc = "print"; break;
            case  43: desc = "execute"; break;
            case  43: desc = "execute"; break;
            case  44: desc = "print screen"; break;
            case  45: desc = "ins"; break;
            case  46: desc = "del"; break;
            case  48: desc = "0"; break;
            case  49: desc = "1"; break;
            case  50: desc = "2"; break;
            case  51: desc = "3"; break;
            case  52: desc = "4"; break;
            case  53: desc = "5"; break;
            case  54: desc = "6"; break;
            case  55: desc = "7"; break;
            case  56: desc = "8"; break;
            case  57: desc = "9"; break;
            case  59: desc = ";"; break;
            case  61: desc = "="; break;
            case  65: desc = "A"; break;
            case  66: desc = "B"; break;
            case  67: desc = "C"; break;
            case  68: desc = "D"; break;
            case  69: desc = "E"; break;
            case  70: desc = "F"; break;
            case  71: desc = "G"; break;
            case  72: desc = "H"; break;
            case  73: desc = "I"; break;
            case  74: desc = "J"; break;
            case  75: desc = "K"; break;
            case  76: desc = "L"; break;
            case  77: desc = "M"; break;
            case  78: desc = "N"; break;
            case  79: desc = "O"; break;
            case  80: desc = "P"; break;
            case  81: desc = "Q"; break;
            case  82: desc = "R"; break;
            case  83: desc = "S"; break;
            case  84: desc = "T"; break;
            case  85: desc = "U"; break;
            case  86: desc = "V"; break;
            case  87: desc = "W"; break;
            case  88: desc = "X"; break;
            case  89: desc = "Y"; break;
            case  90: desc = "Z"; break;
            case  91: desc = "⌘"; break;
            case  93: desc = "menu"; break;
            case  95: desc = "sleep"; break;
            case  96: desc = "[0]"; break;
            case  97: desc = "[1]"; break;
            case  98: desc = "[2]"; break;
            case  99: desc = "[3]"; break;
            case 100: desc = "[4]"; break;
            case 101: desc = "[5]"; break;
            case 102: desc = "[6]"; break;
            case 103: desc = "[7]"; break;
            case 104: desc = "[8]"; break;
            case 105: desc = "[9]"; break;
            case 106: desc = "[*]"; break;
            case 107: desc = "[+]"; break;
            case 108: desc = "separator"; break;
            case 109: desc = "[-]"; break;
            case 110: desc = "[.]"; break;
            case 111: desc = "[/]"; break;
            case 112: desc = "F1"; break;
            case 113: desc = "F2"; break;
            case 114: desc = "F3"; break;
            case 115: desc = "F4"; break;
            case 116: desc = "F5"; break;
            case 117: desc = "F6"; break;
            case 118: desc = "F7"; break;
            case 119: desc = "F8"; break;
            case 120: desc = "F9"; break;
            case 121: desc = "F10"; break;
            case 122: desc = "F11"; break;
            case 123: desc = "F12"; break;
            case 124: desc = "F13"; break;
            case 125: desc = "F14"; break;
            case 126: desc = "F15"; break;
            case 127: desc = "F16"; break;
            case 128: desc = "F17"; break;
            case 129: desc = "F18"; break;
            case 130: desc = "F19"; break;
            case 131: desc = "F20"; break;
            case 132: desc = "F21"; break;
            case 133: desc = "F22"; break;
            case 134: desc = "F23"; break;
            case 135: desc = "F24"; break;
            case 144: desc = "num lock"; break;
            case 145: desc = "scroll lock"; break;
            case 188: desc = ","; break;
            case 190: desc = "."; break;
            case 191: desc = "/"; break;
            case 192: desc = "\""; break;
            case 192: desc = "`"; break;
            case 219: desc = "["; break;
            case 221: desc = "]"; break;
            case 222: desc = "\\"; break; // platform hazard
            case 224: desc = "meta"; break;
            default:
              if (value[1] > 33 && value[1] < 127) {
                desc = String.fromCharCode(value[1]);
              } else {
                desc = "key " + value[1]; break;
              }
          }
          break;
        case "mouse":
          desc = "Mouse " + (value[1] + 1);
          break;
        case "wheel":
          switch (String(value)) {
            case "wheel,0,-1": desc = "Wheel ↑"; break;
            case "wheel,0,1" : desc = "Wheel ↓"; break;
            case "wheel,-1,0": desc = "Wheel ←"; break;
            case "wheel,1,0" : desc = "Wheel →"; break;
            default: desc = "Wheel " + value.slice(1).toString(); break;
          }
          break;
        default:
          desc = String(value);
          break;
      }
      el.textContent = desc;
    }
    
    var active = false;
    var deleteButton;
    
    function activate() {
      if (active) return;
      active = true;
      el.tabIndex = 0;
      el.focus();
      
      if (deleter) {
        deleteButton = document.createElement("button");
        deleteButton.textContent = "×";
        deleteButton.className = "control-unbind-button";
        deleteButton.style.position = "absolute";
        deleteButton.style.zIndex = "1";
        el.parentElement.appendChild(deleteButton);
        var inset = 0.2;
        deleteButton.style.left = (el.offsetLeft + el.offsetWidth - deleteButton.offsetWidth * inset) + "px";
        deleteButton.style.top = (el.offsetTop - deleteButton.offsetHeight * (1 - inset)) + "px";
        deleteButton.addEventListener("mousedown", function (e) {
          // mousedown, not click, because this has to be instant or it gets deleted by the blur handler
          deleter();
          return true;
        }, false);
      }
    }
    
    function deactivate() {
      if (!active) return;
      active = false;
      el.tabIndex = -1;
      if (deleteButton) {
        if (deleteButton.parentElement) deleteButton.parentElement.removeChild(deleteButton);
        deleteButton = undefined;
      }
      el.blur();
    }
    
    el.addEventListener("click", function (ev) {
      activate();
      ev.stopPropagation();
      return false;
    }, false);
    
    function generalListener(ev) {
      if (active) {
        deactivate();
        ev.preventDefault();
        set(parseEvent(ev));
        return false;
      } else {
        return true;
      }
    }
    
    el.addEventListener("keydown", generalListener, false);
    el.addEventListener("keyup", generalListener, false);
    el.addEventListener("mousedown", generalListener, false);
    el.addEventListener("mouseup", generalListener, false);
    el.addEventListener("mousewheel", generalListener, false);
    
    // allow to become a mousedown
    el.addEventListener("contextmenu", function (ev) { 
      ev.preventDefault();
      return false;
    }, false);
    
    el.addEventListener("blur", function () {
      setTimeout(deactivate, 0);
    }, false);
  }
  ControlChip.prototype.conflict = function () {
    this.element.classList.add("control-chip-conflict");
  }
  
  function ControlBindingUI(bindingsCell, rowContainer) {
    var commands = Input.commands;
    
    var commandToContainer = {};
    Object.keys(commands).forEach(function (commandName) {
      var row = document.createElement("tr");
      rowContainer.appendChild(row);

      var labelCell = document.createElement("td");
      row.appendChild(labelCell);
      labelCell.textContent = commands[commandName].label;

      var controlsCell = document.createElement("td");
      row.appendChild(controlsCell);
      
      var bindingsContainer = document.createElement("span");
      controlsCell.appendChild(bindingsContainer);
      commandToContainer[commandName] = bindingsContainer;
      
      var placeholderChip = new ControlChip(null, function (newControl) {
        bindingsCell.set(bindingsCell.get().concat([[commandName, newControl]]));
      });
      controlsCell.appendChild(placeholderChip.element);
    });
    
    function updateBindings() {
      var bindings = bindingsCell.get();
      var conflictMap = {};
      Object.keys(commandToContainer).forEach(function (key) {
        commandToContainer[key].textContent = "";
      });
      bindings.forEach(function (bindingRecord, index) {
        var commandName = bindingRecord[0];
        var control = bindingRecord[1];
        
        var container = commandToContainer[commandName];
        var chip = new ControlChip(control, function (newControl) {
          var newBindings = bindings.slice();
          newBindings[index] = [newBindings[index][0], newControl];
          bindingsCell.set(newBindings);
        }, function () {
          var newBindings = bindings.slice();
          if (index < bindings.length - 1) {
            newBindings[index] = newBindings.pop();
          } else {
            newBindings.pop();
          }
          bindingsCell.set(newBindings);
        });
        container.appendChild(chip.element);
        container.appendChild(document.createTextNode(" "));
        
        var conflictList = conflictMap[control] || (conflictMap[control] = []);
        conflictList.push(chip);
        if (conflictList.length > 1) {
          conflictList[conflictList.length - 1].conflict();
        }
        if (conflictList.length == 2) {
          conflictList[0].conflict();
        }
      });
    }
    bindingsCell.nowAndWhenChanged(function () {
      updateBindings();
      return true;
    })
  }
  
  function Input_(config, eventReceiver, playerInput, hud, renderer, focusCell, save) {
    var interfaceMode;
    var expectingPointerLock = false;
    
    var mousePos = null;
    
    var quickSlots;
    var quickSlotLRU;
    
    // --- Utilities ---
    
    function evalVel(pos, neg) {
      return pos ? neg ? 0 : 1 : neg ? -1 : 0;
    }
    
    function quick(n) {
      playerInput.tool = quickSlots[n];
    }
  
    function clearChildren(elem) {
      while (elem.firstChild) elem.removeChild(elem.firstChild);
    }
    
    // --- Focus ---
    
    eventReceiver.addEventListener("focus", function (event) {
      focusCell.set(true);
      return true;
    }, false);
    eventReceiver.addEventListener("blur", function (event) {
      focusCell.set(false);
      resetHeldControls();
      return true;
    }, false);
    
    // This is used as the conditiopn to inhibit focus-granting clicks from modifying the world. Simply checking focusCell is insufficient (due to focusiing happening before the event) in at least one case: when focus is on Chrome's Web Inspector.
    var delayedFocus = false;
    
    focusCell.whenChanged(function (value) {
      setTimeout(function () { 
        delayedFocus = value;
        
        if (!value) {
          // Blur is probably a good time to autosave
          save();
        }
        interfaceMode.focus(value);
      }, 0);
      return true;
    });
    
    // --- Events for configurable controls ---
    
    var heldControls = {};
    var commandState = {};
    var heldCommands = {};
    function resetHeldControls() {
      heldControls = {};
      Object.keys(Input_.commands).forEach(function (k) { 
        commandState[k] = {
          command: commandFunctions[k],
          controlCount: 0,
          repeatPhase: 0
        };
      });
      evalHeldControls();
    }
    
    // Construct commands augmented with implementation functions
    var commandFunctions = {};
    function deffunbase(name) {
      var command = Input_.commands[name];
      if (!command) throw new Error("inconsistent table");
      var cmdWithFunc = commandFunctions[name] = Object.create(command);
      cmdWithFunc.name = name;
      return cmdWithFunc;
    }
    function defhold(name) {
      var cmdWithFunc = deffunbase(name);
      cmdWithFunc.press = function () {};
    }
    function defaction(name, func) {
      var cmdWithFunc = deffunbase(name);
      cmdWithFunc.press = func;
    }
    defhold("left");
    defhold("right");
    defhold("forward");
    defhold("backward");
    defhold("up");
    defhold("down");
    defaction("jump", function () {
      playerInput.jump();
    });
    defaction("quick0", function () { quick(0); });
    defaction("quick1", function () { quick(1); });
    defaction("quick2", function () { quick(2); });
    defaction("quick3", function () { quick(3); });
    defaction("quick4", function () { quick(4); });
    defaction("quick5", function () { quick(5); });
    defaction("quick6", function () { quick(6); });
    defaction("quick7", function () { quick(7); });
    defaction("quick8", function () { quick(8); });
    defaction("quick9", function () { quick(9); });
    defaction("interfaceMode", function () {
      switchMode(interfaceMode.mouselookKeyTransition);
    });
    defaction("enterWorld", function () {
      playerInput.changeWorld(+1);
    });
    defaction("exitWorld", function () {
      playerInput.changeWorld(-1);
    });
    defaction("subdatumInc", function () {
      playerInput.tweakSubdata(+1);
    });
    defaction("subdatumDec", function () {
      playerInput.tweakSubdata(-1);
    });
    defaction("editBlockset", function () {
      switchMode(fullMenuMode);
      eventReceiver.blur();
    });
    defaction("useTool", function () {
      playerInput.useTool();
    });
    defaction("deleteBlock", function () {
      playerInput.deleteBlock();
    });
    
    var controlMap;
    function rebuildControlMap(bindings) {
      controlMap = {};
      
      bindings.forEach(function (bindingRecord) {
        var commandName = bindingRecord[0];
        var control = bindingRecord[1];
        controlMap[control] = commandFunctions[commandName];
        if (!commandFunctions[commandName]) {
          if (typeof console !== "undefined") {
            console.warn("No function for command", commandName);
          }
        }
      })
      resetHeldControls();
      
      return true;
    }
    config.controls.nowAndWhenChanged(rebuildControlMap);
    
    function evalHeldControls() {
      playerInput.movement = [
        evalVel(heldCommands.right,    heldCommands.left),
        evalVel(heldCommands.up,       heldCommands.down),
        evalVel(heldCommands.backward, heldCommands.forward)
      ];
    }
    
    function stepControlRepeat(timestep) {
      for (var name in heldCommands) {
        if (!heldCommands.hasOwnProperty(name)) continue;
        var state = heldCommands[name];

        var period = state.command.repeatPeriod;
        if (typeof period !== "number") continue;
        
        state.repeatPhase += timestep;
        while (state.repeatPhase > period) {
          state.command.press();
          state.repeatPhase -= period;
        }
      }
    }
    
    function controlPressHandler(event) {
      // avoid disturbing browser shortcuts
      if (event.altKey || event.ctrlKey || event.metaKey) return true;
      
      var control = parseEvent(event);
      var command = controlMap[control];
      
      if (command) {
        if (!heldControls.hasOwnProperty(control)) {
          command.press();
          var state = commandState[command.name];
          if (state.controlCount++ <= 0) {
            heldControls[control] = true;
            heldCommands[command.name] = state;
            state.repeatPhase = -state.command.repeatDelay;
          }
          //console.log("hold +", control, command.name, commandState[command.name]);
          evalHeldControls();
        }
        
        event.stopPropagation();
        return false;
      } else {
        return true;
      }
    }
    
    function controlReleaseHandler(event) {
      var control = parseEvent(event);
      var command = controlMap[control];
      
      if (heldControls.hasOwnProperty(control)) {
        delete heldControls[control];
        var state = commandState[command.name];
        if (--state.controlCount <= 0) {
          delete heldCommands[command.name];
        }
        //console.log("hold -", control, command.name, commandState[command.name]);
        evalHeldControls();
        
        event.stopPropagation();
        return false;
      } else {
        return true;
      }
    }
    
    function controlMomentaryHandler(event) {
      var r = controlPressHandler(event);
      controlReleaseHandler(event);
      return r;
    }
    
    // Keyboard events
    eventReceiver.addEventListener("keydown", controlPressHandler, false);
    eventReceiver.addEventListener("keyup", controlReleaseHandler, false);
    document.addEventListener("keyup", controlReleaseHandler, false);
      // also on document to catch key-ups after focus changes etc.
    
    // Mouse events
    eventReceiver.addEventListener("mousedown", function (event) {
      updateMouseFromEvent(event);
      if (delayedFocus) {
        controlPressHandler(event);
      } else {
        // Don't respond to focus-granting click
        eventReceiver.focus();
      }
      event.preventDefault(); // inhibits text selection
      return false;
    }, false);
    eventReceiver.addEventListener("mouseup", controlReleaseHandler, false);
    eventReceiver.addEventListener("mousewheel", controlMomentaryHandler, false);
    
    eventReceiver.addEventListener("contextmenu", function (event) {
      event.preventDefault(); // inhibits context menu (on the game world only) since we use right-click for our own purposes
    }, false);
    
    // Initialization
    resetHeldControls();
    
    // TODO: Implement repeat on held down button
    
    // --- Mouselook ---
    
    var CENTER = {};
    var dx = 0;
    var prevx = 0;
    
    function applyMousePosition() {
      var cs = window.getComputedStyle(eventReceiver, null);
      var w = parseInt(cs.width, 10);
      var h = parseInt(cs.height, 10);
      
      if (mousePos === CENTER) {
        playerInput.mousePos = [w/2, h/2];
        return;
      }
      
      if (!focusCell.get() || mousePos === null) {
        playerInput.mousePos = null;
        dx = 0;
        return;
      } else {
        playerInput.mousePos = mousePos;
      }
      
      var swingY = mousePos[1] / (h*0.5) - 1;
      var swingX = mousePos[0] / (w*0.5) - 1;
      
      var directY = -Math.PI/2 * swingY;
      var directX = -Math.PI/2 * swingX;
      
      if (interfaceMode.mouselook) {
        playerInput.pitch = directY;
        playerInput.yaw += (directX - prevx);
        dx = -(config.mouseTurnRate.get()) * deadzone(swingX, 0.1);
      } else {
        dx = 0;
      }
      prevx = directX;
    }
    focusCell.whenChanged(function (value) {
      applyMousePosition();
      return true;
    });
    
    function updateMouseFromEvent(event) {
      if (document.pointerLockEnabled/*shimmed*/ || expectingPointerLock) {
        mousePos = CENTER;
        dx = 0;
      } else if (event && !expectingPointerLock) {
        mousePos = [event.clientX, event.clientY];
      }
      applyMousePosition();
    }
    
    eventReceiver.addEventListener("mousemove", function (event) {
      updateMouseFromEvent(event);
      
      if (document.pointerLockEnabled/*shimmed*/ || expectingPointerLock) {
        // This is not in updateMouseFromEvent because movement* are updated only on mousemove events, even though they are provided on all events.
      
        // TODO this is duplicative-ish of applyMousePosition. We need a refactoring...
      
        var my = event.movementY/*shimmed*/;
        var mx = event.movementX/*shimmed*/;
        mx = mx || 0; // TODO Why are movement* sometimes undefined?
        my = my || 0;
        
        var swingY = -Math.PI/2 * my / 300; // TODO user config
        var swingX = -Math.PI/2 * mx / 300;
        
        playerInput.pitch = Math.min(Math.PI/2, Math.max(-Math.PI/2, playerInput.pitch + swingY));
        playerInput.yaw += swingX;
      }
    }, false);
    eventReceiver.addEventListener("mouseout", function (event) {
      mousePos = null;
      applyMousePosition();
      return true;
    }, false);
    
    // --- Fullscreen and pointer lock (experimental browser APIs) ---
    
    // game-shim.js provides these facilities as stubs if the browser does not, so this code contains no conditionals.
    
    var fullScreenElement = document.body;
    
    //console.log("Pointer lock supported:", GameShim.supports.pointerLock);
    
    document.addEventListener("fullscreenchange"/*shimmed*/, updatePointerLock, false);
    document.addEventListener("fullscreenerror"/*shimmed*/, function (event) {
      console.info("Fullscreen entry error", event);
    }, false);
    
    this.requestFullScreen = function () {
      fullScreenElement.requestFullScreen/*shimmed*/(Element.ALLOW_KEYBOARD_INPUT /* TODO this is a webkitism */);
    };
    
    function updatePointerLock() {
      if (interfaceMode.mouselook) {
        eventReceiver.requestPointerLock/*shimmed*/();
        expectingPointerLock = GameShim.supports.pointerLock;
        updateMouseFromEvent(null);
        setTimeout(function () {
           // TODO should be on pointer lock callback but that's not supported by the shim
           expectingPointerLock = false;
           updateMouseFromEvent(null);
        }, 20);
      } else {
        document.exitPointerLock/*shimmed*/();
      }
    };
    
    // --- Stepping ---
    
    function step(timestep) {
      if (dx !== 0) {
        playerInput.yaw += dx*timestep;
      }
      
      stepControlRepeat(timestep);
    }
    
    // --- Interface modes ---
    
    var lastAppliedClass;
    function switchMode(newMode) {
      interfaceMode = newMode;
      var cl = document.body.classList;
      if (lastAppliedClass) cl.remove(lastAppliedClass);
      cl.add(lastAppliedClass = "ui-mode-" + interfaceMode.uiClass);
      updatePointerLock();
      applyMousePosition();
    }
    
    var mouselookIMode = {
      mouselook: true,
      uiClass: "hidden",
      focus: function () {}
    };
    
    var menuMode = {
      mouselook: false,
      mouselookKeyTransition: mouselookIMode,
      uiClass: "menu",
      focus: function () {}
    };
    mouselookIMode.mouselookKeyTransition = menuMode;
    
    var fullMenuMode = {
      mouselook: false,
      mouselookKeyTransition: menuMode,
      uiClass: "full",
      focus: function (focused) { if (focused) switchMode(mouselookIMode); }
    };
    
    var allUIClasses = ["full", "menu", "hidden"];
    
    interfaceMode = mouselookIMode;
    
    // --- Block menu ---
    
    var QUICK_SLOT_COUNT = 10;
    
    var menuItemsByBlockId;
    var quickItemsByBlockId;
    var blocksetInMenu;
    
    function deferrer(func) {
      var set = false;
      return function () {
        if (!set) {
          setTimeout(function () {
            set = false;
            func();
          }, 0);
          set = true;
        }
      }
    }
    
    function resetQuick() {
      quickSlots = [];
      quickSlotLRU = [];
      for (var i = 0; i < QUICK_SLOT_COUNT; i++) {
        quickSlots[i] = i + 1; // block ids starting from 1
        quickSlotLRU[i] = QUICK_SLOT_COUNT - (i + 1); // reverse order
      }
    }
    resetQuick();
    
    function forAllMenuBlocks(f) {
      for (var i = 1; i < blocksetInMenu.length; i++) f(i, menuItemsByBlockId[i]);
    }
    
    var updateDeferred = deferrer(updateMenuBlocks);
    var menuListener = {
      interest: function () { return true; },
      // deferred because otherwise we act while in the middle of a rebuild
      texturingChanged: function (id) { updateDeferred(); },
      tableChanged:     function (id) { updateDeferred(); }
    };
    
    function setupIconButton(item, icon, blockID) {
      icon.onclick = function () {
        playerInput.tool = blockID;
        
        var quickSlot = quickSlots.indexOf(blockID);
        if (quickSlot === -1) {
          // promote to recently-used menu
          quickSlot = quickSlotLRU.shift();
          quickSlots[quickSlot] = blockID;
          updateQuickBar();
        } else {
          // touch LRU entry
          quickSlotLRU.splice(quickSlotLRU.indexOf(quickSlot), 1);
        }
        quickSlotLRU.push(quickSlot);
        
        return false;
      };
      icon.onmousedown = icon.onselectstart = function () {
        item.classList.add("selectedTool");
        return false; // inhibit selection
      };
      icon.oncontextmenu = function () {
        playerInput.enterWorld(blockID);
        return false;
      };
      icon.onmouseout = function () {
        if (blockID !== playerInput.tool) {
          item.classList.remove("selectedTool");
        }
        return true;
      };
    }
    
    function updateMenuBlocks() {
      if (!hud) return;
      
      if (playerInput.blockset !== blocksetInMenu) {
        if (blocksetInMenu) blocksetInMenu.listen.cancel(menuListener);
        blocksetInMenu = playerInput.blockset;
        if (blocksetInMenu) blocksetInMenu.listen(menuListener);
      }
      
      menuItemsByBlockId = [];
      quickItemsByBlockId = [];
      resetQuick();
      
      var blocksetRender = blocksetInMenu.getRenderData(renderer);
      
      var sidecount = Math.ceil(Math.sqrt(blocksetInMenu.length));
      var size = Math.min(64, 300 / sidecount);
      
      clearChildren(hud.blocksetAll);
      
      forAllMenuBlocks(function (blockID) {
        var blockType = blocksetInMenu.get(blockID);
        
        // element structure and style
        var item = menuItemsByBlockId[blockID] = document.createElement("tr");
        item.className = "menu-item";
        
        function cell() {
          var cell = document.createElement("td");
          cell.className = "block-details";
          item.appendChild(cell);
          return cell;
        }
        
        cell().appendChild(document.createTextNode(blockID.toString()));
        
        var iconCell = cell();
        var icon = document.createElement("img");
        icon.style.width = icon.style.height = size + "px"; // TODO don't do this in full menu mode
        iconCell.classList.remove("block-details"); // always shown
        iconCell.appendChild(icon);
        blocksetRender.icons[blockID].nowAndWhenChanged(function (url) {
          if (url !== null)
            icon.src = url;
          return true;
        });
        
        // TODO: This code duplicates functionality of PersistentCell.bindControl — refactor so we can use that code here.
        
        var name = document.createElement("input");
        name.type = "text";
        name.value = blockType.name;
        name.onchange = function () {
          blockType.name = name.value;
          return true;
        };
        cell().appendChild(name);
        
        var behavior = document.createElement("select");
        var currentBehavior = (blockType.behavior || {name:""}).name;
        var o = document.createElement("option");
        o.textContent = "—";
        o.selected = name === currentBehavior;
        behavior.appendChild(o);
        Object.keys(Circuit.behaviors).forEach(function (name) {
          var o = document.createElement("option");
          o.textContent = name;
          o.value = name;
          o.selected = name === currentBehavior;
          behavior.appendChild(o);
        })
        behavior.onchange = function () {
          blockType.behavior = Circuit.behaviors[behavior.value];
          return true;
        };
        cell().appendChild(behavior);
        
        var solid = document.createElement("input");
        solid.type = "checkbox";
        solid.checked = blockType.solid;
        solid.onchange = function () {
          blockType.solid = solid.checked;
          return true;
        };
        cell().appendChild(solid);
        
        var light = document.createElement("input");
        light.type = "range";
        light.min = 0;
        light.max = 4;
        light.step = "any";
        light.value = blockType.light.toString();
        light.onchange = function () {
          blockType.light = parseFloat(light.value);
          return true;
        };
        cell().appendChild(light);
        
        setupIconButton(item,icon,blockID);
        
        hud.blocksetAll.appendChild(item);
        
      });
      
      updateQuickBar();
    }
    
    function updateQuickBar() {
      if (!hud) return;
      
      clearChildren(hud.quickBar);
      quickItemsByBlockId = [];
      var r = blocksetInMenu.getRenderData(renderer);
      quickSlots.forEach(function (blockID, index) {
        var item = document.createElement("span");
        item.className = "menu-item";
        
        // keyboard shortcut hint
        var hint = document.createElement("kbd");
        hint.appendChild(document.createTextNode(((index+1) % 10).toString()));
        hint.className = "menu-shortcut-key";
        item.appendChild(hint);
        
        var icon = document.createElement("img");
        icon.style.width = icon.style.height = "64px";
        r.icons[blockID].nowAndWhenChanged(function (url) {
          if (url !== null)
            icon.src = url;
          return true;
        });
        item.appendChild(icon);
        
        setupIconButton(item,icon,blockID);
        hud.quickBar.appendChild(item);
        
        quickItemsByBlockId[blockID] = item;
      });
      
      updateMenuSelection();
    }
    
    function updateMenuSelection() {
      var tool = playerInput.tool;
      forAllMenuBlocks(function (i, item) {
        item.classList[i === tool ? "add" : "remove"]("selectedTool");
      });
      quickItemsByBlockId.forEach(function (item, i) {
        if (item !== undefined) {
          item.classList[i === tool ? "add" : "remove"]("selectedTool");
        }
      });
    }
    
    playerInput.listen({
      interest: function () { return true; },
      changedWorld: function (v) {
        // TODO: remember quick slot contents across worlds (add an input-state object to player's Places?)
        updateMenuBlocks();
      },
      changedTool: function (v) {
        updateMenuSelection();
      }
    });
    
    updateMenuBlocks();
    
    // --- Methods ---
    
    this.step = step;
    
    // TODO these two blockset-editing operations are assuming the sub-blockset to use is the blockset of the #1 block. We should either explicitly declare there is only one sub-blockset or provide a way to choose.
    
    // invoked from UI
    this.addBlockType = function () {
      playerInput.blockset.add(WorldGen.newRandomBlockType(playerInput.blockset.tileSize, playerInput.blockset.get(1).world.blockset));
    };
    
    // invoked from UI
    this.deleteLastBlockType = function () {
      playerInput.blockset.deleteLast();
    };
    
    // invoked from UI
    this.addCircuitBlocks = function () {
      WorldGen.addLogicBlocks(playerInput.blockset.tileSize, playerInput.blockset, playerInput.blockset.get(1).world.blockset);
    };
    
    // invoked from UI
    this.editBlockset = function () {
      switchMode(fullMenuMode);
    };
    
    // --- Late initialization ---
    
    switchMode(interfaceMode);
  }
  
  Input_.commands = {};
  Input_.defaultBindings = [];
  function defcmd(name, label, bindings, repeat, rd) {
    Input_.commands[name] = {
      label: label,
      repeatPeriod: repeat,
      repeatDelay: rd || 0
    }
    bindings.forEach(function (control) {
      Input_.defaultBindings.push([name, control])
    });
  }
  defcmd("useTool"    , "Place block",  [["mouse", 1]], 1/4); // TODO derive from movement speed
  defcmd("deleteBlock", "Delete block", [["mouse", 0]], 1/4);
  defcmd("left"    , "Left"    , [["key", "A".charCodeAt(0)], ["key", 37]]);
  defcmd("right"   , "Right"   , [["key", "D".charCodeAt(0)], ["key", 39]]);
  defcmd("forward" , "Forward" , [["key", "W".charCodeAt(0)], ["key", 38]]);
  defcmd("backward", "Backward", [["key", "S".charCodeAt(0)], ["key", 40]]);
  defcmd("up"      , "Up/Fly"  , [["key", "E".charCodeAt(0)]]);
  defcmd("down"    , "Down"    , [["key", "C".charCodeAt(0)]]);
  defcmd("jump"    , "Jump"    , [["key", " ".charCodeAt(0)]], 1/60);
  defcmd("quick0", "Tool #1"   , [["key", "1".charCodeAt(0)]]);
  defcmd("quick1", "Tool #2"   , [["key", "2".charCodeAt(0)]]);
  defcmd("quick2", "Tool #3"   , [["key", "3".charCodeAt(0)]]);
  defcmd("quick3", "Tool #4"   , [["key", "4".charCodeAt(0)]]);
  defcmd("quick4", "Tool #5"   , [["key", "5".charCodeAt(0)]]);
  defcmd("quick5", "Tool #6"   , [["key", "6".charCodeAt(0)]]);
  defcmd("quick6", "Tool #7"   , [["key", "7".charCodeAt(0)]]);
  defcmd("quick7", "Tool #8"   , [["key", "8".charCodeAt(0)]]);
  defcmd("quick8", "Tool #9"   , [["key", "9".charCodeAt(0)]]);
  defcmd("quick9", "Tool #10"  , [["key", "0".charCodeAt(0)]]);
  defcmd("interfaceMode", "Mouselook"    , [["key", "Q".charCodeAt(0)]]);
  defcmd("enterWorld"   , "Edit block"   , [["key", "R".charCodeAt(0)]]);
  defcmd("exitWorld"    , "Exit editing" , [["key", "F".charCodeAt(0)], ["key", 0x1b]]);
  defcmd("subdatumDec"  , "Subdatum −1"  , [["key", "Z".charCodeAt(0)]], 1/20, 1/4);
  defcmd("subdatumInc"  , "Subdatum +1"  , [["key", "X".charCodeAt(0)]], 1/20, 1/4);
  defcmd("editBlockset" , "Edit blockset", [["key", "B".charCodeAt(0)]]);
  Object.freeze(Input_.commands);
  Object.freeze(Input_.defaultBindings); // should be recursive
      
  CubesControlBindingUI = ControlBindingUI;
  Input = Input_;
}());
