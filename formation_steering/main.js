// Main code for the formation demo
var Engine = {};

var FormationDemo = (function () 
{
	var ctx;
	
	var formation  = new Formation(
	    new Vec2D(300, 300),    // Position
	    new Vec2D(0, 1),        // Direction
	    5,                      // Number of Rows
	    4,                      // Number of Columns
	    50,                     // Turn radius
	    5                       // Unit radius
	    );
	var pTarget = new Vec2D(700, 300);
	var dTarget = new Vec2D(0, 1);
	
    var angleStep = ((5 / 180) * Math.PI); // How far to go around the circles when generating the points on the path
	
	// Centers of the two circles used for generating the path
	var c1 = new Vec2D(-1, -1);
	var c2 = new Vec2D(-1, -1);
	
	// Angles where the path separates from c1, and where it joins c2
	var c1_exitAngle  = 0;
	var c2_enterAngle = 0;
	
	// These are used for debug rendering (not in the path calculation itself)
	var c1_exit  = new Vec2D(-1, -1);
	var c2_enter = new Vec2D(-1, -1);
		
    function Init() 
	{
		ctx = document.getElementById('canvas').getContext('2d'); 
		ctx.lineWidth = 2;
		ctx.fillStyle = "rgb(200,0,50)";
		CalculatePath();
    };
	
	function Run()
	{
		ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
	
	    formation.Update();
		formation.Draw(ctx);
		DrawVector(ctx, pTarget, dTarget, "rgb(0, 0, 0)", "rgb(255, 0, 0)");
				
		ctx.strokeStyle = "rgb(0,0,0)";
		ctx.lineWidth = 5;
		ctx.strokeRect(0, 0, ctx.canvas.width, ctx.canvas.height);
		
		DrawCircle(ctx, c1.x, c1.y, formation.turnRadius, "rgb(0, 128, 0)", 2, false);
		DrawCircle(ctx, c2.x, c2.y, formation.turnRadius, "rgb(128, 0, 0)", 2, false);
		
		DrawCircle(ctx, c1_exit.x,  c1_exit.y,  5, "rgb(0,128,0)", 2, true);
		DrawCircle(ctx, c2_enter.x, c2_enter.y, 5, "rgb(128,0,0)", 2, true);
		
		if (c1_exit.x  >= 0 && c1_exit.y  >= 0 &&
		    c2_enter.x >= 0 && c2_enter.y >= 0)
		{
	        ctx.beginPath();
	        ctx.moveTo(c1_exit.x, c1_exit.y);
	        ctx.lineTo(c2_enter.x, c2_enter.y);
	        ctx.closePath();
	        ctx.stroke();
	    }
		
        DrawCircle(ctx, c1_exit.x,  c1_exit.y,  5, "rgb(0, 128, 0)", 2, true);
		DrawCircle(ctx, c2_enter.x, c2_enter.y, 5, "rgb(128, 0, 0)", 2, true);		
	};
	
	function SetTargetVector(x, y)
	{
	    var tempVec = new Vec2D();
	    tempVec.x = x - pTarget.x;
	    tempVec.y = y - pTarget.y;
		
		if (tempVec.Length() == 0)
		    return;
		    
		dTarget = tempVec;		
		CalculatePath();
	}
	
	function SetTargetPos(x, y)
	{
	    if (pTarget.x == x && pTarget.y == y)
	        return;
	        
		pTarget.x = x;
		pTarget.y = y;
		
		CalculatePath();
	}
	
	function Pause(isPaused)
	{
	    formation.paused = isPaused;	    
	}
	
	function CalculatePath()
	{
	    var v1, v2, v3, v4;
	    var dt;
	       
	    // 1) Calculate the starting steering circle
	    v1 = formation.dir.Normalize();
	    dt = pTarget.Sub(formation.pos);
	    dt = dt.Normalize();
	    v2 = v1.Perpendicular(dt);
	    c1 = formation.pos.Add( v2.Scale(formation.turnRadius) );
	    
	    // 2) Calculate the ending steering circle
	    v3 = dTarget.Normalize();
	    v4 = v3.Perpendicular(dt.Scale(-1));
	    c2 = pTarget.Add( v4.Scale(formation.turnRadius) );
	    
	    var distCircles = c2.Sub(c1).Length();
	    if (distCircles < 2 * formation.turnRadius)
	    {
	        v2 = v2.Scale(-1);
	        v4 = v4.Scale(-1);
	        
	        c1 = formation.pos.Add( v2.Scale(formation.turnRadius) );
	        c2 = pTarget.Add( v4.Scale(formation.turnRadius) );
	    }
	    
	    var sideStart;
        var sideEnd;
                
        if ( v2.Equal(v1.RightPerp()) )
            sideStart = 1;
        else
            sideStart = 0;
        
        v3_right = v3.RightPerp();
        v3_left  = v3.LeftPerp();
	    if ( v4.Equal(v3.RightPerp()) )
	        sideEnd = 1;
	    else
	        sideEnd = 0;
        
        // 3) Calculate the starting circle exit point    
        if (sideStart != sideEnd)
        {
            var r  = formation.turnRadius;
            var d  = c2.Sub(c1).Length() / 2;
            var a1 = Math.acos(r/d);
            var a2 = c2.Sub(c1).ConvertToAngle();

            var a3 = 0;
            if (sideStart == 1 && sideEnd == 0)
				a3 = a2 + a1;
			else
				a3 = a2 - a1;

			c1_exitAngle = a3;
            c1_exit.x = c1.x + r * Math.cos(a3);
            c1_exit.y = c1.y + r * Math.sin(a3);
        }
        else
        {
			if (sideStart == 1)
				c1_exit = c2.Sub(c1).LeftPerp().Normalize().Scale(formation.turnRadius);
			else
				c1_exit = c2.Sub(c1).RightPerp().Normalize().Scale(formation.turnRadius);

			c1_exitAngle = c1_exit.ConvertToAngle();
			c1_exit = c1.Add(c1_exit);
        }
	    
	    // 4) Calculate the ending circle entry point
        if (sideStart != sideEnd)
        {
            var r  = formation.turnRadius;
            var d  = c2.Sub(c1).Length() / 2;
            var b1 = Math.acos(r/d);
            var b2 = c1.Sub(c2).ConvertToAngle();
            
            var b3 = 0;
            if (sideStart == 1 && sideEnd == 0)
				b3 = b2 + b1;
			else
				b3 = b2 - b1;
            
            c2_enterAngle = b3;
            c2_enter.x = c2.x + r * Math.cos(b3);
            c2_enter.y = c2.y + r * Math.sin(b3);
        }
        else
        {	            
			if (sideEnd == 1)
				c2_enter = c2.Sub(c1).LeftPerp().Normalize().Scale(formation.turnRadius);
			else
				c2_enter = c2.Sub(c1).RightPerp().Normalize().Scale(formation.turnRadius);						
			
			c2_enterAngle = c2_enter.ConvertToAngle();
			c2_enter = c2.Add(c2_enter);
        }
	    
		// 5) Calculate points along the path	
	    GeneratePathArray(sideStart, sideEnd);
	}
	
	function GeneratePathArray(directionStart, directionEnd)
	{  
	    var path = new Array();
	    
	    ///////////////////////////////////////////////////////////////////////     
	    // Generate points on the starting circle
	    xVec = new Vec2D(1, 0);
	    yVec = new Vec2D(0, 1);
	    
	    startVec = formation.pos.Sub(c1);
	    endVec   = c1_exit.Sub(c1);
	       	   
	    startAngle = startVec.ConvertToAngle();
	    endAngle   = c1_exitAngle; //endVec.ConvertToAngle();
	    
	    // Generate points on the starting circle
	    if (directionStart == 0) // clockwise
	        GeneratePath_Clockwise(startAngle, endAngle, c1, path);
	    else // Counter-clockwise
	        GeneratePath_CounterClockwise(startAngle, endAngle, c1, path);
	    
	    ///////////////////////////////////////////////////////////////////////
	    // Generate points on the ending circle
	    startVec = c2_enter.Sub(c2);
	    endVec   = pTarget.Sub(c2);	    
	    
		startAngle = c2_enterAngle; //startVec.ConvertToAngle();
	    endAngle   = endVec.ConvertToAngle();
	       
	    // Generate points on the starting circle
	    if (directionEnd == 0) // clockwise
	        GeneratePath_Clockwise(startAngle, endAngle, c2, path);
	    else // Counter-clockwise
	        GeneratePath_CounterClockwise(startAngle, endAngle, c2, path);
	    
	    // Give the path to the formation
	    formation.SetPath(path);
	}
	
	function GeneratePath_Clockwise(startAngle, endAngle, center, path)
	{
	    formationWidth = (formation.turnRadius);
	    
    	if (startAngle > endAngle)
    	    endAngle += 2 * Math.PI;
  	    
    	curAngle = startAngle;
        while (curAngle < endAngle)
        {
            var p = new Vec2D();
            p.x = center.x + formationWidth * Math.cos(curAngle);
            p.y = center.y + formationWidth * Math.sin(curAngle);
            path.push(p);
            
            curAngle += angleStep;
        }
        
        if (curAngle != endAngle)
        {
            var p = new Vec2D();
            p.x = center.x + formationWidth * Math.cos(endAngle);
            p.y = center.y + formationWidth * Math.sin(endAngle);
            path.push(p);
        }
	}
	
	function GeneratePath_CounterClockwise(startAngle, endAngle, center, path)
	{
	    formationWidth = (formation.turnRadius);
	    
       	if (startAngle < endAngle)
    	    startAngle += 2 * Math.PI;
    	    
    	curAngle = startAngle;
        while (curAngle > endAngle)
        {
            var p = new Vec2D();
            p.x = center.x + formationWidth * Math.cos(curAngle);
            p.y = center.y + formationWidth * Math.sin(curAngle);
            path.push(p);
            
            curAngle -= angleStep;
        }	
        
        if (curAngle != endAngle)
        {
            var p = new Vec2D();
            p.x = center.x + formationWidth * Math.cos(endAngle);
            p.y = center.y + formationWidth * Math.sin(endAngle);
            path.push(p);
        }
	}
	
	return {
        "Init" : Init,
		"Run"  : Run,
		"SetTargetPos"  : SetTargetPos,
		"SetTargetVector"  : SetTargetVector,
		"Pause" : Pause
    };
}());
