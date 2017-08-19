export default Graphics;

import * as THREE from 'three';

function Graphics() {
  this.mesh = new THREE.Mesh(new THREE.SphereGeometry(
    1, 1,
    1, 1,
  ));
  this.inScene = false;
}
