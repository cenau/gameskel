export default initShape

function initShape(scene,thing){

	scene.add(thing.shape.mesh);
	thing.shape.inScene = true;	

}
