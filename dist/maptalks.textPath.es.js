/*!
 * maptalks.textPath v0.1.0
 * LICENSE : MIT
 * (c) 2016-2018 maptalks.org
 */
import { Canvas, LineString } from 'maptalks';

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
(function () {
	/* Usefull function */
	function dist2D(x1, y1, x2, y2) {
		var dx = x2 - x1;
		var dy = y2 - y1;
		return Math.sqrt(dx * dx + dy * dy);
	}

	/* Add new properties on CanvasRenderingContext2D */
	CanvasRenderingContext2D.prototype.textOverflow = "";
	CanvasRenderingContext2D.prototype.textJustify = false;
	CanvasRenderingContext2D.prototype.textStrokeMin = 0;

	var state = [];
	var save = CanvasRenderingContext2D.prototype.save;
	CanvasRenderingContext2D.prototype.save = function () {
		state.push({ textOverflow: this.textOverflow,
			textJustify: this.textJustify,
			textStrokeMin: this.textStrokeMin
		});
		save.call(this);
	};

	var restore = CanvasRenderingContext2D.prototype.restore;
	CanvasRenderingContext2D.prototype.restore = function () {
		restore.call(this);
		var s = state.pop();
		this.textOverflow = s.textOverflow;
		this.textJustify = s.textJustify;
		this.textStrokeMin = s.textStrokeMin;
	};

	/* textPath function */
	CanvasRenderingContext2D.prototype.textPath = function (text, path) {
		// Helper to get a point on the path, starting at dl 
		// (return x, y and the angle on the path)
		var di,
		    dpos = 0;
		var pos = 2;
		function pointAt(dl) {
			if (!di || dpos + di < dl) {
				for (; pos < path.length;) {
					di = dist2D(path[pos - 2], path[pos - 1], path[pos], path[pos + 1]);
					if (dpos + di > dl) break;
					pos += 2;
					if (pos >= path.length) break;
					dpos += di;
				}
			}

			var x,
			    y,
			    dt = dl - dpos;
			if (pos >= path.length) {
				pos = path.length - 2;
			}

			if (!dt) {
				x = path[pos - 2];
				y = path[pos - 1];
			} else {
				x = path[pos - 2] + (path[pos] - path[pos - 2]) * dt / di;
				y = path[pos - 1] + (path[pos + 1] - path[pos - 1]) * dt / di;
			}
			return [x, y, Math.atan2(path[pos + 1] - path[pos - 1], path[pos] - path[pos - 2])];
		}

		var letterPadding = this.measureText(" ").width * 0.25;

		// Calculate length
		var d = 0;
		for (var i = 2; i < path.length; i += 2) {
			d += dist2D(path[i - 2], path[i - 1], path[i], path[i + 1]);
		}
		if (d < this.minWidth) return;
		var nbspace = text.split(" ").length - 1;

		// Remove char for overflow
		if (this.textOverflow != "visible") {
			if (d < this.measureText(text).width + (text.length - 1 + nbspace) * letterPadding) {
				var overflow = this.textOverflow == "ellipsis" ? '\u2026' : this.textOverflow || "";
				var dt = overflow.length - 1;
				do {
					if (text[text.length - 1] === " ") nbspace--;
					text = text.slice(0, -1);
				} while (text && d < this.measureText(text + overflow).width + (text.length + dt + nbspace) * letterPadding);
				text += overflow;
			}
		}

		// Calculate start point
		var start = 0;
		switch (this.textJustify || this.textAlign) {case true: // justify
			case "center":
			case "end":
			case "right":
				{
					// Justify
					if (this.textJustify) {
						start = 0;
						letterPadding = (d - this.measureText(text).width) / (text.length - 1 + nbspace);
					}
					// Text align
					else {
							start = d - this.measureText(text).width - (text.length + nbspace) * letterPadding;
							if (this.textAlign == "center") start /= 2;
						}
					break;
				}
			// left
			default:
				break;
		}

		// Do rendering
		for (var t = 0; t < text.length; t++) {
			var letter = text[t];
			var wl = this.measureText(letter).width;

			var p = pointAt(start + wl / 2);

			this.save();
			this.textAlign = "center";
			this.translate(p[0], p[1]);
			this.rotate(p[2]);
			if (this.lineWidth > 0.1) this.strokeText(letter, 0, 0);
			this.fillText(letter, 0, 0);
			this.restore();
			start += wl + letterPadding * (letter == " " ? 2 : 1);
		}
	};
})();

function isSamePoint(pt1, pt2) {
	if (Math.abs(pt1.x - pt2.x) < 0.000001 && Math.abs(pt1.y - pt2.y) < 0.000001) return true;
	return false;
}

// remove duplicate adjacent point 
function delDuplicatePt(pts) {
	let i = 0;

	while (i < pts.length - 1) {
		if (isSamePoint(pts[i], pts[i + 1])) {
			pts.splice(i + 1, 1);
			continue;
		} else {
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
	textStrokeMin: 40
};

class TextPath extends LineString {
	_paintOn(ctx, points, lineOpacity, fillOpacity, dasharray) {
		delDuplicatePt(points); //  paint smoothline error when adjacent-points duplicate
		if (this.options['textName']) {
			let fontSize = this.options["fontSize"];
			if (this.options["fontSize"].indexOf("px") != -1) {
				fontSize = this.options["fontSize"];
			} else if (this.options["fontSize"].indexOf("m") != -1) {
				const index = this.options["fontSize"].indexOf("m");
				const size = parseFloat(this.options["fontSize"].substring(0, index));
				const scale = this.getMap().getScale();
				fontSize = size / scale + "px";
			}

			const font = fontSize + " " + this.options["fontFamily"];
			this._paintPolylineTextPath(ctx, points, this.options['textName'], font, this.options["symbol"]['lineColor'], this.options["symbol"]['lineWidth'], lineOpacity);
		} else {
			originPaintOn.apply(this, arguments);
		}
	}

	_paintPolylineTextPath(ctx, points, text, font, lineColor, lineWidth, lineOpacity) {
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
		for (let i = 0; i < len; i++) {
			path.push(points[i].x);
			path.push(points[i].y);
		}

		ctx.beginPath();
		ctx.moveTo(path[0], path[1]);
		ctx.textPath(text, path);
		Canvas._stroke(ctx, lineOpacity);
	}

}

TextPath.mergeOptions(options);

TextPath.registerJSONType('TextPath');

export { TextPath };
export default TextPath;

typeof console !== 'undefined' && console.log('maptalks.textPath v0.1.0');
