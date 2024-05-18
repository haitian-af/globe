import "./styles.css";

import { useEffect, useRef, type LegacyRef, useState } from "react";
import { createRoot } from "react-dom/client";
import usePartySocket from "partysocket/react";
import createGlobe from "cobe";

// The type of messages we'll be receiving from the server
import type { OutgoingMessage } from "./server";

function App() {
  // A reference to the canvas element where we'll render the globe
  const canvasRef = useRef<HTMLCanvasElement>();
  // The number of markers we're currently displaying
  const [counter, setCounter] = useState(0);
  const [visible, setVisibility] = useState(true);
  const toggle = () => setVisibility(true);

  // A map of marker IDs to their positions
  // Note that we use a ref because the globe's `onRender` callback
  // is called on every animation frame, and we don't want to re-render
  // the component on every frame.
  const positions = useRef<
    Map<
      string,
      {
        location: [number, number];
        size: number;
      }
    >
  >(new Map());
  // Connect to the PartyKit server
  const socket = usePartySocket({
    // host: 'localhost:1999',
    host: 'https://partykit.darkfadr.partykit.dev',
    room: "globe-party",
    onMessage(evt) {
      const message = JSON.parse(evt.data) as OutgoingMessage;
      if (message.type === "add-marker") {
        // Add the marker to our map
        positions.current.set(message.position.id, {
          location: [message.position.lat, message.position.lng],
          size: message.position.id === socket.id ? 0.1 : 0.05,
        });
        // Update the counter
        setCounter((c) => c + 1);
      } else if (message.type === "remove-marker") {
        // Remove the marker from our map
        positions.current.delete(message.id);
        // Update the counter
        setCounter((c) => c - 1);
      }
    },
  });

  useEffect(() => {
    // The angle of rotation of the globe
    // We'll update this on every frame to make the globe spin
    let phi = 0;

    const globe = createGlobe(canvasRef.current as HTMLCanvasElement, {
      devicePixelRatio: 2,
      width: 1000,
      height: 1000,
      phi: 0,
      theta: 0,
      dark: 1,
      diffuse: 0.8,
      mapSamples: 16000,
      mapBrightness: 6,
      baseColor: [0.3, 0.3, 0.3],
      markerColor: [0.8, 0.1, 0.1],
      glowColor: [0.2, 0.2, 0.2],
      markers: [],
      opacity: 0.7,
      onRender: (state) => {
        // Called on every animation frame.
        // `state` will be an empty object, return updated params.

        // Get the current positions from our map
        state.markers = [...positions.current.values()];

        // Rotate the globe
        state.phi = phi;
        phi += 0.005;
      },
    });

    return () => {
      globe.destroy();
    };
  }, []);

  return (
    <div className="App">
      <h1 style={{ marginTop: 80 }}>Where are the Haitians?</h1>
      {counter !== 0 ? (
        <p>
          <b>{counter}</b> {counter === 1 ? "Haitian" : "Haitians"} online.
        </p>
      ) : (
        <p>&nbsp;</p>
      )}

      {/* {visible != true && <button className="signup" onClick={toggle}>Sign up to leave your mark</button>} */}

      {/* The canvas where we'll render the globe */}
      <canvas
        ref={canvasRef as LegacyRef<HTMLCanvasElement>}
        style={{ width: 500, height: 500, maxWidth: "100%", aspectRatio: 1, visibility: visible && 'visible' || 'hidden' }}
        width={1000}
        height={1000}
      />

      {/* <Cobe /> */}

      <p>Built by Haitians, for 🇭🇹</p>
      <p>A <a href="https://haitian.af">haitian.af</a> Experiment...Powered by OSS & Pilkiz</p>
    </div>
  );
}


export function Cobe() {
  const canvasRef = useRef();
  useEffect(() => {
    let phi = 0
    let width = 0;
    //@ts-ignore
    const onResize = () => canvasRef.current && (width = canvasRef.current.offsetWidth)
    window.addEventListener('resize', onResize)
    onResize()
    //@ts-ignore
    const globe = createGlobe(canvasRef.current, {
      devicePixelRatio: 2,
      width: width * 2,
      height: width * 2 * 0.4,
      phi: 0,
      theta: 0.3,
      dark: 1,
      diffuse: 3,
      mapSamples: 16000,
      mapBrightness: 1.2,
      baseColor: [1, 1, 1],
      markerColor: [251 / 255, 100 / 255, 21 / 255],
      glowColor: [1.2, 1.2, 1.2],
      markers: [],
      scale: 2.5,
      offset: [0, width * 2 * 0.4 * 0.6],
      onRender: (state) => {
        state.width = width * 2
        state.height = width * 2 * 0.4

        // Rotate the globe
        state.phi = phi;
        phi += 0.005;
      }
    })

    //@ts-ignore
    setTimeout(() => canvasRef.current.style.opacity = '1')
    return () => { 
      globe.destroy();
      window.removeEventListener('resize', onResize);
    }
  }, [])
  return <div style={{
    width: '100%',
    aspectRatio: 1/.4,
    margin: 'auto',
    position: 'relative',
  }}>
    <canvas
      //@ts-ignore
      ref={canvasRef}
      style={{
        width: '100%',
        height: '100%',
        contain: 'layout paint size',
        opacity: 0,
        transition: 'opacity 1s ease',
      }}
    />
  </div>
}


createRoot(document.getElementById("root")!).render(<App />);
