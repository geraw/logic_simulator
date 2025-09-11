# Logic Circuit Simulator

A command-line digital logic circuit simulator built in Python using the Lark parsing library. This tool parses and simulates circuit description files, allowing for the analysis of combinational and sequential logic circuits over time.



[Image of a digital logic circuit diagram]


## Features

* **Declarative Syntax**: Describe circuits using a simple, human-readable text format.
* **Macro Support**: Define reusable components (like `And`, `Or`, `Xor`) using a `:=` syntax.
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
    cd logic-simulator
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

### Basic Syntax

```bash
python main.py <path_to_circuit_file> [options]