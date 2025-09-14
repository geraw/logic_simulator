# Logic Circuit Simulator

A command-line digital logic circuit simulator built in Python using the Lark parsing library. This tool parses and simulates circuit description files, allowing for the analysis of combinational and sequential logic circuits over time.

## Features

* **Declarative Syntax**: Describe circuits using a simple, human-readable text format.
* **Macro Support**: Define reusable components (like `AND`, `OR`, `XOR`) using a `:=` syntax.
* **Sequential Logic**: Built-in support for D-type flip-flops using `D(expr, default)` for time-delayed evaluation.
* **Combinational Logic**: Automatically resolves dependencies within a single time step.
* **Error Detection**: Detects basic combinational loops and provides clear syntax error reporting with line and column numbers.
* **Command-Line Interface**: Flexible CLI for specifying input sequences, output signals, and simulation duration.

## Requirements

* Python 3.7+
* `lark` library

## Installation

1.  **Clone the repository:**

    ```bash
    git clone <repository-url>
    cd logic_simulator
    ```

2.  **Install dependencies:**
    It's recommended to use a virtual environment.

    ```bash
    python -m venv venv
    source venv/bin/activate  # On Windows, use `venv\Scripts\activate`
    pip install lark
    ```

## How to Run

The simulator is executed from the command line using `main.py`.

## Basic Syntax

```bash
python main.py <path_to_circuit_file> [options]
```

## Options

| Flag | Argument | Description |
| --- | --- | --- |
| -i, --input | SIGNAL=SEQUENCE | Defines an input signal. Example: -i B=1011. Can be used multiple times for multiple inputs. |
| -o, --output | SIGNAL | Specifies a signal to display in the output. If omitted, all signals are shown. Can be used multiple times. |
| -s, --steps | NUMBER | Sets the total number of simulation steps. If omitted, it defaults to the length of the longest input sequence. |

## Example Command

```bash
python main.py circuit.cir -i B=10110010 -i C=00110101 -s 8
```

## Circuit File Syntax (.cir)

Circuit files are text files that describe the components and connections of a logic circuit.

### Comments

Lines starting with # are treated as comments and are ignored.

```cir
# This is a comment
```

### Assignments (=)

Assignments define a signal (wire) as the output of an expression. The left side is the signal name, and the right side is the component's output.

```cir
# Signal 'A' is the output of a NAND gate with inputs 'B' and 'C'
A = NAND(B, C)
```

### Macro Definitions (:=)

Macros define reusable components. They are expanded into their base expressions during the initialization of the simulation.

```cir
# A 'NOT' gate is defined as a NAND gate with both inputs tied together
NOT(x) := NAND(x, x)

# An 'AND' gate can be defined using other macros
AND(x, y) := NOT(NAND(x, y))
```

## Core Components

The simulator has two fundamental, built-in components:

### NAND(x, y)

The universal NAND gate. All other standard logic gates can be built from this.

### D(expr, default)

A D-type flip-flop or delay element.

* expr: The expression to be evaluated in the previous time step
* default: The value to return at the very first time step (t=0), when there is no previous state

## Project Structure

```text
logic_simulator/
├── grammar.lark          # Defines the language grammar for Lark
├── circuit_parser.py     # Parses .cir files into an Abstract Syntax Tree (AST)
├── simulator.py          # The core simulation engine
├── main.py              # The command-line interface
├── circuit.cir          # An example circuit file
└── README.md            # This file
```
