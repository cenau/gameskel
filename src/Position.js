export default Position

function Position(){
	this.x = 0;
	this.y = 0;
	this.z = 0;
}

Position.prototype.copy = function(source){
	this.x = source.x;
	this.y = source.y;
	this.z = source.z;
	return this;
};
