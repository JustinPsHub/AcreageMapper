# Acreage Mapper 🗺️

A professional, offline-first GIS tool designed for land planning, fencing measurements, and acreage calculation. Built with a modern **Glassmorphism UI** for a premium user experience on desktop and tablet devices.

## ✨ Features

- **Offline GIS**: Works entirely in the browser without server dependencies. PWA enabled for installation.
- **Glassmorphism UI**: A sleek, dark-themed interface featuring translucent panels, ambient gradients, and refined typography.
- **Precision Drawing**:
  - **Zones (Polygons)**: Calculate area in Square Feet and Acres.
  - **Fences (Polylines)**: Calculate precise linear footage.
  - **Points**: Mark gates, water troughs, or points of interest.
- **Scale Calibration**: Upload any satellite image or plot map, draw a reference line (e.g., a known 10ft gate), and the entire map scales automatically.
- **Project Management**: Save and Load projects via JSON.

## 🛠️ Tech Stack

- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS (with custom Glassmorphism utilities)
- **Icons**: Lucide React
- **Deployment**: GitHub Pages

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher recommended)
- NPM

### Installation

```bash
# Install dependencies
npm install
```

### Development

```bash
# Start local development server
npm run dev
```

### Building for Production

```bash
# Build the project to /dist
npm run build
```

## 📦 Deployment

This project is configured for **GitHub Pages**.

1. Ensure your `package.json` homepage field matches your repo: `https://JustinPsHub.github.io/AcreageMapper/`
2. Run the deploy script:

```bash
npm run deploy
```

## 📱 PWA Setup

To enable offline functionality:
1. Generate icons using the included `generate_icons.html` utility.
2. Place `manifest.json`, `service-worker.js`, and generated icons in the `public/` directory.

---

Created by Justin | [Repository Link](https://github.com/JustinPsHub/AcreageMapper)
