export default Quaternion

function Quaternion(){
	this.x = 0;
	this.y = 0;
	this.z = 0;
	this.w = 1;
}

Quaternion.prototype.copy = function(source){
	this.x = source.x;
	this.y = source.y;
	this.z = source.z;
	this.w = source.w;
	return this;
};
