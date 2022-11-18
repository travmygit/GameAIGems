function FormationTarget(pos, unitRadius)
{
    this.pos      = pos;
    this.unitRadius = unitRadius;
    this.color    = "rgb(255,0,0)";
    this.lastTurnDirection = 0;
}

FormationTarget.prototype.Draw = function(ctx)
{
    DrawCircle(ctx, this.pos.x, this.pos.y, this.unitRadius, this.color, 1);
}

///////////////////////////////////////////////////////////////////////////////
function Formation (pos, dir, rows, columns, turnRadius, unitRadius) 
{
    this.rows  = rows;
    this.cols  = columns;
	this.pos   = pos;
	this.dir   = dir;
	this.speed = document.getElementById("movement_speed").value;
	this.unitRadius = unitRadius;
	this.turnRadius = turnRadius;
	this.paused = false;
	
	var xRoot = this.pos.x - ((this.cols-1)*this.unitRadius*2)/2;
	var yRoot = this.pos.y;
	
	this.targets = new Array();
	for (r = 0; r < rows; ++r)
	{
	    this.targets[r] = new Array();
	    for (c = 0; c < columns; ++c)
	    {
	        this.targets[r][c] = new FormationTarget( new Vec2D(xRoot + c*2*this.unitRadius, yRoot - r*2*this.unitRadius), this.unitRadius );
	    }
	}
};

Formation.prototype.Draw = function(ctx) 
{
	var xRoot = this.pos.x - ((this.cols-1)*this.unitRadius*2)/2;
	var yRoot = this.pos.y;
	
    for (r = 0; r < this.rows; ++r)
    {
        for (c = 0; c < this.cols; ++c)
        {
            this.targets[r][c].Draw(ctx);
        }
    }

    DrawCircle(ctx, this.pos.x, this.pos.y, this.unitRadius,  "rgb(0,255,0)", 1);
	DrawVector(ctx, this.pos,   this.dir,   "rgb(0, 0, 0)", "rgb(0, 255, 0)");
	
	for (i = 0; i < this.path.length; i += 2)
	{
	    DrawCircle(ctx, this.path[i].x, this.path[i].y, 2, "rgb(0,0,0)", 1);
	}  
}

Formation.prototype.Update = function()
{
    this.speed = document.getElementById("movement_speed").value;
    if (this.speed < 0)
    {
        this.speed = 0;
        document.getElementById("movement_speed").value = 0;
    }
    else if (this.speed > 10)
    {
        this.speed = 10;
        document.getElementById("movement_speed").value = 10;
    }

    if (this.paused == true || this.path.length <= 0 || this.speed == 0)
        return;
        
    dist = Math.sqrt( Math.pow(this.path[0].y - this.pos.y, 2) + Math.pow(this.path[0].x -  this.pos.x, 2) );
    
    if (dist < this.speed)
    {
        // Check for approximately 0
        if (dist > 0.001)
        {
            this.dir = this.path[0].Sub(this.pos);
            this.dir = this.dir.Normalize();
        }
        
        this.pos = this.path[0];
        this.path.splice(0, 1);    
    }
    else
    {
        this.dir = this.path[0].Sub(this.pos);
        this.dir = this.dir.Normalize();
        this.pos = this.pos.Add(this.dir.Scale(this.speed));
    }
    
    // Update target positions
    formationStyle = document.getElementById("movement_style").value;
    
    if (formationStyle < 0)
    {
        formationStyle = 0;
        document.getElementById("movement_style").value = 0;
    }
    else if (formationStyle > 2) 
    {
        formationStyle = 2;
        document.getElementById("movement_style").value = 2;
    }
    
    switch (formationStyle)
    {
        case "0":
            this.UpdateTargetPositions_Static();
            break;
        case "1":
            this.UpdateTargetPositions_Follow();
            break;
        case "2":
            this.UpdateTargetPositions_Band();
            break;   
    }
}

Formation.prototype.SetPath = function(newPath)
{
    this.path = newPath;
}

Formation.prototype.UpdateTargetPositions_Static = function()
{
    // Set the position of the first row
    rootPos = this.pos.Add( this.dir.LeftPerp().Scale(((this.cols-1)*this.unitRadius*2)/2) );
    
    for (c = 0; c < this.cols; ++c)
    {
        this.targets[0][c].pos = rootPos.Add( this.dir.RightPerp().Scale(2 * c * this.unitRadius) );
    }
    
    // Move the followers in the specified manner
    for (r = 1; r < this.rows; ++r)
    {
        for (c = 0; c < this.cols; ++c)
        {
            this.targets[r][c].pos = this.targets[r-1][c].pos.Sub( this.dir.Scale(2 * this.unitRadius) );
        }
    }
}

Formation.prototype.UpdateTargetPositions_Follow = function()
{
    // Set the position of the first row
    rootPos = this.pos.Add( this.dir.LeftPerp().Scale(((this.cols-1)*this.unitRadius*2)/2) );
    
    for (c = 0; c < this.cols; ++c)
    {
        this.targets[0][c].pos = rootPos.Add( this.dir.RightPerp().Scale(2 * c * this.unitRadius) );
    }
    
    // Move the followers in the specified manner
    for (r = 1; r < this.rows; ++r)
    {
        for (c = 0; c < this.cols; ++c)
        {
            // Get leader position
            var curPos = this.targets[r][c].pos;
            var leaderPos = this.targets[r-1][c].pos;
            
            var dir = curPos.Sub(leaderPos).Normalize().Scale(2 * this.unitRadius);
            this.targets[r][c].pos = leaderPos.Add(dir);
        }
    }
}

Formation.prototype.UpdateTargetPositions_Band = function()
{
    // Set the position of the first row
    rootPos = this.pos.Add( this.dir.LeftPerp().Scale(((this.cols-1)*this.unitRadius*2)/2) );
    
    for (c = 0; c < this.cols; ++c)
    {
        this.targets[0][c].pos = rootPos.Add( this.dir.RightPerp().Scale(2 * c * this.unitRadius) );
    }
    
    var prevRowDir = this.dir.Normalize();
    
    // Move the followers in the specified manner
    for (r = 1; r < this.rows; ++r)
    {
        // Determine if the row ahead is turning right or left
        var leaderPos = this.targets[r-1][0].pos;
        var unitPos   = this.targets[r][0].pos;
                
        var curRowDir = leaderPos.Sub(unitPos).Normalize();
        dotResult = curRowDir.RightPerp().Dot(prevRowDir);
        
        // Figure out which direction this row is turning, while counting "approximately zero" (-.05 <= x <= 0.05) as straight
        var turnDir = 0;
        if (dotResult > 0.05)
            turnDir = 1;
        else if (dotResult < -0.05)
            turnDir = -1;
        
        if (this.lastTurnDirection != 0 && this.lastTurnDirection != turnDir)
			turnDir = 0;
		
		this.lastTurnDirection = turnDir;
        
        // If it's turning left, start at the leftmost unit, and base the other positions off of it
        if (turnDir == -1)
        {
            curPos = this.targets[r][0].pos;
            leaderPos = this.targets[r-1][0].pos;
            
            var dir = curPos.Sub(leaderPos).Normalize().Scale(2 * this.unitRadius);
            this.targets[r][0].pos = leaderPos.Add(dir);
            
            var perpDir = leaderPos.Sub(curPos).RightPerp();
            perpDir = perpDir.Normalize().Scale(2 * this.unitRadius);
            
            for (c = 1; c < this.cols; ++c)
            {                
                this.targets[r][c].pos = this.targets[r][c-1].pos.Add(perpDir);
            }
        }
        // Else, start on the rightmost unit
        else if (turnDir == 1)
        {
            curPos = this.targets[r][this.cols-1].pos;
            leaderPos = this.targets[r-1][this.cols-1].pos;
            
            var dir = curPos.Sub(leaderPos).Normalize().Scale(2 * this.unitRadius);
            this.targets[r][this.cols-1].pos = leaderPos.Add(dir);
            
            var perpDir = leaderPos.Sub(curPos).LeftPerp();
            perpDir = perpDir.Normalize().Scale(2 * this.unitRadius);
            
            for (c = this.cols-2; c >= 0; --c)
            {                
                this.targets[r][c].pos = this.targets[r][c+1].pos.Add(perpDir);
            }
        }
        else
        {
            for (c = 0; c < this.cols; ++c)
            {
                // Get leader position
                var curPos = this.targets[r][c].pos;
                var leaderPos = this.targets[r-1][c].pos;
                
                var dirVec = curPos.Sub(leaderPos).Normalize().Scale(2 * this.unitRadius);
                this.targets[r][c].pos = leaderPos.Add(dirVec);
            }
        }
    }
}