import "./styles.css";

import { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import usePartySocket from "partysocket/react";
import { faker } from '@faker-js/faker';
import { Globe } from "./Globe";

// The type of messages we'll be receiving from the server
import type { OutgoingMessage } from "./server";
import { Toaster, toast } from "react-hot-toast";
import { useInterval } from "usehooks-ts";

type Markers = Map<
  string,
  {
    location: [number, number];
    size: number;
  }
>

function App() {
  // A reference to the canvas element where we'll render the globe
  // const canvasRef = useRef<HTMLCanvasElement>();
  // The number of markers we're currently displaying
  const [counter, setCounter] = useState(0);
  // const [visible, setVisibility] = useState(true);
  // const toggle = () => setVisibility(true);

  // A map of marker IDs to their positions
  // Note that we use a ref because the globe's `onRender` callback
  // is called on every animation frame, and we don't want to re-render
  // the component on every frame.
  const positions = useRef<Markers>(new Map());
  // Connect to the PartyKit server
  const socket = usePartySocket({
    // host: 'localhost:1999',
    host: 'https://globe-party.darkfadr.partykit.dev',
    room: "default",
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

  useInterval(
    () => {
      toast.success(
       `🇭🇹 Haitian in ${faker.location.city()}\n${faker.lorem.sentence()}`, 
        { 
          icon: null, 
          position: 'bottom-right', 
          duration: 10000,
          style: {
            textAlign: 'left',
            borderRadius: '5px',
            background: '#333',
            color: '#fff',
          },
        }
      );
    },
    // Delay in milliseconds or null to stop it
    faker.number.int({ min: 500, max: 2000 })
  )
  

  
  /*
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
        phi += 0.003;
      },
    });

    return () => {
      globe.destroy();
    };
  }, []);
  /**/

  return (
    <div className="App" style={{ height: '100vh' }}>
      <h1 style={{ marginTop: 50 }}>Haitians Are Everywhere</h1>
      {counter !== 0 ? (
        <p>
          <b>{counter}</b> {counter === 1 ? "Haitian" : "Haitians"} online.
        </p>
      ) : (
        <p>&nbsp;</p>
      )}
      
      <Globe markers={positions} />
      
      <p>A <a href="https://haitian.af">haitian.af</a>  Experiment</p>
      <p>Powered by OSS & Pilkiz 🇭🇹</p>
      <Toaster/>
    </div>
  );
}


createRoot(document.getElementById("root")!).render(<App />);
