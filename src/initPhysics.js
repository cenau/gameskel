import CANNON from 'cannon'

export default initPhysics

function initPhysics(world,thing){
    thing.physics.body = new CANNON.Body({
        mass:thing.physics.mass,
   //	position: new CANNON.Vec3(0, 8, 0), // m 
	position: thing.position,   
	shape: new CANNON.Sphere(1)
    });


    world.addBody(thing.physics.body)
}
