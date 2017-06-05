import * as THREE from 'three'
import createLoop from 'canvas-loop'
import kd from 'keydrown'
import ecs from 'tiny-ecs'
import ec from 'three-effectcomposer'
const EffectComposer = ec(THREE)
//import { glslify } from 'glslify'
const glslify = require('glslify') // needed for bug https://github.com/stackgl/glslify/issues/49 - if you try using fixes like glslify babel plugin, then shaders wont live reload!!
import CANNON from 'cannon'


function ready() {

}

//systems 
import initPhysics from './initPhysics'
import initShape from './initShape'
import stickToTargetSystem from './stickToTargetSystem'

//components 
import Physics from './Physics'
import Shape from './Shape'
import StickToTarget from './StickToTarget'

//assets 

const scene = new THREE.Scene()


//physics 

var world = new CANNON.World();

//world.gravity = new CANNON.Vec3(0, -9.82, 0) // m/s²  
world.gravity = new CANNON.Vec3(0, 0, 0) // m/s² 

world.broadphase = new CANNON.NaiveBroadphase();

world.solver.iterations = 10;


//canvas for rendering	
const canvas =  document.createElement('canvas')
document.body.appendChild(canvas)

//renderer 
const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
  antialias: true,
  devicePixelRatio: window.devicePixelRatio,
})

//renderer.context.getShaderInfoLog = function () { return '' }; //nasty hack to suppress error merssages due to possible ff bug? https://github.com/mrdoob/three.js/issues/9716


//setup ecs
var ents = new ecs.EntityManager(); //ents, because, i keep misspelling entities

// the player
const player = ents.createEntity();
player.addComponent(Physics);
player.addComponent(Shape);


renderer.setClearColor(0xff6600, 1)

var fixedTimeStep = 1 / 60; // physics engine setting - keeps render framerate and sim in sync
var maxSubSteps = 10; // physics engine setting - not 100% sure what this does

//setup buffer render target for render to texture stuff. 
const bufferScene = new THREE.Scene();
var bufferTexture = new THREE.WebGLRenderTarget( window.innerWidth, window.innerHeight, { minFilter: THREE.LinearFilter, magFilter: THREE.NearestFilter});

//setup camera	
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 500)
camera.position.set(0, 0, 0)

//passthrough shader for fullscreen + buffer. Use this as template for effects.  
const passthroughShader = {

    uniforms :{
	"tLast" : {type: "t", value: bufferTexture}, 
        "tDiffuse": { type: "t", value: null },   // output from previous - all need this  
        "iResolution": {type: 'v2', value: new THREE.Vector2()},
        "iGlobalTime": { type: 'f', value: 0 },
    },
  vertexShader: glslify('../shaders/pass_vert.glsl'),
  fragmentShader: glslify('../shaders/pass_frag.glsl'),

}

//effect composer to deal with the screen shaders
let composer = new EffectComposer( renderer );
composer.addPass( new EffectComposer.RenderPass(scene,camera)); //the actual scene
let passthroughEffect = new EffectComposer.ShaderPass(passthroughShader); // the passthrough shader
composer.addPass( passthroughEffect ) // adding the passthrough shader

composer.passes[composer.passes.length - 1].renderToScreen = true;


var light = new THREE.AmbientLight( 0x404040 ); // soft white light
scene.add( light );

// procedural deformation texture
const deform_mat = new THREE.ShaderMaterial({
  vertexShader: glslify('../shaders/deform_vert.glsl'),
  fragmentShader: glslify('../shaders/deform_frag.glsl'),
  transparent: true,
  uniforms: {
    iGlobalTime: { type: 'f', value: 0 },
    iResolution: {type: 'v2', value: new THREE.Vector2()},
  },
  defines: {
    USE_MAP: ''
  }
})

const app = createLoop(canvas, { scale: renderer.devicePixelRatio })

//uniforms for screen shaders
passthroughEffect.uniforms.iResolution.value.set(app.shape[0],app.shape[1]);

//time - for passing into shaders
let time = 0

//the terrain plane
var geom = new THREE.PlaneGeometry(
			    300, 300, // Width and Height
			        300, 300    // Terrain resolution
			)


const plane = ents.createEntity();
plane.addComponent(Shape);
plane.addComponent(StickToTarget);
plane.shape.mesh = new THREE.Mesh(geom);

plane.shape.mesh.material = deform_mat 
plane.shape.mesh.material.side=THREE.DoubleSide
plane.shape.mesh.rotation.x -= 90 * Math.PI/180;
plane.stickToTarget.target = player;


app.on('tick', dt => {
	kd.tick()
	time += dt / 1000
	deform_mat.uniforms.iGlobalTime.value = time
	composer.render(scene, camera)
    	renderer.render(scene, camera,bufferTexture)
    	passthroughEffect.uniforms.iGlobalTime.value = time;
    

    world.step(fixedTimeStep, dt, maxSubSteps);

    //run system inits 
	 ents.queryComponents([Shape]).forEach(function(each){

		
		if (!each.shape.inScene){
			initShape(scene,each)
		}
    })
	 ents.queryComponents([Physics]).forEach(function(each){
		if (!each.physics.body){
			initPhysics(world,each)
		}
    })
    //run systems 
	 ents.queryComponents([Shape,Physics]).forEach(function(each){
		each.shape.mesh.position.copy(each.physics.body.position) 
		each.shape.mesh.quaternion.copy(each.physics.body.quaternion);

    })

	 ents.queryComponents([Shape,StickToTarget]).forEach(function(each){
		stickToTargetSystem(each)
    })
    camera.position.copy(player.physics.body.position);
    camera.quaternion.copy(player.physics.body.quaternion);
//    plane.shape.mesh.position.x = player.physics.body.position.x;
//    plane.shape.mesh.position.z = player.physics.body.position.z;
})
    
    
app.on('resize', resize)

app.start()
resize()

function resize() {
	let [ width, height ] = app.shape
    camera.aspect = width / height
    renderer.setSize(width, height, false)
    
    camera.updateProjectionMatrix()
}


kd.LEFT.down(function () {
});

kd.RIGHT.down(function () {
});

kd.UP.down(function () {
});

kd.DOWN.down(function () {
});

kd.SPACE.up(function () {
	
});

kd.W.down(function () {
	player.physics.body.applyLocalImpulse(
			    new CANNON.Vec3(0, 0, -1 ),
			        new CANNON.Vec3( 0, 0, 0 )
			);
});

kd.S.down(function () {
	player.physics.body.applyLocalImpulse(
			    new CANNON.Vec3(0, 0, 1 ),
			        new CANNON.Vec3( 0, 0, 0 )
			);
});

kd.A.down(function () {
	player.physics.body.angularVelocity =new CANNON.Vec3(0,0.05,0); 
});

kd.D.down(function () {
	player.physics.body.angularVelocity =new CANNON.Vec3(0,-0.05,0); 
});


