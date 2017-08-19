import * as THREE from 'three';

export default Graphics;


function Graphics() {
  this.mesh = new THREE.Mesh(new THREE.SphereGeometry(
    1, 1,
    1, 1,
  ));
  this.inScene = false;
}

Graphics.prototype.setIsInScene = function (bool) {
  this.inScene = bool;
};
