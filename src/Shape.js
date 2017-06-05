export default Shape

import * as THREE from 'three'

function Shape(){
	this.mesh = new THREE.Mesh(new THREE.SphereGeometry(
		1,1,
		1,1
	))
	this.inScene = false;
}
