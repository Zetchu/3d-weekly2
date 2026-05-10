import './style.css';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { GlitchPass } from 'three/examples/jsm/postprocessing/GlitchPass.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import GUI from 'lil-gui';

import fragmentShader from './shaders/floorFragment.glsl?raw';

const canvas = document.querySelector('canvas.webgl');
const sizes = { width: window.innerWidth, height: window.innerHeight };

const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.5;

renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();

const pmremGenerator = new THREE.PMREMGenerator(renderer);
scene.environment = pmremGenerator.fromScene(
  new RoomEnvironment(),
  0.04,
).texture;

const floorMaterial = new THREE.ShaderMaterial({
  transparent: true,
  side: THREE.DoubleSide,
  uniforms: {
    uTime: { value: 0 },
    uColor: { value: new THREE.Color('#00ffff') },
    uMouse: { value: new THREE.Vector2(0, 0) },
  },
  vertexShader: `
        varying vec2 vUv;
        void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,
  fragmentShader: fragmentShader,
});

const floor = new THREE.Mesh(new THREE.PlaneGeometry(20, 20), floorMaterial);
floor.rotation.x = -Math.PI * 0.5;
floor.renderOrder = 1;
scene.add(floor);

const shadowPlane = new THREE.Mesh(
  new THREE.PlaneGeometry(20, 20),
  new THREE.ShadowMaterial({ opacity: 0.8 }),
);
shadowPlane.rotation.x = -Math.PI * 0.5;
shadowPlane.position.y = 0.01;
shadowPlane.receiveShadow = true;
shadowPlane.renderOrder = 2;
scene.add(shadowPlane);

const statusLine = document.querySelector('.status-line');
const loadingManager = new THREE.LoadingManager();

loadingManager.onProgress = (url, itemsLoaded, itemsTotal) => {
  const progress = Math.round((itemsLoaded / itemsTotal) * 100);
  statusLine.innerHTML = `SCANNING FOR VEHICLES... <span style="color: #ffaa00;">${progress}%</span>`;
};

loadingManager.onLoad = () => {
  statusLine.innerHTML = `SYSTEM READY. <span class="blink" style="color: #00ffff;">VEHICLES FOUND</span>`;
};

const gltfLoader = new GLTFLoader(loadingManager);
const models = [];
let currentModelIndex = 0;
const vehicleNameUI = document.querySelector('#v-name');

const loadVehicle = (path, name, scale = 1) => {
  gltfLoader.load(path, (gltf) => {
    const model = gltf.scene;
    model.visible = false;

    model.scale.set(scale, scale, scale);
    model.updateMatrixWorld(true);

    model.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    const box = new THREE.Box3().setFromObject(model);
    const offsetY = -box.min.y;
    model.position.y = offsetY;

    scene.add(model);

    models.push({
      mesh: model,
      name: name,
      baseY: offsetY,
    });

    if (models.length === 1) {
      model.visible = true;
      vehicleNameUI.innerText = name;
    }
  });
};

loadVehicle('/models/car/scene.gltf', 'QUADRA V-TECH', 1.8);
loadVehicle('/models/moto/scene.gltf', 'ARCH NAZARÉ', 2.8);

window.addEventListener('mousemove', (event) => {
  floorMaterial.uniforms.uMouse.value.x = (event.clientX / sizes.width) * 2 - 1;
  floorMaterial.uniforms.uMouse.value.y =
    -(event.clientY / sizes.height) * 2 + 1;
});

window.addEventListener('keydown', (event) => {
  if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
    if (models.length < 2) return;

    glitchPass.enabled = true;
    setTimeout(() => {
      glitchPass.enabled = false;
    }, 200);

    models[currentModelIndex].mesh.visible = false;
    currentModelIndex = (currentModelIndex + 1) % models.length;
    models[currentModelIndex].mesh.visible = true;
    vehicleNameUI.innerText = models[currentModelIndex].name;

    floorMaterial.uniforms.uColor.value.set(
      currentModelIndex === 0 ? '#00ffff' : '#d400ff',
    );
  }
});

const ambientLight = new THREE.AmbientLight('#ffffff', 0.2);
scene.add(ambientLight);

const spotLight = new THREE.SpotLight('#ffffff', 15, 20, Math.PI * 0.4);
spotLight.position.set(0, 8, 4);

spotLight.castShadow = true;
spotLight.shadow.mapSize.width = 1024;
spotLight.shadow.mapSize.height = 1024;
spotLight.shadow.bias = -0.0001;

scene.add(spotLight);

const camera = new THREE.PerspectiveCamera(
  75,
  sizes.width / sizes.height,
  0.1,
  100,
);
camera.position.set(0, 4, 10);
scene.add(camera);

const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));

const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(sizes.width, sizes.height),
  0.15,
  0.4,
  1.0,
);
composer.addPass(bloomPass);

const glitchPass = new GlitchPass();
glitchPass.enabled = false;
composer.addPass(glitchPass);

const gui = new GUI();
gui.add(bloomPass, 'strength').min(0).max(3).name('Bloom Intensity');
gui.addColor(floorMaterial.uniforms.uColor, 'value').name('Floor Color');
gui
  .add(renderer, 'toneMappingExposure')
  .min(0)
  .max(3)
  .step(0.01)
  .name('Exposure');
gui.add(spotLight, 'intensity').min(0).max(50).step(1).name('SpotLight Power');

const clock = new THREE.Clock();

const tick = () => {
  const elapsedTime = clock.getElapsedTime();

  floorMaterial.uniforms.uTime.value = elapsedTime;

  if (models[currentModelIndex]) {
    const active = models[currentModelIndex];
    active.mesh.rotation.y = elapsedTime * 0.2;
    active.mesh.position.y = active.baseY + Math.sin(elapsedTime * 2.0) * 0.15;
  }

  controls.update();
  composer.render();
  window.requestAnimationFrame(tick);
};

tick();

window.addEventListener('resize', () => {
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;
  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();
  renderer.setSize(sizes.width, sizes.height);
  composer.setSize(sizes.width, sizes.height);
});
