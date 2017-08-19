export default stickToTargetSystem;

function stickToTargetSystem(thing) {
  thing.position.x = thing.stickToTarget.target.position.x;
  thing.position.z = thing.stickToTarget.target.position.z;
}
