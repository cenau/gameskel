export default stickToTargetSystem

function stickToTargetSystem(thing){
	thing.shape.mesh.position.x = thing.stickToTarget.target.physics.body.position.x
	thing.shape.mesh.position.z = thing.stickToTarget.target.physics.body.position.z

}
