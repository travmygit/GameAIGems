function DrawCircle(ctx, x, y, radius, color, width, isFilled)
{
    if (x < 0 || y < 0)
        return;
        
	ctx.beginPath();	
	ctx.arc(x, y, radius, 0, Math.PI * 2, true);
	ctx.strokeStyle = color;	
	ctx.lineWidth = width;
	ctx.stroke();
	
	if (isFilled == true)
	{
		ctx.fillStyle = color;
		ctx.fill();
	}
}

function DrawVector(ctx, pos, vec, colorPos, colorArrow)
{
    if (pos.x < 0 || pos.y < 0)
        return;

	DrawCircle(ctx, pos.x, pos.y, 2, colorPos, 1, true);
	
	ctx.lineCap     = "round";
	ctx.lineWidth   = 2;
	ctx.strokeStyle = colorArrow;
	ctx.beginPath();
		
	// Draw the main line
	nVec = vec.Normalize();
	xTarget = pos.x + 30*nVec.x;
	yTarget = pos.y + 30*nVec.y;

	ctx.moveTo(pos.x, pos.y);
	ctx.lineTo(xTarget, yTarget);

	// Draw the other arrow parts
	var perpVec = vec.Perpendicular(vec);
	perpVec = perpVec.Normalize();

	x_p1 = pos.x + 20*nVec.x + 5*perpVec.x;
	y_p1 = pos.y + 20*nVec.y + 5*perpVec.y;
	ctx.moveTo(x_p1, y_p1);
	ctx.lineTo(xTarget, yTarget);

	x_p2 = pos.x + 20*nVec.x - 5*perpVec.x;
	y_p2 = pos.y + 20*nVec.y - 5*perpVec.y;
	ctx.moveTo(x_p2, y_p2);
	ctx.lineTo(xTarget, yTarget);

	ctx.closePath();
	ctx.stroke();
}