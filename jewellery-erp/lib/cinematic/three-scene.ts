import * as THREE from "three";
import { CameraWayPoint } from "./types";

export interface ThreeSceneManagerOptions {
  canvas: HTMLCanvasElement;
  container: HTMLElement;
  initialTheme?: "light" | "dark";
}

export interface ThreeSceneController {
  updateScrollProgress: (progress: number) => void;
  setTheme: (theme: "light" | "dark") => void;
  resize: () => void;
  dispose: () => void;
}

/**
 * Creates a soft, radial blurred particle texture for ambient stardust.
 */
function createSoftCircleTexture(): THREE.Texture {
  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    gradient.addColorStop(0, "rgba(255, 235, 170, 1)");
    gradient.addColorStop(0.3, "rgba(225, 185, 95, 0.5)");
    gradient.addColorStop(0.7, "rgba(200, 150, 60, 0.12)");
    gradient.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 64, 64);
  }
  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}

/**
 * Creates a rounded rectangular 2D shape with continuous smooth fillets.
 */
function createRoundedRectShape(
  width: number,
  height: number,
  radius: number
): THREE.Shape {
  const shape = new THREE.Shape();
  const x = -width / 2;
  const y = -height / 2;
  const r = Math.min(radius, width / 2, height / 2);

  shape.moveTo(x + r, y);
  shape.lineTo(x + width - r, y);
  shape.quadraticCurveTo(x + width, y, x + width, y + r);
  shape.lineTo(x + width, y + height - r);
  shape.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  shape.lineTo(x + r, y + height);
  shape.quadraticCurveTo(x, y + height, x, y + height - r);
  shape.lineTo(x, y + r);
  shape.quadraticCurveTo(x, y, x + r, y);

  return shape;
}

/**
 * Creates and orchestrates the mature, smooth 3D WebGL stage.
 * Strict zero 'any' and zero 'unknown' policy.
 */
export function createCinematicThreeScene(
  options: ThreeSceneManagerOptions
): ThreeSceneController {
  const { canvas, container, initialTheme = "dark" } = options;

  let currentTheme: "light" | "dark" = initialTheme;

  // 1. Scene, Camera, Renderer
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(
    currentTheme === "dark" ? 0x060709 : 0xfaf9f5,
    0.05
  );

  const camera = new THREE.PerspectiveCamera(
    38,
    container.clientWidth / Math.max(container.clientHeight, 1),
    0.1,
    100
  );
  // Elegant camera placement: positioned to frame objects below typography
  camera.position.set(0, 0.2, 5.2);

  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
    powerPreference: "high-performance",
  });
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = currentTheme === "dark" ? 1.0 : 0.95;

  // 2. Mature Studio Lighting Rig (Subtle Champagne Luster, No Blinding Overexposure)
  const ambientLight = new THREE.AmbientLight(
    currentTheme === "dark" ? 0xf5eedc : 0xffffff,
    currentTheme === "dark" ? 0.45 : 0.85
  );
  scene.add(ambientLight);

  const keySpotLight = new THREE.SpotLight(0xfff6ea, 5.0, 25, Math.PI / 5, 0.4, 1.2);
  keySpotLight.position.set(3.5, 4.5, 3.5);
  scene.add(keySpotLight);

  const fillLight = new THREE.DirectionalLight(0xe0d0b8, 1.2);
  fillLight.position.set(-3, 2, 2);
  scene.add(fillLight);

  const rimLight = new THREE.DirectionalLight(0xb0bec5, 1.5);
  rimLight.position.set(0, -3, -2);
  scene.add(rimLight);

  const softGoldGlow = new THREE.PointLight(0xd4af37, 1.2, 8);
  softGoldGlow.position.set(0, -0.6, 2);
  scene.add(softGoldGlow);

  // 3. Mature PBR Materials (Velvety Champagne, Translucent Gemstone & Brushed Titanium)
  const goldMaterial = new THREE.MeshPhysicalMaterial({
    color: 0xdeb862, // Refined champagne bullion gold
    metalness: 0.92,
    roughness: 0.24, // Velvety satin sheen, eliminates harsh plastic reflections
    clearcoat: 0.3,
    clearcoatRoughness: 0.15,
    reflectivity: 0.9,
  });

  const hallmarkEmbossMaterial = new THREE.MeshStandardMaterial({
    color: 0xc49b45, // Subtle recessed gold tone
    metalness: 0.94,
    roughness: 0.32,
  });

  // Refined translucent champagne diamond: soft, subtle facet that never washes out into an opaque white egg
  const diamondMaterial = new THREE.MeshPhysicalMaterial({
    color: 0xc5a059,
    metalness: 0.12,
    roughness: 0.18,
    transmission: 0.65,
    ior: 1.85,
    thickness: 0.8,
    specularIntensity: 0.6,
    specularColor: 0xffe8ba,
    transparent: true,
    opacity: 0.42,
  });

  const titaniumRingMaterial = new THREE.MeshStandardMaterial({
    color: 0x334155,
    metalness: 0.85,
    roughness: 0.35,
    transparent: true,
    opacity: 0.35,
  });

  const champagneRingMaterial = new THREE.MeshStandardMaterial({
    color: 0xc5a059,
    metalness: 0.9,
    roughness: 0.28,
    transparent: true,
    opacity: 0.35,
  });

  // 4. Smooth Procedural Geometries (NO EDGY BOXES)

  // Object Group 1: The Smooth Filleted 24K Bullion Ingot
  const ingotGroup = new THREE.Group();

  // Smooth beveled bullion shape sized to fit dedicated hero negative space
  const ingotShape = createRoundedRectShape(2.3, 1.15, 0.16);
  const ingotExtrudeSettings: THREE.ExtrudeGeometryOptions = {
    depth: 0.52,
    bevelEnabled: true,
    bevelSegments: 16, // High segment count for silky smooth curves
    bevelSize: 0.1,
    bevelThickness: 0.1,
    curveSegments: 32,
  };
  const ingotBodyGeo = new THREE.ExtrudeGeometry(ingotShape, ingotExtrudeSettings);
  ingotBodyGeo.center();
  const ingotBody = new THREE.Mesh(ingotBodyGeo, goldMaterial);
  ingotGroup.add(ingotBody);

  // Smooth recessed hallmark plate
  const hallmarkShape = createRoundedRectShape(1.85, 0.78, 0.08);
  const hallmarkExtrudeSettings: THREE.ExtrudeGeometryOptions = {
    depth: 0.035,
    bevelEnabled: true,
    bevelSegments: 8,
    bevelSize: 0.03,
    bevelThickness: 0.03,
    curveSegments: 24,
  };
  const hallmarkPlateGeo = new THREE.ExtrudeGeometry(
    hallmarkShape,
    hallmarkExtrudeSettings
  );
  hallmarkPlateGeo.center();
  const hallmarkPlate = new THREE.Mesh(hallmarkPlateGeo, hallmarkEmbossMaterial);
  hallmarkPlate.position.set(0, 0, 0.32); // Gracefully seated on top surface
  ingotGroup.add(hallmarkPlate);

  // Position ingot in dedicated hero negative space below CTA and above metrics
  ingotGroup.position.set(0, -0.52, 0);
  scene.add(ingotGroup);

  // Object Group 2: Smooth Champagne Solitaire Brilliant (Refined Scale & Opacity)
  const diamondGroup = new THREE.Group();
  const diamondGeo = new THREE.IcosahedronGeometry(0.62, 2);
  const diamondMesh = new THREE.Mesh(diamondGeo, diamondMaterial);
  diamondGroup.add(diamondMesh);
  diamondGroup.position.set(0, -10, 0);
  scene.add(diamondGroup);

  // Object Group 3: Delicate Horological Concentric Kinetic Vault Rings (Slender Calipers)
  const vaultGroup = new THREE.Group();
  const outerRingGeo = new THREE.TorusGeometry(1.05, 0.016, 32, 160);
  const middleRingGeo = new THREE.TorusGeometry(0.78, 0.012, 32, 128);
  const innerRingGeo = new THREE.TorusGeometry(0.52, 0.009, 32, 96);

  const outerRing = new THREE.Mesh(outerRingGeo, titaniumRingMaterial);
  const middleRing = new THREE.Mesh(middleRingGeo, champagneRingMaterial);
  const innerRing = new THREE.Mesh(innerRingGeo, titaniumRingMaterial);

  vaultGroup.add(outerRing);
  vaultGroup.add(middleRing);
  vaultGroup.add(innerRing);
  vaultGroup.position.set(0, -10, 0);
  scene.add(vaultGroup);

  // Object Group 4: Soft Floating Stardust Motes
  const particleCount = 45;
  const particlePositions = new Float32Array(particleCount * 3);
  for (let i = 0; i < particleCount * 3; i += 3) {
    particlePositions[i] = (Math.random() - 0.5) * 9;
    particlePositions[i + 1] = (Math.random() - 0.5) * 8;
    particlePositions[i + 2] = (Math.random() - 0.5) * 6;
  }
  const particleGeo = new THREE.BufferGeometry();
  particleGeo.setAttribute(
    "position",
    new THREE.BufferAttribute(particlePositions, 3)
  );

  const circleTexture = createSoftCircleTexture();
  const particleMat = new THREE.PointsMaterial({
    map: circleTexture,
    color: 0xdeb862,
    size: 0.055,
    transparent: true,
    opacity: currentTheme === "dark" ? 0.22 : 0.14,
    blending: currentTheme === "dark" ? THREE.AdditiveBlending : THREE.NormalBlending,
    depthWrite: false,
  });
  const particleSystem = new THREE.Points(particleGeo, particleMat);
  scene.add(particleSystem);

  // 5. Animation & Scroll State Variables
  let currentScrollProgress = 0;
  let targetScrollProgress = 0;
  let isDisposed = false;
  let animationFrameId = 0;
  const clock = new THREE.Clock();

  function smoothstep(edge0: number, edge1: number, x: number): number {
    const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
    return t * t * (3 - 2 * t);
  }

  // Refined camera path with softer transitions
  const waypoints: CameraWayPoint[] = [
    { x: 0, y: 0.12, z: 5.2, targetX: 0, targetY: -0.12, targetZ: 0 }, // Hero: centered in negative space
    { x: -0.6, y: 0.25, z: 4.6, targetX: 0.1, targetY: 0, targetZ: 0 }, // Dual Nature: slight offset
    { x: 0.6, y: 0.1, z: 4.4, targetX: -0.1, targetY: 0, targetZ: 0 }, // Billing Sim: right offset
    { x: 0, y: 0, z: 4.8, targetX: 0, targetY: 0, targetZ: 0 }, // Vault Ledger: centered
    { x: 0, y: 0.12, z: 5.2, targetX: 0, targetY: -0.12, targetZ: 0 }, // Resolution
  ];

  function interpolateWaypoints(p: number): CameraWayPoint {
    const clamped = Math.max(0, Math.min(0.999, p));
    const segmentCount = waypoints.length - 1;
    const index = Math.floor(clamped * segmentCount);
    const subProgress = clamped * segmentCount - index;
    const w0 = waypoints[index];
    const w1 = waypoints[index + 1];

    return {
      x: w0.x + (w1.x - w0.x) * subProgress,
      y: w0.y + (w1.y - w0.y) * subProgress,
      z: w0.z + (w1.z - w0.z) * subProgress,
      targetX: w0.targetX + (w1.targetX - w0.targetX) * subProgress,
      targetY: w0.targetY + (w1.targetY - w0.targetY) * subProgress,
      targetZ: w0.targetZ + (w1.targetZ - w0.targetZ) * subProgress,
    };
  }

  // Render loop
  function tick() {
    if (isDisposed) {
      return;
    }

    clock.getDelta();
    const elapsedTime = clock.getElapsedTime();

    // Smooth inertia lerp for scroll progress
    currentScrollProgress += (targetScrollProgress - currentScrollProgress) * 0.06;

    // Camera trajectory interpolation
    const wp = interpolateWaypoints(currentScrollProgress);
    camera.position.set(wp.x, wp.y, wp.z);
    camera.lookAt(wp.targetX, wp.targetY, wp.targetZ);

    // Continuous, filmic blend weights between 3D sculptural objects (NO JUMP CUTS)
    const ingotInHero = 1 - smoothstep(0.14, 0.24, currentScrollProgress);
    const ingotInResolution = smoothstep(0.88, 0.96, currentScrollProgress);
    const ingotWeight = Math.max(ingotInHero, ingotInResolution);

    // Diamond: strictly for Act II (Dual Nature / Metallurgy), completely cleared before Act III/IV
    const diamondFadeIn = smoothstep(0.18, 0.26, currentScrollProgress);
    const diamondFadeOut = 1 - smoothstep(0.38, 0.46, currentScrollProgress);
    const diamondWeight = diamondFadeIn * diamondFadeOut;

    // Vault Rings: strictly for Act IV (The Sovereign Ledger / Vault), cleared before Act V comparison
    const vaultFadeIn = smoothstep(0.52, 0.60, currentScrollProgress);
    const vaultFadeOut = 1 - smoothstep(0.68, 0.74, currentScrollProgress);
    const vaultWeight = vaultFadeIn * vaultFadeOut;

    // 1. Ingot Choreography (Dedicated negative space below CTA and above bottom metrics)
    if (ingotWeight > 0.001) {
      ingotGroup.visible = true;
      const s = THREE.MathUtils.lerp(0.3, 0.76, ingotWeight);
      ingotGroup.scale.set(s, s, s);
      const yOffset = currentScrollProgress < 0.5 ? -0.52 : -0.45;
      ingotGroup.position.set(
        0,
        yOffset + Math.sin(elapsedTime * 0.6) * 0.02,
        -0.15
      );
      ingotGroup.rotation.set(
        0.24 + currentScrollProgress * 0.35,
        elapsedTime * 0.12 + currentScrollProgress * 1.5,
        0.04
      );
    } else {
      ingotGroup.visible = false;
      ingotGroup.position.y = -50;
    }

    // 2. Diamond Choreography (Subtle, translucent solitaire brilliant during Act II)
    if (diamondWeight > 0.001) {
      diamondGroup.visible = true;
      const s = THREE.MathUtils.lerp(0.2, 0.65, diamondWeight);
      diamondGroup.scale.set(s, s, s);
      diamondGroup.position.set(
        0,
        -0.25 + Math.sin(elapsedTime * 0.8) * 0.03,
        -1.2
      );
      diamondGroup.rotation.set(
        elapsedTime * 0.18,
        elapsedTime * 0.22 + currentScrollProgress * 2.0,
        0
      );
    } else {
      diamondGroup.visible = false;
      diamondGroup.position.y = -50;
    }

    // 3. Vault Rings Choreography (Deep, delicate watermark calipers during Act IV)
    if (vaultWeight > 0.001) {
      vaultGroup.visible = true;
      const s = THREE.MathUtils.lerp(0.2, 0.75, vaultWeight);
      vaultGroup.scale.set(s, s, s);
      vaultGroup.position.set(0, -0.15, -1.4);
      const ringSpeed = currentScrollProgress * Math.PI * 2;
      outerRing.rotation.z = ringSpeed * 0.8 + elapsedTime * 0.08;
      middleRing.rotation.z = -ringSpeed * 1.2 - elapsedTime * 0.1;
      innerRing.rotation.z = ringSpeed * 1.6 + elapsedTime * 0.12;
      vaultGroup.rotation.y = elapsedTime * 0.08;
    } else {
      vaultGroup.visible = false;
      vaultGroup.position.y = -50;
    }

    // Ambient floating particles gentle drift
    particleSystem.rotation.y = elapsedTime * 0.02;
    particleSystem.rotation.x = Math.sin(elapsedTime * 0.015) * 0.02;

    // Moving key light glint
    keySpotLight.position.x = Math.cos(elapsedTime * 0.35) * 3 + 1;
    keySpotLight.position.y = Math.sin(elapsedTime * 0.25) * 2 + 3.5;

    renderer.render(scene, camera);
    animationFrameId = requestAnimationFrame(tick);
  }

  animationFrameId = requestAnimationFrame(tick);

  return {
    updateScrollProgress: (progress: number) => {
      targetScrollProgress = Math.max(0, Math.min(1, progress));
    },
    setTheme: (theme: "light" | "dark") => {
      currentTheme = theme;
      scene.fog = new THREE.FogExp2(
        theme === "dark" ? 0x060709 : 0xfaf9f5,
        0.05
      );
      renderer.toneMappingExposure = theme === "dark" ? 1.0 : 0.95;
      ambientLight.color.setHex(theme === "dark" ? 0xf5eedc : 0xffffff);
      ambientLight.intensity = theme === "dark" ? 0.45 : 0.85;
      particleMat.opacity = theme === "dark" ? 0.20 : 0.12;
      particleMat.blending =
        theme === "dark" ? THREE.AdditiveBlending : THREE.NormalBlending;
      particleMat.needsUpdate = true;
    },
    resize: () => {
      if (isDisposed || !container) {
        return;
      }
      const width = container.clientWidth;
      const height = Math.max(container.clientHeight, 1);
      const isMobile = width < 768;
      camera.fov = isMobile ? 48 : 38;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    },
    dispose: () => {
      isDisposed = true;
      cancelAnimationFrame(animationFrameId);

      circleTexture.dispose();

      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry.dispose();
          if (Array.isArray(obj.material)) {
            obj.material.forEach((mat) => mat.dispose());
          } else {
            obj.material.dispose();
          }
        } else if (obj instanceof THREE.Points) {
          obj.geometry.dispose();
          obj.material.dispose();
        }
      });

      renderer.dispose();
    },
  };
}
