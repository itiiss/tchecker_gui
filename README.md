# TChecker GUI

A comprehensive graphical user interface for modeling, simulating, and verifying timed automata using the TChecker verification tool.

![GitHub](https://img.shields.io/badge/license-MIT-blue.svg)
![Electron](https://img.shields.io/badge/Electron-v37.2.3-blue.svg)
![React](https://img.shields.io/badge/React-v19.1.0-blue.svg)

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Installation](#installation)
- [Usage](#usage)
- [Project Structure](#project-structure)
- [Development](#development)
- [Building](#building)
- [License](#license)

## 🔍 Overview

TChecker GUI is an Electron-based desktop application that provides an intuitive visual interface for working with timed automata. Built with React and Material-UI, it integrates seamlessly with the TChecker verification tool to offer comprehensive modeling, simulation, and formal verification capabilities.

The application bridges the gap between theoretical timed automata concepts and practical verification tasks, making formal methods more accessible through visual modeling and interactive simulation.

## ✨ Features

### 🎨 Visual Editor

- **Interactive Graph Editor**: Drag-and-drop interface for creating automata using Cytoscape.js
- **Process Management**: Create, rename, copy, and manage multiple processes
- **Location Properties**: Set initial states, invariants, labels, committed/urgent flags
- **Transition Modeling**: Define guards, actions, and synchronization events
- **System Declarations**: Configure clocks, integer variables, and events

### 🎯 Interactive Simulator

- **Step-by-step Simulation**: Execute transitions interactively
- **State Visualization**: Real-time highlighting of current states
- **Trace Management**: Navigate through execution history
- **Model Validation**: Automatic checking before simulation starts

### 🔬 Formal Verification

- **Property Verification**: Support for reachability, safety, and deadlock-freedom properties
- **Integration with tck-reach**: Leverages TChecker's verification algorithms
- **Result Analysis**: Detailed statistics and counter-examples
- **DOT Graph Visualization**: View state space exploration results

### 💾 File Management

- **Save/Load Models**: Persistent storage of automata models
- **Export Capabilities**: Generate TChecker (.tck) format files
- **UPPAAL XTA Import**: Support for UPPAAL XTA file format

## 🛠 Technology Stack

### Frontend

- **Electron**: Cross-platform desktop application framework
- **React 19**: Modern UI development with hooks and functional components
- **Material-UI**: Professional UI components and theming
- **Cytoscape.js**: Graph visualization and interaction
- **ReactFlow**: Additional graph visualization for DOT output
- **Zustand**: Lightweight state management

### Backend Integration

- **TChecker**: External verification tool integration
- **Node.js**: File I/O and system integration
- **DOT Parser**: Custom parser for TChecker output

### Development Tools

- **Electron Vite**: Fast build tooling
- **ESLint**: Code quality and consistency
- **Prettier**: Code formatting
- **Electron Builder**: Application packaging

## 📦 Installation

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn package manager
- TChecker binary (included in `src/main/build/src/`)

### Steps

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd tchecker_gui
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

## 🚀 Usage

### Getting Started

1. **Launch the Application**

   ```bash
   npm run dev
   ```

2. **Create Your First Model**
   - Navigate to the **Declarations** tab to define system-wide elements
   - Add clocks, integer variables, and events
   - Create processes and design automata using the visual editor

3. **Design Automata**
   - Add locations by right-clicking in the editor
   - Set initial states, invariants, and labels
   - Connect locations with transitions
   - Define guards, actions, and synchronization events

4. **Simulate Your Model**
   - Switch to the **Simulator** tab
   - Step through execution interactively
   - Observe state changes and trace history

5. **Verify Properties**
   - Navigate to the **Verifier** tab
   - Define properties (reachability, safety, deadlock-freedom)
   - Run verification and analyze results

### Model Format

The application uses a JSON-based model format that includes:

```javascript
{
  systemName: "system_name",
  clocks: [{ name: "x", size: 1 }],
  intVars: [{ name: "v", size: 1, min: 0, max: 10, initial: 0 }],
  events: ["event1", "event2"],
  processes: {
    "process1": {
      locations: { ... },
      edges: [ ... ]
    }
  },
  synchronizations: [ ... ]
}
```

## 📁 Project Structure

```
tchecker_gui/
├── src/
│   ├── main/                    # Electron main process
│   │   ├── index.js            # Main entry point
│   │   ├── utils/              # Backend utilities
│   │   │   ├── simulation-manager.js
│   │   │   ├── verification-manager.js
│   │   │   ├── tck-generator.js
│   │   │   ├── dot-parser.js
│   │   │   └── tck_model.js
│   │   └── build/              # TChecker binaries
│   ├── renderer/               # React frontend
│   │   ├── src/
│   │   │   ├── App.jsx         # Main application
│   │   │   ├── layout/         # Main view components
│   │   │   ├── components/     # Reusable components
│   │   │   └── store/          # State management
│   │   └── index.html
│   └── preload/                # Secure IPC bridge
├── out/                        # Build output
├── package.json
├── CLAUDE.md                   # Development guidelines
└── README.md
```

### Key Components

- **Main Process** (`src/main/`): Handles file operations, TChecker integration, and system APIs
- **Renderer Process** (`src/renderer/`): React-based UI with visual editor and simulation views
- **Preload Scripts** (`src/preload/`): Secure communication bridge between main and renderer
- **Utilities** (`src/main/utils/`): Core backend functionality for simulation and verification

## 🔧 Development

### Available Scripts

```bash
# Development
npm run dev              # Start development server
npm run lint             # Run ESLint
npm run format           # Format code with Prettier

# Building
npm run build            # Build for production
npm run build:win        # Build for Windows
npm run build:mac        # Build for macOS
npm run build:linux      # Build for Linux

# Preview
npm run start            # Preview built application
```

### Architecture Notes

- **Electron Security**: Secure IPC communication through preload scripts
- **Process Separation**: Clear separation between main process (backend) and renderer (frontend)
- **External Integration**: TChecker binary integration through child processes
- **File Handling**: Temporary file management for TChecker operations

## 🏗 Building

### Development Build

```bash
npm run build
```

### Platform-specific Builds

```bash
npm run build:win     # Windows
npm run build:mac     # macOS
npm run build:linux   # Linux
```

### Distribution

Built applications will be available in the `dist/` directory with installers for each platform.

## 🚧 Roadmap

- [ ] Enhanced UPPAAL XTA support
- [ ] Additional verification algorithms
- [ ] Improved DOT graph visualization
- [ ] Model templates and examples
- [ ] Plugin architecture for extensions

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [TChecker](http://www.labri.fr/perso/herbrete/tchecker/) - The underlying verification tool
- [Electron](https://electronjs.org/) - Cross-platform desktop framework
- [React](https://reactjs.org/) - UI library
- [Cytoscape.js](https://cytoscape.org/) - Graph visualization
- [Material-UI](https://mui.com/) - React component library

**TChecker GUI** - Making formal verification accessible through visual modeling and interactive simulation.
