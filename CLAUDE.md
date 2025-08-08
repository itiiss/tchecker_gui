# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

TChecker GUI is an Electron application with React that provides a visual interface for modeling and simulating timed automata using the TChecker verification tool. It integrates with the external `tck-simulate` binary for formal verification and simulation capabilities.

## Development Commands

- **Start development**: `npm run dev` - Launches Electron app in development mode with hot reload
- **Build application**: `npm run build` - Builds the application for distribution
- **Platform-specific builds**:
  - `npm run build:win` - Build for Windows
  - `npm run build:mac` - Build for macOS  
  - `npm run build:linux` - Build for Linux
- **Code quality**:
  - `npm run lint` - Run ESLint for code linting
  - `npm run format` - Format code using Prettier
- **Preview**: `npm run start` - Preview built application

## Architecture

### Electron Structure
- **Main process** (`src/main/`): Node.js backend handling file I/O, system integration, and TChecker binary execution
- **Renderer process** (`src/renderer/`): React frontend for the visual editor and simulator
- **Preload** (`src/preload/`): Secure bridge between main and renderer processes

### Key Components

#### Backend Integration (`src/main/utils/`)
- **simulation-manager.js**: Core simulator integration with tck-simulate binary at `/Users/zhaochen/Documents/tchecker_gui/src/main/build/src/tck-simulate`
- **tck-generator.js**: Converts JSON model data to TChecker (.tck) format
- **dot-parser.js**: Parses DOT graph output from tck-simulate
- **verification-manager.js**: Handles formal verification tasks
- **tck_model.js**: Defines the automaton model structure

#### Frontend State Management
- **editorStore.js**: Zustand store managing entire application state including:
  - System definition (clocks, integer variables, events)
  - Process automata (nodes/locations, edges/transitions)
  - Simulation state and trace management
  - Backend communication for simulation execution

#### UI Components (`src/renderer/src/`)
- **App.jsx**: Main application with tabbed interface (Editor/Simulator/Verifier)
- **layout/**: Main views for editing, simulation, and verification
- **components/**: Core components including CytoscapeAutomaton for graph visualization

### External Dependencies
- **TChecker binary**: Located at `src/main/build/src/tck-simulate` - handles actual verification and simulation
- **Cytoscape.js**: Primary graph visualization for automata display with direct line layout
- **ReactFlow (@xyflow/react)**: Used only for DOT graph viewer in verification results
- **Material-UI**: UI component library
- **Zustand**: Lightweight state management

## Model Format

The application works with a specific JSON model format defined in `tck_model.js`:
- **System-level**: name, clocks, integer variables, events, synchronizations
- **Process-level**: locations (with invariants, labels, committed/urgent flags) and edges (with guards, actions)
- **ReactFlow integration**: Nodes and edges include positioning and visual data

## Simulation Workflow

1. **Model Definition**: User creates automata in the visual editor
2. **TCK Generation**: JSON model converted to TChecker format
3. **Binary Execution**: tck-simulate generates DOT graph with state space
4. **State Parsing**: DOT output parsed to extract states and transitions
5. **Interactive Simulation**: User can step through execution trace

## Important Paths

- TChecker binary: `/Users/zhaochen/Documents/tchecker_gui/src/main/build/src/tck-simulate`
- Temporary files: Created in `src/main/utils/` during simulation
- Build output: `out/` directory after running build commands

## Testing and Quality

Run `npm run lint` before making changes to ensure code quality. The project uses ESLint with Electron-specific configurations.