# maptalks.TextPath
**TextPath plugin for maptalks , show text content along the polyline path, extend from maptalks LineString**   

**Reference:**
https://github.com/Viglino/Canvas-TextPath

**Demo Online** 
https://jsfiddle.net/JudeHu/ktgejn2v/  

## Usage
```javascript
var layer = new maptalks.VectorLayer('vector').addTo(map);
var textpath = new maptalks.TextPath(
        [
		map.getCenter().add(-0.1, -0.2),
		map.getCenter().add(0.1, 0.1),
		map.getCenter().add(-0.1, 0.1)
        ],
        {
	 	textName: "test123456test123456test中文测试中文测试123456",
		fontSize: '10000m',	// meter(m) use geoDistance, pixel(px) use pixelDistance
		fontFamily: "Arial",
		textStrokeMin: 8,			// no text drawed if text-pixel-Size < textStrokeMin, default 5
		symbol:{
			'lineColor' : 'red',
			'lineOpacity': 0.9
		}
        }
      ).addTo(layer);
```

