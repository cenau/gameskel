import * as THREE from 'three';
import createLoop from 'canvas-loop';
import kd from 'keydrown';
import ecs from 'tiny-ecs';
import ec from 'three-effectcomposer';
import CANNON from 'cannon';

// systems
import initPhysics from './initPhysics';
import initGraphics from './initGraphics';
import stickToTargetSystem from './stickToTargetSystem';

// components
import Physics from './Physics';
import WASD from './WASD';
import Graphics from './Graphics';
import StickToTarget from './StickToTarget';
import Position from './Position';
import Quaternion from './Quaternion';

//  stuff that should be imports but doesnt work
const EffectComposer = ec(THREE);
// import { glslify } from 'glslify'
const glslify = require('glslify');
// needed for bug https://github.com/stackgl/glslify/issues/49 - if you try using fixes like glslify babel plugin, then shaders wont live reload!!


// assets

const scene = setupScene();


// physics

const world = setupWorld();


//  canvas for rendering
const canvas = document.createElement('canvas');
document.body.appendChild(canvas);

// renderer

const renderer = setupRenderer();
const camera = setupCamera();
const composer = setupComposer();

// setup ecs
const ents = new ecs.EntityManager(); // ents, because, i keep misspelling entities

// the player
const player = ents.createEntity();

player.addComponent(Position);
player.addComponent(Quaternion);
player.addComponent(Physics);
player.addComponent(Graphics);
player.addComponent(WASD);

player.position.y = 8;


// procedural deformation texture
const deformMat = new THREE.ShaderMaterial({
  vertexShader: glslify('../shaders/deform_vert.glsl'),
  fragmentShader: glslify('../shaders/deform_frag.glsl'),
  transparent: true,
  uniforms: {
    iGlobalTime: { type: 'f', value: 0 },
    iResolution: { type: 'v2', value: new THREE.Vector2() },
  },
  defines: {
    USE_MAP: '',
  },
});

const app = createLoop(canvas, { scale: renderer.devicePixelRatio });

// uniforms for screen shaders
composer.passthroughEffect.uniforms.iResolution.value.set(app.shape[0], app.shape[1]);

// time - for passing into shaders
let time = 0;

// the terrain plane
const geom = new THREE.PlaneGeometry(
  300, 300, // Width and Height
  300, 300, // Terrain resolution
);


const plane = ents.createEntity();
plane.addComponent(Graphics);
plane.addComponent(Position);
plane.addComponent(StickToTarget);
plane.graphics.mesh = new THREE.Mesh(geom);

plane.graphics.mesh.material = deformMat;
plane.graphics.mesh.material.side = THREE.DoubleSide;
plane.graphics.mesh.rotation.x -= (90 * Math.PI) / 180;
plane.stickToTarget.target = player;


app.on('tick', (dt) => {
  kd.tick();
  time += dt / 1000;
  deformMat.uniforms.iGlobalTime.value = time;
  composer.render(scene, camera);
  renderer.render(scene, camera, composer.bufferTexture);
  composer.passthroughEffect.uniforms.iGlobalTime.value = time;


  world.step(world.fixedTimeStep, dt, world.maxSubSteps);

  // run system inits
  ents.queryComponents([Graphics]).forEach((each) => {
    if (!each.graphics.inScene) {
      initGraphics(scene, each);
    }
  });
  ents.queryComponents([Physics]).forEach((each) => {
    if (!each.physics.body) {
      initPhysics(world, each);
    }
  });
  // run systems

  // update position from physics
  ents.queryComponents([Physics, Position]).forEach((each) => {
    each.position.copy(each.physics.body.position);
  });
  // update quaternion from physics
  ents.queryComponents([Physics, Quaternion]).forEach((each) => {
    each.quaternion.copy(each.physics.body.quaternion);
  });


  // update mesh from position
  ents.queryComponents([Graphics, Position]).forEach((each) => {
    each.graphics.mesh.position.copy(each.position);
  });
  // update mesh from quaternion
  ents.queryComponents([Graphics, Quaternion]).forEach((each) => {
    each.graphics.mesh.quaternion.copy(each.quaternion);
  });

  ents.queryComponents([Position, StickToTarget]).forEach((each) => {
    stickToTargetSystem(each);
  });

  camera.position.copy(player.position);
  camera.quaternion.copy(player.quaternion);
});


app.on('resize', resize);

app.start();
resize();


// keyboard input

kd.W.down(() => {
  ents.queryComponents([WASD]).forEach((each) => {
    each.physics.body.applyLocalImpulse(
      new CANNON.Vec3(0, 0, -1),
      new CANNON.Vec3(0, 0, 0),
    );
  });
});

kd.S.down(() => {
  ents.queryComponents([WASD]).forEach((each) => {
    each.physics.body.applyLocalImpulse(
      new CANNON.Vec3(0, 0, 1),
      new CANNON.Vec3(0, 0, 0),
    );
  });
});

kd.A.down(() => {
  ents.queryComponents([WASD]).forEach((each) => {
    each.physics.body.applyLocalImpulse(
      new CANNON.Vec3(-0.1, 0, 0),
      new CANNON.Vec3(0, 0, -0.1),
    );
  });
});

kd.D.down(() => {
  ents.queryComponents([WASD]).forEach((each) => {
    each.physics.body.applyLocalImpulse(
      new CANNON.Vec3(0.1, 0, 0),
      new CANNON.Vec3(0, 0, -0.1),
    );
  });
});


function setupRenderer() {
  const rend = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    devicePixelRatio: window.devicePixelRatio,
  });

  rend.setClearColor(0xff8300, 1);
  // renderer.context.getShaderInfoLog = function () { return '' }; //nasty hack to suppress error merssages due to possible ff bug? https://github.com/mrdoob/three.js/issues/9716
  return rend;
}


// setup camera
function setupCamera() {
  const cam = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    500);

  cam.position.set(0, 0, 0);
  return cam;
}

function setupWorld() {
  const wor = new CANNON.World();
  // wor.gravity = new CANNON.Vec3(0, -9.82, 0) // m/s²
  wor.gravity = new CANNON.Vec3(0, 0, 0); // m/s²

  wor.broadphase = new CANNON.NaiveBroadphase();

  wor.solver.iterations = 10;


  wor.fixedTimeStep = 1 / 60; // physics engine setting - keeps render framerate and sim in sync
  wor.maxSubSteps = 10; // physics engine setting - not 100% sure what this does

  return wor;
}

function setupScene() {
  const sce = new THREE.Scene();
  const light = new THREE.AmbientLight(0x404040); // soft white light
  sce.add(light);
  return sce;
}

function setupComposer() {
  const effectComposer = new EffectComposer(renderer);

  // setup buffer render target for render to texture stuff.

  // const bufferScene = new THREE.Scene();
  effectComposer.bufferTexture = new THREE.WebGLRenderTarget(
    window.innerWidth,
    window.innerHeight,
    {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.NearestFilter,
    },
  );


  // passthrough shader for fullscreen + buffer. Use this as template for effects.
  const passthroughShader = {

    uniforms: {
      tLast: { type: 't', value: effectComposer.bufferTexture },
      tDiffuse: { type: 't', value: null }, // output from previous - all need this
      iResolution: { type: 'v2', value: new THREE.Vector2() },
      iGlobalTime: { type: 'f', value: 0 },
    },
    vertexShader: glslify('../shaders/pass_vert.glsl'),
    fragmentShader: glslify('../shaders/pass_frag.glsl'),

  };

  // effect composer to deal with the screen shaders
  effectComposer.addPass(new EffectComposer.RenderPass(scene, camera)); // the actual scene
  effectComposer.passthroughEffect = new EffectComposer.ShaderPass(passthroughShader);

  effectComposer.addPass(effectComposer.passthroughEffect); // adding the passthrough shader

  effectComposer.passes[effectComposer.passes.length - 1].renderToScreen = true;

  return effectComposer;
}


function resize() {
  const [width, height] = app.shape;
  camera.aspect = width / height;
  renderer.setSize(width, height, false);

  camera.updateProjectionMatrix();
}
