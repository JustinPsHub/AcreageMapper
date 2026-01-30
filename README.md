
# Acreage Mapper 🗺️

A professional, offline-first land planning and GIS tool. Design property layouts, calculate acreage, estimate fencing costs, and analyze terrain—all directly in your browser.

![License](https://img.shields.io/badge/license-MIT-blue.svg) ![React](https://img.shields.io/badge/react-v19-blue) ![TypeScript](https://img.shields.io/badge/typescript-v5-blue)

## ✨ Features

### 🗺️ Mapping & Import
- **Web Map Importer**: Search any location worldwide.
  - **Satellite Imagery**: High-resolution Esri World Imagery.
  - **Topography**: Overlay contour lines (OpenTopoMap) to see elevation.
  - **Auto-Calibration**: Imported maps are automatically scaled to real-world feet.
- **Manual Upload**: Support for uploading drone shots, blueprints, or survey images (JPG/PNG).
- **Manual Calibration**: Draw a line of known distance (e.g., a 12ft gate) to scale any uploaded image.

### ✏️ Drawing & Measurement
- **Zones (Polygons)**: Measure area in **Acres** and **Square Feet**. Ideal for pastures, gardens, or orchards.
- **Fences (Polylines)**: Measure linear footage.
- **Points**: Mark infrastructure like gates, water troughs, or trees.
- **Snapping**: Smart vertex snapping for precise closures and connections.

### ☀️ Analysis Tools
- **Solar Analysis**: Visualize sun azimuth and calculate shadow lengths based on Date, Time, and Latitude. Perfect for positioning solar panels or trees.
- **Slope & Hydrology**: Draw "Downhill" vectors to analyze terrain.
  - **Water Flow Viz**: Toggle flow indicators on fences to see how water interacts with your layout (swales vs diversion).

### 💰 Planning & Costing
- **Material Presets**: Define costs for specific items (e.g., "Woven Wire @ $1.50/ft", "Pasture Mix @ $40/acre").
- **Cost Estimation**: Real-time project budget calculation based on drawn area/length.
- **BOM Export**: Generate a printable "Shopping List" (Bill of Materials) for your project.

### 💾 Data Management
- **Offline First**: Works as a Progressive Web App (PWA). No internet required after initial load.
- **Save/Load**: Export projects to JSON to share or backup.
- **Privacy Focused**: All data stays in your browser. No server uploads.

## 🚀 Quick Start Guide

1.  **Get a Map**:
    *   Click the **Globe Icon** (Web Map Import).
    *   Search for your address (e.g., "123 Farm Lane, Texas").
    *   Select "Satellite" base layer and toggle "Topography" if needed.
    *   Click "Import Map".
2.  **Draw**:
    *   Select **Zone** (Hexagon) to trace a pasture. Right-click to finish.
    *   Select **Fence** (Activity Line) to draw boundaries.
3.  **Assign Materials**:
    *   Click the **Package Icon** to open Material Manager.
    *   Create a material (e.g., "T-Post Fence", Linear, $2.00).
    *   Select your drawn fence and choose the material from the dropdown in the sidebar.
4.  **Analyze**:
    *   Select **Slope** tool (Trending Down). Click Top of hill -> Click Bottom of hill.
    *   Toggle "Water Flow Viz" in the sidebar to see drainage patterns.

## 🎮 Controls

| Action | Control |
| :--- | :--- |
| **Pan Map** | Middle Mouse Button OR Spacebar + Drag |
| **Zoom** | Mouse Wheel |
| **Select Object** | Left Click |
| **Add Point** | Left Click |
| **Finish Shape** | Right Click |
| **Delete Object** | Delete / Backspace |
| **Undo** | Ctrl + Z |
| **Save** | Ctrl + S |

## 🛠️ Development Setup

1.  **Clone the repository**
    ```bash
    git clone https://github.com/JustinPsHub/AcreageMapper.git
    cd AcreageMapper
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **Run development server**
    ```bash
    npm run dev
    ```

4.  **Build for production**
    ```bash
    npm run build
    ```

## 📱 PWA Installation

To install as an app on your device:
1.  Visit the hosted URL.
2.  **Desktop (Chrome/Edge)**: Click the "Install" icon in the address bar.
3.  **Mobile (iOS)**: Share -> Add to Home Screen.
4.  **Mobile (Android)**: Menu -> Install App.

## 📄 License

This project is open source and available under the [MIT License](LICENSE).
