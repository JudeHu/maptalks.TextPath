import {Canvas, LineString} from 'maptalks'

// https://github.com/Viglino/Canvas-TextPath
/** Render text along a path in a Canvas
*	Adds extra functionality to the CanvasRenderingContext2D by extending its prototype.
*	Extent the global object with options:
*		- textOverflow {undefined|visible|ellipsis|string} the text to use on overflow, default "" (hidden)
*		- textJustify {undefined|boolean} used to justify text (otherwise use textAlign), default false
*		- textStrokeMin {undefined|number} the min length (in pixel) for the support path to draw the text upon, default 0
* 
* @param {string} text the text to render
* @param {Array<Number>} path an array of coordinates as support for the text (ie. [x1,y1,x2,y2,...]
*/
(function()
{
/* Usefull function */
function dist2D(x1,y1,x2,y2)
{	var dx = x2-x1;
	var dy = y2-y1;
	return Math.sqrt(dx*dx+dy*dy);
}

/* Add new properties on CanvasRenderingContext2D */
CanvasRenderingContext2D.prototype.textOverflow = "";
CanvasRenderingContext2D.prototype.textJustify = false;
CanvasRenderingContext2D.prototype.textStrokeMin = 0;

var state = [];
var save = CanvasRenderingContext2D.prototype.save;
CanvasRenderingContext2D.prototype.save = function()
{	state.push(
		{	textOverflow: this.textOverflow, 
			textJustify: this.textJustify, 
			textStrokeMin: this.textStrokeMin, 
		});
	save.call(this);
}

var restore = CanvasRenderingContext2D.prototype.restore;
CanvasRenderingContext2D.prototype.restore = function()
{	restore.call(this);
	var s = state.pop();
	this.textOverflow = s.textOverflow;
	this.textJustify = s.textJustify;
	this.textStrokeMin = s.textStrokeMin;
}

/* textPath function */
CanvasRenderingContext2D.prototype.textPath = function (text, path)
{	// Helper to get a point on the path, starting at dl 
	// (return x, y and the angle on the path)
	var di, dpos=0;
	var pos=2;
	function pointAt(dl)
	{	if (!di || dpos+di<dl)
		{ for (; pos<path.length; )
			{	di = dist2D(path[pos-2],path[pos-1], path[pos],path[pos+1]);
				if (dpos+di>dl) break;
				pos += 2;
				if (pos>=path.length) break;
				dpos += di;
			}
		}
   
		var x, y, dt = dl-dpos;
		if (pos>=path.length) 
		{	pos = path.length-2;
		}

		if (!dt) 
		{	x = path[pos-2];
			y = path[pos-1];
		}
		else
		{	x = path[pos-2]+ (path[pos]-path[pos-2])*dt/di;
			y = path[pos-1]+ (path[pos+1]-path[pos-1])*dt/di;
		}
		return [x, y, Math.atan2(path[pos+1]-path[pos-1], path[pos]-path[pos-2])];
	}

	var letterPadding = this.measureText(" ").width *0.25;
  
	// Calculate length
	var d = 0;
	for (var i=2; i<path.length; i+=2)
	{	d += dist2D(path[i-2],path[i-1],path[i],path[i+1])
	}
	if (d < this.minWidth) return;
	var nbspace = text.split(" ").length -1;

	// Remove char for overflow
	if (this.textOverflow != "visible")
	{	if (d < this.measureText(text).width + (text.length-1 + nbspace) * letterPadding)
		{	var overflow = (this.textOverflow=="ellipsis") ? '\u2026' : this.textOverflow||"";
			var dt = overflow.length-1;
			do
			{	if (text[text.length-1]===" ") nbspace--;
				text = text.slice(0,-1);
			} while (text && d < this.measureText(text+overflow).width + (text.length + dt + nbspace) * letterPadding)
			text += overflow;
		}
	}

	// Calculate start point
	var start = 0;
	switch (this.textJustify || this.textAlign)
	{	case true: // justify
		case "center":
		case "end":
		case "right":
		{	// Justify
			if (this.textJustify) 
			{	start = 0;
				letterPadding = (d - this.measureText(text).width) / (text.length-1 + nbspace);
			}
			// Text align
			else
			{	start = d - this.measureText(text).width - (text.length + nbspace) * letterPadding;
				if (this.textAlign == "center") start /= 2;
			}
			break;
		}
		// left
		default: break;
	}
  
	// Do rendering
	for (var t=0; t<text.length; t++)
	{	var letter = text[t];
		var wl = this.measureText(letter).width;
    
		var p = pointAt(start+wl/2);

		this.save();
		this.textAlign = "center";
		this.translate(p[0], p[1]);
		this.rotate(p[2]);
		if (this.lineWidth>0.1) this.strokeText(letter,0,0);
		this.fillText(letter,0,0);
		this.restore();
		start += wl+letterPadding*(letter==" "?2:1);
	}
  
};

})();

function distance(pt1, pt2){
	const xdis = pt2.x - pt1.x;
	const ydis = pt2.y - pt1.y;
	return Math.sqrt(xdis*xdis + ydis*ydis);
}
function ratio(pt1, pt2){
	const vecX = pt2.x - pt1.x;
	const vecY = pt2.y - pt1.y;
	let vecLen = distance(pt1, pt2);
	if(vecLen<0.000001) return {x:0, y:0}; 
	return {x: vecX/vecLen, y: vecY/vecLen};
}


function getCubicCurveLength(x0, y0, x1, y1, x2, y2){
	// from https://math.stackexchange.com/questions/12186/arc-length-of-b%C3%A9zier-curves
	let v = {}, w = {};
	v.x = 2*(x1 - x0);
	v.y = 2*(y1 - y0);
	w.x = x2 - 2*x1 + x0;
	w.y = y2 - 2*y1 + y0;

	const uu = 4*(w.x*w.x + w.y*w.y);

	if(uu < 0.00001)
	{
		return Math.sqrt((x2 - x0)*(x2 - x0) + (y2 - y0)*(y2 - y0));
	}

	const vv = 4*(v.x*w.x + v.y*w.y),
		ww = v.x*v.x + v.y*v.y;

	const t1 = 2*Math.sqrt(uu*(uu + vv + ww)),
		t2 = 2*uu+vv,
		t3 = vv*vv - 4*uu*ww,
		t4 = 2*Math.sqrt(uu*ww);

	const error = 0.00001;
	return (t1*t2 - t3*Math.log(t2+t1+error) -(vv*t4 - t3*Math.log(vv+t4+error))) / (8*Math.pow(uu, 1.5));
}

function getCubicControlPoints(x0, y0, x1, y1, x2, y2, x3, y3, smoothValue) {
//from http://www.antigrain.com/research/bezier_interpolation/
	// Assume we need to calculate the control
	// points between (x1,y1) and (x2,y2).
	// Then x0,y0 - the previous vertex,
	//      x3,y3 - the next one.
	const xc1 = (x0 + x1) / 2.0, yc1 = (y0 + y1) / 2.0;
	const xc2 = (x1 + x2) / 2.0, yc2 = (y1 + y2) / 2.0;
	const xc3 = (x2 + x3) / 2.0, yc3 = (y2 + y3) / 2.0;

	const len1 = Math.sqrt((x1 - x0) * (x1 - x0) + (y1 - y0) * (y1 - y0));
	const len2 = Math.sqrt((x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1));
	const len3 = Math.sqrt((x3 - x2) * (x3 - x2) + (y3 - y2) * (y3 - y2));

	const k1 = len1 / (len1 + len2);
	const k2 = len2 / (len2 + len3);

	const xm1 = xc1 + (xc2 - xc1) * k1, ym1 = yc1 + (yc2 - yc1) * k1;

	const xm2 = xc2 + (xc3 - xc2) * k2, ym2 = yc2 + (yc3 - yc2) * k2;

	// Resulting control points. Here smoothValue is mentioned
	// above coefficient K whose value should be in range [0...1].
	const ctrl1X = xm1 + (xc2 - xm1) * smoothValue + x1 - xm1,
		ctrl1Y = ym1 + (yc2 - ym1) * smoothValue + y1 - ym1,

		ctrl2X = xm2 + (xc2 - xm2) * smoothValue + x2 - xm2,
		ctrl2Y = ym2 + (yc2 - ym2) * smoothValue + y2 - ym2;

	return [ctrl1X, ctrl1Y, ctrl2X, ctrl2Y];
}


//https://stackoverflow.com/questions/22578254/drawing-shapes-along-a-curved-path-in-canvas
/*
	At the start of the curve T==0.00
	At the end of the curve T==1.00
*/
function getQuadraticBezierXYatT(startPt,controlPt,endPt,T) {
    var x = Math.pow(1-T,2) * startPt.x + 2 * (1-T) * T * controlPt.x + Math.pow(T,2) * endPt.x; 
    var y = Math.pow(1-T,2) * startPt.y + 2 * (1-T) * T * controlPt.y + Math.pow(T,2) * endPt.y; 
    return( {x:x,y:y} );
}

// Anti-Clock rotate
function vecRotate(vec, theta){	
	const sin = Math.sin(theta*Math.PI/180);
	const cos = Math.cos(theta*Math.PI/180);
	return new Point([vec.x*cos - vec.y*sin, vec.x*sin + vec.y*cos]);		
}

function reversePts(pts){
	let temp, low = 0, high = pts.length-1;
	while(low<high){
		temp = pts[low];
		pts[low] = pts[high];
		pts[high] = temp;
		low++;
		high--;
	}
	return pts;
}

function isSamePoint(pt1, pt2){
	if(Math.abs(pt1.x-pt2.x) < 0.000001 && Math.abs(pt1.y-pt2.y) < 0.000001)
		return true;
	return false;
}

// remove duplicate adjacent point 
function delDuplicatePt(pts){
	let i = 0;
	
	while(i<pts.length-1){
		if(isSamePoint(pts[i],pts[i+1])){
			pts.splice(i+1,1);
			continue;
		}
		else{
			i++;
		}
	}
	return pts;
} 

const originPaintOn = LineString.prototype._paintOn;

const options = {
	fontSize: "48px",
	fontFamily: "Arial",
	textJustify: true,
	textOverflow: "visible",
	textBaseline: "middle",
	textStrokeMin: 20
}

export class TextPath extends LineString {
	_paintOn(ctx, points, lineOpacity, fillOpacity, dasharray) {
		delDuplicatePt(points);		//  paint smoothline error when adjacent-points duplicate
		if (this.options['text']){
			let fontSize = this.options["fontSize"];
			if(this.options["fontSize"].indexOf("px") != -1){
				fontSize = this.options["fontSize"];
			}
			else if(this.options["fontSize"].indexOf("m") != -1){
				const index = this.options["fontSize"].indexOf("m");
				const size = parseFloat(this.options["fontSize"].substring(0, index));
				const scale = this.getMap().getScale();
				fontSize = size/scale + "px";
			}
			
			const font = fontSize + " " + this.options["fontFamily"];
			this._paintPolylineTextPath(ctx, points, this.options['textName'], font, 
				this.options["symbol"]['lineColor'],
				this.options["symbol"]['lineWidth'],
				lineOpacity
			);
		}
		else{
			originPaintOn.apply(this, arguments);
		}
    }
	
	_paintPolylineTextPath(ctx, points, text, font,	lineColor, lineWidth, lineOpacity){
		// Render text
		ctx.font = font;
		ctx.strokeStyle = lineColor;
		ctx.lineWidth = lineWidth || 3;
		ctx.globalAlpha = lineOpacity;
		
		ctx.textAlign = this.options['textAlign'];
		ctx.textBaseline = this.options['textBaseline'];
		ctx.textOverflow = this.options['textOverflow'];
		ctx.textJustify = this.options['textJustify'];
		ctx.textStrokeMin = this.options['textStrokeMin'];

		let path = [];
		let len = points.length;
		for(let i=0; i<len; i++){
			path.push(points[i].x);
			path.push(points[i].y);
		}
		
		ctx.beginPath();
        ctx.moveTo(path[0],path[1]);
		ctx.textPath (text, path);
		Canvas._stroke(ctx, lineOpacity);
	}

}

TextPath.mergeOptions(options);

TextPath.registerJSONType('TextPath');

export default TextPath;
