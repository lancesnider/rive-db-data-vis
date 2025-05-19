import { Rive, Fit, Alignment, Layout } from "@rive-app/webgl2";
import "./styles.css";

const el = document.getElementById("rive-canvas");

// Min and max values
const MIN_VALUE = 50;
const MAX_VALUE = 1000;
const NUMBER_OF_BARS = 5;
const FFT_SIZE = 16; // Min = 16

function isPowerOfTwo(n) {
  if (n < 16) {
    return false;
  }
  return (n & (n - 1)) === 0;
}

const fftsPerBar = isPowerOfTwo(NUMBER_OF_BARS)
  ? 1
  : Math.floor(FFT_SIZE / NUMBER_OF_BARS);

const bars = [];

/*
  Get audio data from microphone
*/

const audioContext = new AudioContext();
const analyser = audioContext.createAnalyser();

// Configure the analyser
analyser.fftSize = FFT_SIZE * 2; // 64 gives us 32 bars (fftSize / 2)
const bufferLength = analyser.frequencyBinCount; // Half of fftSize
const dataArray = new Uint8Array(bufferLength);

// Map function to normalize values
function mapValue(value, inMin, inMax, outMin, outMax) {
  return ((value - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
}

async function main() {
  const r = new Rive({
    src: "voice_assitant.riv",
    autoplay: true,
    // autoBind: true,
    canvas: el,
    layout: new Layout({
      fit: Fit.Contain,
      alignment: Alignment.Center,
    }),
    stateMachines: "State Machine 1",
    onLoad: () => {
      const vm = r.viewModelByName("View Model 1");
      const vmi = vm.instance();
      r.bindViewModelInstance(vmi);

      bars.push(vmi.number("1"));
      bars.push(vmi.number("2"));
      bars.push(vmi.number("3"));
      bars.push(vmi.number("4"));
      bars.push(vmi.number("5"));

      r.resizeDrawingSurfaceToCanvas();
    },
    onAdvance: () => {
      if (audioContext.state === "running") {
        analyser.getByteFrequencyData(dataArray); // Populate dataArray with frequency data

        const values = Array.from(dataArray, (value) =>
          mapValue(value, 0, 255, MIN_VALUE, MAX_VALUE)
        ); // Normalize values to MIN_VALUE - MAX_VALUE

        bars.forEach((bar, index) => {
          bar.value = values[index * fftsPerBar];
        });
      }
    },
  });

  window.addEventListener(
    "resize",
    () => {
      r.resizeDrawingSurfaceToCanvas();
    },
    false
  );
}

// Initialize microphone input
navigator.mediaDevices
  .getUserMedia({ audio: true })
  .then((stream) => {
    const source = audioContext.createMediaStreamSource(stream);

    // Connect the microphone source to the analyser
    source.connect(analyser);

    // Automatically start visualizer when the context is running
    if (audioContext.state === "suspended") {
      audioContext.resume();
    }
  })
  .catch((err) => {
    console.error("Error accessing the microphone:", err);
  });

main();
