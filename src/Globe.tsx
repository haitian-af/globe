import { useEffect, useRef, forwardRef, type Ref } from "react";
import createGlobe from "cobe";
import { useSpring } from 'react-spring';
import * as turf from "@turf/turf";

type Markers = Map<
  string,
  {
    location: [number, number];
    size: number;
  }
>

export const Globe = forwardRef(({ markers }: { markers: Ref<Markers> }) => {
  const canvasRef = useRef();
  const pointerInteracting = useRef(null);
  const pointerInteractionMovement = useRef(0);
  const [{ r }, api] = useSpring(() => ({
    r: 0,
    config: {
      mass: 1,
      tension: 280,
      friction: 40,
      precision: 0.001,
    },
  }));

  useEffect(() => {
    let phi = 0
    let width = 0;
    let height = 0;
    const points = turf.randomPoint(25)
      .features.map(f => f.geometry.coordinates)

    console.log('generated points', points);

    const onResize = () => {
      if(canvasRef.current) {
        //@ts-ignore
        width = canvasRef.current.offsetWidth;
        //@ts-ignore
        height = canvasRef?.current?.offsetHeight || [];
      }
    }

    window.addEventListener('resize', onResize)
    onResize()
    //@ts-ignore
    const globe = createGlobe(canvasRef.current, {
      devicePixelRatio: 2,
      width: width * 2,
      height: width * 2,
      phi: 0,
      theta: 0,
      dark: 1,
      diffuse: .8,
      mapSamples: 16000,
      mapBrightness: 1.2,
      baseColor: [.5, .5, .5],
      markerColor: [251 / 255, 100 / 255, 21 / 255],
      glowColor: [0.2, 0.2, 0.2],
      markers: [],
      opacity: .8,
      scale: 1,
      // offset: [0, -height * 1.4],
      // offset: [0, width * 2 * 0.4 * 0.2],
      onRender: (state) => {
        // This prevents rotation while dragging
        if (!pointerInteracting.current) {
          // Called on every animation frame.
          // `state` will be an empty object, return updated params.
          phi += 0.005
        } 

        // Get the current positions from our map
        if (markers !== null) {
          //@ts-ignore
          state.markers = [...markers?.current?.values()];
        }

        // Rotate the globe
        state.phi = phi + r.get();
        state.width = width * 2
        state.height = width * 2
        phi += 0.003;
      }
    })

    //@ts-ignore
    setTimeout(() => canvasRef.current.style.opacity = '1')
    return () => { 
      globe.destroy();
      window.removeEventListener('resize', onResize);
    }
  }, [])

  return (
    <div style={{ width: '100%',aspectRatio: 1 }}>
      <canvas
        //@ts-ignore
        ref={canvasRef}
        onPointerDown={(e) => {
          pointerInteracting.current = e.clientX - pointerInteractionMovement.current;
          //@ts-ignore
          canvasRef.current.style.cursor = 'grabbing';
        }}
        onPointerUp={() => {
          pointerInteracting.current = null;
          //@ts-ignore
          canvasRef.current.style.cursor = 'grab';
        }}
        onPointerOut={() => {
          pointerInteracting.current = null;
          //@ts-ignore
          canvasRef.current.style.cursor = 'grab';
        }}
        onMouseMove={(e) => {
          if (pointerInteracting.current !== null) {
            const delta = e.clientX - pointerInteracting.current;
            pointerInteractionMovement.current = delta;
            api.start({
              r: delta / 200,
            });
          }
        }}
        onTouchMove={(e) => {
          if (pointerInteracting.current !== null && e.touches[0]) {
            const delta = e.touches[0].clientX - pointerInteracting.current;
            pointerInteractionMovement.current = delta;
            api.start({ r: delta / 100 });
          }
        }}
        style={{
          width: '100%',
          height: '100%',
          contain: 'layout paint size',
          opacity: 0,
          transition: 'opacity 1s ease',
        }}
      />
    </div>
  );
})
