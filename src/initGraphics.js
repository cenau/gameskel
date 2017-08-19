export default initGraphics;

function initGraphics(scene, thing) {
  scene.add(thing.graphics.mesh);
  thing.graphics.setIsInScene(true);
}
