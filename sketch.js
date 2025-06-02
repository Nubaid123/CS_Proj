let gates = [];
let draggingGate = null;
let connectingGate = null; // gate from which we're starting connection
let offsetX = 0;
let offsetY = 0;
let inputA, inputB;
let outputGate;
let lastTap = 0;
let showUntil = 0;

function setup() {
  createCanvas(900, 500);
  textSize(12);

  // Create Inputs
  inputA = new InputGate(50, 50, 'A');
  inputB = new InputGate(50, 120, 'B');
  gates.push(inputA, inputB);

  // Add random gates and line them up at the bottom
  const types = ['AND', 'OR', 'NOT'];
  let x = 100;
  for (let type of types) {
    let count = floor(random(1, 4));
    for (let i = 0; i < count; i++) {
      gates.push(new LogicGate(x, height - 60, type));
      x += 80;
    }
  }

  // Add output gate
  outputGate = new LogicGate(width - 100, height - 60, 'OUTPUT');
  gates.push(outputGate);

  // Show controls for 3 seconds
  showUntil = millis() + 3000;
}

function draw() {
  background(240);

  // Show controls for 3 seconds
  if (millis() < showUntil) {
    fill(0);
    textSize(14);
    textAlign(CENTER);
    text(
      '🖱 Drag gates to move — 🔗 Click & drag from gate output to connect — ⏯ Click inputs to toggle — ⏺ Double-tap gates to clear connections',
      width / 2,
      30
    );
  } else {
    // Update outputGate last, after all other gates
    for (let gate of gates) gate.updateOutput();
    outputGate.updateOutput();

    fill(0);
    textSize(16);
    textAlign(LEFT);
    text('Final Output: ' + (outputGate.getOutput() ? '1' : '0'), 20, 30);
  }

  // Draw all gates
  for (let gate of gates) gate.display();

  // Draw connection line while dragging a connection
  if (connectingGate) {
    stroke(0, 150, 0);
    strokeWeight(3);
    const startX = connectingGate.x + connectingGate.w;
    const startY = connectingGate.y + connectingGate.h / 2;
    line(startX, startY, mouseX, mouseY);
    strokeWeight(1);
    stroke(0);
  }
}

function mousePressed() {
  // Check if clicking on output circle of LogicGate or InputGate (right side)
  for (let gate of gates) {
    if (
      (gate instanceof LogicGate || gate instanceof InputGate) &&
      mouseX > gate.x + gate.w - 10 &&
      mouseX < gate.x + gate.w + 10 &&
      mouseY > gate.y &&
      mouseY < gate.y + gate.h
    ) {
      // Start a connection drag from this gate's output
      connectingGate = gate;
      return; // don't start dragging gate position when connecting
    }
  }

  // If not starting a connection, check if clicking on a gate to drag or toggle input
  for (let gate of gates) {
    if (gate.isMouseOver()) {
      let now = millis();
      if (now - lastTap < 400) {
        // Double-tap: clear gate inputs and remove from others
        gate.inputs = [];

        for (let other of gates) {
          if (other !== gate && other.inputs) {
            other.inputs = other.inputs.filter((g) => g !== gate);
          }
        }

        lastTap = 0;
        return;
      } else {
        lastTap = now;
      }

      // Toggle InputGate value if it's an input gate
      if (gate instanceof InputGate) {
        gate.value = !gate.value;
        return;
      }

      // Start dragging the gate position
      draggingGate = gate;
      offsetX = mouseX - gate.x;
      offsetY = mouseY - gate.y;
      return;
    }
  }
}

function mouseDragged() {
  if (draggingGate) {
    draggingGate.x = mouseX - offsetX;
    draggingGate.y = mouseY - offsetY;
    draggingGate.hasMoved = true; // optional, for reference
  }
}

function mouseReleased() {
  // If we were connecting a line and release on a valid gate input, connect it
  if (connectingGate) {
    for (let gate of gates) {
      if (
        gate !== connectingGate &&
        gate.isMouseOver() &&
        gate.canAcceptInputFrom(connectingGate)
      ) {
        if (!gate.inputs.includes(connectingGate)) {
          gate.inputs.push(connectingGate);
        }
        break;
      }
    }
    connectingGate = null;
  }
  draggingGate = null;
}

// ---------- Classes ----------

class InputGate {
  constructor(x, y, label) {
    this.x = x;
    this.y = y;
    this.w = 60;
    this.h = 30;
    this.label = label;
    this.value = false;
    this.initialX = x;
    this.initialY = y;
  }

  display() {
    fill(this.value ? 'green' : 'red');
    rect(this.x, this.y, this.w, this.h);

    // Draw output connection point (right side)
    fill(50, 150, 50);
    ellipse(this.x + this.w, this.y + this.h / 2, 10, 10);

    fill(0);
    textAlign(LEFT, CENTER);
    text(`${this.label}: ${this.value ? 1 : 0}`, this.x + 5, this.y + this.h / 2);
  }

  isMouseOver() {
    return (
      mouseX > this.x &&
      mouseX < this.x + this.w &&
      mouseY > this.y &&
      mouseY < this.y + this.h
    );
  }

  updateOutput() {
    // input toggling handled on mousePressed
  }

  getOutput() {
    return this.value;
  }

  canAcceptInputFrom(_) {
    return false;
  }
}

class LogicGate {
  constructor(x, y, type) {
    this.x = x;
    this.y = y;
    this.w = 70;
    this.h = 40;
    this.type = type;
    this.inputs = [];
    this.output = false;
    this.initialX = x;
    this.initialY = y;
    this.hasMoved = false;
  }

  display() {
    fill(200);
    rect(this.x, this.y, this.w, this.h);

    // Draw output connection point (right side)
    fill(50, 150, 50);
    ellipse(this.x + this.w, this.y + this.h / 2, 10, 10);

    fill(0);
    textAlign(LEFT, TOP);
    text(`${this.type}\n${this.output ? 1 : 0}`, this.x + 5, this.y + 5);
    this.drawInputs();
  }

  drawInputs() {
    stroke(0);
    for (let input of this.inputs) {
      line(
        input.x + input.w,
        input.y + input.h / 2,
        this.x,
        this.y + this.h / 2
      );
    }
  }

  isMouseOver() {
    return (
      mouseX > this.x &&
      mouseX < this.x + this.w &&
      mouseY > this.y &&
      mouseY < this.y + this.h
    );
  }

  updateOutput() {
    let values = this.inputs.map((i) => i.getOutput());
    if (this.type === 'AND') {
      this.output = values.length === 2 && values[0] && values[1];
    } else if (this.type === 'OR') {
      this.output = values.length === 2 && (values[0] || values[1]);
    } else if (this.type === 'NOT') {
      this.output = values.length >= 1 && !values[0];
    } else if (this.type === 'OUTPUT') {
      this.output = values.length >= 1 ? values[0] : false;
    }
  }

  getOutput() {
    return this.output;
  }

  canAcceptInputFrom(source) {
    if (this.inputs.includes(source)) return false;
    if (this.type === 'NOT' || this.type === 'OUTPUT') return this.inputs.length < 1;
    if (this.type === 'AND' || this.type === 'OR') return this.inputs.length < 2;
    return false;
  }
}