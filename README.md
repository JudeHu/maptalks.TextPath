# maptalks.TextPath
**TextPath plugin for maptalks , show text content along the polyline path, extend from maptalks LineString**   

**Reference:**
https://github.com/Viglino/Canvas-TextPath

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
		  fontSize: '10000m',	// meter(m) use geoDistance, pixel(px) use pixelDistance
		  text: "test123456test123456test123456test123456test123456",
		  fontFamily: "Arial",
          symbol:{
            'lineColor' : 'red',
			      'lineOpacity': 0.9
          }
        }
      ).addTo(layer);
```

