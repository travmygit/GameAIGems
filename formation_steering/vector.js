function Vec2D (x, y)
{
	this.x = x;
	this.y = y;
};

Vec2D.prototype.Length = function()
{
	result = Math.sqrt( Math.pow(this.x, 2) + Math.pow(this.y, 2) );
	return result;
}

Vec2D.prototype.Normalize = function() 
{
	var result = new Vec2D(0,0);
	
	length = this.Length();
	result.x = (this.x / length);
	result.y = (this.y / length);
	
	return result;
}

Vec2D.prototype.Perpendicular = function(directionVector)
{
	var result1 = new Vec2D(-1 * this.y, this.x);
	var result2 = new Vec2D(this.y, -1 * this.x);
	
	if (result1.Dot(directionVector) >= 0)
		return result1;
	else
		return result2;
}

Vec2D.prototype.RightPerp = function()
{
    var result1 = new Vec2D(this.y, -1 * this.x);
    return result1;
}

Vec2D.prototype.LeftPerp = function()
{
    var result1 = new Vec2D(-1 * this.y, this.x);
    return result1;
}

Vec2D.prototype.Dot = function(v2)
{
	var n1 = this; //this.Normalize();
	var n2 = v2; //v2.Normalize();
	
	return (n1.x * n2.x + n1.y * n2.y);
}

Vec2D.prototype.Add = function(v2)
{
	var result = new Vec2D(this.x + v2.x, this.y + v2.y)
	return result;
}

Vec2D.prototype.Sub = function(v2)
{
	var result = new Vec2D(this.x - v2.x, this.y - v2.y)
	return result;
}

Vec2D.prototype.Scale = function(i)
{
	var result = new Vec2D(this.x * i, this.y * i)
	return result;
}

Vec2D.prototype.ConvertToAngle = function()
{
	var angle = Math.acos(this.x / this.Length());
	
	if (this.y < 0)
		angle = (2 * Math.PI) - angle;
	
	if (angle < 0)
		angle = (2 * Math.PI) + angle;
	
	return angle;
}

Vec2D.prototype.Equal = function (v2)
{
	if (this.x == v2.x && this.y == v2.y)
		return true;
	else
		return false;
}