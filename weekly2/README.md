# Cyberpunk Vehicle Terminal

A 3D interactive vehicle showcase built with [Three.js](https://threejs.org/).

## Features

- **3D Model Loading:** Seamlessly loads and displays GLTF vehicle models.
- **Custom Shaders:** Features a custom glowing, reactive neon floor grid.
- **Post-Processing:** Utilizes Unreal Bloom and Glitch passes for an authentic cyberpunk aesthetic.
- **Interactive:** Use arrow keys to cycle through vehicles and mouse to orbit the camera.

## Technical Implementation & Shaders

The goal of this project was to establish a retro-futuristic, cyberpunk atmosphere for a 3D vehicle showcase.

**Custom Floor Shader (`floorFragment.glsl`)**
To achieve the signature neon look, a custom GLSL fragment shader was implemented for the floor grid rather than relying on static textures. This procedural approach ensures infinite resolution and allows the grid lines to dynamically react and interact with the scene's lighting. When combined with the Unreal Bloom post-processing pass, the procedural shader produces a highly emissive, glowing effect that perfectly captures the cyberpunk aesthetic.

## Getting Started

1. Install dependencies:

   ```bash
   npm install
   ```

2. Start the development server:

   ```bash
   npm run dev
   ```

3. Open your browser and navigate to the local URL provided by the server.
